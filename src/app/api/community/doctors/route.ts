import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// GET /api/community/doctors?q= — annuaire médecins (mentions @)
// id + nom + spécialités. Médecins uniquement.
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
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const { map } = await authorMap();
    let list = Array.from(map.values());
    if (q) {
      list = list.filter((d: any) => d.name.toLowerCase().includes(q));
    }
    return NextResponse.json({
      success: true,
      doctors: list.slice(0, 8).map((d: any) => ({
        id: d.id,
        name: d.name,
        specialty: (d.specialtyNames || [])[0] || "",
      })),
    });
  } catch (error) {
    console.error("GET /api/community/doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load doctors." },
      { status: 500 }
    );
  }
}
