import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolveDoctorWithSpecialties,
  productTargetsDoctor,
} from "@/lib/lab-auth";
import { resolvePharmacist } from "@/lib/pharmacy-auth";

// ============================================================
// GET /api/labs/feed?role=doctor|pharmacy
// Nouveautés labos publiées + infos labo.
// Médecin : filtrées par SES spécialités (vide = toutes).
// Pharmacie : toutes les nouveautés.
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "doctor";

    let doctorSpecialtyIds: string[] = [];
    if (role === "doctor") {
      const doc = await resolveDoctorWithSpecialties(request);
      if (!doc) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as doctor." },
          { status: 401 }
        );
      }
      doctorSpecialtyIds = doc.specialtyIds;
    } else if (role === "pharmacy") {
      const ctx = await resolvePharmacist(request);
      if (!ctx) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as pharmacist." },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "role must be doctor or pharmacy." },
        { status: 400 }
      );
    }

    let products: any[] = [];
    try {
      const all = await (prisma as any).labProduct.findMany({});
      products = (all || []).filter((p: any) => p.status === "PUBLISHED");
      if (role === "doctor") {
        products = products.filter((p: any) =>
          productTargetsDoctor(p.specialtyIds || [], doctorSpecialtyIds)
        );
      }
    } catch (err) {
      console.warn("lab feed failed:", err);
    }

    let facilities: any[] = [];
    let specialties: any[] = [];
    try {
      facilities = (await prisma.healthcareFacility.findMany({})) || [];
      specialties = (await (prisma as any).specialty.findMany({})) || [];
    } catch {
      facilities = [];
      specialties = [];
    }
    const specNames = new Map(specialties.map((s: any) => [String(s.id), s.name]));

    const enriched = products
      .map((p: any) => {
        const f = facilities.find((x: any) => x.id === p.facilityId);
        return {
          ...p,
          docUrl: undefined,
          hasDoc: !!p.docUrl,
          labName: f?.name || "Laboratoire",
          labCity: f?.city || "",
          labWilaya: f?.wilaya || "",
          labPhone: f?.phone || "",
          targetNames: (p.specialtyIds || []).length
            ? (p.specialtyIds || []).map((id: string) => specNames.get(String(id)) || "Spécialité")
            : ["Toutes spécialités"],
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ success: true, products: enriched });
  } catch (error) {
    console.error("GET /api/labs/feed error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load lab news." },
      { status: 500 }
    );
  }
}
