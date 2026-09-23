import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap, notifyMentioned, cleanIds } from "@/lib/community";

const KINDS = ["POST", "CASE", "QUESTION", "POLL", "EVENT", "LIBRARY"];

export function extractHashtags(text: string): string[] {
  const found = String(text || "").match(/#[\p{L}0-9_-]+/gu) || [];
  return Array.from(new Set(found.map((t) => t.toLowerCase()))).slice(0, 10);
}

// ============================================================
// GET — fil communauté (médecins uniquement, masqués exclus)
// ?q=&kind=&specialty=&mine=1&saved=1&postId=
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
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const kind = searchParams.get("kind") || "";
    const specialty = searchParams.get("specialty") || "";
    const mine = searchParams.get("mine") === "1";
    const saved = searchParams.get("saved") === "1";
    const following = searchParams.get("following") === "1";
    const tag = (searchParams.get("tag") || "").trim().toLowerCase();
    const postId = searchParams.get("postId") || "";
    const sort = searchParams.get("sort") === "top" ? "top" : "recent";

    let posts: any[] = [];
    let likes: any[] = [];
    let dislikes: any[] = [];
    let comments: any[] = [];
    let votes: any[] = [];
    let rsvps: any[] = [];
    let bookmarks: any[] = [];
    try {
      posts = (await (prisma as any).doctorPost.findMany({})) || [];
      likes = (await (prisma as any).postLike.findMany({})) || [];
      dislikes = (await (prisma as any).postDislike.findMany({})) || [];
      comments = (await (prisma as any).postComment.findMany({})) || [];
      votes = (await (prisma as any).pollVote.findMany({})) || [];
      rsvps = (await (prisma as any).eventRsvp.findMany({})) || [];
      bookmarks = (await (prisma as any).postBookmark.findMany({})) || [];
    } catch (err) {
      console.warn("community feed failed:", err);
    }

    const { map: authors, specNames } = await authorMap();
    const savedIds = new Set(
      bookmarks.filter((b: any) => b.doctorId === doc.doctorId).map((b: any) => b.postId)
    );

    let list = posts.filter((p: any) => !p.hidden);
    if (postId) list = list.filter((p: any) => p.id === postId);
    if (mine) list = list.filter((p: any) => p.doctorId === doc.doctorId);
    if (saved) list = list.filter((p: any) => savedIds.has(p.id));
    if (following) {
      try {
        const follows = (await (prisma as any).doctorFollow.findMany({})) || [];
        const ids = new Set(
          follows.filter((f: any) => f.followerId === doc.doctorId).map((f: any) => f.followedId)
        );
        list = list.filter((p: any) => ids.has(p.doctorId));
      } catch {
        list = [];
      }
    }
    if (tag) {
      list = list.filter((p: any) =>
        ((p.hashtags || []).map(String) || []).map((t: string) => t.toLowerCase()).includes(tag.startsWith("#") ? tag : `#${tag}`)
      );
    }
    if (kind) list = list.filter((p: any) => p.kind === kind);
    if (specialty) {
      list = list.filter((p: any) => {
        const s = (p.specialtyIds || []).map(String);
        return s.length === 0 || s.includes(specialty);
      });
    }
    if (q) {
      list = list.filter(
        (p: any) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.text || "").toLowerCase().includes(q)
      );
    }

    const enriched = list
      .map((p: any) => {
        const pLikes = likes.filter((l: any) => l.postId === p.id);
        const pDislikes = dislikes.filter((l: any) => l.postId === p.id);
        const pComments = comments.filter((c: any) => c.postId === p.id);
        const pVotes = votes.filter((v: any) => v.postId === p.id);
        const pRsvps = rsvps.filter((r: any) => r.postId === p.id);
        const counts: Record<string, number> = {};
        for (const v of pVotes) counts[v.optionId] = (counts[v.optionId] || 0) + 1;
        return {
          id: p.id,
          kind: p.kind,
          title: p.title,
          text: p.text,
          mediaPath: p.mediaPath,
          mediaType: p.mediaType,
          mediaPaths: p.mediaPaths || [],
          hashtags: p.hashtags || [],
          pollDeadline: p.pollDeadline || null,
          specialtyIds: p.specialtyIds || [],
          targetNames: (p.specialtyIds || []).length
            ? (p.specialtyIds || []).map((id: string) => specNames.get(String(id)) || "Spécialité")
            : ["Toutes spécialités"],
          pollOptions: p.pollOptions || null,
          pollCounts: counts,
          pollTotal: pVotes.length,
          myVote: (pVotes.find((v: any) => v.doctorId === doc.doctorId) || {}).optionId || null,
          eventDate: p.eventDate,
          eventPlace: p.eventPlace,
          rsvpCount: pRsvps.length,
          myRsvp: pRsvps.some((r: any) => r.doctorId === doc.doctorId),
          likeCount: pLikes.length,
          liked: pLikes.some((l: any) => l.doctorId === doc.doctorId),
          dislikeCount: pDislikes.length,
          disliked: pDislikes.some((l: any) => l.doctorId === doc.doctorId),
          commentCount: pComments.length,
          views: Number(p.views) || 0,
          outcome: p.outcome || null,
          outcomeAt: p.outcomeAt || null,
          saved: savedIds.has(p.id),
          mine: p.doctorId === doc.doctorId,
          author: authors.get(p.doctorId) || { name: "Médecin", specialtyNames: [] },
          createdAt: p.createdAt,
        };
      });

    if (sort === "top") {
      const week = Date.now() - 7 * 86400000;
      enriched.sort((a: any, b: any) => {
        const sa =
          (a.likeCount - a.dislikeCount) * 2 +
          a.commentCount * 3 +
          (new Date(a.createdAt).getTime() >= week ? 5 : 0);
        const sb =
          (b.likeCount - b.dislikeCount) * 2 +
          b.commentCount * 3 +
          (new Date(b.createdAt).getTime() >= week ? 5 : 0);
        return sb - sa;
      });
    } else {
      enriched.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const sliced = enriched.slice(0, 100);

    // Rappels J-1 : mes événements RSVP de demain → notification (sans doublon).
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sameDay = (d: Date) =>
        d.getFullYear() === tomorrow.getFullYear() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getDate() === tomorrow.getDate();
      const myRsvpPosts = enriched.filter(
        (p: any) =>
          p.kind === "EVENT" &&
          p.myRsvp &&
          p.eventDate &&
          sameDay(new Date(p.eventDate))
      );
      if (myRsvpPosts.length > 0) {
        const existing = (await (prisma as any).doctorNotification.findMany({})) || [];
        for (const p of myRsvpPosts) {
          const dup = existing.some(
            (n: any) => n.doctorId === doc.doctorId && n.postId === p.id && !n.read
          );
          if (dup) continue;
          try {
            await (prisma as any).doctorNotification.create({
              data: { doctorId: doc.doctorId, productId: null, postId: p.id, read: false },
            });
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, posts: sliced });
  } catch (error) {
    console.error("GET /api/community/posts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load feed." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — publier {kind, title?, text, mediaPath?, mediaType?,
// specialtyIds?, pollOptions?, eventDate?, eventPlace?,
// mentionedDoctorIds?, anonymized? (requis pour CASE)}
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
    const kind = String(body.kind || "POST").toUpperCase();
    if (!KINDS.includes(kind)) {
      return NextResponse.json({ success: false, error: "Invalid kind." }, { status: 400 });
    }
    const text = String(body.text || "").trim();
    if (!text || text.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Text is required (max 5000)." },
        { status: 400 }
      );
    }
    if (kind === "CASE" && body.anonymized !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "Confirmez l'anonymisation du cas (aucune donnée identifiante).",
        },
        { status: 400 }
      );
    }
    let pollOptions: any = null;
    if (kind === "POLL") {
      const opts = Array.isArray(body.pollOptions)
        ? body.pollOptions.map((o: any) => String(o?.text ?? o ?? "").trim()).filter(Boolean).slice(0, 4)
        : [];
      if (opts.length < 2) {
        return NextResponse.json(
          { success: false, error: "Un sondage exige au moins 2 options." },
          { status: 400 }
        );
      }
      pollOptions = opts.map((t: string, i: number) => ({ id: `o${i + 1}`, text: t.slice(0, 120) }));
    }
    let pollDeadline: Date | null = null;
    if (kind === "POLL" && body.pollDeadline) {
      const d = new Date(body.pollDeadline);
      if (!isNaN(d.getTime()) && d.getTime() > Date.now()) pollDeadline = d;
    }
    const mediaPaths = Array.isArray(body.mediaPaths)
      ? body.mediaPaths
          .map((m: any) => String(m?.path || m || "").trim())
          .filter((s: string) => s.startsWith("community/"))
          .slice(0, 4)
      : [];
    let eventDate: Date | null = null;
    if (kind === "EVENT") {
      if (!body.eventDate) {
        return NextResponse.json(
          { success: false, error: "Event date is required." },
          { status: 400 }
        );
      }
      eventDate = new Date(body.eventDate);
      if (isNaN(eventDate.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid event date." }, { status: 400 });
      }
    }
    let mediaPath: string | null = null;
    let mediaType: string | null = null;
    if (typeof body.mediaPath === "string" && body.mediaPath.trim()) {
      const mp = body.mediaPath.trim();
      if (!mp.startsWith("community/")) {
        return NextResponse.json({ success: false, error: "Invalid media." }, { status: 400 });
      }
      mediaPath = mp.slice(0, 300);
      mediaType = body.mediaType === "video" ? "video" : body.mediaType === "doc" ? "doc" : "image";
    }
    let created: any = null;
    try {
      created = await (prisma as any).doctorPost.create({
        data: {
          doctorId: doc.doctorId,
          kind,
          title: String(body.title || "").trim().slice(0, 160) || null,
          text: text.slice(0, 5000),
          mediaPath,
          mediaType,
          mediaPaths,
          hashtags: extractHashtags(`${body.title || ""} ${text}`),
          specialtyIds: cleanIds(body.specialtyIds),
          pollOptions,
          pollDeadline,
          eventDate,
          eventPlace: String(body.eventPlace || "").trim().slice(0, 160) || null,
        },
      });
    } catch (err) {
      console.error("post create failed:", err);
      return NextResponse.json(
        { success: false, error: "Unable to publish." },
        { status: 500 }
      );
    }
    await notifyMentioned(cleanIds(body.mentionedDoctorIds), created.id, doc.doctorId);
    return NextResponse.json({ success: true, post: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community/posts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to publish." },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — modifier MON post {id, text?, title?, outcome?}
// (outcome = conclusion du cas, horodatée)
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
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required." }, { status: 400 });
    }
    let post: any = null;
    try {
      const all = (await (prisma as any).doctorPost.findMany({})) || [];
      post = all.find((p: any) => p.id === id) || null;
    } catch {
      post = null;
    }
    if (!post || post.doctorId !== doc.doctorId) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }
    const data: any = {};
    if (typeof body.text === "string" && body.text.trim()) {
      data.text = body.text.trim().slice(0, 5000);
    }
    if (typeof body.title === "string") {
      data.title = body.title.trim().slice(0, 160) || null;
    }
    if (typeof body.outcome === "string") {
      const o = body.outcome.trim().slice(0, 2000);
      data.outcome = o || null;
      data.outcomeAt = o ? new Date() : null;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "Nothing to update." }, { status: 400 });
    }
    let updated: any = { ...post, ...data };
    try {
      updated =
        (await (prisma as any).doctorPost.update({ where: { id }, data })) || updated;
    } catch (err) {
      console.warn("post update failed:", err);
    }
    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error("PATCH /api/community/posts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update post." },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE ?id= — supprimer MON post
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
      const all = (await (prisma as any).doctorPost.findMany({})) || [];
      const post = all.find((p: any) => p.id === id);
      if (!post || post.doctorId !== doc.doctorId) {
        return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
      }
      await (prisma as any).doctorPost.delete({ where: { id } });
    } catch (err) {
      console.warn("post delete failed:", err);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/community/posts error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete post." },
      { status: 500 }
    );
  }
}
