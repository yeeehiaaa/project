import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
// POST - upload a lab report file (PDF or image)
// form-data: file: File  ->  { success, url }
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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication session." },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.findFirst({
      where: {
        profile: { authUserId: userData.user.id, userType: "PATIENT" },
      },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient profile not found." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file provided." },
        { status: 400 }
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
    const safeName = sanitizeFileName(typedFile.name || "bilan");
    const fileName = `${Date.now()}-${safeName}`;
    const dir = join(process.cwd(), "public", "uploads", "lab", patient.id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), buffer);

    const url = `/uploads/lab/${patient.id}/${fileName}`;
    return NextResponse.json({ success: true, url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/dashboard/patient/laboratory/upload:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed." },
      { status: 500 }
    );
  }
}
