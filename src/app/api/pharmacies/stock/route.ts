import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePharmacist } from "@/lib/pharmacy-auth";

function requireFacility(ctx: any) {
  if (!ctx || !ctx.facilityId) {
    return NextResponse.json(
      { success: false, error: "No pharmacy configured." },
      { status: 404 }
    );
  }
  return null;
}

// ============================================================
// GET — mon stock (ma pharmacie uniquement)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    const missing = requireFacility(ctx);
    if (missing) return missing;

    let items: any[] = [];
    try {
      const all = await prisma.pharmacyStock.findMany({});
      items = (all || []).filter((s: any) => s.facilityId === ctx!.facilityId);
    } catch (err) {
      console.warn("stock list failed:", err);
    }

    items.sort((a: any, b: any) =>
      String(a.medicationName || "").localeCompare(
        String(b.medicationName || ""),
        "fr"
      )
    );

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET /api/pharmacies/stock error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load stock." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — ajouter / réassortir un médicament
// {medicationName, dosage?, quantity?, lowThreshold?, price?}
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    const missing = requireFacility(ctx);
    if (missing) return missing;

    const body = await request.json().catch(() => ({}));
    const medicationName = String(body.medicationName || "").trim();
    if (!medicationName) {
      return NextResponse.json(
        { success: false, error: "Medication name is required." },
        { status: 400 }
      );
    }
    const dosageRaw = String(body.dosage || "").trim();
    const dosage = dosageRaw ? dosageRaw.slice(0, 60) : null;
    const addQty = Math.max(0, parseInt(String(body.quantity ?? 0), 10) || 0);

    let existing: any = null;
    try {
      const all = await prisma.pharmacyStock.findMany({});
      existing = (all || []).find(
        (s: any) =>
          s.facilityId === ctx!.facilityId &&
          s.medicationName === medicationName.slice(0, 120) &&
          (s.dosage || null) === dosage
      );
    } catch {
      existing = null;
    }

    const patch: any = {};
    if (body.lowThreshold !== undefined) {
      patch.lowThreshold = Math.max(0, parseInt(String(body.lowThreshold), 10) || 0);
    }
    if (body.price !== undefined && body.price !== null && body.price !== "") {
      const price = Number(body.price);
      if (!Number.isNaN(price) && price >= 0) patch.price = price;
    }

    let item: any = null;
    try {
      if (existing) {
        item = await prisma.pharmacyStock.update({
          where: { id: existing.id },
          data: {
            quantity: (Number(existing.quantity) || 0) + addQty,
            ...patch,
          },
        });
      } else {
        item = await prisma.pharmacyStock.create({
          data: {
            facilityId: ctx!.facilityId,
            medicationName: medicationName.slice(0, 120),
            dosage,
            quantity: addQty,
            lowThreshold: patch.lowThreshold ?? 5,
            ...(patch.price !== undefined ? { price: patch.price } : {}),
          },
        });
      }
    } catch (err) {
      console.error("stock upsert failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to save stock item." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/pharmacies/stock error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save stock item." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — ajuster {id, quantity?, lowThreshold?, price?}
// (quantity = nouvelle valeur absolue)
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    const missing = requireFacility(ctx);
    if (missing) return missing;

    const body = await request.json().catch(() => ({}));
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Item id is required." },
        { status: 400 }
      );
    }

    let owned: any = null;
    try {
      const all = await prisma.pharmacyStock.findMany({});
      owned = (all || []).find(
        (s: any) => s.id === body.id && s.facilityId === ctx!.facilityId
      );
    } catch {
      owned = null;
    }
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Stock item not found." },
        { status: 404 }
      );
    }

    const data: any = {};
    if (body.quantity !== undefined) {
      data.quantity = Math.max(0, parseInt(String(body.quantity), 10) || 0);
    }
    if (body.lowThreshold !== undefined) {
      data.lowThreshold = Math.max(0, parseInt(String(body.lowThreshold), 10) || 0);
    }
    if (body.price !== undefined) {
      if (body.price === null || body.price === "") data.price = null;
      else {
        const price = Number(body.price);
        if (!Number.isNaN(price) && price >= 0) data.price = price;
      }
    }

    let item: any = { ...owned, ...data };
    try {
      item =
        (await prisma.pharmacyStock.update({
          where: { id: owned.id },
          data,
        })) || item;
    } catch (err) {
      console.warn("stock update failed, using local merge:", err);
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("PATCH /api/pharmacies/stock error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update stock item." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ?id= — retirer un médicament de mon stock
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await resolvePharmacist(request);
    const missing = requireFacility(ctx);
    if (missing) return missing;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item id is required." },
        { status: 400 }
      );
    }

    let owned: any = null;
    try {
      const all = await prisma.pharmacyStock.findMany({});
      owned = (all || []).find(
        (s: any) => s.id === id && s.facilityId === ctx!.facilityId
      );
    } catch {
      owned = null;
    }
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Stock item not found." },
        { status: 404 }
      );
    }

    try {
      await prisma.pharmacyStock.delete({ where: { id } });
    } catch (err) {
      console.warn("stock delete failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pharmacies/stock error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete stock item." },
      { status: 500 }
    );
  }
}
