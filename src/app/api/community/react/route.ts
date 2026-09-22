import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";

const REPORT_LIMIT = 3;

// ============================================================
// POST /api/community/react
// {action: "like"|"bookmark"|"poll"|"rsvp"|"report", postId,
//  optionId? (poll), reason? (report)}
// like/bookmark/rsvp = toggle. poll = vote unique (modifiable).
// report = 1/post/médecin, masquage auto à 3 signalements.
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
    const { action, postId } = body;
    if (
      !postId ||
      !["like", "dislike", "bookmark", "poll", "rsvp", "report", "view", "comment-vote"].includes(action)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid action." },
        { status: 400 }
      );
    }

    // Compteur de vues (audience réelle).
    if (action === "view") {
      try {
        const all = (await (prisma as any).doctorPost.findMany({})) || [];
        const post = all.find((p: any) => p.id === postId);
        if (post) {
          await (prisma as any).doctorPost.update({
            where: { id: postId },
            data: { views: (Number(post.views) || 0) + 1 },
          });
        }
      } catch {
        // ignore
      }
      return NextResponse.json({ success: true });
    }

    // Vote j'aime / j'aime pas sur un commentaire (exclusifs).
    if (action === "comment-vote") {
      const commentId = String(body.commentId || "");
      const value = String(body.value || "");
      if (!commentId || !["like", "dislike", "none"].includes(value)) {
        return NextResponse.json(
          { success: false, error: "commentId and value (like|dislike|none) are required." },
          { status: 400 }
        );
      }
      try {
        if (value === "none") {
          try {
            await (prisma as any).commentVote.delete({
              where: { commentId_doctorId: { commentId, doctorId: doc.doctorId } },
            });
          } catch {
            // pas de vote : rien à faire
          }
        } else {
          const all = (await (prisma as any).commentVote.findMany({})) || [];
          const mine = all.find(
            (v: any) => v.commentId === commentId && v.doctorId === doc.doctorId
          );
          if (mine) {
            await (prisma as any).commentVote.update({
              where: { commentId_doctorId: { commentId, doctorId: doc.doctorId } },
              data: { value, postId },
            });
          } else {
            await (prisma as any).commentVote.create({
              data: { postId, commentId, doctorId: doc.doctorId, value },
            });
          }
        }
      } catch (err) {
        console.warn("comment vote failed:", err);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "dislike") {
      const allLikes = (await (prisma as any).postLike.findMany({})) || [];
      if (allLikes.some((l: any) => l.postId === postId && l.doctorId === doc.doctorId)) {
        try {
          await (prisma as any).postLike.delete({
            where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
          });
        } catch { /* ignore */ }
      }
      const all = (await (prisma as any).postDislike.findMany({})) || [];
      const mine = all.find((l: any) => l.postId === postId && l.doctorId === doc.doctorId);
      if (mine) {
        try {
          await (prisma as any).postDislike.delete({
            where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
          });
        } catch { /* ignore */ }
        return NextResponse.json({ success: true, disliked: false });
      }
      try {
        await (prisma as any).postDislike.create({
          data: { postId, doctorId: doc.doctorId },
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true, disliked: true });
    }

    if (action === "like") {
      const all = (await (prisma as any).postLike.findMany({})) || [];
      const mine = all.find((l: any) => l.postId === postId && l.doctorId === doc.doctorId);
      // Exclusif : j'aime retire j'aime pas.
      try {
        await (prisma as any).postDislike.delete({
          where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
        });
      } catch {
        // pas de dislike : rien à faire
      }
      if (mine) {
        try {
          await (prisma as any).postLike.delete({
            where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
          });
        } catch { /* ignore */ }
        return NextResponse.json({ success: true, liked: false });
      }
      try {
        await (prisma as any).postLike.create({
          data: { postId, doctorId: doc.doctorId },
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true, liked: true });
    }

    if (action === "bookmark") {
      const all = (await (prisma as any).postBookmark.findMany({})) || [];
      const mine = all.find((b: any) => b.postId === postId && b.doctorId === doc.doctorId);
      if (mine) {
        try {
          await (prisma as any).postBookmark.delete({
            where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
          });
        } catch { /* ignore */ }
        return NextResponse.json({ success: true, saved: false });
      }
      try {
        await (prisma as any).postBookmark.create({
          data: { postId, doctorId: doc.doctorId },
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true, saved: true });
    }

    if (action === "poll") {
      const optionId = String(body.optionId || "");
      if (!optionId) {
        return NextResponse.json(
          { success: false, error: "optionId is required." },
          { status: 400 }
        );
      }
      try {
        const all = (await (prisma as any).pollVote.findMany({})) || [];
        const mine = all.find((v: any) => v.postId === postId && v.doctorId === doc.doctorId);
        if (mine) {
          await (prisma as any).pollVote.update({
            where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
            data: { optionId },
          });
        } else {
          await (prisma as any).pollVote.create({
            data: { postId, doctorId: doc.doctorId, optionId },
          });
        }
      } catch (err) {
        console.warn("poll vote failed:", err);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "rsvp") {
      const all = (await (prisma as any).eventRsvp.findMany({})) || [];
      const mine = all.find((r: any) => r.postId === postId && r.doctorId === doc.doctorId);
      if (mine) {
        try {
          await (prisma as any).eventRsvp.delete({
            where: { postId_doctorId: { postId, doctorId: doc.doctorId } },
          });
        } catch { /* ignore */ }
        return NextResponse.json({ success: true, rsvp: false });
      }
      try {
        await (prisma as any).eventRsvp.create({
          data: { postId, doctorId: doc.doctorId },
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true, rsvp: true });
    }

    // report
    try {
      await (prisma as any).postReport.create({
        data: {
          postId,
          doctorId: doc.doctorId,
          reason: String(body.reason || "").trim().slice(0, 300) || null,
        },
      });
    } catch {
      return NextResponse.json({ success: true, reported: true });
    }
    try {
      const all = (await (prisma as any).postReport.findMany({})) || [];
      const count = all.filter((r: any) => r.postId === postId).length;
      if (count >= REPORT_LIMIT) {
        await (prisma as any).doctorPost.update({
          where: { id: postId },
          data: { hidden: true, reportsCount: count },
        });
      } else {
        await (prisma as any).doctorPost.update({
          where: { id: postId },
          data: { reportsCount: count },
        });
      }
    } catch { /* ignore */ }
    return NextResponse.json({ success: true, reported: true });
  } catch (error) {
    console.error("POST /api/community/react error:", error);
    return NextResponse.json(
      { success: false, error: "Action failed." },
      { status: 500 }
    );
  }
}
