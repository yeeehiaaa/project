import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveDoctorId(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.substring(7).trim();
    if (!token) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return null;
    const doctor = await prisma.doctor.findFirst({
      where: {
        profile: { authUserId: userData.user.id, userType: "DOCTOR" },
      },
      select: { id: true },
    });
    return doctor?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const queryDoctorId = searchParams.get("doctorId");

    // Isolate per doctor: an authenticated doctor only sees his own prescriptions.
    const authDoctorId = await resolveDoctorId(request);
    const effectiveDoctorId = authDoctorId || queryDoctorId;

    const whereClause: any = {};
    if (patientId) {
      whereClause.patientId = patientId;
    }
    if (effectiveDoctorId) {
      whereClause.doctorId = effectiveDoctorId;
    } else if (authDoctorId === null && !queryDoctorId) {
      // No doctor scope and authenticated check failed: do not leak all prescriptions.
      // Require explicit doctorId or valid auth.
      return NextResponse.json(
        { error: "Doctor scope required (missing auth or doctorId)." },
        { status: 401 }
      );
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        patient: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: {
        prescribedDate: "desc",
      },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("GET /api/prescriptions error:", error);

    return NextResponse.json(
      { error: "Unable to load prescriptions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      patientName,
      doctorId,
      prescriptionNumber,
      notes,
      items,
    } = body;

    // Resolve patient if ID not directly provided or needs fallback
    let targetPatientId = patientId;
    if (!targetPatientId && patientName) {
      const found = await prisma.patient.findFirst({
        where: {
          OR: [
            {
              profile: {
                OR: [
                  { firstName: { contains: patientName.trim(), mode: "insensitive" } },
                  { lastName: { contains: patientName.trim(), mode: "insensitive" } },
                ],
              },
            },
          ],
        },
      });
      if (found) targetPatientId = found.id;
    }

    // Default to first patient if still not resolved
    if (!targetPatientId) {
      const firstPat = await prisma.patient.findFirst();
      targetPatientId = firstPat?.id || "pat-1";
    }

    // Resolve doctor ID: NEVER default to another doctor's account.
    // Priority: authenticated doctor > explicit doctorId > error.
    let targetDoctorId = doctorId;
    const authDoctorId = await resolveDoctorId(request);
    if (authDoctorId) {
      targetDoctorId = authDoctorId;
    }
    if (!targetDoctorId) {
      return NextResponse.json(
        { success: false, error: "Doctor authentication required to create a prescription." },
        { status: 401 }
      );
    }

    const refNum =
      prescriptionNumber ||
      `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const newPrescription = await prisma.prescription.create({
      data: {
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        prescriptionNumber: refNum,
        prescribedDate: new Date(),
        status: "ACTIVE",
        notes: notes || "",
        items: {
          create: Array.isArray(items)
            ? items.map((it: any) => ({
                medicationName: it.medication || it.medicationName || "Médicament",
                dosage: it.dosage || "1 cp",
                frequency: it.frequency || "Selon prescription",
                instructions: it.instructions || "",
                durationDays: it.duration ? parseInt(String(it.duration)) || 30 : 30,
              }))
            : [],
        },
      },
      include: {
        items: true,
        patient: {
          include: {
            profile: true,
          },
        },
        doctor: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("POST /api/prescriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement de l'ordonnance" },
      { status: 500 }
    );
  }
}