import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        doctor: {
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        items: true,
      },
      orderBy: {
        prescribedDate: "desc",
      },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("GET /api/prescriptions error:", error);

    return NextResponse.json(
      { error: "Unable to load prescriptions" },
      { status: 500 }
    );
  }
}