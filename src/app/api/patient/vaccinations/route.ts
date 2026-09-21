import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePatientRecordId } from "@/lib/pharmacy-auth";

// ============================================================
// GET — mon carnet de vaccinations (patient connecté uniquement)
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
    let items: any[] = [];
    try {
      const all = await prisma.vaccination.findMany({});
      items = (all || [])
        .filter((v: any) => v.patientId === patientId)
        .sort(
          (a: any, b: any) =>
            new Date(b.vaccinationDate).getTime() - new Date(a.vaccinationDate).getTime()
        );
    } catch (err) {
      console.warn("vaccinations list failed:", err);
    }
    return NextResponse.json({ success: true, vaccinations: items });
  } catch (error) {
    console.error("GET /api/patient/vaccinations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load vaccinations." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — ajouter {vaccineName, vaccinationDate, dose?, nextDueDate?, provider?, batchNumber?, notes?}
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
    const vaccineName = String(body.vaccineName || "").trim();
    if (!vaccineName) {
      return NextResponse.json(
        { success: false, error: "vaccineName is required." },
        { status: 400 }
      );
    }
    const vaccinationDate = body.vaccinationDate ? new Date(body.vaccinationDate) : new Date();
    if (isNaN(vaccinationDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid vaccinationDate." },
        { status: 400 }
      );
    }
    let nextDueDate: Date | null = null;
    if (body.nextDueDate) {
      const d = new Date(body.nextDueDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid nextDueDate." },
          { status: 400 }
        );
      }
      nextDueDate = d;
    }
    let created: any = null;
    try {
      created = await prisma.vaccination.create({
        data: {
          patientId,
          vaccineName: vaccineName.slice(0, 120),
          dose: String(body.dose || "").trim().slice(0, 60) || null,
          vaccinationDate,
          nextDueDate,
          provider: String(body.provider || "").trim().slice(0, 120) || null,
          batchNumber: String(body.batchNumber || "").trim().slice(0, 60) || null,
          notes: String(body.notes || "").trim().slice(0, 300) || null,
        },
      });
    } catch (err) {
      console.error("vaccination create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to add vaccination." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, vaccination: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/patient/vaccinations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to add vaccination." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ?id= — retirer une entrée de MON carnet
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
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required." },
        { status: 400 }
      );
    }
    let found: any = null;
    try {
      const all = await prisma.vaccination.findMany({});
      found = (all || []).find((v: any) => v.id === id) || null;
    } catch {
      found = null;
    }
    if (!found || found.patientId !== patientId) {
      return NextResponse.json(
        { success: false, error: "Vaccination not found." },
        { status: 404 }
      );
    }
    try {
      await prisma.vaccination.delete({ where: { id } });
    } catch (err) {
      console.warn("vaccination delete failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/patient/vaccinations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete vaccination." },
      { status: 500 }
    );
  }
}
