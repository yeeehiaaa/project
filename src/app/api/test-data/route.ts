import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      take: 10,
    });

    const doctors = await prisma.doctor.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({
      patients,
      doctors,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load test data" },
      { status: 500 }
    );
  }
}