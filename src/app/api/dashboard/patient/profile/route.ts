import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ============================================================
   SUPABASE AUTH CLIENT
============================================================ */

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

/* ============================================================
   AUTHENTICATED USER
============================================================ */

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
    authorization
      .substring(7)
      .trim();

  if (!token) {
    return null;
  }

  try {
    const supabase =
      getSupabaseAuthClient();

    const {
      data: { user },
      error,
    } =
      await supabase.auth.getUser(token);

    if (error || !user) {
      console.error(
        "SUPABASE AUTH ERROR:",
        error
      );

      return null;
    }

    return user;
  } catch (error) {
    console.error(
      "AUTHENTICATION ERROR:",
      error
    );

    return null;
  }
}

/* ============================================================
   GET PATIENT DASHBOARD
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    /* ========================================================
       1. AUTHENTICATION
    ======================================================== */

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

    /* ========================================================
       2. FIND PROFILE
    ======================================================== */

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

          phone: true,
          birthDate: true,
          gender: true,

          address: true,
          city: true,
          wilaya: true,
          postalCode: true,

          latitude: true,
          longitude: true,

          preferredLanguage: true,
          avatarUrl: true,

          isVerified: true,
          accountStatus: true,

          createdAt: true,
          updatedAt: true,
        },
      });

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

    /* ========================================================
       3. CHECK PATIENT
    ======================================================== */

    if (profile.userType !== "PATIENT") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This dashboard is only available for patients.",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       4. FIND PATIENT
    ======================================================== */

    const patient =
      await prisma.patient.findUnique({
        where: {
          profileId: profile.id,
        },

        select: {
          id: true,
          profileId: true,

          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRelation: true,

          guardianFirstName: true,
          guardianLastName: true,
          guardianEmail: true,
          guardianPhone: true,
          guardianRelation: true,

          bloodType: true,
          allergies: true,
          chronicConditions: true,

          createdAt: true,
          updatedAt: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Patient record not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* ========================================================
       5. CURRENT DATE
    ======================================================== */

    const now = new Date();

    /* ========================================================
       6. APPOINTMENTS
    ======================================================== */

    const appointments =
      await prisma.appointment.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          doctor: {
            select: {
              id: true,

              licenseNumber: true,
              biography: true,
              yearsExperience: true,

              consultationLanguages: true,
              education: true,
              certifications: true,

              consultationFee: true,
              consultationDuration: true,

              acceptsOnline: true,
              acceptsHomeVisit: true,
              isAcceptingNewPatients: true,

              averageRating: true,
              totalReviews: true,

              profile: {
                select: {
                  id: true,

                  firstName: true,
                  lastName: true,

                  email: true,
                  phone: true,

                  avatarUrl: true,

                  city: true,
                  wilaya: true,
                },
              },

              specialties: {
                include: {
                  specialty: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },

              facilities: {
                include: {
                  facility: {
                    select: {
                      id: true,
                      name: true,
                      type: true,

                      address: true,
                      city: true,
                      wilaya: true,

                      phone: true,
                      email: true,

                      latitude: true,
                      longitude: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          appointmentDate: "asc",
        },

        take: 20,
      });

    /* ========================================================
       7. PRESCRIPTIONS
    ======================================================== */

    const prescriptions =
      await prisma.prescription.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          doctor: {
            select: {
              id: true,

              profile: {
                select: {
                  id: true,

                  firstName: true,
                  lastName: true,

                  avatarUrl: true,
                },
              },
            },
          },

          items: {
            select: {
              id: true,

              medicationName: true,
              dosage: true,
              frequency: true,
              route: true,

              durationDays: true,
              quantity: true,

              instructions: true,

              createdAt: true,
            },
          },
        },

        orderBy: {
          prescribedDate: "desc",
        },

        take: 20,
      });

    /* ========================================================
       8. LABORATORY RESULTS
    ======================================================== */

    const laboratoryResults =
      await prisma.laboratoryResult.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          parameters: {
            select: {
              id: true,

              name: true,
              value: true,
              unit: true,

              referenceMin: true,
              referenceMax: true,

              flag: true,

              createdAt: true,
            },
          },
        },

        orderBy: {
          testDate: "desc",
        },

        take: 20,
      });

    /* ========================================================
       9. MEDICAL RECORDS
    ======================================================== */

    const medicalRecords =
      await prisma.medicalRecord.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          doctor: {
            select: {
              id: true,

              profile: {
                select: {
                  id: true,

                  firstName: true,
                  lastName: true,

                  avatarUrl: true,
                },
              },
            },
          },
        },

        orderBy: {
          recordDate: "desc",
        },

        take: 20,
      });

    /* ========================================================
       10. VACCINATIONS
    ======================================================== */

    const vaccinations =
      await prisma.vaccination.findMany({
        where: {
          patientId: patient.id,
        },

        orderBy: {
          vaccinationDate: "desc",
        },

        take: 30,
      });

    /* ========================================================
       11. REFILL REQUESTS
    ======================================================== */

    const refillRequests =
      await prisma.refillRequest.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          prescription: {
            select: {
              id: true,

              prescriptionNumber: true,

              prescribedDate: true,
              startDate: true,
              endDate: true,

              status: true,

              items: {
                select: {
                  id: true,

                  medicationName: true,
                  dosage: true,
                  frequency: true,
                  route: true,

                  durationDays: true,
                  quantity: true,

                  instructions: true,
                },
              },
            },
          },
        },

        orderBy: {
          requestedDate: "desc",
        },

        take: 20,
      });

    /* ========================================================
       12. AI CONVERSATIONS
    ======================================================== */

    const conversations =
      await prisma.aIConversation.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          messages: {
            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },

        take: 10,
      });

    /* ========================================================
       13. APPOINTMENT STATISTICS
    ======================================================== */

    const upcomingAppointments =
      appointments.filter(
        (appointment) =>
          appointment.appointmentDate >= now &&
          appointment.status !== "CANCELLED" &&
          appointment.status !== "NO_SHOW"
      );

    const completedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "COMPLETED"
      );

    const pendingAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "PENDING"
      );

    const confirmedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "CONFIRMED"
      );

    const cancelledAppointments =
      appointments.filter(
        (appointment) =>
          appointment.status === "CANCELLED"
      );

    /* ========================================================
       14. PRESCRIPTION STATISTICS
    ======================================================== */

    const activePrescriptions =
      prescriptions.filter(
        (prescription) =>
          prescription.status === "ACTIVE"
      );

    const completedPrescriptions =
      prescriptions.filter(
        (prescription) =>
          prescription.status === "COMPLETED"
      );

    const expiredPrescriptions =
      prescriptions.filter(
        (prescription) =>
          prescription.status === "EXPIRED"
      );

    const cancelledPrescriptions =
      prescriptions.filter(
        (prescription) =>
          prescription.status === "CANCELLED"
      );

    /* ========================================================
       15. LABORATORY STATISTICS
    ======================================================== */

    const pendingLaboratoryResults =
      laboratoryResults.filter(
        (result) =>
          result.status === "PENDING"
      );

    const processingLaboratoryResults =
      laboratoryResults.filter(
        (result) =>
          result.status === "PROCESSING"
      );

    const completedLaboratoryResults =
      laboratoryResults.filter(
        (result) =>
          result.status === "COMPLETED"
      );

    const cancelledLaboratoryResults =
      laboratoryResults.filter(
        (result) =>
          result.status === "CANCELLED"
      );

    /* ========================================================
       16. CRITICAL LABORATORY VALUES
    ======================================================== */

    const criticalLaboratoryParameters =
      laboratoryResults.flatMap(
        (result) =>
          result.parameters.filter(
            (parameter) =>
              parameter.flag === "CRITICAL"
          )
      );

    const abnormalLaboratoryParameters =
      laboratoryResults.flatMap(
        (result) =>
          result.parameters.filter(
            (parameter) =>
              parameter.flag === "LOW" ||
              parameter.flag === "HIGH" ||
              parameter.flag === "CRITICAL"
          )
      );

    /* ========================================================
       17. REFILL STATISTICS
    ======================================================== */

    const pendingRefillRequests =
      refillRequests.filter(
        (request) =>
          request.status === "REQUESTED"
      );

    const approvedRefillRequests =
      refillRequests.filter(
        (request) =>
          request.status === "APPROVED"
      );

    const completedRefillRequests =
      refillRequests.filter(
        (request) =>
          request.status === "COMPLETED"
      );

    const rejectedRefillRequests =
      refillRequests.filter(
        (request) =>
          request.status === "REJECTED"
      );

    /* ========================================================
       18. NEXT APPOINTMENT
    ======================================================== */

    const nextAppointment =
      upcomingAppointments.length > 0
        ? upcomingAppointments[0]
        : null;

    /* ========================================================
       19. LATEST PRESCRIPTION
    ======================================================== */

    const latestPrescription =
      prescriptions.length > 0
        ? prescriptions[0]
        : null;

    /* ========================================================
       20. LATEST LABORATORY RESULT
    ======================================================== */

    const latestLaboratoryResult =
      laboratoryResults.length > 0
        ? laboratoryResults[0]
        : null;

    /* ========================================================
       21. LATEST MEDICAL RECORD
    ======================================================== */

    const latestMedicalRecord =
      medicalRecords.length > 0
        ? medicalRecords[0]
        : null;

    /* ========================================================
       22. RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        /* ----------------------------------------------------
           AUTH USER
        ---------------------------------------------------- */

        user: {
          id: user.id,

          email:
            user.email ??
            profile.email,

          displayName:
            user.user_metadata?.display_name ??
            `${profile.firstName} ${profile.lastName}`,

          firstName:
            user.user_metadata?.first_name ??
            profile.firstName,

          lastName:
            user.user_metadata?.last_name ??
            profile.lastName,
        },

        /* ----------------------------------------------------
           PROFILE
        ---------------------------------------------------- */

        profile,

        /* ----------------------------------------------------
           PATIENT
        ---------------------------------------------------- */

        patient,

        /* ----------------------------------------------------
           STATISTICS
        ---------------------------------------------------- */

        statistics: {
          appointments: {
            total:
              appointments.length,

            upcoming:
              upcomingAppointments.length,

            pending:
              pendingAppointments.length,

            confirmed:
              confirmedAppointments.length,

            completed:
              completedAppointments.length,

            cancelled:
              cancelledAppointments.length,
          },

          prescriptions: {
            total:
              prescriptions.length,

            active:
              activePrescriptions.length,

            completed:
              completedPrescriptions.length,

            expired:
              expiredPrescriptions.length,

            cancelled:
              cancelledPrescriptions.length,
          },

          laboratory: {
            total:
              laboratoryResults.length,

            pending:
              pendingLaboratoryResults.length,

            processing:
              processingLaboratoryResults.length,

            completed:
              completedLaboratoryResults.length,

            cancelled:
              cancelledLaboratoryResults.length,

            abnormal:
              abnormalLaboratoryParameters.length,

            critical:
              criticalLaboratoryParameters.length,
          },

          medicalRecords: {
            total:
              medicalRecords.length,
          },

          vaccinations: {
            total:
              vaccinations.length,
          },

          refillRequests: {
            total:
              refillRequests.length,

            pending:
              pendingRefillRequests.length,

            approved:
              approvedRefillRequests.length,

            completed:
              completedRefillRequests.length,

            rejected:
              rejectedRefillRequests.length,
          },

          aiConversations: {
            total:
              conversations.length,
          },
        },

        /* ----------------------------------------------------
           HIGHLIGHTS
        ---------------------------------------------------- */

        highlights: {
          nextAppointment,

          latestPrescription,

          latestLaboratoryResult,

          latestMedicalRecord,
        },

        /* ----------------------------------------------------
           FULL DATA
        ---------------------------------------------------- */

        appointments,

        prescriptions,

        laboratoryResults,

        medicalRecords,

        vaccinations,

        refillRequests,

        conversations,
      },

      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATIENT DASHBOARD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Unable to load patient dashboard.",

        details:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}