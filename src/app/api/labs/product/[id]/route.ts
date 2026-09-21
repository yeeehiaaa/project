import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";

// ============================================================
// GET /api/labs/product/[id] — fiche complète d'un produit publié
// (médecin, pharmacien, ou son labo). Inclut le document officiel.
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await resolveAuth(request);
    if (!auth || !["DOCTOR", "PHARMACIST", "LABORATORY_STAFF"].includes(auth.userType)) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }
    let product: any = null;
    try {
      const all = await (prisma as any).labProduct.findMany({});
      product = (all || []).find((p: any) => p.id === id) || null;
    } catch {
      product = null;
    }
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }
    if (product.status !== "PUBLISHED" && auth.userType !== "LABORATORY_STAFF") {
      return NextResponse.json(
        { success: false, error: "Product not published." },
        { status: 403 }
      );
    }
    let lab: any = null;
    let specialties: any[] = [];
    try {
      const all = await prisma.healthcareFacility.findMany({});
      lab = (all || []).find((f: any) => f.id === product.facilityId) || null;
      specialties = (await (prisma as any).specialty.findMany({})) || [];
    } catch {
      lab = null;
    }
    const specNames = new Map(specialties.map((s: any) => [String(s.id), s.name]));
    return NextResponse.json({
      success: true,
      product: {
        ...product,
        labName: lab?.name || "Laboratoire",
        labCity: lab?.city || "",
        labWilaya: lab?.wilaya || "",
        labPhone: lab?.phone || "",
        labWebsite: lab?.website || "",
        targetNames: (product.specialtyIds || []).length
          ? (product.specialtyIds || []).map((sid: string) => specNames.get(String(sid)) || "Spécialité")
          : ["Toutes spécialités"],
      },
    });
  } catch (error) {
    console.error("GET /api/labs/product/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load product." },
      { status: 500 }
    );
  }
}
