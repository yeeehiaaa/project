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

  // ==========================================================
  // DOCTOR INFORMATION
  // ==========================================================

  doctorSpecialty: z.string().optional().nullable(),

  doctorNationalId: z.string().optional().nullable(),

  doctorDiploma: z.string().optional().nullable(),

  doctorDiplomaNumber: z.string().optional().nullable(),

  doctorGraduationYear: z
    .string()
    .optional()
    .nullable(),

  doctorStartPracticeYear: z
    .string()
    .optional()
    .nullable(),

  doctorRegistrationNumber: z
    .string()
    .optional()
    .nullable(),

  doctorRegistrationAuthority: z
    .string()
    .optional()
    .nullable(),

  // ==========================================================
  // PHARMACY INFORMATION
  // ==========================================================

  pharmacyName: z.string().optional().nullable(),

  pharmacyLicense: z.string().optional().nullable(),

  pharmacyPhone: z.string().optional().nullable(),

  pharmacyCity: z.string().optional().nullable(),

  pharmacyWilaya: z.string().optional().nullable(),

  pharmacyAddress: z.string().optional().nullable(),

  guardian: guardianSchema.optional().nullable(),
});

// ============================================================
// 2. HELPERS
// ============================================================

function calculateAge(birthDate: Date): number {
  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

// ============================================================
// 3. API HANDLER
// ============================================================

export async function POST(request: Request) {
  try {
    // ========================================================
    // Parse JSON
    // ========================================================

    const rawBody = await request.json().catch(() => {
      throw new Error("Invalid JSON payload");
    });

    // ========================================================
    // Validate request
    // ========================================================

    const validationResult =
      registerSchema.safeParse(rawBody);

    if (!validationResult.success) {
      const errors =
        validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

      return NextResponse.json(
        {
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    const body = validationResult.data;

    // ========================================================
    // Map frontend role -> Prisma enum
    // ========================================================

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

    // ========================================================
    // Check existing profile
    // ========================================================

    const existingProfile =
      await prisma.profile.findFirst({
        where: {
          OR: [
            {
              authUserId: body.authUserId,
            },
            {
              email: body.email
                .trim()
                .toLowerCase(),
            },
          ],
        },
      });

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "A profile already exists for this account or email",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // Parse birth date
    // ========================================================

    const birthDate = new Date(body.birthDate);

    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid birth date" },
        { status: 400 }
      );
    }

    const age = calculateAge(birthDate);

    const isMinor = age < 18;

    // ========================================================
    // Guardian validation
    // ========================================================

    if (isMinor && body.role === "patient") {
      if (!body.guardian) {
        return NextResponse.json(
          {
            error:
              "Guardian information is required for patients under 18",
          },
          { status: 400 }
        );
      }
    }

    // ========================================================
    // DOCTOR VALIDATION
    // ========================================================

    if (body.role === "doctor") {
      if (!body.doctorSpecialty) {
        return NextResponse.json(
          {
            error:
              "Medical specialty is required for doctors",
          },
          { status: 400 }
        );
      }

      if (!body.doctorNationalId?.trim()) {
        return NextResponse.json(
          {
            error:
              "National ID number is required for doctors",
          },
          { status: 400 }
        );
      }

      if (!body.doctorDiploma?.trim()) {
        return NextResponse.json(
          {
            error:
              "Medical diploma is required for doctors",
          },
          { status: 400 }
        );
      }

      if (!body.doctorGraduationYear) {
        return NextResponse.json(
          {
            error:
              "Graduation year is required for doctors",
          },
          { status: 400 }
        );
      }

      if (!body.doctorStartPracticeYear) {
        return NextResponse.json(
          {
            error:
              "Start practice year is required for doctors",
          },
          { status: 400 }
        );
      }

      if (!body.doctorRegistrationNumber?.trim()) {
        return NextResponse.json(
          {
            error:
              "Professional registration number is required for doctors",
          },
          { status: 400 }
        );
      }

      const currentYear =
        new Date().getFullYear();

      const graduationYear = Number(
        body.doctorGraduationYear
      );

      const startPracticeYear = Number(
        body.doctorStartPracticeYear
      );

      if (
        !Number.isInteger(graduationYear) ||
        graduationYear < 1900 ||
        graduationYear > currentYear
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid graduation year",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(startPracticeYear) ||
        startPracticeYear < 1900 ||
        startPracticeYear > currentYear
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid practice start year",
          },
          { status: 400 }
        );
      }

      if (startPracticeYear < graduationYear) {
        return NextResponse.json(
          {
            error:
              "Practice start year cannot be before graduation year",
          },
          { status: 400 }
        );
      }

      // Make sure the specialty exists
      const specialty =
        await prisma.specialty.findUnique({
          where: {
            id: body.doctorSpecialty,
          },
        });

      if (!specialty) {
        return NextResponse.json(
          {
            error:
              "Selected medical specialty does not exist",
          },
          { status: 400 }
        );
      }
    }

    // ==========================================================
    // 4. PRISMA TRANSACTION
    // ==========================================================

    const result =
      await prisma.$transaction(async (tx) => {
        // ======================================================
        // CREATE PROFILE
        // ======================================================

        const profile =
          await tx.profile.create({
            data: {
              authUserId:
                body.authUserId,

              userType,

              email:
                body.email
                  .trim()
                  .toLowerCase(),

              firstName:
                body.firstName.trim(),

              lastName:
                body.lastName.trim(),

              birthDate,

              gender: body.gender,

              phone:
                body.phone.trim(),

              address:
                body.address?.trim() ||
                null,

              city:
                body.city?.trim() ||
                null,

              wilaya:
                body.wilaya?.trim() ||
                null,

              // =================================================
              // Doctor national ID
              // =================================================

              nationalId:
                body.role === "doctor"
                  ? body.doctorNationalId
                      ?.trim() || null
                  : null,

              accountStatus: "ACTIVE",

              isVerified: false,
            },
          });

        // ======================================================
        // CREATE ROLE-SPECIFIC RECORD
        // ======================================================

        let roleData;

        switch (userType) {
          // ====================================================
          // PATIENT
          // ====================================================

          case "PATIENT": {
            roleData =
              await tx.patient.create({
                data: {
                  profileId:
                    profile.id,

                  guardianFirstName:
                    body.guardian
                      ?.firstName ||
                    null,

                  guardianLastName:
                    body.guardian
                      ?.lastName ||
                    null,

                  guardianEmail:
                    body.guardian
                      ?.email ||
                    null,

                  guardianPhone:
                    body.guardian
                      ?.phone ||
                    null,

                  guardianRelation:
                    body.guardian
                      ?.relation ||
                    null,
                },
              });

            break;
          }

          // ====================================================
          // DOCTOR
          // ====================================================

          case "DOCTOR": {
            const currentYear =
              new Date().getFullYear();

            const graduationYear =
              Number(
                body.doctorGraduationYear
              );

            const startPracticeYear =
              Number(
                body.doctorStartPracticeYear
              );

            const yearsExperience =
              Math.max(
                0,
                currentYear -
                  startPracticeYear
              );

            const doctor =
              await tx.doctor.create({
                data: {
                  profileId:
                    profile.id,

                  // Required by Prisma Doctor model
                  licenseNumber:
                    body.doctorRegistrationNumber!.trim(),

                  nationalRegistration:
                    body.doctorRegistrationAuthority
                      ?.trim() || null,

                  diploma:
                    body.doctorDiploma
                      ?.trim() || null,

                  diplomaNumber:
                    body.doctorDiplomaNumber
                      ?.trim() || null,

                  graduationYear,

                  startPracticeYear,

                  yearsExperience,

                  isAcceptingNewPatients:
                    true,

                  acceptsOnline:
                    false,

                  acceptsHomeVisit:
                    false,
                },
              });

            // ==================================================
            // CREATE DOCTOR <-> SPECIALTY
            // ==================================================

            await tx.doctorSpecialty.create({
              data: {
                doctorId: doctor.id,

                specialtyId:
                  body.doctorSpecialty!,
              },
            });

            roleData = doctor;

            break;
          }

          // ====================================================
          // PHARMACIST (+ sa pharmacie si renseignée)
          // ====================================================

          case "PHARMACIST": {
            const license =
              typeof body.pharmacyLicense === "string" &&
              body.pharmacyLicense.trim()
                ? body.pharmacyLicense.trim()
                : null;

            roleData =
              await tx.pharmacist.create({
                data: {
                  profileId:
                    profile.id,
                  licenseNumber: license,
                },
              });

            const shopName =
              typeof body.pharmacyName === "string"
                ? body.pharmacyName.trim()
                : "";

            if (shopName) {
              const str = (v: unknown): string | null => {
                if (typeof v !== "string") return null;
                const t = v.trim();
                return t ? t : null;
              };

              const facility =
                await tx.healthcareFacility.create({
                  data: {
                    name: shopName.slice(0, 120),
                    type: "PHARMACY",
                    city: str(body.pharmacyCity)?.slice(0, 80) || null,
                    wilaya:
                      str(body.pharmacyWilaya)?.slice(0, 80) || null,
                    address:
                      str(body.pharmacyAddress)?.slice(0, 200) || null,
                    phone:
                      str(body.pharmacyPhone)?.slice(0, 40) || null,
                  },
                });

              await tx.pharmacistFacility.create({
                data: {
                  pharmacistId: roleData.id,
                  facilityId: facility.id,
                },
              });
            }

            break;
          }

          // ====================================================
          // LABORATORY STAFF
          // ====================================================

          case "LABORATORY_STAFF": {
            roleData =
              await tx.laboratoryStaff.create({
                data: {
                  profileId:
                    profile.id,
                },
              });

            break;
          }

          default: {
            throw new Error(
              `Unsupported user type: ${userType}`
            );
          }
        }

        return {
          profile,
          roleData,
        };
      });

    // ==========================================================
    // 5. SUCCESS RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Account and profile created successfully",

        userType,

        profileId:
          result.profile.id,

        roleId:
          result.roleData?.id ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration API error:",
      error
    );

    // ==========================================================
    // Prisma errors
    // ==========================================================

    if (
      error &&
      typeof error === "object" &&
      "code" in error
    ) {
      // Unique constraint
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "This email, national ID, registration number, or other account information already exists",
          },
          { status: 409 }
        );
      }

      // Database connection
      if (
        error.code === "P1001" ||
        error.code === "P1002"
      ) {
        return NextResponse.json(
          {
            error:
              "Database connection error. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    // ==========================================================
    // Generic fallback
    // ==========================================================

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the account",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// Unsupported methods
// ============================================================

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}