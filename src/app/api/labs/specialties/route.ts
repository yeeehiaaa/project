import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// GET /api/labs/specialties — liste des spécialités (ciblage labo)
// ============================================================
export async function GET() {
  try {
    const specialties = (await (prisma as any).specialty.findMany({})) || [];
    return NextResponse.json({
      success: true,
      specialties: specialties.map((s: any) => ({ id: s.id, name: s.name })),
    });
  } catch (error) {
    console.error("GET /api/labs/specialties error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load specialties." },
      { status: 500 }
    );
  }
}
