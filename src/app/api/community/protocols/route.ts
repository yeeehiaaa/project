import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// Protocoles : fiches validées par les pairs (2 confirmations
// de confrères distincts = validé). Chaque modification = v+1.
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
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty") || "";
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    let protocols: any[] = [];
    let confirms: any[] = [];
    try {
      protocols = (await (prisma as any).protocol.findMany({})) || [];
      confirms = (await (prisma as any).protocolConfirm.findMany({})) || [];
    } catch (err) {
      console.warn("protocols list failed:", err);
    }
    const { map: authors, specNames } = await authorMap();
    let list = protocols;
    if (specialty) list = list.filter((p: any) => String(p.specialtyId || "") === specialty);
    if (q) {
      list = list.filter(
        (p: any) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.content || "").toLowerCase().includes(q)
      );
    }
    const enriched = list
      .map((p: any) => {
        const c = confirms.filter((x: any) => x.protocolId === p.id);
        return {
          id: p.id,
          title: p.title,
          specialtyId: p.specialtyId,
          specialtyName: p.specialtyId ? specNames.get(String(p.specialtyId)) || "" : "",
          content: p.content,
          filePath: p.filePath,
          version: p.version,
          validated: !!p.validated,
          confirmCount: c.length,
          confirmed: doc ? c.some((x: any) => x.doctorId === doc.doctorId) : false,
          mine: doc ? p.doctorId === doc.doctorId : false,
          author: authors.get(p.doctorId) || { name: "Médecin", specialtyNames: [] },
          updatedAt: p.updatedAt,
        };
      })
      .sort(
        (a: any, b: any) =>
          Number(b.validated) - Number(a.validated) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    return NextResponse.json({ success: true, protocols: enriched });
  } catch (error) {
    console.error("GET /api/community/protocols error:", error);
    return NextResponse.json({ success: false, error: "Unable to load." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required." },
        { status: 400 }
      );
    }
    let filePath: string | null = null;
    if (typeof body.filePath === "string" && body.filePath.trim().startsWith("community/")) {
      filePath = body.filePath.trim().slice(0, 300);
    }
    const created = await (prisma as any).protocol.create({
      data: {
        doctorId: doc.doctorId,
        title: title.slice(0, 160),
        specialtyId: String(body.specialtyId || "").trim() || null,
        content: content.slice(0, 10000),
        filePath,
      },
    });
    return NextResponse.json({ success: true, protocol: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community/protocols error:", error);
    return NextResponse.json({ success: false, error: "Unable to create." }, { status: 500 });
  }
}

// PATCH {id, confirm?: true, content?/title? (auteur → nouvelle version)}
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
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required." }, { status: 400 });
    }
    const all = (await (prisma as any).protocol.findMany({})) || [];
    const protocol = all.find((p: any) => p.id === id);
    if (!protocol) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    // Confirmation par un confrère (jamais l'auteur).
    if (body.confirm) {
      if (protocol.doctorId === doc.doctorId) {
        return NextResponse.json(
          { success: false, error: "Vous ne pouvez pas valider votre propre fiche." },
          { status: 400 }
        );
      }
      try {
        await (prisma as any).protocolConfirm.create({
          data: { protocolId: id, doctorId: doc.doctorId },
        });
      } catch {
        return NextResponse.json({ success: true });
      }
      const confirms = (await (prisma as any).protocolConfirm.findMany({})) || [];
      const count = confirms.filter((c: any) => c.protocolId === id).length;
      if (count >= 2 && !protocol.validated) {
        await (prisma as any).protocol.update({
          where: { id },
          data: { validated: true },
        });
      }
      return NextResponse.json({ success: true, confirmCount: count });
    }
    // Modification auteur → version+1, confirmations remises à zéro.
    if (protocol.doctorId !== doc.doctorId) {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    const data: any = { version: (Number(protocol.version) || 1) + 1, validated: false };
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 160);
    if (typeof body.content === "string" && body.content.trim()) data.content = body.content.trim().slice(0, 10000);
    const updated = await (prisma as any).protocol.update({ where: { id }, data });
    try {
      const confirms = (await (prisma as any).protocolConfirm.findMany({})) || [];
      for (const c of confirms.filter((x: any) => x.protocolId === id)) {
        try {
          await (prisma as any).protocolConfirm.delete({
            where: { protocolId_doctorId: { protocolId: id, doctorId: c.doctorId } },
          });
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    return NextResponse.json({ success: true, protocol: updated });
  } catch (error) {
    console.error("PATCH /api/community/protocols error:", error);
    return NextResponse.json({ success: false, error: "Unable to update." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const doc = await resolveDoctorWithSpecialties(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id || !doc) {
      return NextResponse.json({ success: false, error: "id is required." }, { status: 400 });
    }
    const all = (await (prisma as any).protocol.findMany({})) || [];
    const protocol = all.find((p: any) => p.id === id);
    if (!protocol || protocol.doctorId !== doc.doctorId) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    await (prisma as any).protocol.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/community/protocols error:", error);
    return NextResponse.json({ success: false, error: "Unable to delete." }, { status: 500 });
  }
}
