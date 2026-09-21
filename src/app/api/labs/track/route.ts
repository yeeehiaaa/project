import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";

// ============================================================
// POST /api/labs/track — compteur de portée (facturation future)
// {productId, kind: "view"|"click"}
// view = fiche ouverte • click = document officiel ouvert
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
    const { productId, kind } = body;
    if (!productId || !["view", "click"].includes(kind)) {
      return NextResponse.json(
        { success: false, error: "productId and kind (view|click) are required." },
        { status: 400 }
      );
    }
    try {
      const all = await (prisma as any).labProduct.findMany({});
      const product = (all || []).find((p: any) => p.id === productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: "Product not found." },
          { status: 404 }
        );
      }
      const field = kind === "view" ? "views" : "clicks";
      await (prisma as any).labProduct.update({
        where: { id: productId },
        data: { [field]: (Number(product[field]) || 0) + 1 },
      });
    } catch (err) {
      console.warn("lab track failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/labs/track error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to track." },
      { status: 500 }
    );
  }
}
