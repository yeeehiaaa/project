import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| SUPABASE CLIENT - PUBLIC
|--------------------------------------------------------------------------
|
| Used ONLY to verify the user's access token.
|
*/

function getSupabaseAuthClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase public environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| SUPABASE ADMIN CLIENT - SERVER ONLY
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This client uses the SERVICE ROLE key.
|
| NEVER expose this key with NEXT_PUBLIC_.
|
*/

function getSupabaseAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATED USER
|--------------------------------------------------------------------------
*/

async function getAuthenticatedUser(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token =
    authorization.substring(7).trim();

  if (!token) {
    return null;
  }

  const supabase =
    getSupabaseAuthClient();

  const {
    data: { user },
    error,
  } =
    await supabase.auth.getUser(token);

  if (error) {
    console.error(
      "SUPABASE AUTH ERROR:",
      error
    );

    return null;
  }

  if (!user) {
    return null;
  }

  return user;
}

/*
|--------------------------------------------------------------------------
| GET /api/patient/profile
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const user =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. FIND PROFILE
    |--------------------------------------------------------------------------
    */

    const profile =
      await prisma.profile.findUnique({
        where: {
          authUserId: user.id,
        },

        select: {
          id: true,
          authUserId: true,
          userType: true,

          email: true,

          firstName: true,
          lastName: true,

          nationalId: true,

          phone: true,

          birthDate: true,

          gender: true,

          avatarUrl: true,

          address: true,
          city: true,
          wilaya: true,
          postalCode: true,

          latitude: true,
          longitude: true,

          preferredLanguage: true,

          accountStatus: true,
          isVerified: true,

          patient: {
            select: {
              id: true,
              profileId: true,

              bloodType: true,

              allergies: true,

              chronicConditions: true,

              emergencyContactName: true,
              emergencyContactPhone: true,
              emergencyContactRelation: true,

              guardianFirstName: true,
              guardianLastName: true,
              guardianEmail: true,
              guardianPhone: true,
              guardianRelation: true,
            },
          },
        },
      });

    /*
    |--------------------------------------------------------------------------
    | 3. PROFILE NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. CHECK PATIENT
    |--------------------------------------------------------------------------
    */

    if (
      profile.userType !==
      "PATIENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This profile belongs to a non-patient account.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 5. DISPLAY NAME
    |--------------------------------------------------------------------------
    */

    const metadataFirstName =
      typeof user.user_metadata?.first_name ===
      "string"
        ? user.user_metadata.first_name
        : profile.firstName;

    const metadataLastName =
      typeof user.user_metadata?.last_name ===
      "string"
        ? user.user_metadata.last_name
        : profile.lastName;

    const displayName =
      `${metadataFirstName} ${metadataLastName}`.trim();

    /*
    |--------------------------------------------------------------------------
    | 6. RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        user: {
          id: user.id,

          email:
            user.email ??
            profile.email,

          displayName,

          firstName:
            metadataFirstName,

          lastName:
            metadataLastName,
        },

        profile,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET PATIENT PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve your profile.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/patient/profile
|--------------------------------------------------------------------------
*/

export async function PUT(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const user =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. READ BODY
    |--------------------------------------------------------------------------
    */

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. VALUES
    |--------------------------------------------------------------------------
    */

    const firstName =
      typeof body.firstName === "string"
        ? body.firstName.trim()
        : "";

    const lastName =
      typeof body.lastName === "string"
        ? body.lastName.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : null;

    const birthDate =
      typeof body.birthDate === "string"
        ? body.birthDate.trim()
        : "";

    const gender =
      typeof body.gender === "string"
        ? body.gender.trim().toUpperCase()
        : null;

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : null;

    const city =
      typeof body.city === "string"
        ? body.city.trim()
        : null;

    const wilaya =
      typeof body.wilaya === "string"
        ? body.wilaya.trim()
        : null;

    const postalCode =
      typeof body.postalCode === "string"
        ? body.postalCode.trim()
        : null;

    const preferredLanguage =
      typeof body.preferredLanguage ===
      "string"
        ? body.preferredLanguage.trim()
        : "fr";

    /*
    |--------------------------------------------------------------------------
    | 4. VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!firstName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "First name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!lastName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Last name is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 5. VALIDATE GENDER
    |--------------------------------------------------------------------------
    */

    const allowedGenders =
      [
        "MALE",
        "FEMALE",
        "OTHER",
      ] as const;

    type GenderValue =
      (typeof allowedGenders)[number];

    let parsedGender:
      | GenderValue
      | null = null;

    if (gender) {
      if (
        !allowedGenders.includes(
          gender as GenderValue
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid gender value.",
          },
          {
            status: 400,
          }
        );
      }

      parsedGender =
        gender as GenderValue;
    }

    /*
    |--------------------------------------------------------------------------
    | 6. VALIDATE BIRTH DATE
    |--------------------------------------------------------------------------
    */

    let parsedBirthDate:
      | Date
      | null = null;

    if (birthDate) {
      const date =
        new Date(birthDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid date of birth.",
          },
          {
            status: 400,
          }
        );
      }

      parsedBirthDate = date;
    }

    /*
    |--------------------------------------------------------------------------
    | 7. FIND EXISTING PROFILE
    |--------------------------------------------------------------------------
    */

    const existingProfile =
      await prisma.profile.findUnique({
        where: {
          authUserId: user.id,
        },

        select: {
          id: true,
          authUserId: true,
          userType: true,
          email: true,
        },
      });

    if (!existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 8. CHECK PATIENT
    |--------------------------------------------------------------------------
    */

    if (
      existingProfile.userType !==
      "PATIENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This profile does not belong to a patient.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 9. UPDATE PRISMA
    |--------------------------------------------------------------------------
    */

    const updatedProfile =
      await prisma.profile.update({
        where: {
          authUserId: user.id,
        },

        data: {
          firstName,

          lastName,

          phone:
            phone || null,

          birthDate:
            parsedBirthDate,

          gender:
            parsedGender,

          address:
            address || null,

          city:
            city || null,

          wilaya:
            wilaya || null,

          postalCode:
            postalCode || null,

          preferredLanguage:
            preferredLanguage || "fr",
        },

        select: {
          id: true,
          authUserId: true,
          userType: true,

          email: true,

          firstName: true,
          lastName: true,

          nationalId: true,

          phone: true,

          birthDate: true,

          gender: true,

          avatarUrl: true,

          address: true,
          city: true,
          wilaya: true,
          postalCode: true,

          latitude: true,
          longitude: true,

          preferredLanguage: true,

          accountStatus: true,
          isVerified: true,

          patient: {
            select: {
              id: true,
              profileId: true,

              bloodType: true,

              allergies: true,

              chronicConditions: true,

              emergencyContactName: true,
              emergencyContactPhone: true,
              emergencyContactRelation: true,

              guardianFirstName: true,
              guardianLastName: true,
              guardianEmail: true,
              guardianPhone: true,
              guardianRelation: true,
            },
          },
        },
      });

    /*
    |--------------------------------------------------------------------------
    | 10. BUILD DISPLAY NAME
    |--------------------------------------------------------------------------
    */

    const displayName =
      `${firstName} ${lastName}`.trim();

    /*
    |--------------------------------------------------------------------------
    | 11. UPDATE SUPABASE AUTH
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | We use the ADMIN client here.
    |
    | This requires:
    |
    | SUPABASE_SERVICE_ROLE_KEY
    |
    */

    const supabaseAdmin =
      getSupabaseAdminClient();

    const {
      data: updatedAuthData,
      error: authUpdateError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...(user.user_metadata || {}),

            display_name:
              displayName,

            first_name:
              firstName,

            last_name:
              lastName,
          },
        }
      );

    /*
    |--------------------------------------------------------------------------
    | 12. SUPABASE AUTH ERROR
    |--------------------------------------------------------------------------
    */

    if (authUpdateError) {
      console.error(
        "SUPABASE AUTH UPDATE ERROR:",
        authUpdateError
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "Your profile was updated, but the Supabase account name could not be synchronized.",

          profile:
            updatedProfile,

          authError:
            authUpdateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 13. SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        message:
          "Profile updated successfully.",

        profile:
          updatedProfile,

        user: {
          id:
            updatedAuthData.user?.id ??
            user.id,

          email:
            updatedAuthData.user?.email ??
            user.email ??
            updatedProfile.email,

          displayName,

          firstName,

          lastName,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE PATIENT PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to update your profile.",
      },
      {
        status: 500,
      }
    );
  }
}