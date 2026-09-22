import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { amountFor } from "@/lib/subscriptions";

// ============================================================
// POST /api/subscriptions/confirm — TEST MODE (sans banque).
// Simule le callback SATIM : {subscriptionId, provider: CIB|EDAHABIA}
// → abonnement PREMIUM actif, expiry +1 mois / +1 an.
// En prod : vérifier la signature SATIM ici avant d'activer.
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
    const { subscriptionId, provider } = body;
    if (!subscriptionId || !["CIB", "EDAHABIA"].includes(provider)) {
      return NextResponse.json(
        { success: false, error: "subscriptionId and provider (CIB|EDAHABIA) are required." },
        { status: 400 }
      );
    }
    let sub: any = null;
    try {
      const all = await (prisma as any).subscription.findMany({});
      sub = (all || []).find((s: any) => s.id === subscriptionId) || null;
    } catch {
      sub = null;
    }
    if (!sub || sub.profileId !== auth.profileId) {
      return NextResponse.json(
        { success: false, error: "Subscription not found." },
        { status: 404 }
      );
    }
    const cycle = sub.cycle === "YEARLY" ? "YEARLY" : "MONTHLY";
    const amount = amountFor(auth.userType, cycle);
    const expiresAt = new Date();
    if (cycle === "YEARLY") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    let updated: any = null;
    try {
      updated = await (prisma as any).subscription.update({
        where: { id: sub.id },
        data: {
          plan: "PREMIUM",
          status: "ACTIVE",
          cycle,
          provider,
          providerRef: `TEST-${Date.now().toString(36).toUpperCase()}`,
          startedAt: new Date(),
          expiresAt,
        },
      });
    } catch (err) {
      console.error("subscription confirm failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to activate subscription." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, subscription: updated, amount, testMode: true });
  } catch (error) {
    console.error("POST /api/subscriptions/confirm error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to confirm payment." },
      { status: 500 }
    );
  }
}
