import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// POST /api/calls/log — journalise un appel (upsert par RDV :
// on garde la durée la plus longue si les 2 côtés journalisent).
// Body {appointmentId, mode?, durationSec?}. Auth Bearer (tout
// utilisateur connecté ; le RDV doit exister).
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const appointmentId = String(body.appointmentId || "");
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "appointmentId is required." },
        { status: 400 }
      );
    }
    const mode = body.mode === "voice" ? "voice" : "video";
    const durationSec = Math.max(0, Math.min(30 * 60, parseInt(String(body.durationSec ?? 0), 10) || 0));

    let apt: any = null;
    try {
      const all = await prisma.appointment.findMany({});
      apt = (all || []).find((a: any) => a.id === appointmentId) || null;
    } catch {
      apt = null;
    }
    if (!apt) {
      return NextResponse.json(
        { success: false, error: "Appointment not found." },
        { status: 404 }
      );
    }

    try {
      const existing = await (prisma as any).callLog.findMany({});
      const prev = (existing || []).find((c: any) => c.appointmentId === appointmentId);
      if (prev) {
        const best = Math.max(Number(prev.durationSec) || 0, durationSec);
        await (prisma as any).callLog.update({
          where: { id: prev.id },
          data: { durationSec: best, endedAt: new Date(), mode },
        });
      } else {
        await (prisma as any).callLog.create({
          data: {
            appointmentId,
            doctorId: apt.doctorId,
            patientId: apt.patientId,
            mode,
            endedAt: new Date(),
            durationSec,
          },
        });
      }
    } catch (err) {
      console.warn("call log save failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/calls/log error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save call log." },
      { status: 500 }
    );
  }
}
