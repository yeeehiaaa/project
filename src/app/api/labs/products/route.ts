import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveLabStaff } from "@/lib/lab-auth";
import { FREE_LAB_PRODUCTS, isPremiumActive } from "@/lib/subscriptions";

function cleanStr(v: unknown, max: number): string | null {
  const t = String(v ?? "").trim();
  return t ? t.slice(0, max) : null;
}

function cleanIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return Array.from(
    new Set(v.map((x) => String(x).trim()).filter(Boolean))
  ).slice(0, 20);
}

// Notifie les médecins ciblés par un produit publié.
// Ciblage vide = toutes les spécialités = tous les médecins.
async function notifyDoctors(product: any) {
  try {
    const want: string[] = (product.specialtyIds || []).map(String);
    const doctors = (await (prisma as any).doctor.findMany({})) || [];
    let targets = doctors;
    if (want.length > 0) {
      const links = (await (prisma as any).doctorSpecialty.findMany({})) || [];
      const byDoctor = new Map<string, Set<string>>();
      for (const l of links) {
        if (!byDoctor.has(l.doctorId)) byDoctor.set(l.doctorId, new Set());
        byDoctor.get(l.doctorId)!.add(String(l.specialtyId));
      }
      targets = doctors.filter((d: any) => {
        const have = byDoctor.get(d.id);
        return have && want.some((id) => have.has(id));
      });
    }
    const existing = (await (prisma as any).doctorNotification.findMany({})) || [];
    const already = new Set(
      existing
        .filter((n: any) => n.productId === product.id)
        .map((n: any) => n.doctorId)
    );
    for (const d of targets) {
      if (already.has(d.id)) continue;
      try {
        await (prisma as any).doctorNotification.create({
          data: { doctorId: d.id, productId: product.id, read: false },
        });
      } catch {
        // ignorer les doublons / mode dégradé
      }
    }
  } catch (err) {
    console.warn("doctor notify failed:", err);
  }
}

