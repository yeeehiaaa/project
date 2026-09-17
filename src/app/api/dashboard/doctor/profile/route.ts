import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    const token =
      authorization.substring(7).trim();

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const profile =
      await prisma.profile.findUnique({
        where: {
          authUserId:
            userData.user.id,
        },

        include: {
          doctor: {
            include: {
              specialties: {
                include: {
                  specialty: true,
                },
              },

              facilities: {
                include: {
                  facility: true,
                },
              },
            },
          },
        },
      });

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Doctor profile not found.",
        },
        { status: 404 }
      );
    }

    if (
      profile.userType !== "DOCTOR" ||
      !profile.doctor
    ) {
      return NextResponse.json(
        {
          error:
            "This account is not a doctor account.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,

      profile: {
        id: profile.id,
        firstName:
          profile.firstName,
        lastName:
          profile.lastName,
        email:
          profile.email,
        phone:
          profile.phone,
        address:
          profile.address,
        city:
          profile.city,
        wilaya:
          profile.wilaya,
        avatarUrl:
          profile.avatarUrl,
        isVerified:
          profile.isVerified,
        accountStatus:
          profile.accountStatus,
      },

      doctor: {
        id:
          profile.doctor.id,

        licenseNumber:
          profile.doctor.licenseNumber,

        nationalRegistration:
          profile.doctor
            .nationalRegistration,

        diploma:
          profile.doctor.diploma,

        diplomaNumber:
          profile.doctor
            .diplomaNumber,

        graduationYear:
          profile.doctor
            .graduationYear,

        startPracticeYear:
          profile.doctor
            .startPracticeYear,

        yearsExperience:
          profile.doctor
            .yearsExperience,

        acceptsOnline:
          profile.doctor
            .acceptsOnline,

        acceptsHomeVisit:
          profile.doctor
            .acceptsHomeVisit,

        isAcceptingNewPatients:
          profile.doctor
            .isAcceptingNewPatients,

        averageRating:
          Number(
            profile.doctor
              .averageRating
          ),

        totalReviews:
          profile.doctor
            .totalReviews,
      },

      specialties:
        profile.doctor.specialties.map(
          (item) => ({
            id:
              item.specialty.id,
            name:
              item.specialty.name,
          })
        ),

      facilities:
        profile.doctor.facilities.map(
          (item) => ({
            id:
              item.facility.id,
            name:
              item.facility.name,
            type:
              item.facility.type,
            address:
              item.facility.address,
            city:
              item.facility.city,
            wilaya:
              item.facility.wilaya,
            phone:
              item.facility.phone,
          })
        ),
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/doctor/profile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load doctor profile.",
      },
      { status: 500 }
    );
  }
}