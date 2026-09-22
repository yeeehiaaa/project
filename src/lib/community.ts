import { prisma } from "@/lib/prisma";

// Noms d'auteurs + noms de spécialités pour la communauté.
export async function authorMap() {
  let doctors: any[] = [];
  let profiles: any[] = [];
  let specLinks: any[] = [];
  let specialties: any[] = [];
  try {
    doctors = (await (prisma as any).doctor.findMany({})) || [];
    profiles = (await prisma.profile.findMany({})) || [];
    specLinks = (await (prisma as any).doctorSpecialty.findMany({})) || [];
    specialties = (await (prisma as any).specialty.findMany({})) || [];
  } catch {
    doctors = [];
  }
  const specNames = new Map(specialties.map((s: any) => [String(s.id), s.name]));
  const map = new Map<string, any>();
  for (const d of doctors) {
    const prof = profiles.find((p: any) => p.id === d.profileId);
    const sIds = specLinks.filter((l: any) => l.doctorId === d.id).map((l: any) => String(l.specialtyId));
    map.set(d.id, {
      id: d.id,
      name: prof ? `Dr. ${prof.firstName || ""} ${prof.lastName || ""}`.trim() : "Médecin",
      specialtyNames: sIds.map((id: string) => specNames.get(id)).filter(Boolean),
    });
  }
  return { map, specNames };
}

// Notifie les médecins mentionnés (hors auteur, sans doublon non lu).
export async function notifyMentioned(
  mentionedIds: string[],
  postId: string,
  byDoctorId: string
) {
  const targets = Array.from(new Set((mentionedIds || []).map(String))).filter(
    (id) => id && id !== byDoctorId
  );
  if (targets.length === 0) return;
  try {
    const all = (await (prisma as any).doctorNotification.findMany({})) || [];
    for (const target of targets.slice(0, 10)) {
      const dup = all.some(
        (n: any) => n.doctorId === target && n.postId === postId && !n.read
      );
      if (dup) continue;
      try {
        await (prisma as any).doctorNotification.create({
          data: { doctorId: target, productId: null, postId, read: false },
        });
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export function cleanIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.map((x) => String(x).trim()).filter(Boolean))).slice(0, 10);
}
