import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth, type AuthContext } from "@/lib/pharmacy-auth";

export interface LabStaffContext extends AuthContext {
  labStaffId: string;
  facilityId: string;
  facility: any;
}

// Responsable labo + SON laboratoire (le premier lié). Tout est scopé :
// un labo ne voit/modifie que ses produits et son établissement.
export async function resolveLabStaff(
  request: NextRequest
): Promise<LabStaffContext | null> {
  const auth = await resolveAuth(request);
  if (!auth || auth.userType !== "LABORATORY_STAFF") return null;

  let staff: any = null;
  try {
    const found = await prisma.laboratoryStaff.findMany({
      where: { profileId: auth.profileId },
    });
    staff = (found || [])[0] || null;
  } catch {
    staff = null;
  }
  if (!staff) return null;

  let links: any[] = [];
  try {
    const all = await prisma.laboratoryFacility.findMany({});
    links = (all || []).filter((l: any) => l.laboratoryStaffId === staff.id);
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
    labStaffId: staff.id,
    facilityId: facility?.id || "",
    facility,
  };
}

// Médecin connecté + ses spécialités (ids) pour le ciblage des nouveautés.
export async function resolveDoctorWithSpecialties(
  request: NextRequest
): Promise<{ doctorId: string; specialtyIds: string[] } | null> {
  const auth = await resolveAuth(request);
  if (!auth || auth.userType !== "DOCTOR") return null;
  try {
    const doctors = (await (prisma as any).doctor.findMany({})) || [];
    const doc = doctors.find((d: any) => d.profileId === auth.profileId);
    if (!doc) return null;
    const links = (await (prisma as any).doctorSpecialty.findMany({})) || [];
    const specialtyIds = links
      .filter((l: any) => l.doctorId === doc.id)
      .map((l: any) => String(l.specialtyId));
    return { doctorId: doc.id, specialtyIds };
  } catch {
    return null;
  }
}

// Un produit cible-t-il ce médecin ? (vide = toutes spécialités)
export function productTargetsDoctor(
  productSpecialtyIds: string[],
  doctorSpecialtyIds: string[]
): boolean {
  const want = (productSpecialtyIds || []).map(String);
  if (want.length === 0) return true;
  const have = new Set(doctorSpecialtyIds.map(String));
  return want.some((id) => have.has(id));
}
