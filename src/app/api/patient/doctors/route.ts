import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    /* =====================================================
       1. AUTHENTICATION
    ===================================================== */

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = authorization
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authentication token",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       2. VERIFY PATIENT PROFILE
    ===================================================== */

    const profile = await prisma.profile.findUnique({
      where: {
        authUserId: user.id,
      },
      select: {
        id: true,
        userType: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found.",
        },
        { status: 404 }
      );
    }

    if (profile.userType !== "PATIENT") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only patient accounts can access this endpoint.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       3. GET ACTIVE DOCTORS
    ===================================================== */

    const doctors = await prisma.doctor.findMany({
      where: {
        isAcceptingNewPatients: true,

        profile: {
          accountStatus: "ACTIVE",
        },
      },

      include: {
        profile: true,

        specialties: {
          include: {
            specialty: true,
          },
        },
      },

      orderBy: [
        {
          profile: {
            lastName: "asc",
          },
        },
        {
          profile: {
            firstName: "asc",
          },
        },
      ],
    });

    /* =====================================================
       4. FORMAT FOR FRONTEND (+ mise en avant Premium)
    ===================================================== */

    let premiumProfileIds = new Set<string>();
    try {
      const subs = (await (prisma as any).subscription.findMany({})) || [];
      const now = Date.now();
      for (const s of subs) {
        if (
          s.plan === "PREMIUM" &&
          s.status === "ACTIVE" &&
          (!s.expiresAt || new Date(s.expiresAt).getTime() > now)
        ) {
          premiumProfileIds.add(String(s.profileId));
        }
      }
    } catch {
      premiumProfileIds = new Set<string>();
    }

    const formattedDoctors = doctors.map(
      (doctor) => {
        const specialties =
          doctor.specialties
            .map(
              (item) =>
                item.specialty.name
            )
            .filter(Boolean);

        const specialty =
          specialties.length > 0
            ? specialties.join(", ")
            : "General Practitioner";

        const locationParts = [
          doctor.profile.city,
          doctor.profile.wilaya,
        ].filter(Boolean);

        const location =
          locationParts.length > 0
            ? locationParts.join(", ")
            : "Location not specified";

        const firstName =
          doctor.profile.firstName || "";

        const lastName =
          doctor.profile.lastName || "";

        const initials =
          `${firstName.charAt(0)}${lastName.charAt(0)}`
            .toUpperCase() || "DR";

        return {
          id: doctor.id,

          name: `Dr. ${firstName} ${lastName}`.trim(),

          specialty,

          location,

          rating: doctor.averageRating
            ? Number(doctor.averageRating)
            : 0,

          available:
            doctor.isAcceptingNewPatients,

          avatar:
            doctor.profile.avatarUrl ||
            initials,

          isPremium: premiumProfileIds.has(String(doctor.profileId)),
        };
      }
    );

    // Premium d'abord, puis note.
    formattedDoctors.sort(
      (a, b) =>
        Number(b.isPremium) - Number(a.isPremium) || b.rating - a.rating
    );

    /* =====================================================
       5. RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      doctors: formattedDoctors,
      count: formattedDoctors.length,
    });
  } catch (error) {
    console.error(
      "GET /api/patient/doctors error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to retrieve doctors.",
      },
      { status: 500 }
    );
  }
}