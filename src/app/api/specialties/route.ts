import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(specialties);
  } catch (error) {
    console.error("Failed to fetch specialties:", error);

    return NextResponse.json(
      { error: "Failed to fetch specialties." },
      { status: 500 }
    );
  }
}