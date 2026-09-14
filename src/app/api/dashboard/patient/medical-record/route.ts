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
   GET MEDICAL RECORD
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

          avatarUrl: true,
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
            "This page is only available for patients.",
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
          error: "Patient record not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* ========================================================
       5. MEDICAL RECORDS
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

              specialties: {
                include: {
                  specialty: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          recordDate: "desc",
        },

        take: 50,
      });

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

              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },

              specialties: {
                include: {
                  specialty: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          appointmentDate: "desc",
        },

        take: 50,
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
            },
          },
        },

        orderBy: {
          prescribedDate: "desc",
        },

        take: 50,
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
            },
          },
        },

        orderBy: {
          testDate: "desc",
        },

        take: 50,
      });

    /* ========================================================
       9. VACCINATIONS
    ======================================================== */

    const vaccinations =
      await prisma.vaccination.findMany({
        where: {
          patientId: patient.id,
        },

        orderBy: {
          vaccinationDate: "desc",
        },

        take: 50,
      });

    /* ========================================================
       10. RESPONSE
    ======================================================== */

    return NextResponse.json({
      success: true,

      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        birthDate: profile.birthDate,
        address: profile.address,
        city: profile.city,
        wilaya: profile.wilaya,
        postalCode: profile.postalCode,
        avatarUrl: profile.avatarUrl,
      },

      patient: {
        id: patient.id,

        bloodType: patient.bloodType,
        allergies: patient.allergies,
        chronicConditions:
          patient.chronicConditions,

        emergencyContactName:
          patient.emergencyContactName,

        emergencyContactPhone:
          patient.emergencyContactPhone,

        emergencyContactRelation:
          patient.emergencyContactRelation,

        guardianFirstName:
          patient.guardianFirstName,

        guardianLastName:
          patient.guardianLastName,

        guardianEmail:
          patient.guardianEmail,

        guardianPhone:
          patient.guardianPhone,

        guardianRelation:
          patient.guardianRelation,
      },

      medicalRecords:
        medicalRecords.map((record) => ({
          id: record.id,

          title: record.title,
          diagnosis: record.diagnosis,
          symptoms: record.symptoms,
          notes: record.notes,

          recordDate:
            record.recordDate,

          doctor: record.doctor
            ? {
                id: record.doctor.id,

                firstName:
                  record.doctor.profile.firstName,

                lastName:
                  record.doctor.profile.lastName,

                avatarUrl:
                  record.doctor.profile.avatarUrl,

                specialties:
                  record.doctor.specialties.map(
                    (item) =>
                      item.specialty.name
                  ),
              }
            : null,
        })),

      appointments:
        appointments.map((appointment) => ({
          id: appointment.id,

          appointmentDate:
            appointment.appointmentDate,

          type: appointment.type,
          status: appointment.status,
          reason: appointment.reason,
          notes: appointment.notes,
          location: appointment.location,

          doctor: {
            id: appointment.doctor.id,

            firstName:
              appointment.doctor.profile.firstName,

            lastName:
              appointment.doctor.profile.lastName,

            avatarUrl:
              appointment.doctor.profile.avatarUrl,

            specialties:
              appointment.doctor.specialties.map(
                (item) =>
                  item.specialty.name
              ),
          },
        })),

      prescriptions:
        prescriptions.map((prescription) => ({
          id: prescription.id,

          prescriptionNumber:
            prescription.prescriptionNumber,

          prescribedDate:
            prescription.prescribedDate,

          startDate:
            prescription.startDate,

          endDate:
            prescription.endDate,

          status:
            prescription.status,

          notes:
            prescription.notes,

          doctor: {
            id: prescription.doctor.id,

            firstName:
              prescription.doctor.profile.firstName,

            lastName:
              prescription.doctor.profile.lastName,

            avatarUrl:
              prescription.doctor.profile.avatarUrl,
          },

          items:
            prescription.items.map(
              (item) => ({
                id: item.id,

                medicationName:
                  item.medicationName,

                dosage:
                  item.dosage,

                frequency:
                  item.frequency,

                route:
                  item.route,

                durationDays:
                  item.durationDays,

                quantity:
                  item.quantity,

                instructions:
                  item.instructions,
              })
            ),
        })),

      laboratoryResults:
        laboratoryResults.map((result) => ({
          id: result.id,

          testName:
            result.testName,

          laboratoryName:
            result.laboratoryName,

          testDate:
            result.testDate,

          status:
            result.status,

          reportUrl:
            result.reportUrl,

          notes:
            result.notes,

          parameters:
            result.parameters.map(
              (parameter) => ({
                id: parameter.id,

                name:
                  parameter.name,

                value:
                  parameter.value,

                unit:
                  parameter.unit,

                referenceMin:
                  parameter.referenceMin,

                referenceMax:
                  parameter.referenceMax,

                flag:
                  parameter.flag,
              })
            ),
        })),

      vaccinations:
        vaccinations.map((vaccination) => ({
          id: vaccination.id,

          vaccineName:
            vaccination.vaccineName,

          dose:
            vaccination.dose,

          vaccinationDate:
            vaccination.vaccinationDate,

          nextDueDate:
            vaccination.nextDueDate,

          provider:
            vaccination.provider,

          batchNumber:
            vaccination.batchNumber,

          notes:
            vaccination.notes,
        })),
    });
  } catch (error) {
    console.error(
      "MEDICAL RECORD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Unable to load medical record.",

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