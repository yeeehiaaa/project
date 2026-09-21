import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

// =====================================================
// POST - upload d'un fichier de discussion (PDF ou image)
// form-data: file: File, conversationId: string
// -> { success, url, name, mime }
// Seul un MEMBRE de la conversation peut uploader.
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401 }
      );
    }
    const token = authorization.substring(7).trim();
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Server misconfigured." },
        { status: 500 }
      );
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication session." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { authUserId: userData.user.id },
    });
    if (!profile || (profile.userType !== "PATIENT" && profile.userType !== "DOCTOR")) {
      return NextResponse.json(
        { success: false, error: "Not authorized." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const conversationId = formData.get("conversationId");
    if (!file || typeof file === "string" || !conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { success: false, error: "File and conversationId are required." },
        { status: 400 }
      );
    }

    // Vérifier l'appartenance à la conversation.
    let myRecordId = "";
    if (profile.userType === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { profileId: profile.id },
        select: { id: true },
      });
      if (!patient) {
        return NextResponse.json(
          { success: false, error: "Patient not found." },
          { status: 404 }
        );
      }
      myRecordId = patient.id;
    } else {
      const doctor = await prisma.doctor.findUnique({
        where: { profileId: profile.id },
        select: { id: true },
      });
      if (!doctor) {
        return NextResponse.json(
          { success: false, error: "Doctor not found." },
          { status: 404 }
        );
      }
      myRecordId = doctor.id;
    }

    let conv: any = null;
    try {
      const found = await prisma.directConversation.findMany({
        where: { id: conversationId },
      });
      const list = found || [];
      conv =
        list.find((c: any) => c.id === conversationId) ||
        list.find(
          (c: any) =>
            c.patientId === myRecordId || c.doctorId === myRecordId
        ) ||
        null;
    } catch {
      conv = null;
    }
    if (
      !conv ||
      (conv.patientId !== myRecordId && conv.doctorId !== myRecordId)
    ) {
      return NextResponse.json(
        { success: false, error: "Conversation not found." },
        { status: 404 }
      );
    }

    const typedFile = file as File;
    if (!ALLOWED_MIME.has(typedFile.type)) {
      return NextResponse.json(
        { success: false, error: "Only PDF, JPG, PNG or WEBP files are accepted." },
        { status: 400 }
      );
    }
    if (typedFile.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File is too large (max 10 MB)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await typedFile.arrayBuffer());
    const safeName = sanitizeFileName(typedFile.name || "fichier");
    const fileName = `${Date.now()}-${safeName}`;
    const dir = join(process.cwd(), "public", "uploads", "chat", conv.id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), buffer);

    return NextResponse.json(
      {
        success: true,
        url: `/uploads/chat/${conv.id}/${fileName}`,
        name: typedFile.name || fileName,
        mime: typedFile.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/direct-messages/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed." },
      { status: 500 }
    );
  }
}
