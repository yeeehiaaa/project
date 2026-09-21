import { NextRequest } from "next/server";
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

export interface AuthContext {
  authUserId: string;
  profileId: string;
  userType: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function resolveAuth(request: NextRequest): Promise<AuthContext | null> {
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
    });
    if (!profile) return null;
    return {
      authUserId: userData.user.id,
      profileId: profile.id,
      userType: String(profile.userType),
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
    };
  } catch {
    return null;
  }
}

export interface PharmacistContext extends AuthContext {
  pharmacistId: string;
  facilityId: string;
  facility: any;
}

// Pharmacien + SA pharmacie (la première liée). Tout est scopé par elle :
// un pharmacien ne voit/modifie que son propre stock et ses demandes.
export async function resolvePharmacist(
  request: NextRequest
): Promise<PharmacistContext | null> {
  const auth = await resolveAuth(request);
  if (!auth || auth.userType !== "PHARMACIST") return null;

  let pharmacist: any = null;
  try {
    const found = await prisma.pharmacist.findMany({
      where: { profileId: auth.profileId },
    });
    pharmacist = (found || [])[0] || null;
  } catch {
    pharmacist = null;
  }
  if (!pharmacist) return null;

  let links: any[] = [];
  try {
    const all = await prisma.pharmacistFacility.findMany({});
    links = (all || []).filter((l: any) => l.pharmacistId === pharmacist.id);
  } catch {
    links = [];
  }

  let facility: any = null;
  if (links.length > 0) {
    try {
      const all = await prisma.healthcareFacility.findMany({});
      facility =
        (all || []).find((f: any) => f.id === links[0].facilityId) || null;
    } catch {
      facility = null;
    }
  }

  return {
    ...auth,
    pharmacistId: pharmacist.id,
    facilityId: facility?.id || "",
    facility,
  };
}

export async function resolvePatientRecordId(
  request: NextRequest
): Promise<string | null> {
  const auth = await resolveAuth(request);
  if (!auth || auth.userType !== "PATIENT") return null;
  try {
    const found = await prisma.patient.findMany({
      where: { profileId: auth.profileId },
    });
    const patient = (found || [])[0] || null;
    return patient?.id || null;
  } catch {
    return null;
  }
}

export function norm(s: unknown): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
