import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================================
// 1. ZOD SCHEMAS
// ============================================================

const guardianSchema = z.object({
  firstName: z.string().min(1, "Guardian first name is required"),
  lastName: z.string().min(1, "Guardian last name is required"),
  relation: z.string().min(1, "Guardian relation is required"),
  email: z.string().email("Invalid guardian email address"),
  phone: z.string().min(1, "Guardian phone number is required"),
});

const registerSchema = z.object({
  authUserId: z.string().min(1, "Authentication user ID is required"),
  role: z.enum(["patient", "doctor", "pharmacy", "laboratory"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid birth date format",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  wilaya: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(), 
  specialty: z.string().optional().nullable(),
  guardian: guardianSchema.optional().nullable(),
});

// ============================================================
// 2. HELPERS
// ============================================================

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// ============================================================
// 3. API HANDLER
// ============================================================

export async function POST(request: Request) {
  try {
    // Parse the request body
    const rawBody = await request.json().catch(() => {
      throw new Error("Invalid JSON payload");
    });

    // Validate with Zod
    const validationResult = registerSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const body = validationResult.data;

    // Map frontend role to Prisma enum
    const roleMap = {
      patient: "PATIENT",
      doctor: "DOCTOR",
      pharmacy: "PHARMACIST",
      laboratory: "LABORATORY_STAFF",
    } as const;
    const userType = roleMap[body.role];
    if (!userType) {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // Check for existing profile
    const existingProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          { authUserId: body.authUserId },
          { email: body.email.toLowerCase() },
        ],
      },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "A profile already exists for this account or email" },
        { status: 409 }
      );
    }

    // Parse birth date and check minor status
    const birthDate = new Date(body.birthDate);
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid birth date" },
        { status: 400 }
      );
    }

    const age = calculateAge(birthDate);
    const isMinor = age < 18;

    // Guardian validation for minor patients
    if (isMinor && body.role === "patient") {
      if (!body.guardian) {
        return NextResponse.json(
          { error: "Guardian information is required for patients under 18" },
          { status: 400 }
        );
      }
    }

    // ==========================================================
    // 4. PRISMA TRANSACTION
    // ==========================================================

    const result = await prisma.$transaction(async (tx) => {
      // Create Profile
      const profile = await tx.profile.create({
        data: {
          authUserId: body.authUserId,
          userType,
          email: body.email.trim().toLowerCase(),
          firstName: body.firstName.trim(),
          lastName: body.lastName.trim(),
          birthDate,
          gender: body.gender,
          phone: body.phone.trim(),
          address: body.address?.trim() || null,
          city: body.city?.trim() || null,
          wilaya: body.wilaya?.trim() || null,
          accountStatus: "ACTIVE",
          isVerified: false,
        },
      });

      // Create role-specific record
      let roleData;
      switch (userType) {
        case "PATIENT": {
          roleData = await tx.patient.create({
            data: {
              profileId: profile.id,
              guardianFirstName: body.guardian?.firstName || null,
              guardianLastName: body.guardian?.lastName || null,
              guardianEmail: body.guardian?.email || null,
              guardianPhone: body.guardian?.phone || null,
              guardianRelation: body.guardian?.relation || null,
            },
          });
          break;
        }
        case "DOCTOR": {
  const licenseNumber = `PENDING-${profile.id}`;

  roleData = await tx.doctor.create({
    data: {
      profileId: profile.id,
      licenseNumber,
      isAcceptingNewPatients: true,
      acceptsOnline: false,
      acceptsHomeVisit: false,
    },
  });

  break;
}
        case "PHARMACIST": {
          roleData = await tx.pharmacist.create({
            data: { profileId: profile.id },
          });
          break;
        }
        case "LABORATORY_STAFF": {
          roleData = await tx.laboratoryStaff.create({
            data: { profileId: profile.id },
          });
          break;
        }
        default: {
          throw new Error(`Unsupported user type: ${userType}`);
        }
      }

      return { profile, roleData };
    });

    // ==========================================================
    // 5. SUCCESS RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,
        message: "Account and profile created successfully",
        userType,
        profileId: result.profile.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration API error:", error);

    // Handle specific Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      // Prisma unique constraint error (P2002)
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "This email or account information already exists" },
          { status: 409 }
        );
      }
      // Prisma connection error
      if (error.code === "P1001" || error.code === "P1002") {
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 503 }
        );
      }
    }

    // Generic fallback – always return JSON
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the account" },
      { status: 500 }
    );
  }
}

// Add a catch-all for unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}