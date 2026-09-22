import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap, notifyMentioned, cleanIds } from "@/lib/community";

// ============================================================
// GET ?postId= — arbre des commentaires (2 niveaux) + auteurs
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
    const postId = searchParams.get("postId") || "";
    if (!postId) {
      return NextResponse.json({ success: false, error: "postId is required." }, { status: 400 });
    }
    const doc = await resolveDoctorWithSpecialties(request);
    let comments: any[] = [];
    let votes: any[] = [];
    let postAuthorId = "";
    try {
      const all = (await (prisma as any).postComment.findMany({})) || [];
      comments = all
        .filter((c: any) => c.postId === postId)
        .sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      votes = (await (prisma as any).commentVote.findMany({})) || [];
      const posts = (await (prisma as any).doctorPost.findMany({})) || [];
      postAuthorId = (posts.find((p: any) => p.id === postId) || {}).doctorId || "";
    } catch (err) {
      console.warn("comments list failed:", err);
    }
    const { map: authors } = await authorMap();
    const countFor = (id: string, value: string) =>
      votes.filter((v: any) => v.commentId === id && v.value === value).length;
    const myVoteFor = (id: string) =>
      (votes.find((v: any) => v.commentId === id && v.doctorId === (doc?.doctorId || "")) || {})
        .value || null;
    const withVotes = (c: any) => ({
      ...c,
      likes: countFor(c.id, "like"),
      dislikes: countFor(c.id, "dislike"),
      myVote: myVoteFor(c.id),
      author: authors.get(c.doctorId) || { name: "Médecin", specialtyNames: [] },
    });
    const byId = new Map(comments.map((c: any) => [c.id, c]));
    const tops = comments.filter((c: any) => !c.parentId || !byId.has(c.parentId));
    const tree = tops.map((c: any) => ({
      ...withVotes(c),
      replies: comments
        .filter((r: any) => r.parentId === c.id)
        .map((r: any) => withVotes(r)),
    }));
    return NextResponse.json({
      success: true,
      comments: tree,
      myDoctorId: doc?.doctorId || "",
      postAuthorId,
    });
  } catch (error) {
    console.error("GET /api/community/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load comments." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — commenter {postId, text, parentId?, mentionedDoctorIds?}
// ============================================================
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
    const postId = String(body.postId || "");
    const text = String(body.text || "").trim();
    if (!postId || !text || text.length > 2000) {
      return NextResponse.json(
        { success: false, error: "postId and text (max 2000) are required." },
        { status: 400 }
      );
    }
    let created: any = null;
    try {
      created = await (prisma as any).postComment.create({
        data: {
          postId,
          doctorId: doc.doctorId,
          parentId: String(body.parentId || "").trim() || null,
          text: text.slice(0, 2000),
          mentionedDoctorIds: cleanIds(body.mentionedDoctorIds),
        },
      });
    } catch (err) {
      console.error("comment create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to comment." },
        { status: 500 }
      );
    }
    await notifyMentioned(cleanIds(body.mentionedDoctorIds), postId, doc.doctorId);
    return NextResponse.json({ success: true, comment: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to comment." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — modifier MON commentaire {id, text}
// ============================================================
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
    const text = String(body.text || "").trim();
    if (!id || !text || text.length > 2000) {
      return NextResponse.json(
        { success: false, error: "id and text (max 2000) are required." },
        { status: 400 }
      );
    }
    try {
      const all = (await (prisma as any).postComment.findMany({})) || [];
      const comment = all.find((c: any) => c.id === id);
      if (!comment || comment.doctorId !== doc.doctorId) {
        return NextResponse.json({ success: false, error: "Comment not found." }, { status: 404 });
      }
      await (prisma as any).postComment.update({
        where: { id },
        data: { text: text.slice(0, 2000), edited: true },
      });
    } catch (err) {
      console.warn("comment update failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/community/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update comment." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ?id= — auteur du commentaire OU auteur du post
// (un confrère ne supprime jamais le commentaire d'un autre)
// ============================================================
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
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found." },
        { status: 404 }
      );
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required." }, { status: 400 });
    }
    try {
      const all = (await (prisma as any).postComment.findMany({})) || [];
      const comment = all.find((c: any) => c.id === id);
      if (!comment) {
        return NextResponse.json({ success: false, error: "Comment not found." }, { status: 404 });
      }
      const posts = (await (prisma as any).doctorPost.findMany({})) || [];
      const post = posts.find((p: any) => p.id === comment.postId);
      const canDelete =
        comment.doctorId === doc.doctorId || (post && post.doctorId === doc.doctorId);
      if (!canDelete) {
        return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
      }
      await (prisma as any).postComment.delete({ where: { id } });
    } catch (err) {
      console.warn("comment delete failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/community/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete comment." },
      { status: 500 }
    );
  }
}
