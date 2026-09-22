import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";

// ============================================================
// GET /api/calls/[appointmentId] — droit d'accès à la salle d'appel.
// Seuls le médecin et le patient du RDV (type ONLINE, non annulé/
// terminé) peuvent rejoindre. Retourne le rôle + noms d'affichage.
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    let apt: any = null;
    try {
      const all = await prisma.appointment.findMany({});
      apt = (all || []).find((a: any) => a.id === appointmentId) || null;
    } catch {
      apt = null;
    }
    if (!apt) {
      return NextResponse.json(
        { success: false, error: "Rendez-vous introuvable." },
        { status: 404 }
      );
    }
    if (apt.type !== "ONLINE") {
      return NextResponse.json(
        { success: false, error: "Ce rendez-vous n'est pas en ligne." },
        { status: 400 }
      );
    }
    if (["CANCELLED", "NO_SHOW"].includes(apt.status)) {
      return NextResponse.json(
        { success: false, error: "Ce rendez-vous est annulé." },
        { status: 400 }
      );
    }

    let role: "doctor" | "patient" | null = null;
    try {
      const doctors = (await (prisma as any).doctor.findMany({})) || [];
      const patients = (await (prisma as any).patient.findMany({})) || [];
      const doc = doctors.find((d: any) => d.profileId === auth.profileId);
      const pat = patients.find((p: any) => p.id === apt.patientId && p.profileId === auth.profileId);
      if (doc && doc.id === apt.doctorId) role = "doctor";
      else if (pat) role = "patient";
    } catch {
      role = null;
    }
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Accès réservé au médecin et au patient du rendez-vous." },
        { status: 403 }
      );
    }

    // Quota freemium : 1 visio/mois en FREE, illimité en PREMIUM (patient).
    if (role === "patient") {
      try {
        const subs = (await (prisma as any).subscription.findMany({})) || [];
        const sub = subs.find((s: any) => s.profileId === auth.profileId);
        const premium =
          sub?.plan === "PREMIUM" &&
          sub?.status === "ACTIVE" &&
          (!sub?.expiresAt || new Date(sub.expiresAt).getTime() > Date.now());
        if (!premium) {
          const logs = (await (prisma as any).callLog.findMany({})) || [];
          const from = new Date();
          from.setDate(1);
          from.setHours(0, 0, 0, 0);
          const used = logs.filter(
            (c: any) =>
              c.patientId === apt.patientId &&
              new Date(c.startedAt).getTime() >= from.getTime() &&
              (Number(c.durationSec) || 0) > 0
          ).length;
          if (used >= 1) {
            return NextResponse.json(
              {
                success: false,
                error: "PAYWALL",
                message:
                  "Quota gratuit épuisé (1 téléconsultation / mois). Passez Premium pour continuer.",
              },
              { status: 402 }
            );
          }
        }
      } catch {
        // en cas de doute, on laisse passer (pas de blocage technique)
      }
    }

    let doctorName = "Médecin";
    let patientName = "Patient";
    try {
      const profiles = (await prisma.profile.findMany({})) || [];
      const doctors = (await (prisma as any).doctor.findMany({})) || [];
      const patients = (await (prisma as any).patient.findMany({})) || [];
      const doc = doctors.find((d: any) => d.id === apt.doctorId);
      const pat = patients.find((p: any) => p.id === apt.patientId);
      const dProf = profiles.find((x: any) => x.id === doc?.profileId);
      const pProf = profiles.find((x: any) => x.id === pat?.profileId);
      if (dProf) doctorName = `Dr. ${dProf.firstName || ""} ${dProf.lastName || ""}`.trim() || doctorName;
      if (pProf) patientName = `${pProf.firstName || ""} ${pProf.lastName || ""}`.trim() || patientName;
    } catch {
      // noms par défaut
    }

    return NextResponse.json({
      success: true,
      role,
      appointment: {
        id: apt.id,
        type: apt.type,
        status: apt.status,
        appointmentDate: apt.appointmentDate,
        doctorName,
        patientName,
      },
    });
  } catch (error) {
    console.error("GET /api/calls/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to check call access." },
      { status: 500 }
    );
  }
}
