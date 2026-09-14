import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // =====================================================
    // 1. GET AUTHORIZATION HEADER
    // =====================================================

    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          error: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 2. EXTRACT BEARER TOKEN
    // =====================================================

    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Invalid authentication header.",
        },
        {
          status: 401,
        }
      );
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return NextResponse.json(
        {
          error: "Authentication token is missing.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 3. SUPABASE ENVIRONMENT VARIABLES
    // =====================================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing Supabase environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Supabase environment variables are missing.",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 4. CREATE SUPABASE SERVER CLIENT
    // =====================================================

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // =====================================================
    // 5. VERIFY SUPABASE USER
    // =====================================================

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError) {
      console.error(
        "Supabase auth error:",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Authentication session is invalid.",
        },
        {
          status: 401,
        }
      );
    }

    const user = userData.user;

    if (!user) {
      return NextResponse.json(
        {
          error: "Not authenticated.",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 6. FIND MEDICONNECT PROFILE
    // =====================================================

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
          accountStatus: true,
        },
      });

    // =====================================================
    // 7. PROFILE NOT FOUND
    // =====================================================

    if (!profile) {
      console.error(
        "MediConnect profile not found for Supabase user:",
        user.id
      );

      return NextResponse.json(
        {
          error:
            "Your Supabase account exists, but your MediConnect profile was not found.",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // 8. ACCOUNT STATUS
    // =====================================================

    if (
      profile.accountStatus === "BLOCKED"
    ) {
      return NextResponse.json(
        {
          error:
            "Your account has been blocked.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      profile.accountStatus === "SUSPENDED"
    ) {
      return NextResponse.json(
        {
          error:
            "Your account is currently suspended.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // 9. SUCCESS
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        userType: profile.userType,

        user: {
          id: user.id,
          email: user.email,
        },

        profile: {
          id: profile.id,
          authUserId: profile.authUserId,
          userType: profile.userType,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          accountStatus: profile.accountStatus,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PROFILE API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve your profile.",
      },
      {
        status: 500,
      }
    );
  }
}