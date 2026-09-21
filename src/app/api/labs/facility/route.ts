import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveLabStaff } from "@/lib/lab-auth";

// ============================================================
// GET — mon laboratoire (ou null si pas encore configuré)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveLabStaff(request);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as lab staff." },
        { status: 401 }
      );
    }
    return NextResponse.json({
      success: true,
      facility: ctx.facility || null,
      labStaffId: ctx.labStaffId,
    });
  } catch (error) {
    console.error("GET /api/labs/facility error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load laboratory." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — créer mon laboratoire (un seul) et me lier
// {name, city?, wilaya?, address?, phone?, website?}
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveLabStaff(request);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as lab staff." },
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
        { success: false, error: "Laboratory name is required." },
        { status: 400 }
      );
    }

    let facility: any;
    try {
      facility = await prisma.healthcareFacility.create({
        data: {
          name: name.slice(0, 120),
          type: "LABORATORY",
          city: String(body.city || "").trim().slice(0, 80) || null,
          wilaya: String(body.wilaya || "").trim().slice(0, 80) || null,
          address: String(body.address || "").trim().slice(0, 200) || null,
          phone: String(body.phone || "").trim().slice(0, 40) || null,
          website: String(body.website || "").trim().slice(0, 200) || null,
          description: String(body.description || "").trim().slice(0, 500) || null,
        },
      });
    } catch (err) {
      console.error("lab facility create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to create laboratory." },
        { status: 500 }
      );
    }

    try {
      await prisma.laboratoryFacility.create({
        data: { laboratoryStaffId: ctx.labStaffId, facilityId: facility.id },
      });
    } catch {
      // lien déjà existant : ignorer
    }

    return NextResponse.json({ success: true, facility }, { status: 201 });
  } catch (error) {
    console.error("POST /api/labs/facility error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create laboratory." },
      { status: 500 }
    );
  }
}
