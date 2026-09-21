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
    bloodType: true,
    allergies: true,
    chronicConditions: true,

    // AJOUTE CEUX-CI
    currentMedications: true,
    medicalHistory: true,
    surgicalHistory: true,
    familyMedicalHistory: true,
    vaccinationHistory: true,

    smokingStatus: true,
    alcoholConsumption: true,
    physicalActivity: true,
    diet: true,

    additionalMedicalInfo: true,

    emergencyContactName: true,
    emergencyContactPhone: true,
    emergencyContactRelation: true,

    guardianFirstName: true,
    guardianLastName: true,
    guardianEmail: true,
    guardianPhone: true,
    guardianRelation: true,

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
  chronicConditions: patient.chronicConditions,

  currentMedications: patient.currentMedications,
  medicalHistory: patient.medicalHistory,
  surgicalHistory: patient.surgicalHistory,
  familyMedicalHistory: patient.familyMedicalHistory,
  vaccinationHistory: patient.vaccinationHistory,

  smokingStatus: patient.smokingStatus,
  alcoholConsumption: patient.alcoholConsumption,
  physicalActivity: patient.physicalActivity,
  diet: patient.diet,

  additionalMedicalInfo:
    patient.additionalMedicalInfo,

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

  updatedAt: patient.updatedAt,
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

