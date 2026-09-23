import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";

// ============================================================
// Push navigateur : inscription / désinscription.
// L'envoi se fait côté serveur (mentions, réponses, expertise).
// Clés VAPID requises, sinon inscription refusée proprement.
// ============================================================

function vapidReady(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const doc = await resolveDoctorWithSpecialties(request);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found." },
        { status: 404 }
      );
    }
    if (!vapidReady()) {
      return NextResponse.json(
        { success: false, error: "Push non configuré (clés VAPID manquantes)." },
        { status: 500 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const { endpoint, p256dh, auth: authKey } = body;
    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json(
        { success: false, error: "Subscription invalide." },
        { status: 400 }
      );
    }
    try {
      const all = (await (prisma as any).pushSubscription.findMany({})) || [];
      const mine = all.find((s: any) => s.endpoint === endpoint);
      if (mine && mine.doctorId !== doc.doctorId) {
        try {
          await (prisma as any).pushSubscription.delete({ where: { id: mine.id } });
        } catch { /* ignore */ }
      }
      if (!mine || mine.doctorId !== doc.doctorId) {
        await (prisma as any).pushSubscription.create({
          data: {
            doctorId: doc.doctorId,
            endpoint: String(endpoint).slice(0, 500),
            p256dh: String(p256dh),
            auth: String(authKey),
          },
        });
      }
    } catch (err) {
      console.warn("push subscribe failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/community/push error:", error);
    return NextResponse.json({ success: false, error: "Unable to subscribe." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint") || "";
    if (!endpoint) {
      return NextResponse.json({ success: false, error: "endpoint is required." }, { status: 400 });
    }
    try {
      const all = (await (prisma as any).pushSubscription.findMany({})) || [];
      const mine = all.find((s: any) => s.endpoint === endpoint);
      if (mine) {
        await (prisma as any).pushSubscription.delete({ where: { id: mine.id } });
      }
    } catch { /* ignore */ }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/community/push error:", error);
    return NextResponse.json({ success: false, error: "Unable to unsubscribe." }, { status: 500 });
  }
}
