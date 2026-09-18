import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedDoctorContext {
  userId: string;
  email: string;
  profileId: string;
  doctorId: string;
  doctorName: string;
  isRegisteredDoctor: boolean;
}

/**
 * Extracts and verifies the authenticated doctor from request Authorization Bearer token.
 * Returns null if no valid token or not authenticated.
 */
export async function getAuthenticatedDoctor(
  request: NextRequest
): Promise<AuthenticatedDoctorContext | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return null;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return null;
    }

    const user = userData.user;

    // Find Profile in Prisma store
    let profile = await prisma.profile.findUnique({
      where: { authUserId: user.id },
      include: {
        doctor: true,
      },
    });

    // Fallback search by email if authUserId mismatch
    if (!profile && user.email) {
      profile = await prisma.profile.findUnique({
        where: { email: user.email.toLowerCase() },
        include: {
          doctor: true,
        },
      });
    }

    if (profile) {
      let doctor = profile.doctor;
      if (!doctor) {
        // Look up by profileId
        doctor = await prisma.doctor.findUnique({
          where: { profileId: profile.id },
        });
      }

      const doctorId = doctor?.id || `doc-${profile.id}`;
      const doctorName = `Dr. ${profile.firstName || ""} ${profile.lastName || ""}`.trim();

      return {
        userId: user.id,
        email: user.email || profile.email,
        profileId: profile.id,
        doctorId,
        doctorName: doctorName || "Dr. Praticien",
        isRegisteredDoctor: true,
      };
    }

    // Default authenticated context from Supabase user metadata if profile not yet in Prisma
    const metaFirstName = (user.user_metadata?.first_name || user.user_metadata?.firstName || "").trim();
    const metaLastName = (user.user_metadata?.last_name || user.user_metadata?.lastName || "").trim();
    const name = metaFirstName || metaLastName
      ? `Dr. ${metaFirstName} ${metaLastName}`.trim()
      : `Dr. ${(user.email || "Médecin").split("@")[0]}`;

    return {
      userId: user.id,
      email: user.email || "",
      profileId: `prof-${user.id}`,
      doctorId: `doc-${user.id}`,
      doctorName: name,
      isRegisteredDoctor: true,
    };
  } catch (err) {
    console.warn("getAuthenticatedDoctor error:", err);
    return null;
  }
}
