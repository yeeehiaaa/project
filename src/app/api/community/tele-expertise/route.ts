import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// Télé-expertise : avis formel d'un confrère, traçable.
// POST {toDoctorId, question, postId?} → notif cloche.
// PATCH {id, answer} (destinataire) | {id, decline:true}
// GET ?box=received|sent
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
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found." },
        { status: 404 }
      );
    }
    const { searchParams } = new URL(request.url);
    const box = searchParams.get("box") === "sent" ? "sent" : "received";
    const all = (await (prisma as any).teleExpertise.findMany({})) || [];
    const list = all.filter((t: any) =>
      box === "sent" ? t.fromDoctorId === doc.doctorId : t.toDoctorId === doc.doctorId
    );
    const { map: authors } = await authorMap();
    let posts: any[] = [];
    try {
      posts = (await (prisma as any).doctorPost.findMany({})) || [];
    } catch {
      posts = [];
    }
    const enriched = list
      .map((t: any) => {
        const other = box === "sent" ? t.toDoctorId : t.fromDoctorId;
        const post = t.postId ? posts.find((p: any) => p.id === t.postId) : null;
        return {
          id: t.id,
          question: t.question,
          answer: t.answer,
          status: t.status,
          createdAt: t.createdAt,
          otherName: authors.get(other)?.name || "Médecin",
          postTitle: post?.title || (post ? String(post.text || "").slice(0, 80) : null),
          postId: t.postId,
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    const pending = enriched.filter((t: any) => t.status === "PENDING").length;
    return NextResponse.json({ success: true, items: enriched, pending });
  } catch (error) {
    console.error("GET /api/community/tele-expertise error:", error);
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
    const toDoctorId = String(body.toDoctorId || "");
    const question = String(body.question || "").trim();
    if (!toDoctorId || toDoctorId === doc.doctorId || !question) {
      return NextResponse.json(
        { success: false, error: "Destinataire et question requis." },
        { status: 400 }
      );
    }
    const created = await (prisma as any).teleExpertise.create({
      data: {
        postId: String(body.postId || "").trim() || null,
        fromDoctorId: doc.doctorId,
        toDoctorId,
        question: question.slice(0, 2000),
        status: "PENDING",
      },
    });
    try {
      await (prisma as any).doctorNotification.create({
        data: {
          doctorId: toDoctorId,
          productId: null,
          postId: String(body.postId || "").trim() || null,
          teleExpertiseId: created.id,
          read: false,
        },
      });
    } catch {
      // ignore
    }
    try {
      const { sendPushToDoctors } = await import("@/lib/push");
      await sendPushToDoctors([toDoctorId], {
        title: "Demande d'avis médical 🩺",
        body: question.slice(0, 100),
        url: "/dashboard/doctor",
      });
    } catch {
      // ignore
    }
    return NextResponse.json({ success: true, request: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community/tele-expertise error:", error);
    return NextResponse.json({ success: false, error: "Unable to send." }, { status: 500 });
  }
}

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
    const all = (await (prisma as any).teleExpertise.findMany({})) || [];
    const item = all.find((t: any) => t.id === id);
    if (!item || item.toDoctorId !== doc.doctorId) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    if (body.decline) {
      await (prisma as any).teleExpertise.update({
        where: { id },
        data: { status: "DECLINED" },
      });
      return NextResponse.json({ success: true });
    }
    const answer = String(body.answer || "").trim();
    if (!answer) {
      return NextResponse.json({ success: false, error: "Answer is required." }, { status: 400 });
    }
    const updated = await (prisma as any).teleExpertise.update({
      where: { id },
      data: { answer: answer.slice(0, 5000), status: "ANSWERED" },
    });
    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("PATCH /api/community/tele-expertise error:", error);
    return NextResponse.json({ success: false, error: "Unable to answer." }, { status: 500 });
  }
}
