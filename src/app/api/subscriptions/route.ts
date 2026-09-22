import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";
import {
  planFor,
  amountFor,
  isPremiumActive,
  monthStart,
  FREE_VIDEO_PER_MONTH,
} from "@/lib/subscriptions";

async function mySubscription(profileId: string): Promise<any | null> {
  try {
    const all = await (prisma as any).subscription.findMany({});
    return (all || []).find((s: any) => s.profileId === profileId) || null;
  } catch {
    return null;
  }
}

// ============================================================
// GET — mon abonnement + quotas (téléconsultations restantes)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }
    const sub = await mySubscription(auth.profileId);
    const premium = isPremiumActive(sub);
    const plan = planFor(auth.userType);

    let videoUsed = 0;
    if (auth.userType === "PATIENT") {
      try {
        const patients = (await (prisma as any).patient.findMany({})) || [];
        const me = patients.find((p: any) => p.profileId === auth.profileId);
        if (me) {
          const logs = (await (prisma as any).callLog.findMany({})) || [];
          const from = monthStart().getTime();
          videoUsed = logs.filter(
            (c: any) =>
              c.patientId === me.id &&
              new Date(c.startedAt).getTime() >= from &&
              (Number(c.durationSec) || 0) > 0
          ).length;
        }
      } catch {
        videoUsed = 0;
      }
    }

    return NextResponse.json({
      success: true,
      subscription: sub || { plan: "FREE", status: "ACTIVE" },
      premium,
      plan: {
        monthly: plan.monthly,
        yearly: plan.yearly,
        free: plan.free,
        premium: plan.premium,
      },
      quotas: {
        videoUsed,
        videoFree: FREE_VIDEO_PER_MONTH,
        videoRemaining: premium ? -1 : Math.max(0, FREE_VIDEO_PER_MONTH - videoUsed),
      },
    });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load subscription." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — initier un abonnement {cycle: MONTHLY|YEARLY}
// → PENDING + montant (le confirm active, mode test immédiat)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const cycle = body.cycle === "YEARLY" ? "YEARLY" : "MONTHLY";
    const amount = amountFor(auth.userType, cycle);

    const existing = await mySubscription(auth.profileId);
    if (existing && isPremiumActive(existing)) {
      return NextResponse.json(
        { success: false, error: "Already premium." },
        { status: 400 }
      );
    }

    let sub: any = null;
    try {
      if (existing) {
        sub =
          (await (prisma as any).subscription.update({
            where: { id: existing.id },
            data: { status: "PENDING", cycle },
          })) || existing;
      } else {
        sub = await (prisma as any).subscription.create({
          data: {
            profileId: auth.profileId,
            userType: auth.userType,
            plan: "FREE",
            status: "PENDING",
            cycle,
          },
        });
      }
    } catch (err) {
      console.error("subscription init failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to start subscription." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: true, subscriptionId: sub.id, amount, cycle, testMode: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to start subscription." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — résilier (redevient FREE immédiatement, mode test)
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }
    const existing = await mySubscription(auth.profileId);
    if (!existing) {
      return NextResponse.json({ success: true });
    }
    try {
      await (prisma as any).subscription.update({
        where: { id: existing.id },
        data: { plan: "FREE", status: "CANCELLED", expiresAt: null },
      });
    } catch (err) {
      console.warn("subscription cancel failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/subscriptions error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to cancel subscription." },
      { status: 500 }
    );
  }
}