// ============================================================
// PUT - UPDATE PATIENT MEDICAL INFORMATION
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    // ----------------------------------------------------------
    // 1. AUTHENTICATION
    // ----------------------------------------------------------

    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ----------------------------------------------------------
    // 2. FIND PROFILE
    // ----------------------------------------------------------

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
          error: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // 3. VERIFY PATIENT
    // ----------------------------------------------------------

    if (profile.userType !== "PATIENT") {
      return NextResponse.json(
        {
          success: false,
          error: "This account is not a patient account.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------------------------
    // 4. FIND PATIENT
    // ----------------------------------------------------------

    const patient = await prisma.patient.findUnique({
      where: {
        profileId: profile.id,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient record not found.",
        },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // 5. READ REQUEST BODY
    // ----------------------------------------------------------

    const body = await request.json();

    // ----------------------------------------------------------
    // 6. NORMALIZE VALUES
    // ----------------------------------------------------------

    const normalize = (value: unknown): string | null => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmed = value.trim();

      return trimmed.length > 0 ? trimmed : null;
    };

    const bloodType = normalize(body.bloodType);
    const allergies = normalize(body.allergies);
    const chronicConditions = normalize(body.chronicConditions);

    const currentMedications = normalize(
      body.currentMedications
    );

    const medicalHistory = normalize(
      body.medicalHistory
    );

    const surgicalHistory = normalize(
      body.surgicalHistory
    );

    const familyMedicalHistory = normalize(
      body.familyMedicalHistory
    );

    const vaccinationHistory = normalize(
      body.vaccinationHistory
    );

    const smokingStatus = normalize(
      body.smokingStatus
    );

    const alcoholConsumption = normalize(
      body.alcoholConsumption
    );

    const physicalActivity = normalize(
      body.physicalActivity
    );

    const diet = normalize(body.diet);

    const additionalMedicalInfo = normalize(
      body.additionalMedicalInfo
    );

    // Emergency contact

    const emergencyContactName = normalize(
      body.emergencyContactName
    );

    const emergencyContactPhone = normalize(
      body.emergencyContactPhone
    );

    const emergencyContactRelation = normalize(
      body.emergencyContactRelation
    );

    // Guardian

    const guardianFirstName = normalize(
      body.guardianFirstName
    );

    const guardianLastName = normalize(
      body.guardianLastName
    );

    const guardianEmail = normalize(
      body.guardianEmail
    );

    const guardianPhone = normalize(
      body.guardianPhone
    );

    const guardianRelation = normalize(
      body.guardianRelation
    );

    // ----------------------------------------------------------
    // 7. VALIDATE BLOOD TYPE
    // ----------------------------------------------------------

    const validBloodTypes = [
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
      "UNKNOWN",
    ];

    if (
      bloodType &&
      !validBloodTypes.includes(bloodType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid blood type.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------
    // 8. UPDATE PATIENT
    // ----------------------------------------------------------

const updatedPatient = await prisma.patient.update({
  where: {
    id: patient.id,
  },

  data: {
    bloodType,
    allergies,
    chronicConditions,

    currentMedications,
    medicalHistory,
    surgicalHistory,
    familyMedicalHistory,
    vaccinationHistory,

    smokingStatus,
    alcoholConsumption,
    physicalActivity,
    diet,

    additionalMedicalInfo,

    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,

    guardianFirstName,
    guardianLastName,
    guardianEmail,
    guardianPhone,
    guardianRelation,
  },

  select: {
    id: true,

    bloodType: true,
    allergies: true,
    chronicConditions: true,

    currentMedications: true,
    medicalHistory: true,
    surgicalHistory: true,
    familyMedicalHistory: true,
    vaccinationHistory: true,

    smokingStatus: true,
    alcoholConsumption: true,
    physicalActivity: true,
    diet: true,

    additionalMedicalInfo: true,

    emergencyContactName: true,
    emergencyContactPhone: true,
    emergencyContactRelation: true,

    guardianFirstName: true,
    guardianLastName: true,
    guardianEmail: true,
    guardianPhone: true,
    guardianRelation: true,

    updatedAt: true,
  },
});

    // ----------------------------------------------------------
    // 9. SUCCESS RESPONSE
    // ----------------------------------------------------------

    return NextResponse.json({
      success: true,
      message:
        "Medical information updated successfully.",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error(
      "PATIENT MEDICAL RECORD PUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An error occurred while updating your medical information.",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST - PATIENT CREATES A PERSONAL RECORD ENTRY
   (doctorId stays null: doctor-written records are read-only)
============================================================ */

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: {
        authUserId: user.id,
      },
      select: {
        id: true,
        userType: true,
      },
    });

    if (!profile || profile.userType !== "PATIENT") {
      return NextResponse.json(
        {
          success: false,
          error: "This account is not a patient account.",
        },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        profileId: profile.id,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient record not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const normalize = (value: unknown): string | null => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmed = value.trim();

      return trimmed.length > 0 ? trimmed : null;
    };

    const title = normalize(body.title);
    const recordDateRaw = normalize(body.recordDate);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "A title is required.",
        },
        { status: 400 }
      );
    }

    const recordDate = recordDateRaw ? new Date(recordDateRaw) : new Date();

    if (Number.isNaN(recordDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid record date.",
        },
        { status: 400 }
      );
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        doctorId: null,
        title,
        diagnosis: normalize(body.diagnosis),
        symptoms: normalize(body.symptoms),
        notes: normalize(body.notes),
        recordDate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "PATIENT MEDICAL RECORD POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An error occurred while creating the record entry.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE - PATIENT REMOVES A PERSONAL ENTRY (?id=...)
   Doctor-written records (doctorId != null) are read-only.
============================================================ */

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: {
        authUserId: user.id,
      },
      select: {
        id: true,
        userType: true,
      },
    });

    if (!profile || profile.userType !== "PATIENT") {
      return NextResponse.json(
        {
          success: false,
          error: "This account is not a patient account.",
        },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        profileId: profile.id,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient record not found.",
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Record id is required.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.medicalRecord.findFirst({
      where: {
        id,
        patientId: patient.id,
      },
      select: {
        id: true,
        doctorId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Record not found.",
        },
        { status: 404 }
      );
    }

    if (existing.doctorId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doctor-written records cannot be deleted.",
        },
        { status: 403 }
      );
    }

    await prisma.medicalRecord.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "PATIENT MEDICAL RECORD DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An error occurred while deleting the record entry.",
      },
      { status: 500 }
    );
  }
}