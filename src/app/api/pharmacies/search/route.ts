import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function norm(s: unknown): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function stockStatus(quantity: number, lowThreshold: number): "OK" | "LOW" | "OUT" {
  if (quantity <= 0) return "OUT";
  if (quantity <= Math.max(lowThreshold, 0)) return "LOW";
  return "OK";
}

export async function resolvePatientId(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.substring(7).trim();
    if (!token) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return null;
    const profile = await prisma.profile.findUnique({
      where: { authUserId: userData.user.id },
      select: { id: true, userType: true },
    });
    if (!profile || profile.userType !== "PATIENT") return null;
    const patient = await prisma.patient.findUnique({
      where: { profileId: profile.id },
      select: { id: true },
    });
    return patient?.id || null;
  } catch {
    return null;
  }
}

// ============================================================
// GET — recherche patient : pharmacies + stocks correspondants
// ?q=ventoline&wilaya=Alger&city=Alger
// Tri : en stock d'abord, puis même ville, puis même wilaya.
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const patientId = await resolvePatientId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = norm(searchParams.get("q"));
    const wilaya = norm(searchParams.get("wilaya"));
    const city = norm(searchParams.get("city"));

    let facilities: any[] = [];
    let stocks: any[] = [];
    try {
      facilities = (await prisma.healthcareFacility.findMany({
        where: { type: "PHARMACY" },
      })) || [];
      stocks = (await prisma.pharmacyStock.findMany({})) || [];
    } catch (err) {
      console.warn("pharmacies search fetch failed:", err);
    }

    // Filtrage JS (identique en mode DB réelle et mock).
    const matchedStocks = stocks.filter((s: any) =>
      q ? norm(s.medicationName).includes(q) : true
    );
    const byFacility = new Map<string, any[]>();
    for (const s of matchedStocks) {
      const list = byFacility.get(s.facilityId) || [];
      list.push(s);
      byFacility.set(s.facilityId, list);
    }

    let results = (facilities || [])
      .filter((f: any) => {
        if (wilaya && norm(f.wilaya) !== wilaya) return false;
        if (city && norm(f.city) !== city) return false;
        // Sans requête : afficher les pharmacies (leurs stocks complets).
        // Avec requête : seulement celles qui ont le médicament.
        if (q && !(byFacility.get(f.id) || []).length) return false;
        return true;
      })
      .map((f: any) => {
        const items = (byFacility.get(f.id) || [])
          .map((s: any) => ({
            id: s.id,
            medicationName: s.medicationName,
            dosage: s.dosage || "",
            quantity: s.quantity,
            price: s.price != null ? Number(s.price) : null,
            status: stockStatus(Number(s.quantity) || 0, Number(s.lowThreshold) || 0),
            updatedAt: s.updatedAt,
          }))
          .sort((a: any, b: any) =>
            a.medicationName.localeCompare(b.medicationName, "fr")
          );
        const hasStock = items.some((i: any) => i.status !== "OUT");
        const sameCity = city && norm(f.city) === city;
        const sameWilaya = wilaya && norm(f.wilaya) === wilaya;
        return {
          id: f.id,
          name: f.name,
          address: f.address || "",
          city: f.city || "",
          wilaya: f.wilaya || "",
          phone: f.phone || "",
          emergencyService: !!f.emergencyService,
          items,
          hasStock,
          score: (hasStock ? 0 : 100) + (sameCity ? 0 : sameWilaya ? 10 : 20),
        };
      })
      .sort((a: any, b: any) => a.score - b.score || a.name.localeCompare(b.name, "fr"));

    results = results.map(({ score, ...r }: any) => r);

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error("GET /api/pharmacies/search error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to search pharmacies." },
      { status: 500 }
    );
  }
}
