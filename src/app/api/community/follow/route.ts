import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDoctorWithSpecialties } from "@/lib/lab-auth";
import { resolveAuth } from "@/lib/pharmacy-auth";

// ============================================================
// GET ?doctorId= — compteurs + mon suivi
// POST {followedId} — suivre / ne plus suivre (toggle)
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
    const doctorId = searchParams.get("doctorId") || "";
    if (!doctorId) {
      return NextResponse.json({ success: false, error: "doctorId is required." }, { status: 400 });
    }
    const all = (await (prisma as any).doctorFollow.findMany({})) || [];
    const me = await resolveDoctorWithSpecialties(request);
    return NextResponse.json({
      success: true,
      followers: all.filter((f: any) => f.followedId === doctorId).length,
      following: all.filter((f: any) => f.followerId === doctorId).length,
      isFollowing: me ? all.some((f: any) => f.followerId === me.doctorId && f.followedId === doctorId) : false,
    });
  } catch (error) {
    console.error("GET /api/community/follow error:", error);
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
    const followedId = String(body.followedId || "");
    if (!followedId || followedId === doc.doctorId) {
      return NextResponse.json({ success: false, error: "Invalid doctor." }, { status: 400 });
    }
    const all = (await (prisma as any).doctorFollow.findMany({})) || [];
    const mine = all.find(
      (f: any) => f.followerId === doc.doctorId && f.followedId === followedId
    );
    if (mine) {
      try {
        await (prisma as any).doctorFollow.delete({
          where: { followerId_followedId: { followerId: doc.doctorId, followedId } },
        });
      } catch { /* ignore */ }
      return NextResponse.json({ success: true, following: false });
    }
    try {
      await (prisma as any).doctorFollow.create({
        data: { followerId: doc.doctorId, followedId },
      });
    } catch { /* ignore */ }
    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error("POST /api/community/follow error:", error);
    return NextResponse.json({ success: false, error: "Action failed." }, { status: 500 });
  }
}