// ============================================================
// GET — mes produits (labo connecté)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveLabStaff(request);
    if (!ctx || !ctx.facilityId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as lab staff." },
        { status: 401 }
      );
    }
    let products: any[] = [];
    try {
      const all = await (prisma as any).labProduct.findMany({});
      products = (all || [])
        .filter((p: any) => p.facilityId === ctx.facilityId)
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
      console.warn("lab products list failed:", err);
    }
    let specialties: any[] = [];
    try {
      specialties = (await (prisma as any).specialty.findMany({})) || [];
    } catch {
      specialties = [];
    }
    return NextResponse.json({ success: true, products, specialties });
  } catch (error) {
    console.error("GET /api/labs/products error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load products." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — créer un produit {name, dci?, dosage?, forme?, indications?,
// price?, description?, docUrl?, docName?, specialtyIds?, status?}
// status=PUBLISHED → notifie les médecins ciblés.
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveLabStaff(request);
    if (!ctx || !ctx.facilityId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as lab staff." },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }
    let price: number | null = null;
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const n = Number(body.price);
      if (isNaN(n) || n < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid price." },
          { status: 400 }
        );
      }
      price = Math.round(n * 100) / 100;
    }
    let docUrl: string | null = null;
    const docName = cleanStr(body.docName, 160);
    if (typeof body.docUrl === "string" && body.docUrl.trim()) {
      const v = body.docUrl.trim();
      if (v.length > 8_000_000) {
        return NextResponse.json(
          { success: false, error: "Document trop lourd (max ~6 Mo)." },
          { status: 400 }
        );
      }
      if (
        !v.startsWith("data:application/pdf") &&
        !v.startsWith("data:image/") &&
        !v.startsWith("http")
      ) {
        return NextResponse.json(
          { success: false, error: "Document : PDF ou image uniquement." },
          { status: 400 }
        );
      }
      docUrl = v;
    }
    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    try {
      const mine = (await (prisma as any).labProduct.findMany({})) || [];
      const count = mine.filter((p: any) => p.facilityId === ctx.facilityId).length;
      if (count >= FREE_LAB_PRODUCTS) {
        const subs = (await (prisma as any).subscription.findMany({})) || [];
        const sub = subs.find((s: any) => s.profileId === ctx.profileId);
        if (!isPremiumActive(sub)) {
          return NextResponse.json(
            {
              success: false,
              error: "PAYWALL",
              message: `Compte gratuit : ${FREE_LAB_PRODUCTS} produits max. Passez Premium pour l'illimité.`,
            },
            { status: 402 }
          );
        }
      }
    } catch {
      // en cas de doute, on laisse passer
    }
    let created: any = null;
    try {
      created = await (prisma as any).labProduct.create({
        data: {
          facilityId: ctx.facilityId,
          name: name.slice(0, 120),
          dci: cleanStr(body.dci, 120),
          dosage: cleanStr(body.dosage, 60),
          forme: cleanStr(body.forme, 60),
          indications: cleanStr(body.indications, 500),
          price,
          description: cleanStr(body.description, 1000),
          docUrl,
          docName,
          specialtyIds: cleanIds(body.specialtyIds),
          status,
        },
      });
    } catch (err) {
      console.error("lab product create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to create product." },
        { status: 500 }
      );
    }
    if (status === "PUBLISHED") await notifyDoctors(created);
    return NextResponse.json({ success: true, product: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/labs/products error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create product." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — modifier {id, ...champs} ; publier/dépublier
// (passage à PUBLISHED → notifie les médecins ciblés)
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveLabStaff(request);
    if (!ctx || !ctx.facilityId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as lab staff." },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required." },
        { status: 400 }
      );
    }
    let product: any = null;
    try {
      const all = await (prisma as any).labProduct.findMany({});
      product = (all || []).find((p: any) => p.id === id) || null;
    } catch {
      product = null;
    }
    if (!product || product.facilityId !== ctx.facilityId) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }
    const data: any = {};
    for (const key of ["name", "dci", "dosage", "forme"] as const) {
      if (typeof body[key] === "string" && body[key].trim()) {
        data[key] = body[key].trim().slice(0, 120);
      }
    }
    for (const key of ["indications", "description"] as const) {
      if (typeof body[key] === "string") {
        data[key] = body[key].trim().slice(0, key === "indications" ? 500 : 1000) || null;
      }
    }
    if (body.price !== undefined) {
      if (body.price === null || body.price === "") data.price = null;
      else {
        const n = Number(body.price);
        if (isNaN(n) || n < 0) {
          return NextResponse.json(
            { success: false, error: "Invalid price." },
            { status: 400 }
          );
        }
        data.price = Math.round(n * 100) / 100;
      }
    }
    if (body.specialtyIds !== undefined) data.specialtyIds = cleanIds(body.specialtyIds);
    if (body.status === "PUBLISHED" || body.status === "DRAFT") data.status = body.status;
    if (typeof body.docName === "string") data.docName = body.docName.trim().slice(0, 160) || null;
    if (typeof body.docUrl === "string") {
      if (!body.docUrl.trim()) data.docUrl = null;
      else {
        const v = body.docUrl.trim();
        if (v.length > 8_000_000) {
          return NextResponse.json(
            { success: false, error: "Document trop lourd (max ~6 Mo)." },
            { status: 400 }
          );
        }
        data.docUrl = v;
      }
    }
    let updated: any = { ...product, ...data };
    try {
      updated =
        (await (prisma as any).labProduct.update({ where: { id }, data })) || updated;
    } catch (err) {
      console.warn("lab product update failed:", err);
    }
    if (data.status === "PUBLISHED" && product.status !== "PUBLISHED") {
      await notifyDoctors(updated);
    }
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("PATCH /api/labs/products error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update product." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ?id= — retirer un de MES produits
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await resolveLabStaff(request);
    if (!ctx || !ctx.facilityId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as lab staff." },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required." },
        { status: 400 }
      );
    }
    try {
      const all = await (prisma as any).labProduct.findMany({});
      const product = (all || []).find((p: any) => p.id === id);
      if (!product || product.facilityId !== ctx.facilityId) {
        return NextResponse.json(
          { success: false, error: "Product not found." },
          { status: 404 }
        );
      }
      await (prisma as any).labProduct.delete({ where: { id } });
    } catch (err) {
      console.warn("lab product delete failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/labs/products error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete product." },
      { status: 500 }
    );
  }
}
