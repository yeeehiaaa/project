import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolvePharmacist,
  resolvePatientRecordId,
  norm,
} from "@/lib/pharmacy-auth";

function makePickupCode(): string {
  return `DZ-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function uniquePickupCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = makePickupCode();
    try {
      const all = await (prisma as any).pharmacyReservation.findMany({});
      if (!(all || []).some((r: any) => r.pickupCode === candidate)) return candidate;
    } catch {
      return candidate;
    }
  }
  return makePickupCode();
}

function headerAfterReview(items: { status: string }[]): string {
  if (items.some((it) => it.status === "PENDING")) return "PENDING";
  return items.some((it) => it.status === "CONFIRMED") ? "READY" : "REFUSED";
}

// ============================================================
// GET — patient : mes paniers / pharmacien : paniers de MA pharmacie
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (role === "pharmacist") {
      const ctx = await resolvePharmacist(request);
      if (!ctx || !ctx.facilityId) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as pharmacist." },
          { status: 401 }
        );
      }
      let packs: any[] = [];
      try {
        const all = await (prisma as any).pharmacyReservation.findMany({});
        const mine = (all || []).filter((r: any) => r.facilityId === ctx.facilityId);
        const itemAll = await (prisma as any).pharmacyReservationItem.findMany({});
        let patients: any[] = [];
        try {
          patients = (await prisma.patient.findMany({ include: { profile: true } })) || [];
        } catch {
          patients = [];
        }
        packs = mine.map((r: any) => {
          const pat = patients.find((p: any) => p.id === r.patientId);
          const prof: any = pat?.profile || null;
          const patientName =
            prof
              ? `${prof.firstName || ""} ${prof.lastName || ""}`.trim() || "Patient"
              : `Patient ${String(r.patientId).slice(0, 6)}`;
          return {
            ...r,
            patientName,
            patientPhone: prof?.phone || "",
            items: (itemAll || []).filter((it: any) => it.reservationId === r.id),
          };
        });
        packs.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (err) {
        console.warn("reservations queue failed:", err);
      }
      return NextResponse.json({ success: true, reservations: packs });
    }

    const patientId = await resolvePatientRecordId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }
    let packs: any[] = [];
    try {
      const all = await (prisma as any).pharmacyReservation.findMany({});
      const mine = (all || []).filter((r: any) => r.patientId === patientId);
      const itemAll = await (prisma as any).pharmacyReservationItem.findMany({});
      let facilities: any[] = [];
      try {
        facilities = (await prisma.healthcareFacility.findMany({})) || [];
      } catch {
        facilities = [];
      }
      packs = mine.map((r: any) => {
        const f = facilities.find((x: any) => x.id === r.facilityId);
        return {
          ...r,
          facilityName: f?.name || "Pharmacie",
          facilityCity: f?.city || "",
          facilityPhone: f?.phone || "",
          items: (itemAll || []).filter((it: any) => it.reservationId === r.id),
        };
      });
      packs.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.warn("reservations list failed:", err);
    }
    return NextResponse.json({ success: true, reservations: packs });
  } catch (error) {
    console.error("GET /api/pharmacies/reservations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load reservations." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — patient : créer un panier {facilityId, items[], prescriptionId?, prescriptionFileUrl?, prescriptionFileName?, notes?}
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const patientId = await resolvePatientRecordId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const facilityId = String(body.facilityId || "");
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!facilityId) {
      return NextResponse.json(
        { success: false, error: "facilityId is required." },
        { status: 400 }
      );
    }
    const items = rawItems
      .map((it: any) => ({
        medicationName: String(it?.medicationName || "").trim().slice(0, 120),
        dosage: String(it?.dosage || "").trim().slice(0, 60) || null,
        quantity: Math.min(99, Math.max(1, parseInt(String(it?.quantity ?? 1), 10) || 1)),
      }))
      .filter((it: any) => it.medicationName);
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Ajoutez au moins un médicament." },
        { status: 400 }
      );
    }
    if (items.length > 20) {
      return NextResponse.json(
        { success: false, error: "Maximum 20 médicaments par réservation." },
        { status: 400 }
      );
    }

    let facility: any = null;
    try {
      const all = await prisma.healthcareFacility.findMany({});
      facility = (all || []).find((f: any) => f.id === facilityId && f.type === "PHARMACY");
    } catch {
      facility = null;
    }
    if (!facility) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found." },
        { status: 404 }
      );
    }

    const prescriptionId = String(body.prescriptionId || "").trim() || null;
    const prescriptionFileName = String(body.prescriptionFileName || "").trim().slice(0, 160) || null;
    let prescriptionFileUrl: string | null = null;
    if (typeof body.prescriptionFileUrl === "string" && body.prescriptionFileUrl.trim()) {
      const v = body.prescriptionFileUrl.trim();
      // Garde-fou ~4 Mo (data URL base64 ≈ 5,5 M caractères).
      if (v.length > 5_500_000) {
        return NextResponse.json(
          { success: false, error: "Fichier ordonnance trop lourd (max ~4 Mo)." },
          { status: 400 }
        );
      }
      if (
        !v.startsWith("data:image/") &&
        !v.startsWith("data:application/pdf") &&
        !v.startsWith("http")
      ) {
        return NextResponse.json(
          { success: false, error: "Ordonnance : image ou PDF uniquement." },
          { status: 400 }
        );
      }
      prescriptionFileUrl = v.slice(0, 5_500_000);
    }

    const pickupCode = await uniquePickupCode();
    let created: any = null;
    try {
      created = await (prisma as any).pharmacyReservation.create({
        data: {
          patientId,
          facilityId,
          pickupCode,
          status: "PENDING",
          prescriptionId,
          prescriptionFileUrl,
          prescriptionFileName,
          notes: String(body.notes || "").trim().slice(0, 300) || null,
          items: { create: items.map((it: any) => ({ ...it, status: "PENDING" })) },
        },
        include: { items: true },
      });
    } catch (err) {
      console.error("reservation create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to create reservation." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: true, reservation: { ...created, facilityName: facility.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/pharmacies/reservations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create reservation." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — {id, itemId?, status}
// Pharmacien : item PENDING -> CONFIRMED/REFUSED ; pack READY -> COMPLETED.
// Patient : pack PENDING/READY -> CANCELLED.
// COMPLETED décrémente le stock des lignes CONFIRMED.
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, itemId, status } = body;
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "id and status are required." },
        { status: 400 }
      );
    }
    const asPharmacist = String(body.asRole || "") === "pharmacist";
    let patientId: string | null = null;
    let ctx: any = null;
    if (asPharmacist) {
      ctx = await resolvePharmacist(request);
      if (!ctx) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as pharmacist." },
          { status: 401 }
        );
      }
    } else {
      patientId = await resolvePatientRecordId(request);
      if (!patientId) {
        return NextResponse.json(
          { success: false, error: "Not authenticated as patient." },
          { status: 401 }
        );
      }
    }

    let pack: any = null;
    let packItems: any[] = [];
    try {
      const all = await (prisma as any).pharmacyReservation.findMany({});
      pack = (all || []).find((r: any) => r.id === id) || null;
      const itemAll = await (prisma as any).pharmacyReservationItem.findMany({});
      packItems = (itemAll || []).filter((it: any) => it.reservationId === id);
    } catch {
      pack = null;
    }
    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Reservation not found." },
        { status: 404 }
      );
    }

    // ---- Annulation patient ----
    if (!asPharmacist) {
      if (pack.patientId !== patientId) {
        return NextResponse.json({ success: false, error: "Not your reservation." }, { status: 403 });
      }
      if (!["PENDING", "READY"].includes(pack.status) || status !== "CANCELLED") {
        return NextResponse.json(
          { success: false, error: `Cannot move ${pack.status} to ${status}.` },
          { status: 400 }
        );
      }
      let updated = { ...pack, status };
      try {
        updated =
          (await (prisma as any).pharmacyReservation.update({ where: { id }, data: { status } })) ||
          updated;
      } catch (err) {
        console.warn("reservation cancel failed:", err);
      }
      return NextResponse.json({ success: true, reservation: { ...updated, items: packItems } });
    }

    // ---- Pharmacien ----
    if (pack.facilityId !== ctx.facilityId) {
      return NextResponse.json(
        { success: false, error: "Not your pharmacy reservation." },
        { status: 403 }
      );
    }

    // 1) Revue ligne par ligne.
    if (itemId) {
      const item = packItems.find((it: any) => it.id === itemId);
      if (!item) {
        return NextResponse.json({ success: false, error: "Item not found." }, { status: 404 });
      }
      if (!["PENDING", "READY"].includes(pack.status)) {
        return NextResponse.json(
          { success: false, error: `Pack already ${pack.status}.` },
          { status: 400 }
        );
      }
      if (item.status !== "PENDING" || !["CONFIRMED", "REFUSED"].includes(status)) {
        return NextResponse.json(
          { success: false, error: `Cannot move item ${item.status} to ${status}.` },
          { status: 400 }
        );
      }
      try {
        await (prisma as any).pharmacyReservationItem.update({
          where: { id: itemId },
          data: { status },
        });
      } catch (err) {
        console.warn("item review failed:", err);
      }
      const nextItems = packItems.map((it: any) =>
        it.id === itemId ? { ...it, status } : it
      );
      const nextHeader = headerAfterReview(nextItems);
      let updatedPack = { ...pack, status: nextHeader };
      if (nextHeader !== pack.status) {
        try {
          updatedPack =
            (await (prisma as any).pharmacyReservation.update({
              where: { id },
              data: { status: nextHeader },
            })) || updatedPack;
        } catch (err) {
          console.warn("pack header update failed:", err);
        }
      }
      return NextResponse.json({
        success: true,
        reservation: { ...updatedPack, items: nextItems },
      });
    }

    // 2) Vente terminée au comptoir.
    if (status === "COMPLETED") {
      if (pack.status !== "READY") {
        return NextResponse.json(
          { success: false, error: "Terminez d'abord la revue des médicaments." },
          { status: 400 }
        );
      }
      let updatedPack = { ...pack, status };
      try {
        updatedPack =
          (await (prisma as any).pharmacyReservation.update({
            where: { id },
            data: { status },
          })) || updatedPack;
      } catch (err) {
        console.warn("pack complete failed:", err);
      }
      // Décrémenter le stock des lignes acceptées.
      try {
        const stockAll = await prisma.pharmacyStock.findMany({});
        for (const it of packItems.filter((x: any) => x.status === "CONFIRMED")) {
          const match = (stockAll || []).find(
            (s: any) =>
              s.facilityId === pack.facilityId &&
              norm(s.medicationName) === norm(it.medicationName) &&
              (s.dosage || "") === (it.dosage || "")
          );
          if (match) {
            const dec = Math.max(1, Number(it.quantity) || 1);
            try {
              await prisma.pharmacyStock.update({
                where: { id: match.id },
                data: { quantity: Math.max(0, (Number(match.quantity) || 0) - dec) },
              });
            } catch {
              // ignorer
            }
          }
        }
      } catch {
        // ignorer
      }
      return NextResponse.json({
        success: true,
        reservation: { ...updatedPack, items: packItems },
      });
    }

    return NextResponse.json(
      { success: false, error: "Action not supported." },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/pharmacies/reservations error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update reservation." },
      { status: 500 }
    );
  }
}
