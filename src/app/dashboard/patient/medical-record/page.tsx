"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Activity,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  TestTube2,
  UserRound,
  Loader2,
  RefreshCw,
  Droplets,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock3,
  Syringe,
  FlaskConical,
  Download,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  postalCode: string | null;
  avatarUrl: string | null;
};

type Patient = {
  id: string;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;

  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;

  guardianFirstName: string | null;
  guardianLastName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
};

type MedicalRecord = {
  id: string;
  title: string;
  diagnosis: string | null;
  symptoms: string | null;
  notes: string | null;
  recordDate: string;

  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    specialties: string[];
  } | null;
};

type Appointment = {
  id: string;
  appointmentDate: string;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
  location: string | null;

  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    specialties: string[];
  };
};

type PrescriptionItem = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string | null;
  route: string | null;
  durationDays: number | null;
  quantity: number | null;
  instructions: string | null;
};

type Prescription = {
  id: string;
  prescriptionNumber: string;
  prescribedDate: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  notes: string | null;

  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };

  items: PrescriptionItem[];
};

type LaboratoryParameter = {
  id: string;
  name: string;
  value: string;
  unit: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  flag: string;
};

type LaboratoryResult = {
  id: string;
  testName: string;
  laboratoryName: string | null;
  testDate: string;
  status: string;
  reportUrl: string | null;
  notes: string | null;
  parameters: LaboratoryParameter[];
};

type Vaccination = {
  id: string;
  vaccineName: string;
  dose: string | null;
  vaccinationDate: string;
  nextDueDate: string | null;
  provider: string | null;
  batchNumber: string | null;
  notes: string | null;
};

