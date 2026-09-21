import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

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

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function calculateAge(birthDate: Date | null) {
  if (!birthDate) return 0;

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatGender(
  gender: "MALE" | "FEMALE" | "OTHER" | null
): "Homme" | "Femme" | "Autre" {
  switch (gender) {
    case "FEMALE":
      return "Femme";

    case "OTHER":
      return "Autre";

    default:
      return "Homme";
  }
}

function getTriageScore(
  appointment: {
    reason: string | null;
    notes: string | null;
  },
  allergies: string | null
): "FAIBLE" | "MODÉRÉ" | "ÉLEVÉ" {
  const text =
    `${appointment.reason || ""} ${
      appointment.notes || ""
    }`.toLowerCase();

  const urgentWords = [
    "douleur thoracique",
    "urgence",
    "détresse",
    "essoufflement sévère",
    "perte de connaissance",
    "syncope",
    "hémorragie",
    "avc",
    "infarctus",
  ];

  const moderateWords = [
    "palpitation",
    "essoufflement",
    "douleur",
    "fièvre",
    "hypertension",
    "diabète",
  ];

  if (
    urgentWords.some((word) =>
      text.includes(word)
    )
  ) {
    return "ÉLEVÉ";
  }

  if (
    moderateWords.some((word) =>
      text.includes(word)
    )
  ) {
    return "MODÉRÉ";
  }

  if (allergies) {
    return "MODÉRÉ";
  }

  return "FAIBLE";
}

function getTriageSummary(
  score: "FAIBLE" | "MODÉRÉ" | "ÉLEVÉ",
  appointment: {
    reason: string | null;
  }
) {
  if (score === "ÉLEVÉ") {
    return "Motif nécessitant une évaluation clinique prioritaire.";
  }

  if (score === "MODÉRÉ") {
    return "Motif nécessitant une attention clinique et une évaluation médicale.";
  }

  return (
    appointment.reason ||
    "Consultation médicale programmée."
  );
}

/*
|--------------------------------------------------------------------------
| GET
| Tous les rendez-vous du médecin connecté
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const token = authorization
      .substring(7)
      .trim();

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authentication session.",
        },
        { status: 401 }
      );
    }

    /*
     * Find the doctor belonging to
     * the authenticated Supabase user.
     */

    const doctor =
      await prisma.doctor.findFirst({
        where: {
          profile: {
            authUserId: userData.user.id,
            userType: "DOCTOR",
          },
        },
        select: {
          id: true,
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor profile not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Get appointments
     */

    const appointments =
      await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
        },

        include: {
          patient: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  birthDate: true,
                  gender: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },

        orderBy: {
          appointmentDate: "asc",
        },
      });

    /*
     * Convert database data to
     * the frontend Appointment interface.
     */

    const formattedAppointments =
      appointments.map((appointment) => {
        const patient =
          appointment.patient;

        const profile =
          patient.profile;

        const triageScore =
          getTriageScore(
            appointment,
            patient.allergies
          );

        const patientName =
          `${profile.firstName} ${profile.lastName}`.trim();

        return {
          id: appointment.id,

          patientId: patient.id,

          patientName,

          patientAge:
            calculateAge(
              profile.birthDate
            ),

          patientGender:
            formatGender(
              profile.gender
            ),

          phone:
            profile.phone ||
            "Non renseigné",

          /*
           * IMPORTANT:
           * Keep Prisma's appointmentDate.
           */

          appointmentDate:
            appointment.appointmentDate.toISOString(),

          previousDate:
            appointment.previousDate
              ? appointment.previousDate.toISOString()
              : null,

          time:
            appointment.appointmentDate.toLocaleTimeString(
              "fr-FR",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),

          /*
           * Keep Prisma enum values.
           */

          type: appointment.type,

          status: appointment.status,

          reason:
            appointment.reason ||
            "Consultation médicale",

          aiTriageScore:
            triageScore,

          aiTriageSummary:
            getTriageSummary(
              triageScore,
              appointment
            ),

          allergies:
            patient.allergies
              ? patient.allergies
                  .split(",")
                  .map((item) =>
                    item.trim()
                  )
                  .filter(Boolean)
              : [],

          notes:
            appointment.notes || "",

          location:
            appointment.location || "",

          avatarUrl:
            profile.avatarUrl || null,
        };
      });

    return NextResponse.json({
      success: true,
      doctorId: doctor.id,
      appointments:
        formattedAppointments,
    });
  } catch (error) {
    console.error(
      "GET /api/dashboard/doctor/appointments:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve doctor appointments.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
| Le médecin crée un rendez-vous
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
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
        {
          success: false,
          error: "Invalid session.",
        },
        { status: 401 }
      );
    }

    /*
     * Get authenticated doctor.
     */

    const doctor =
      await prisma.doctor.findFirst({
        where: {
          profile: {
            authUserId: userData.user.id,
            userType: "DOCTOR",
          },
        },
        select: {
          id: true,
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor profile not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      patientId,
      appointmentDate,
      type,
      reason,
      notes,
      location,
    } = body;

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient is required.",
        },
        { status: 400 }
      );
    }

    if (!appointmentDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Appointment date is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate appointment type.
     */

    const validTypes = [
      "IN_PERSON",
      "ONLINE",
      "HOME_VISIT",
    ] as const;

    if (
      type &&
      !validTypes.includes(type)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid appointment type.",
        },
        { status: 400 }
      );
    }

    /*
     * Verify patient exists.
     */

    const patient =
      await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Convert date.
     */

    const parsedAppointmentDate =
      new Date(appointmentDate);

    if (
      Number.isNaN(
        parsedAppointmentDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid appointment date.",
        },
        { status: 400 }
      );
    }

    /*
     * Create appointment.
     */

    const appointment =
      await prisma.appointment.create({
        data: {
          patientId,

          doctorId: doctor.id,

          appointmentDate:
            parsedAppointmentDate,

          type:
            type || "IN_PERSON",

          status: "CONFIRMED",

          reason:
            typeof reason === "string"
              ? reason.trim() || null
              : null,

          notes:
            typeof notes === "string"
              ? notes.trim() || null
              : null,

          location:
            typeof location === "string"
              ? location.trim() || null
              : null,
        },
      });

    return NextResponse.json(
      {
        success: true,
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/dashboard/doctor/appointments:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create appointment.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH
| Modifier le statut / les notes
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
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
        {
          success: false,
          error: "Invalid session.",
        },
        { status: 401 }
      );
    }

    /*
     * Get authenticated doctor.
     */

    const doctor =
      await prisma.doctor.findFirst({
        where: {
          profile: {
            authUserId: userData.user.id,
            userType: "DOCTOR",
          },
        },
        select: {
          id: true,
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor profile not found.",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    const {
      appointmentId,
      status,
      notes,
      appointmentDate,
    } = body;

    if (!appointmentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Appointment ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate status if provided.
     */

    const validStatuses = [
  "PENDING",
  "CONFIRMED",
  "RESCHEDULED",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

    if (
      status &&
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid appointment status.",
        },
        { status: 400 }
      );
    }

    /*
     * Make sure this appointment
     * belongs to this doctor.
     */

    const existing =
      await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          doctorId: doctor.id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Appointment not found.",
        },
        { status: 404 }
      );
    }

    // Garde-fous de transition côté médecin (avant écriture).
    if (status === "RESCHEDULED") {
      if (existing.status !== "PENDING") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only a pending request can be rescheduled.",
          },
          { status: 400 }
        );
      }
      if (!appointmentDate || isNaN(new Date(appointmentDate).getTime())) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A new date is required to propose another slot.",
          },
          { status: 400 }
        );
      }
    }
    if (
      status === "CONFIRMED" &&
      !["PENDING", "RESCHEDULED"].includes(existing.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm from ${existing.status}.`,
        },
        { status: 400 }
      );
    }

    const updated =
      await prisma.appointment.update({
        where: {
          id: appointmentId,
        },

        data: {
          ...(status
            ? { status }
            : {}),

          // Contre-proposition du médecin : nouveau créneau + statut
          // RESCHEDULED, l'ancienne date est gardée dans previousDate.
          ...(status === "RESCHEDULED" && appointmentDate
            ? {
                appointmentDate: new Date(appointmentDate),
                previousDate: existing.appointmentDate,
              }
            : {}),

          ...(typeof notes === "string"
            ? {
                notes:
                  notes.trim() || null,
              }
            : {}),
        },
      });

    return NextResponse.json({
      success: true,
      appointment: updated,
    });
  } catch (error) {
    console.error(
      "PATCH /api/dashboard/doctor/appointments:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update appointment.",
      },
      { status: 500 }
    );
  }
}
