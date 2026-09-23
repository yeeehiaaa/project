import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";
import { authorMap } from "@/lib/community";

// ============================================================
// GET /api/community/doctor/[id] — profil public d'un confrère :
// infos, compteurs, suivi, dernières publications.
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await resolveAuth(request);
    if (!auth || auth.userType !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Not authenticated as doctor." },
        { status: 401 }
      );
    }
    const me = await resolveDoctorWithSpecialties(request);
    const { map: authors } = await authorMap();
    const target = authors.get(id);
    if (!target) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
    let follows: any[] = [];
    let posts: any[] = [];
    let likes: any[] = [];
    try {
      follows = (await (prisma as any).doctorFollow.findMany({})) || [];
      const allPosts = (await (prisma as any).doctorPost.findMany({})) || [];
      posts = allPosts.filter((p: any) => p.doctorId === id && !p.hidden);
      likes = (await (prisma as any).postLike.findMany({})) || [];
    } catch {
      posts = [];
    }
    const myLikes = likes.filter((l: any) =>
      posts.some((p: any) => p.id === l.postId)
    ).length;
    let yearsExperience: number | null = null;
    try {
      const doctors = (await (prisma as any).doctor.findMany({})) || [];
      yearsExperience = doctors.find((d: any) => d.id === id)?.yearsExperience ?? null;
    } catch {
      // ignore
    }
    return NextResponse.json({
      success: true,
      profile: {
        id,
        name: target.name,
        specialties: target.specialtyNames || [],
        verified: !!target.verified,
        yearsExperience,
        followers: follows.filter((f: any) => f.followedId === id).length,
        following: follows.filter((f: any) => f.followerId === id).length,
        isFollowing: me
          ? follows.some((f: any) => f.followerId === me.doctorId && f.followedId === id)
          : false,
        isSelf: me ? me.doctorId === id : false,
        posts: posts.length,
        likes: myLikes,
        recent: posts
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            kind: p.kind,
            title: p.title,
            snippet: String(p.text || "").slice(0, 120),
            createdAt: p.createdAt,
          })),
      },
    });
  } catch (error) {
    console.error("GET /api/community/doctor/[id] error:", error);
    return NextResponse.json({ success: false, error: "Unable to load." }, { status: 500 });
  }
}