type MedicalRecordResponse = {
  success: boolean;

  profile: Profile;

  patient: Patient;

  medicalRecords: MedicalRecord[];

  appointments: Appointment[];

  prescriptions: Prescription[];

  laboratoryResults: LaboratoryResult[];

  vaccinations: Vaccination[];
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(
  date: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(parsedDate);
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference =
    today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function capitalize(value: string | null | undefined) {
  if (!value) return "Not available";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getInitials(
  firstName: string,
  lastName: string
) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("active") ||
    normalized.includes("completed") ||
    normalized.includes("normal")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("scheduled")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("abnormal") ||
    normalized.includes("high") ||
    normalized.includes("low")
  ) {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getFlagClasses(flag: string) {
  const normalized = flag.toLowerCase();

  if (
    normalized === "normal" ||
    normalized === "none"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("high") ||
    normalized.includes("low") ||
    normalized.includes("critical") ||
    normalized.includes("abnormal")
  ) {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
}

// ============================================================
// PAGE
// ============================================================

export default function MedicalRecordPage() {
  const [data, setData] =
    useState<MedicalRecordResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  // ==========================================================
  // LOAD MEDICAL RECORD
  // ==========================================================

  const loadMedicalRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Unable to retrieve your authentication session."
        );
      }

      const session = sessionData.session;

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const response = await fetch(
        "/api/dashboard/patient/medical-record",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      let result: MedicalRecordResponse & {
        error?: string;
        details?: string;
      };

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load your medical record."
        );
      }

      if (!result.success) {
        throw new Error(
          result.error ||
            "Unable to load your medical record."
        );
      }

      setData(result);
    } catch (err) {
      console.error(
        "Medical record loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicalRecord();
  }, []);

  // ==========================================================
  // DERIVED DATA
  // ==========================================================

  const age = useMemo(() => {
    return calculateAge(data?.profile.birthDate ?? null);
  }, [data?.profile.birthDate]);

  const latestMedicalRecord = useMemo(() => {
    if (!data?.medicalRecords?.length) return null;

    return [...data.medicalRecords].sort(
      (a, b) =>
        new Date(b.recordDate).getTime() -
        new Date(a.recordDate).getTime()
    )[0];
  }, [data?.medicalRecords]);

  const latestAppointment = useMemo(() => {
    if (!data?.appointments?.length) return null;

    return [...data.appointments].sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
    )[0];
  }, [data?.appointments]);

  const latestDoctor =
    latestMedicalRecord?.doctor ??
    latestAppointment?.doctor ??
    null;

  const activePrescriptions = useMemo(() => {
    if (!data?.prescriptions) return [];

    return data.prescriptions.filter((prescription) => {
      const status =
        prescription.status?.toLowerCase() ?? "";

      return (
        status.includes("active") ||
        status.includes("pending")
      );
    });
  }, [data?.prescriptions]);

  const upcomingAppointments = useMemo(() => {
    if (!data?.appointments) return [];

    const now = new Date();

    return data.appointments
      .filter(
        (appointment) =>
          new Date(appointment.appointmentDate) >= now
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      )
      .slice(0, 3);
  }, [data?.appointments]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>

          <div className="text-center">
            <p className="font-semibold text-slate-800">
              Loading medical record
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please wait while we retrieve your health
              information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !data) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Unable to load your medical record
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ||
              "We couldn't retrieve your medical information."}
          </p>

          <button
            type="button"
            onClick={loadMedicalRecord}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const {
    profile,
    patient,
    medicalRecords,
    appointments,
    prescriptions,
    laboratoryResults,
    vaccinations,
  } = data;

  const fullName =
    `${profile.firstName} ${profile.lastName}`.trim();

  const address = [
    profile.address,
    profile.city,
    profile.wilaya,
    profile.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-8 pb-10">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-200">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>

            <span className="text-sm font-semibold text-violet-600">
              Health Records
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Medical Record
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Your complete medical history, health information,
            prescriptions, laboratory results and vaccinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadMedicalRecord}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            Download record
          </button>
        </div>
      </div>

      {/* ======================================================
          PATIENT HERO CARD
      ====================================================== */}

      <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-200/50">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={fullName}
                className="h-20 w-20 rounded-3xl object-cover ring-4 ring-white/20"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-xl font-bold ring-4 ring-white/10">
                {getInitials(
                  profile.firstName,
                  profile.lastName
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-white/70">
                Patient
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {fullName}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                {age !== null && (
                  <span>{age} years old</span>
                )}

                {profile.gender && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span>
                      {capitalize(profile.gender)}
                    </span>
                  </>
                )}

                {profile.city && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/40" />
                    <span>{profile.city}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">
                Records
              </p>
              <p className="mt-1 text-xl font-bold">
                {medicalRecords.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">
                Prescriptions
              </p>
              <p className="mt-1 text-xl font-bold">
                {prescriptions.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs text-white/60">
                Lab results
              </p>
              <p className="mt-1 text-xl font-bold">
                {laboratoryResults.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MEDICAL OVERVIEW
      ====================================================== */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Medical Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Important information about your health.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Blood Type */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
                <Droplets className="h-5 w-5 text-rose-500" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Blood
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Blood Type
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {patient.bloodType || "Not recorded"}
            </p>
          </div>

          {/* Allergies */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Safety
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Allergies
            </p>

            <p className="mt-1 line-clamp-2 text-base font-bold text-slate-900">
              {patient.allergies || "No allergies recorded"}
            </p>
          </div>

          {/* Chronic Conditions */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50">
                <Activity className="h-5 w-5 text-violet-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Conditions
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Chronic Conditions
            </p>

            <p className="mt-1 line-clamp-2 text-base font-bold text-slate-900">
              {patient.chronicConditions ||
                "No chronic conditions recorded"}
            </p>
          </div>

          {/* Physician */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                <Stethoscope className="h-5 w-5 text-indigo-600" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Physician
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Latest Physician
            </p>

            <p className="mt-1 truncate text-base font-bold text-slate-900">
              {latestDoctor
                ? `Dr. ${latestDoctor.firstName} ${latestDoctor.lastName}`
                : "Not assigned"}
            </p>

            {latestDoctor?.specialties?.length ? (
              <p className="mt-1 truncate text-xs text-violet-600">
                {latestDoctor.specialties.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ======================================================
          PERSONAL INFORMATION + EMERGENCY CONTACT
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Personal Information */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50">
              <UserRound className="h-5 w-5 text-violet-600" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="text-sm text-slate-500">
                Your registered personal details.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              icon={<UserRound className="h-4 w-4" />}
              label="Full name"
              value={fullName}
            />

            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Date of birth"
              value={formatDate(profile.birthDate)}
            />

            <InfoItem
              icon={<Activity className="h-4 w-4" />}
              label="Gender"
              value={capitalize(profile.gender)}
            />

            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={profile.email}
            />

            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={
                profile.phone || "Not provided"
              }
            />

            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={address || "Not provided"}
            />
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
              <ShieldCheck className="h-5 w-5 text-rose-500" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Emergency Contact
              </h2>

              <p className="text-sm text-slate-500">
                Contact information for emergencies.
              </p>
            </div>
          </div>

          {patient.emergencyContactName ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-lg font-bold text-slate-900">
                {patient.emergencyContactName}
              </p>

              <p className="mt-1 text-sm text-violet-600">
                {patient.emergencyContactRelation ||
                  "Emergency contact"}
              </p>

              <div className="mt-5 space-y-3">
                {patient.emergencyContactPhone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {patient.emergencyContactPhone}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={
                <ShieldCheck className="h-6 w-6" />
              }
              title="No emergency contact"
              description="No emergency contact has been recorded yet."
            />
          )}

          {patient.guardianFirstName && (
            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                Guardian
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {patient.guardianFirstName}{" "}
                {patient.guardianLastName}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {patient.guardianRelation ||
                  "Guardian"}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ======================================================
          MEDICAL HISTORY
      ====================================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Medical History
              </h2>

              <p className="text-sm text-slate-500">
                Your recorded medical consultations and history.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-600">
            {medicalRecords.length} record
            {medicalRecords.length !== 1 ? "s" : ""}
          </span>
        </div>

        {medicalRecords.length > 0 ? (
          <div className="space-y-3">
            {medicalRecords.map((record) => (
              <div
                key={record.id}
                className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-violet-100 hover:bg-violet-50/30"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <HeartPulse className="h-5 w-5 text-violet-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {record.title}
                      </h3>

                      {record.diagnosis && (
                        <p className="mt-1 text-sm font-medium text-violet-600">
                          {record.diagnosis}
                        </p>
                      )}

                      {record.symptoms && (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          <span className="font-medium text-slate-700">
                            Symptoms:
                          </span>{" "}
                          {record.symptoms}
                        </p>
                      )}

                      {record.notes && (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {record.notes}
                        </p>
                      )}

                      {record.doctor && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>
                            Dr. {record.doctor.firstName}{" "}
                            {record.doctor.lastName}
                          </span>

                          {record.doctor.specialties
                            ?.length > 0 && (
                            <>
                              <span className="text-slate-300">
                                •
                              </span>
                              <span className="text-violet-600">
                                {record.doctor.specialties.join(
                                  " · "
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-400">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(record.recordDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <ClipboardList className="h-6 w-6" />
            }
            title="No medical history"
            description="Your medical history will appear here when records are added by your healthcare providers."
          />
        )}
      </section>

      {/* ======================================================
          PRESCRIPTIONS
      ====================================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <Pill className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Prescriptions
              </h2>

              <p className="text-sm text-slate-500">
                Medications prescribed by your doctors.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
            {prescriptions.length} prescription
            {prescriptions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {prescriptions.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Prescription
                    </p>

                    <h3 className="mt-1 font-bold text-slate-900">
                      {prescription.prescriptionNumber}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(
                        prescription.prescribedDate
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      prescription.status
                    )}`}
                  >
                    {capitalize(prescription.status)}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {prescription.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.medicationName}
                          </p>

                          <p className="mt-1 text-sm text-violet-600">
                            {item.dosage}
                          </p>
                        </div>

                        {item.quantity !== null && (
                          <span className="text-xs text-slate-400">
                            Qty: {item.quantity}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        {item.frequency && (
                          <div>
                            <span className="font-semibold text-slate-700">
                              Frequency:
                            </span>{" "}
                            {item.frequency}
                          </div>
                        )}

                        {item.route && (
                          <div>
                            <span className="font-semibold text-slate-700">
                              Route:
                            </span>{" "}
                            {item.route}
                          </div>
                        )}

                        {item.durationDays !== null && (
                          <div>
                            <span className="font-semibold text-slate-700">
                              Duration:
                            </span>{" "}
                            {item.durationDays} days
                          </div>
                        )}
                      </div>

                      {item.instructions && (
                        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                          {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {prescription.doctor && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Prescribed by Dr.{" "}
                    {prescription.doctor.firstName}{" "}
                    {prescription.doctor.lastName}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Pill className="h-6 w-6" />}
            title="No prescriptions"
            description="Your prescribed medications will appear here."
          />
        )}
      </section>

      {/* ======================================================
          LABORATORY RESULTS
      ====================================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
            <TestTube2 className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Laboratory Results
            </h2>

            <p className="text-sm text-slate-500">
              Your latest laboratory tests and parameters.
            </p>
          </div>
        </div>

        {laboratoryResults.length > 0 ? (
          <div className="space-y-4">
            {laboratoryResults.map((result) => (
              <div
                key={result.id}
                className="overflow-hidden rounded-2xl border border-slate-100"
              >
                <div className="flex flex-col gap-4 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <FlaskConical className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {result.testName}
                      </h3>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          {formatDate(result.testDate)}
                        </span>

                        {result.laboratoryName && (
                          <>
                            <span className="text-slate-300">
                              •
                            </span>
                            <span>
                              {result.laboratoryName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                        result.status
                      )}`}
                    >
                      {capitalize(result.status)}
                    </span>

                    {result.reportUrl && (
                      <a
                        href={result.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                      >
                        View report
                        <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {result.parameters.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Parameter
                          </th>

                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Result
                          </th>

                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Reference
                          </th>

                          <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Flag
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {result.parameters.map(
                          (parameter) => (
                            <tr
                              key={parameter.id}
                              className="border-b border-slate-50 last:border-0"
                            >
                              <td className="px-5 py-4 text-sm font-medium text-slate-800">
                                {parameter.name}
                              </td>

                              <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                {parameter.value}{" "}
                                {parameter.unit || ""}
                              </td>

                              <td className="px-5 py-4 text-xs text-slate-500">
                                {parameter.referenceMin !==
                                  null &&
                                parameter.referenceMax !==
                                  null
                                  ? `${parameter.referenceMin} – ${parameter.referenceMax} ${
                                      parameter.unit || ""
                                    }`
                                  : "—"}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getFlagClasses(
                                    parameter.flag
                                  )}`}
                                >
                                  {capitalize(
                                    parameter.flag
                                  )}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {result.notes && (
                  <div className="border-t border-slate-100 bg-white px-5 py-4 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Notes:
                    </span>{" "}
                    {result.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<TestTube2 className="h-6 w-6" />}
            title="No laboratory results"
            description="Your laboratory results will appear here when they are available."
          />
        )}
      </section>

      {/* ======================================================
          VACCINATIONS
      ====================================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50">
            <Syringe className="h-5 w-5 text-cyan-600" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Vaccination History
            </h2>

            <p className="text-sm text-slate-500">
              Your recorded vaccinations and upcoming doses.
            </p>
          </div>
        </div>

        {vaccinations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vaccinations.map((vaccination) => (
              <div
                key={vaccination.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
                    <Syringe className="h-5 w-5 text-cyan-600" />
                  </div>

                  {vaccination.dose && (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                      {vaccination.dose}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {vaccination.vaccineName}
                </h3>

                <div className="mt-3 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Given:{" "}
                    {formatDate(
                      vaccination.vaccinationDate
                    )}
                  </div>

                  {vaccination.nextDueDate && (
                    <div className="flex items-center gap-2 text-violet-600">
                      <Clock3 className="h-3.5 w-3.5" />
                      Next:{" "}
                      {formatDate(
                        vaccination.nextDueDate
                      )}
                    </div>
                  )}

                  {vaccination.provider && (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {vaccination.provider}
                    </div>
                  )}
                </div>

                {vaccination.notes && (
                  <p className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-slate-500">
                    {vaccination.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Syringe className="h-6 w-6" />}
            title="No vaccination records"
            description="Your vaccination history will appear here."
          />
        )}
      </section>

      {/* ======================================================
          APPOINTMENTS
      ====================================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Appointments
              </h2>

              <p className="text-sm text-slate-500">
                Your recent and upcoming medical appointments.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
            {appointments.length} appointment
            {appointments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Dr.{" "}
                      {appointment.doctor.firstName}{" "}
                      {appointment.doctor.lastName}
                    </p>

                    {appointment.doctor.specialties
                      ?.length > 0 && (
                      <p className="mt-1 text-xs text-violet-600">
                        {appointment.doctor.specialties.join(
                          " · "
                        )}
                      </p>
                    )}

                    {appointment.reason && (
                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatDateTime(
                        appointment.appointmentDate
                      )}
                    </p>

                    {appointment.location && (
                      <p className="mt-1 text-xs text-slate-400">
                        {appointment.location}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                      appointment.status
                    )}`}
                  >
                    {capitalize(appointment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <CalendarDays className="h-6 w-6" />
            }
            title="No appointments"
            description="Your appointments will appear here."
          />
        )}

        {upcomingAppointments.length > 0 && (
          <div className="mt-5 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                <Clock3 className="h-4 w-4 text-violet-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Next appointment
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(
                    upcomingAppointments[0]
                      .appointmentDate
                  )}{" "}
                  with Dr.{" "}
                  {
                    upcomingAppointments[0].doctor
                      .lastName
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Access important parts of your healthcare journey.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            title="Appointments"
            description="View your appointments"
            href="/dashboard/patient/appointments"
          />

          <QuickAction
            icon={<Pill className="h-5 w-5" />}
            title="Prescriptions"
            description="View your medications"
            href="/dashboard/patient/prescriptions"
          />

          <QuickAction
            icon={
              <TestTube2 className="h-5 w-5" />
            }
            title="Laboratory"
            description="View your test results"
            href="/dashboard/patient/laboratory"
          />

          <QuickAction
            icon={
              <HeartPulse className="h-5 w-5" />
            }
            title="AI Assistant"
            description="Analyze your symptoms"
            href="/dashboard/patient/ai-assistant"
          />
        </div>
      </section>
    </div>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-violet-100"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
          {icon}
        </div>

        <div>
          <p className="font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
    </a>
  );
}