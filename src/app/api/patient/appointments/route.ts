import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

type AppointmentType =
  | "IN_PERSON"
  | "ONLINE"
  | "HOME_VISIT";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables."
  );
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

// =====================================================
// GET - PATIENT APPOINTMENTS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // -------------------------------------------------
    // 1. AUTH
    // -------------------------------------------------

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

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token is missing.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------
    // 2. SUPABASE USER
    // -------------------------------------------------

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authentication session.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------
    // 3. PATIENT
    // -------------------------------------------------

    const patient =
      await prisma.patient.findFirst({
        where: {
          profile: {
            authUserId: userData.user.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient profile not found.",
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // 4. APPOINTMENTS
    // -------------------------------------------------

    const appointments =
      await prisma.appointment.findMany({
        where: {
          patientId: patient.id,
        },
        include: {
          doctor: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  city: true,
                  wilaya: true,
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
          appointmentDate: "asc",
        },
      });

    // -------------------------------------------------
    // 5. FORMAT
    // -------------------------------------------------

    const formattedAppointments =
      appointments.map((appointment) => {
        const profile =
          appointment.doctor.profile;

        const firstName =
          profile.firstName?.trim() || "";

        const lastName =
          profile.lastName?.trim() || "";

        const doctorName =
          `Dr. ${firstName} ${lastName}`.trim();

        const specialty =
          appointment.doctor.specialties[0]
            ?.specialty.name ||
          "General Medicine";

        const location =
          appointment.location ||
          profile.city ||
          profile.wilaya ||
          "";

        const avatar =
          `${firstName.charAt(0)}${lastName.charAt(0)}`
            .toUpperCase() || "DR";

        return {
          id: appointment.id,

          doctorName,

          specialty,

          date:
            appointment.appointmentDate.toISOString(),

          type: appointment.type,

          status: appointment.status,

          location,

          avatar,

          notes: appointment.notes || "",

          reason: appointment.reason || "",
        };
      });

    return NextResponse.json(
      {
        success: true,
        appointments: formattedAppointments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/patient/appointments:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve appointments.",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST - CREATE APPOINTMENT
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // -------------------------------------------------
    // 1. AUTH
    // -------------------------------------------------

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

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token is missing.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------
    // 2. VERIFY USER
    // -------------------------------------------------

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authentication session.",
        },
        { status: 401 }
      );
    }

    // -------------------------------------------------
    // 3. FIND PATIENT
    // -------------------------------------------------

    const patient =
      await prisma.patient.findFirst({
        where: {
          profile: {
            authUserId: userData.user.id,
          },
        },

        select: {
          id: true,

          profile: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient profile not found.",
        },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // 4. BODY
    // -------------------------------------------------

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const {
      doctorId,
      date,
      time,
      type,
      location,
      reason,
      notes,
    } = body as {
      doctorId?: unknown;
      date?: unknown;
      time?: unknown;
      type?: unknown;
      location?: unknown;
      reason?: unknown;
      notes?: unknown;
    };

    // -------------------------------------------------
    // 5. BASIC VALIDATION
    // -------------------------------------------------

    if (
      typeof doctorId !== "string" ||
      !doctorId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof date !== "string" ||
      !date.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Date is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof time !== "string" ||
      !time.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Time is required.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 6. TYPE
    // -------------------------------------------------

    const validTypes: AppointmentType[] = [
      "IN_PERSON",
      "ONLINE",
      "HOME_VISIT",
    ];

    const appointmentType: AppointmentType =
      type === undefined ||
      type === null ||
      type === ""
        ? "IN_PERSON"
        : (type as AppointmentType);

    if (!validTypes.includes(appointmentType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid appointment type.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 7. DATE + TIME
    // -------------------------------------------------

    const appointmentDate = new Date(
      `${date}T${time}:00`
    );

    if (
      Number.isNaN(
        appointmentDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid appointment date or time.",
        },
        { status: 400 }
      );
    }

    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Appointment date must be in the future.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 8. DOCTOR
    // -------------------------------------------------

    const doctor =
      await prisma.doctor.findUnique({
        where: {
          id: doctorId.trim(),
        },

        select: {
          id: true,
          acceptsOnline: true,
          acceptsHomeVisit: true,
          isAcceptingNewPatients: true,
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: "Doctor not found.",
        },
        { status: 404 }
      );
    }

    if (!doctor.isAcceptingNewPatients) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This doctor is not accepting new patients.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 9. APPOINTMENT TYPE SUPPORT
    // -------------------------------------------------

    if (
      appointmentType === "ONLINE" &&
      !doctor.acceptsOnline
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This doctor does not accept online appointments.",
        },
        { status: 400 }
      );
    }

    if (
      appointmentType === "HOME_VISIT" &&
      !doctor.acceptsHomeVisit
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This doctor does not offer home visits.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // 10. DOCTOR DOUBLE BOOKING
    // -------------------------------------------------

    const existingAppointment =
      await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,

          appointmentDate,

          status: {
            in: [
              "PENDING",
              "CONFIRMED",
            ],
          },
        },

        select: {
          id: true,
        },
      });

    if (existingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This time slot is already booked. Please choose another time.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // 11. PATIENT DOUBLE BOOKING
    // -------------------------------------------------

    const patientExistingAppointment =
      await prisma.appointment.findFirst({
        where: {
          patientId: patient.id,

          appointmentDate,

          status: {
            in: [
              "PENDING",
              "CONFIRMED",
            ],
          },
        },

        select: {
          id: true,
        },
      });

    if (patientExistingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You already have an appointment at this date and time.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // 12. CREATE
    // -------------------------------------------------

    const appointment =
      await prisma.appointment.create({
        data: {
          patientId: patient.id,

          doctorId: doctor.id,

          appointmentDate,

          type: appointmentType,

          status: "PENDING",

          location:
            typeof location === "string"
              ? location.trim() || null
              : null,

          reason:
            typeof reason === "string"
              ? reason.trim() || null
              : null,

          notes:
            typeof notes === "string"
              ? notes.trim() || null
              : null,
        },

        include: {
          doctor: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

    // -------------------------------------------------
    // 13. RESPONSE
    // -------------------------------------------------

    const doctorFirstName =
      appointment.doctor.profile.firstName || "";

    const doctorLastName =
      appointment.doctor.profile.lastName || "";

    return NextResponse.json(
      {
        success: true,

        message:
          "Appointment booked successfully.",

        appointment: {
          id: appointment.id,

          doctorName:
            `Dr. ${doctorFirstName} ${doctorLastName}`.trim(),

          date:
            appointment.appointmentDate.toISOString(),

          type: appointment.type,

          status: appointment.status,

          location: appointment.location,

          reason: appointment.reason,

          notes: appointment.notes,
        },
      },

      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/patient/appointments:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to book appointment.",
      },
      { status: 500 }
    );
  }
}