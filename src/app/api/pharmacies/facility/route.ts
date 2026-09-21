import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePharmacist } from "@/lib/pharmacy-auth";

// ============================================================
// GET — ma pharmacie (ou null si pas encore configurée)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as pharmacist." },
        { status: 401 }
      );
    }
    return NextResponse.json({
      success: true,
      facility: ctx.facility || null,
      pharmacistId: ctx.pharmacistId,
    });
  } catch (error) {
    console.error("GET /api/pharmacies/facility error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load pharmacy." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — créer ma pharmacie (une seule) et me lier
// {name, city?, wilaya?, address?, phone?, emergencyService?}
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as pharmacist." },
        { status: 401 }
      );
    }
    if (ctx.facility) {
      return NextResponse.json({ success: true, facility: ctx.facility });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Pharmacy name is required." },
        { status: 400 }
      );
    }

    let facility: any;
    try {
      facility = await prisma.healthcareFacility.create({
        data: {
          name: name.slice(0, 120),
          type: "PHARMACY",
          city: String(body.city || "").trim().slice(0, 80) || null,
          wilaya: String(body.wilaya || "").trim().slice(0, 80) || null,
          address: String(body.address || "").trim().slice(0, 200) || null,
          phone: String(body.phone || "").trim().slice(0, 40) || null,
          emergencyService: !!body.emergencyService,
        },
      });
    } catch (err) {
      console.error("facility create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to create pharmacy." },
        { status: 500 }
      );
    }

    try {
      await prisma.pharmacistFacility.create({
        data: { pharmacistId: ctx.pharmacistId, facilityId: facility.id },
      });
    } catch {
      // lien déjà existant : ignorer
    }

    return NextResponse.json({ success: true, facility }, { status: 201 });
  } catch (error) {
    console.error("POST /api/pharmacies/facility error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create pharmacy." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — mettre à jour ma pharmacie (nom, ville, tél, ...)
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    if (!ctx || !ctx.facility) {
      return NextResponse.json(
        { success: false, error: "No pharmacy configured." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const data: any = {};
    for (const key of ["name", "city", "wilaya", "address", "phone"] as const) {
      if (typeof body[key] === "string") data[key] = body[key].trim().slice(0, 200) || null;
    }
    if (typeof body.emergencyService === "boolean") {
      data.emergencyService = body.emergencyService;
    }
    if (data.name === null || data.name === "") {
      return NextResponse.json(
        { success: false, error: "Pharmacy name is required." },
        { status: 400 }
      );
    }

    let facility: any = ctx.facility;
    try {
      const all = await prisma.healthcareFacility.findMany({});
      const found = (all || []).find((f: any) => f.id === ctx.facilityId);
      if (found) {
        try {
          facility =
            (await prisma.healthcareFacility.update({
              where: { id: ctx.facilityId },
              data,
            })) || { ...found, ...data };
        } catch {
          facility = { ...found, ...data };
        }
      }
    } catch (err) {
      console.warn("facility update failed:", err);
    }

    return NextResponse.json({ success: true, facility });
  } catch (error) {
    console.error("PATCH /api/pharmacies/facility error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update pharmacy." },
      { status: 500 }
    );
  }
}
