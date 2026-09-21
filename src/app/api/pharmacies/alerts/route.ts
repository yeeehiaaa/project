import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePatientRecordId, norm } from "@/lib/pharmacy-auth";

// ============================================================
// GET — mes alertes + disponibilité live de chaque médicament
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const patientId = await resolvePatientRecordId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    let alerts: any[] = [];
    try {
      const all = await prisma.stockAlert.findMany({});
      alerts = (all || []).filter((a: any) => a.patientId === patientId);
    } catch (err) {
      console.warn("alerts list failed:", err);
    }

    let stocks: any[] = [];
    let facilities: any[] = [];
    try {
      stocks = (await prisma.pharmacyStock.findMany({})) || [];
      facilities = (await prisma.healthcareFacility.findMany({})) || [];
    } catch {
      stocks = [];
      facilities = [];
    }

    const enriched = alerts
      .map((a: any) => {
        const target = norm(a.medicationName);
        const inScope = stocks.filter((s: any) => {
          if (norm(s.medicationName) !== target) return false;
          const f = facilities.find((x: any) => x.id === s.facilityId);
          if (!f || f.type !== "PHARMACY") return false;
          if (a.wilaya && norm(f.wilaya) !== norm(a.wilaya)) return false;
          return true;
        });
        const available = inScope.filter(
          (s: any) => (Number(s.quantity) || 0) > 0
        );
        const count = available.length;
        return {
          id: a.id,
          medicationName: a.medicationName,
          wilaya: a.wilaya || "",
          city: a.city || "",
          createdAt: a.createdAt,
          available: count > 0,
          count,
          where: available.slice(0, 3).map((s: any) => {
            const f = facilities.find((x: any) => x.id === s.facilityId);
            return { facilityName: f?.name || "Pharmacie", city: f?.city || "" };
          }),
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ success: true, alerts: enriched });
  } catch (error) {
    console.error("GET /api/pharmacies/alerts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load alerts." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — créer une alerte {medicationName, wilaya?, city?}
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const patientId = await resolvePatientRecordId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const medicationName = String(body.medicationName || "").trim();
    if (!medicationName) {
      return NextResponse.json(
        { success: false, error: "Medication name is required." },
        { status: 400 }
      );
    }

    let existing: any = null;
    try {
      const all = await prisma.stockAlert.findMany({});
      existing = (all || []).find(
        (a: any) =>
          a.patientId === patientId &&
          norm(a.medicationName) === norm(medicationName)
      );
    } catch {
      existing = null;
    }
    if (existing) {
      return NextResponse.json({ success: true, alert: existing });
    }

    let created: any = null;
    try {
      created = await prisma.stockAlert.create({
        data: {
          patientId,
          medicationName: medicationName.slice(0, 120),
          wilaya: String(body.wilaya || "").trim().slice(0, 80) || null,
          city: String(body.city || "").trim().slice(0, 80) || null,
        },
      });
    } catch (err) {
      console.error("alert create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to create alert." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, alert: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/pharmacies/alerts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create alert." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ?id= — supprimer une de MES alertes
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const patientId = await resolvePatientRecordId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Alert id is required." },
        { status: 400 }
      );
    }

    let owned: any = null;
    try {
      const all = await prisma.stockAlert.findMany({});
      owned = (all || []).find(
        (a: any) => a.id === id && a.patientId === patientId
      );
    } catch {
      owned = null;
    }
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Alert not found." },
        { status: 404 }
      );
    }

    try {
      await prisma.stockAlert.delete({ where: { id } });
    } catch (err) {
      console.warn("alert delete failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pharmacies/alerts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete alert." },
      { status: 500 }
    );
  }
}
