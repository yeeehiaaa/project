import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolvePharmacist,
  resolvePatientRecordId,
  norm,
} from "@/lib/pharmacy-auth";

const PATIENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CANCELLED"],
};

const PHARMACIST_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "REFUSED"],
  CONFIRMED: ["COMPLETED", "REFUSED"],
};

function makePickupCode(): string {
  return `DZ-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Détails lisibles des ordonnances plateforme liées aux demandes
// (numéro, date, médecin, médicaments) — sinon le pharmacien
// ne verrait qu'un ID brut.
async function fetchRxMap(ids: string[]): Promise<Record<string, any>> {
  const map: Record<string, any> = {};
  const wanted = Array.from(new Set((ids || []).filter(Boolean)));
  if (wanted.length === 0) return map;
  try {
    const allRx = (await (prisma as any).prescription.findMany({})) || [];
    const allItems = (await (prisma as any).prescriptionItem.findMany({})) || [];
    const allDoctors = (await (prisma as any).doctor.findMany({})) || [];
    const allProfiles = (await (prisma as any).profile.findMany({})) || [];
    for (const rx of allRx.filter((x: any) => wanted.includes(x.id))) {
      const doc = allDoctors.find((d: any) => d.id === rx.doctorId);
      const prof = allProfiles.find((p: any) => p.id === doc?.profileId);
      map[rx.id] = {
        id: rx.id,
        prescriptionNumber: rx.prescriptionNumber,
        prescribedDate: rx.prescribedDate,
        status: rx.status,
        notes: rx.notes || "",
        doctorName: prof
          ? `${prof.firstName || ""} ${prof.lastName || ""}`.trim()
          : "",
        items: allItems
          .filter((it: any) => it.prescriptionId === rx.id)
          .map((it: any) => ({
            medicationName: it.medicationName,
            dosage: it.dosage,
            frequency: it.frequency,
            quantity: it.quantity,
            durationDays: it.durationDays,
            instructions: it.instructions,
          })),
      };
    }
  } catch {
    // sans détails, l'ID reste affiché
  }
  return map;
}

// ============================================================
// GET — mes demandes (patient : les miennes / pharmacien : file de MA pharmacie)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (role === "pharmacist") {
      const ctx = await resolvePharmacist(request);
      if (!ctx || !ctx.facilityId) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as pharmacist." },
          { status: 401 }
        );
      }
      let items: any[] = [];
      try {
        const all = await prisma.stockRequest.findMany({});
        items = (all || []).filter((r: any) => r.facilityId === ctx.facilityId);
      } catch (err) {
        console.warn("requests queue failed:", err);
      }

      // Enrichir avec le nom COMPLET du patient.
      let patients: any[] = [];
      try {
        patients =
          (await prisma.patient.findMany({
            include: { profile: true },
          })) || [];
      } catch {
        patients = [];
      }
      const rxMap = await fetchRxMap(items.map((r: any) => r.prescriptionId));
      const enriched = items
        .map((r: any) => {
          const pat = patients.find((p: any) => p.id === r.patientId);
          const prof: any = pat?.profile || null;
          let patientName = "Patient";
          if (!prof) {
            try {
              patientName = `Patient ${String(r.patientId).slice(0, 6)}`;
            } catch {
              patientName = "Patient";
            }
          } else {
            patientName =
              `${prof.firstName || ""} ${prof.lastName || ""}`.trim() || "Patient";
          }
          return {
            ...r,
            patientName,
            patientPhone: prof?.phone || "",
            prescription: r.prescriptionId ? rxMap[r.prescriptionId] || null : null,
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return NextResponse.json({ success: true, requests: enriched });
    }

    // Défaut : patient.
    const patientId = await resolvePatientRecordId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }
    let items: any[] = [];
    try {
      const all = await prisma.stockRequest.findMany({});
      items = (all || []).filter((r: any) => r.patientId === patientId);
    } catch (err) {
      console.warn("requests list failed:", err);
    }

    let facilities: any[] = [];
    try {
      facilities = (await prisma.healthcareFacility.findMany({})) || [];
    } catch {
      facilities = [];
    }
    const rxMap = await fetchRxMap(items.map((r: any) => r.prescriptionId));
    const enriched = items
      .map((r: any) => {
        const f = facilities.find((x: any) => x.id === r.facilityId);
        return {
          ...r,
          facilityName: f?.name || "Pharmacie",
          facilityCity: f?.city || "",
          facilityPhone: f?.phone || "",
          prescription: r.prescriptionId ? rxMap[r.prescriptionId] || null : null,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ success: true, requests: enriched });
  } catch (error) {
    console.error("GET /api/pharmacies/requests error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load requests." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — patient : réserver {facilityId, medicationName, dosage?, prescriptionId?, notes?}
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
    const facilityId = String(body.facilityId || "");
    const medicationName = String(body.medicationName || "").trim();
    if (!facilityId || !medicationName) {
      return NextResponse.json(
        { success: false, error: "facilityId and medicationName are required." },
        { status: 400 }
      );
    }
    const quantity = Math.min(
      99,
      Math.max(1, parseInt(String(body.quantity ?? 1), 10) || 1)
    );
    const prescriptionId = String(body.prescriptionId || "").trim() || null;
    const prescriptionFileName =
      String(body.prescriptionFileName || "").trim().slice(0, 160) || null;
    let prescriptionFileUrl: string | null = null;
    if (typeof body.prescriptionFileUrl === "string" && body.prescriptionFileUrl.trim()) {
      const v = body.prescriptionFileUrl.trim();
      if (v.length > 5_500_000) {
        return NextResponse.json(
          { success: false, error: "Fichier ordonnance trop lourd (max ~4 Mo)." },
          { status: 400 }
        );
      }
      if (
        !v.startsWith("data:image/") &&
        !v.startsWith("data:application/pdf") &&
        !v.startsWith("http")
      ) {
        return NextResponse.json(
          { success: false, error: "Ordonnance : image ou PDF uniquement." },
          { status: 400 }
        );
      }
      prescriptionFileUrl = v.slice(0, 5_500_000);
    }

    let facility: any = null;
    try {
      const all = await prisma.healthcareFacility.findMany({});
      facility = (all || []).find(
        (f: any) => f.id === facilityId && f.type === "PHARMACY"
      );
    } catch {
      facility = null;
    }
    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found." },
        { status: 404 }
      );
    }

    // Code de retrait unique (3 essais).
    let pickupCode = "";
    for (let i = 0; i < 3; i++) {
      const candidate = makePickupCode();
      try {
        const all = await prisma.stockRequest.findMany({});
        if (!(all || []).some((r: any) => r.pickupCode === candidate)) {
          pickupCode = candidate;
          break;
        }
      } catch {
        pickupCode = candidate;
        break;
      }
    }
    if (!pickupCode) pickupCode = makePickupCode();

    let created: any = null;
    try {
      created = await prisma.stockRequest.create({
        data: {
          patientId,
          facilityId,
          medicationName: medicationName.slice(0, 120),
          dosage: String(body.dosage || "").trim().slice(0, 60) || null,
          quantity,
          prescriptionId,
          prescriptionFileUrl,
          prescriptionFileName,
          notes: String(body.notes || "").trim().slice(0, 300) || null,
          status: "PENDING",
          pickupCode,
        },
      });
    } catch (err) {
      console.error("request create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to create reservation." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, request: { ...created, facilityName: facility.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/pharmacies/requests error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create reservation." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — changer le statut {id, status}
// Patient : PENDING -> CANCELLED. Pharmacien : PENDING -> CONFIRMED/REFUSED,
// CONFIRMED -> COMPLETED/REFUSED. COMPLETED décrémente le stock.
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "id and status are required." },
        { status: 400 }
      );
    }

    // Qui appelle ?
    let patientId: string | null = null;
    let ctx: any = null;
    const asPharmacist = String(body.asRole || "") === "pharmacist";
    if (asPharmacist) {
      ctx = await resolvePharmacist(request);
      if (!ctx) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as pharmacist." },
          { status: 401 }
        );
      }
    } else {
      patientId = await resolvePatientRecordId(request);
      if (!patientId) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as patient." },
          { status: 401 }
        );
      }
    }

    let req: any = null;
    try {
      const all = await prisma.stockRequest.findMany({});
      req = (all || []).find((r: any) => r.id === id);
    } catch {
      req = null;
    }
    if (!req) {
      return NextResponse.json(
        { success: false, error: "Request not found." },
        { status: 404 }
      );
    }

    if (asPharmacist) {
      if (req.facilityId !== ctx.facilityId) {
        return NextResponse.json(
          { success: false, error: "Not your pharmacy request." },
          { status: 403 }
        );
      }
      const allowed = PHARMACIST_TRANSITIONS[req.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Cannot move ${req.status} to ${status}.` },
          { status: 400 }
        );
      }
    } else {
      if (req.patientId !== patientId) {
        return NextResponse.json(
          { success: false, error: "Not your request." },
          { status: 403 }
        );
      }
      const allowed = PATIENT_TRANSITIONS[req.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Cannot move ${req.status} to ${status}.` },
          { status: 400 }
        );
      }
    }

    let updated: any = { ...req, status };
    try {
      updated =
        (await prisma.stockRequest.update({
          where: { id },
          data: { status },
        })) || updated;
    } catch (err) {
      console.warn("request status update failed, local merge:", err);
    }

    // Retrait confirmé : décrémenter le stock de la quantité demandée.
    if (status === "COMPLETED") {
      try {
        const all = await prisma.pharmacyStock.findMany({});
        const normName = norm(req.medicationName);
        const match = (all || []).find(
          (s: any) =>
            s.facilityId === req.facilityId &&
            norm(s.medicationName) === normName &&
            (s.dosage || "") === (req.dosage || "")
        );
        if (match) {
          const dec = Math.max(1, Number(req.quantity) || 1);
          try {
            await prisma.pharmacyStock.update({
              where: { id: match.id },
              data: { quantity: Math.max(0, (Number(match.quantity) || 0) - dec) },
            });
          } catch {
            // ignorer en mode dégradé
          }
        }
      } catch {
        // ignorer
      }
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("PATCH /api/pharmacies/requests error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update request." },
      { status: 500 }
    );
  }
}
