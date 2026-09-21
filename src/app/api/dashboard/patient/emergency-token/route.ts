import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolvePatientId(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.substring(7).trim();
    if (!token) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return null;
    const profile = await prisma.profile.findUnique({
      where: { authUserId: userData.user.id },
      select: { id: true, userType: true },
    });
    if (!profile || profile.userType !== "PATIENT") return null;
    const patient = await prisma.patient.findUnique({
      where: { profileId: profile.id },
      select: { id: true },
    });
    return patient?.id || null;
  } catch {
    return null;
  }
}

// ============================================================
// GET — récupérer (ou créer) mon jeton d'urgence
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const patientId = await resolvePatientId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    let patient: any = null;
    try {
      const found = await prisma.patient.findMany({ where: { id: patientId } });
      patient = (found || [])[0] || null;
    } catch {
      patient = null;
    }
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found." },
        { status: 404 }
      );
    }

    // Sans vraie base, aucun jeton ne peut persister : refuser plutôt que
    // renvoyer un jeton fantôme (qui ferait 404 sur la page publique).
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          code: "db_not_ready",
          error: "DATABASE_URL manquante : persistance impossible.",
        },
        { status: 503 }
      );
    }

    if (!patient.emergencyToken) {
      try {
        patient = await prisma.patient.update({
          where: { id: patientId },
          data: { emergencyToken: randomUUID().replace(/-/g, "") },
        });
      } catch (err) {
        console.warn("emergency-token create failed:", err);
        return NextResponse.json(
          {
            success: false,
            code: "db_not_ready",
            error:
              "Colonne emergencyToken absente ou client obsolète : lancez « npx prisma migrate deploy » puis « npx prisma generate » et redémarrez le serveur.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      token: patient.emergencyToken,
    });
  } catch (error) {
    console.error("GET /api/dashboard/patient/emergency-token error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load emergency token." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST {action:"regenerate"} — révoquer et régénérer le jeton
// (l'ancien lien QR cesse immédiatement de fonctionner)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const patientId = await resolvePatientId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.action !== "regenerate") {
      return NextResponse.json(
        { success: false, error: "Unknown action." },
        { status: 400 }
      );
    }

    let patient: any = null;
    try {
      patient = await prisma.patient.update({
        where: { id: patientId },
        data: { emergencyToken: randomUUID().replace(/-/g, "") },
      });
    } catch (err) {
      console.error("emergency-token regenerate failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to regenerate token." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, token: patient.emergencyToken });
  } catch (error) {
    console.error("POST /api/dashboard/patient/emergency-token error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to regenerate token." },
      { status: 500 }
    );
  }
}
