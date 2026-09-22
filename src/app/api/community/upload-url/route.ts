import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { resolveAuth } from "@/lib/pharmacy-auth";

const BUCKET = "community-media";
const MAX_MB = 50;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const ALLOWED: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
};

function extOf(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mime] || "bin";
}

// ============================================================
// POST /api/community/upload-url — URL signée d'upload direct
// navigateur → Storage (contourne la limite 4,5 Mo de Vercel).
// {mime} → {uploadUrl, path, mediaType}. Médecins uniquement.
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
    const doctors = (await (prisma as any).doctor.findMany({})) || [];
    const doc = doctors.find((d: any) => d.profileId === auth.profileId);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found." },
        { status: 404 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const mime = String(body.mime || "");
    const mediaType = ALLOWED.image.includes(mime)
      ? "image"
      : ALLOWED.video.includes(mime)
        ? "video"
        : null;
    if (!mediaType) {
      return NextResponse.json(
        { success: false, error: "Image (JPG/PNG/WEBP/GIF) ou vidéo (MP4/WEBM) uniquement." },
        { status: 400 }
      );
    }
    const size = Number(body.size) || 0;
    if (size <= 0 || size > MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `Fichier trop lourd (max ${MAX_MB} Mo).` },
        { status: 400 }
      );
    }
    const svc = serviceClient();
    if (!svc) {
      return NextResponse.json(
        { success: false, error: "Storage non configuré." },
        { status: 500 }
      );
    }
    // Bucket privé (tentative de création, ignorée s'il existe).
    try {
      await svc.storage.createBucket(BUCKET, { public: false });
    } catch {
      // existe déjà : on continue
    }
    const path = `community/${doc.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extOf(mime)}`;
    const { data, error } = await svc.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      console.error("signed upload failed:", error);
      return NextResponse.json(
        { success: false, error: "Upload impossible pour le moment." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      path,
      mediaType,
    });
  } catch (error) {
    console.error("POST /api/community/upload-url error:", error);
    return NextResponse.json(
      { success: false, error: "Upload impossible." },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/community/upload-url?path= — URL signée de lecture
// (1 h). Les <img>/<video> ne peuvent pas envoyer le Bearer,
// d'où ce relais authentifié. Médecins uniquement.
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
    const path = searchParams.get("path") || "";
    if (!path.startsWith("community/")) {
      return NextResponse.json({ success: false, error: "Invalid path." }, { status: 400 });
    }
    const svc = serviceClient();
    if (!svc) {
      return NextResponse.json(
        { success: false, error: "Storage non configuré." },
        { status: 500 }
      );
    }
    const { data, error } = await svc.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Media not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, url: data.signedUrl });
  } catch (error) {
    console.error("GET /api/community/upload-url error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to sign media." },
      { status: 500 }
    );
  }
}
