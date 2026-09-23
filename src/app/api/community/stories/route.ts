import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// Stories 24 h : GET (actives, groupées par médecin),
// POST {text?, mediaPath?, mediaType?}, DELETE (les miennes)
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
    let stories: any[] = [];
    try {
      const all = (await (prisma as any).story.findMany({})) || [];
      stories = all.filter((s: any) => new Date(s.expiresAt).getTime() > Date.now());
    } catch (err) {
      console.warn("stories list failed:", err);
    }
    const { map: authors } = await authorMap();
    const byDoctor = new Map<string, any[]>();
    for (const s of stories) {
      const list = byDoctor.get(s.doctorId) || [];
      list.push(s);
      byDoctor.set(s.doctorId, list);
    }
    const groups = Array.from(byDoctor.entries())
      .map(([doctorId, items]) => {
        const a = authors.get(doctorId) || { name: "Médecin", specialtyNames: [] };
        return {
          doctorId,
          authorName: a.name,
          specialty: (a.specialtyNames || [])[0] || "",
          stories: items
            .sort(
              (x: any, y: any) =>
                new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
            )
            .map((s: any) => ({
              id: s.id,
              text: s.text,
              mediaPath: s.mediaPath,
              mediaType: s.mediaType,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
            })),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.stories[b.stories.length - 1].createdAt).getTime() -
          new Date(a.stories[a.stories.length - 1].createdAt).getTime()
      );
    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error("GET /api/community/stories error:", error);
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
    const text = String(body.text || "").trim().slice(0, 300);
    let mediaPath: string | null = null;
    let mediaType: string | null = null;
    if (typeof body.mediaPath === "string" && body.mediaPath.trim().startsWith("community/")) {
      mediaPath = body.mediaPath.trim().slice(0, 300);
      mediaType = body.mediaType === "video" ? "video" : "image";
    }
    if (!text && !mediaPath) {
      return NextResponse.json(
        { success: false, error: "Texte ou média requis." },
        { status: 400 }
      );
    }
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
    const created = await (prisma as any).story.create({
      data: { doctorId: doc.doctorId, text: text || null, mediaPath, mediaType, expiresAt },
    });
    return NextResponse.json({ success: true, story: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community/stories error:", error);
    return NextResponse.json({ success: false, error: "Unable to publish." }, { status: 500 });
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
    const all = (await (prisma as any).story.findMany({})) || [];
    const story = all.find((s: any) => s.id === id);
    if (!story || story.doctorId !== doc.doctorId) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    await (prisma as any).story.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/community/stories error:", error);
    return NextResponse.json({ success: false, error: "Unable to delete." }, { status: 500 });
  }
}
