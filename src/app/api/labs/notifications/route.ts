import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// GET /api/labs/notifications — MES notifications (médecin) :
// nouveautés labos + mentions communauté (@).
// ============================================================
export async function GET(request: NextRequest) {
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
    let notifs: any[] = [];
    try {
      const all = await (prisma as any).doctorNotification.findMany({});
      notifs = (all || []).filter((n: any) => n.doctorId === doc.doctorId);
    } catch (err) {
      console.warn("notifications list failed:", err);
    }
    let products: any[] = [];
    let facilities: any[] = [];
    let specialties: any[] = [];
    try {
      products = (await (prisma as any).labProduct.findMany({})) || [];
      facilities = (await prisma.healthcareFacility.findMany({})) || [];
      specialties = (await (prisma as any).specialty.findMany({})) || [];
    } catch {
      products = [];
    }
    const specNames = new Map(specialties.map((s: any) => [String(s.id), s.name]));
    const enriched = notifs
      .map((n: any) => {
        // Mention communauté (@) : renvoie vers le post.
        if (n.postId) return { id: n.id, read: n.read, createdAt: n.createdAt, postId: n.postId };
        const p = products.find((x: any) => x.id === n.productId);
        if (!p || p.status !== "PUBLISHED") return null;
        const f = facilities.find((x: any) => x.id === p.facilityId);
        return {
          id: n.id,
          read: n.read,
          createdAt: n.createdAt,
          product: {
            ...p,
            docUrl: undefined,
            hasDoc: !!p.docUrl,
            labName: f?.name || "Laboratoire",
            labCity: f?.city || "",
            targetNames: (p.specialtyIds || []).length
              ? (p.specialtyIds || []).map((sid: string) => specNames.get(String(sid)) || "Spécialité")
              : ["Toutes spécialités"],
          },
        };
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    // Enrichir les mentions avec le post (titre + auteur).
    const postIds = Array.from(
      new Set(enriched.filter((n: any) => n.postId).map((n: any) => n.postId))
    );
    if (postIds.length > 0) {
      try {
        const allPosts = (await (prisma as any).doctorPost.findMany({})) || [];
        const { map: authors } = await authorMap();
        for (const n of enriched as any[]) {
          if (!n.postId) continue;
          const p = allPosts.find((x: any) => x.id === n.postId);
          const a = p ? authors.get(p.doctorId) : null;
          n.post = p
            ? {
                id: p.id,
                kind: p.kind,
                title: p.title,
                snippet: String(p.text || "").slice(0, 120),
                authorName: a?.name || "Médecin",
              }
            : null;
        }
      } catch {
        // ignore
      }
    }
    const unread = enriched.filter((n: any) => !n.read).length;
    return NextResponse.json({ success: true, notifications: enriched, unread });
  } catch (error) {
    console.error("GET /api/labs/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load notifications." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — {id?} lu / {all:true} tout marquer lu
// ============================================================
export async function PATCH(request: NextRequest) {
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
    const body = await request.json().catch(() => ({}));
    try {
      if (body.all) {
        const all = (await (prisma as any).doctorNotification.findMany({})) || [];
        for (const n of all.filter((x: any) => x.doctorId === doc.doctorId && !x.read)) {
          try {
            await (prisma as any).doctorNotification.update({
              where: { id: n.id },
              data: { read: true },
            });
          } catch { /* ignore */ }
        }
      } else if (body.id) {
        const all = (await (prisma as any).doctorNotification.findMany({})) || [];
        const n = all.find((x: any) => x.id === body.id);
        if (!n || n.doctorId !== doc.doctorId) {
          return NextResponse.json(
            { success: false, error: "Notification not found." },
            { status: 404 }
          );
        }
        await (prisma as any).doctorNotification.update({
          where: { id: n.id },
          data: { read: true },
        });
      }
    } catch (err) {
      console.warn("notification update failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/labs/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update notification." },
      { status: 500 }
    );
  }
}
