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

// Helper to parse DB allergies (string, comma-separated, JSON array, or null) into string[]
function parseAllergies(allergies: any): string[] {
  if (!allergies) return [];
  if (Array.isArray(allergies)) return allergies.map(String).filter(Boolean);
  if (typeof allergies === "string") {
    const trimmed = allergies.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
      } catch {
        // fall through
      }
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// Helper to calculate age from birthDate
function calculateAge(birthDate: Date | string | null | undefined): number {
  if (!birthDate) return 38;
  try {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 && age < 125 ? age : 38;
  } catch {
    return 38;
  }
}

// Helper to format last visit date
function formatLastVisit(appointments?: any[]): string {
  if (!appointments || appointments.length === 0) return "Aucune visite";
  const sorted = [...appointments].sort(
    (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );
  const latest = new Date(sorted[0].appointmentDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays > 0 && diffDays < 7) return `Il y a ${diffDays} jours`;
  return latest.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function mapDbPatientToRecord(pat: any) {
  const firstName = pat.profile?.firstName || "";
  const lastName = pat.profile?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || `Patient ${pat.id.slice(0, 8)}`;
  const gender = pat.profile?.gender === "FEMALE" ? "Femme" : "Homme";
  const allergies = parseAllergies(pat.allergies);
  const totalVisits = Array.isArray(pat.appointments) ? pat.appointments.length : 0;
  const lastVisit = formatLastVisit(pat.appointments);

  return {
    id: pat.id,
    name: fullName,
    firstName,
    lastName,
    age: calculateAge(pat.profile?.birthDate),
    gender,
    phone: pat.profile?.phone || "+213 550 00 00 00",
    email: pat.profile?.email || `${pat.id}@email.com`,
    bloodGroup: pat.bloodType || "O+",
    chronicCondition: pat.chronicConditions || null,
    allergies,
    lastVisit,
    totalVisits,
    currentMedications: pat.currentMedications || null,
    medicalHistory: pat.medicalHistory || null,
    surgicalHistory: pat.surgicalHistory || null,
    emergencyContactName: pat.emergencyContactName || null,
    emergencyContactPhone: pat.emergencyContactPhone || null,
    emergencyContactRelation: pat.emergencyContactRelation || null,
    city: pat.profile?.city || null,
    wilaya: pat.profile?.wilaya || null,
    address: pat.profile?.address || null,
    createdAt: pat.createdAt,
    prescriptions: Array.isArray(pat.prescriptions)
      ? pat.prescriptions.map((pr: any) => ({
          id: pr.id,
          prescriptionNumber: pr.prescriptionNumber,
          prescribedDate: pr.prescribedDate,
          status: pr.status,
          notes: pr.notes,
          doctorName: pr.doctor?.profile
            ? `Dr. ${pr.doctor.profile.firstName || ""} ${pr.doctor.profile.lastName || ""}`.trim()
            : "Dr. Sarah Khelifi",
          items: Array.isArray(pr.items)
            ? pr.items.map((it: any) => ({
                id: it.id,
                medicationName: it.medicationName,
                dosage: it.dosage,
                frequency: it.frequency,
                duration: it.durationDays ? `${it.durationDays} jours` : null,
                instructions: it.instructions,
              }))
            : [],
        }))
      : [],
  };
}

export async function GET(request: NextRequest) {
  try {
    // Isolate per doctor: only patients linked to the authenticated doctor
    // (via appointment or prescription). Without this, doctor 1 sees doctor 2's patients.
    const doctorId = await resolveDoctorId(request);
    if (!doctorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated as doctor.",
          patients: [],
        },
        { status: 401 }
      );
    }

    // ?scope=all : annuaire complet pour les sélecteurs de création
    // (nouveau RDV / nouvelle ordonnance). Un médecin sans activité a une
    // liste "mes patients" vide mais doit quand même pouvoir choisir un
    // patient pour créer le premier rendez-vous. Réservé aux médecins.
    const { searchParams } = new URL(request.url);
    const scopeAll = searchParams.get("scope") === "all";

    const dbPatients = await prisma.patient.findMany({
      where: scopeAll
        ? undefined
        : {
            OR: [
              { appointments: { some: { doctorId } } },
              { prescriptions: { some: { doctorId } } },
            ],
          },
      include: {
        profile: true,
        appointments: {
          where: { doctorId },
          orderBy: { appointmentDate: "desc" },
          take: 5,
        },
        prescriptions: {
          where: { doctorId },
          include: {
            items: true,
            doctor: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { prescribedDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (Array.isArray(dbPatients) && dbPatients.length > 0) {
      const patients = dbPatients.map(mapDbPatientToRecord);
      return NextResponse.json({
        success: true,
        source: "database",
        count: patients.length,
        patients,
      });
    }

    return NextResponse.json({
      success: true,
      source: "empty",
      count: 0,
      patients: [],
    });
  } catch (error) {
    console.error("GET /api/dashboard/doctor/patients error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des patients depuis la base de données",
        patients: [],
      },
      { status: 500 }
    );
  }
}

