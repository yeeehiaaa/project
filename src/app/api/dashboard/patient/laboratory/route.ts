import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

async function resolvePatientId(request: NextRequest): Promise<string | null> {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return null;
    const token = authorization.substring(7).trim();
    if (!token) return null;
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return null;
    const patient = await prisma.patient.findFirst({
      where: {
        profile: { authUserId: userData.user.id, userType: "PATIENT" },
      },
      select: { id: true },
    });
    return patient?.id || null;
  } catch {
    return null;
  }
}

// =====================================================
// GET - list my lab reports (with test tags)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const patientId = await resolvePatientId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const results = await prisma.laboratoryResult.findMany({
      where: { patientId },
      include: { parameters: true },
      orderBy: { testDate: "desc" },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("GET /api/dashboard/patient/laboratory:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load laboratory reports." },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - add a lab report (bilan) with test tags
// body: { testName?, laboratoryName?, testDate, notes?, reportUrl?, tests: [{name, unit?, referenceMin?, referenceMax?}] }
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const patientId = await resolvePatientId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testName, laboratoryName, testDate, notes, reportUrl, tests } = body;

    const parsedDate = testDate ? new Date(testDate) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid analysis date." },
        { status: 400 }
      );
    }

    const testList: { name: string; unit?: string; referenceMin?: number; referenceMax?: number }[] =
      Array.isArray(tests)
        ? tests
            .filter((t) => t && typeof t.name === "string" && t.name.trim())
            .map((t) => ({
              name: t.name.trim(),
              unit: typeof t.unit === "string" ? t.unit : undefined,
              referenceMin:
                t.referenceMin !== undefined && t.referenceMin !== null && t.referenceMin !== ""
                  ? Number(t.referenceMin)
                  : undefined,
              referenceMax:
                t.referenceMax !== undefined && t.referenceMax !== null && t.referenceMax !== ""
                  ? Number(t.referenceMax)
                  : undefined,
            }))
        : [];

    const created = await prisma.laboratoryResult.create({
      data: {
        patientId,
        testName:
          typeof testName === "string" && testName.trim()
            ? testName.trim()
            : `Bilan du ${parsedDate.toLocaleDateString("fr-FR")}`,
        laboratoryName:
          typeof laboratoryName === "string" && laboratoryName.trim()
            ? laboratoryName.trim()
            : null,
        testDate: parsedDate,
        status: "COMPLETED",
        reportUrl: typeof reportUrl === "string" && reportUrl ? reportUrl : null,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        parameters: {
          create: testList.map((t) => ({
            name: t.name,
            // Tag-only parameter: the report file holds the values.
            value: "",
            unit: t.unit || null,
            referenceMin:
              t.referenceMin !== undefined && !Number.isNaN(t.referenceMin)
                ? t.referenceMin
                : null,
            referenceMax:
              t.referenceMax !== undefined && !Number.isNaN(t.referenceMax)
                ? t.referenceMax
                : null,
            flag: "NORMAL",
          })),
        },
      },
      include: { parameters: true },
    });

    return NextResponse.json({ success: true, result: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/dashboard/patient/laboratory:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save the lab report." },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE - remove one of my lab reports (?id=...)
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    const patientId = await resolvePatientId(request);
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated as patient." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Report id is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.laboratoryResult.findFirst({
      where: { id, patientId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Report not found." },
        { status: 404 }
      );
    }

    await prisma.laboratoryParameter.deleteMany({
      where: { laboratoryResultId: id },
    });
    await prisma.laboratoryResult.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dashboard/patient/laboratory:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete the lab report." },
      { status: 500 }
    );
  }
}
