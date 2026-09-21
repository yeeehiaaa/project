"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import PatientWelcomeBanner from "@/components/patient/PatientWelcomeBanner";

import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
  HeartPulse,
  Loader2,
  Pill,
  RefreshCw,
  Stethoscope,
  Syringe,
  XCircle,
  ChevronRight,
  Users,
  MessageCircle,
  PlusCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ============================================================
   TYPES (unchanged)
============================================================ */

interface DashboardUser {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

interface Profile {
  id: string;
  authUserId: string;
  userType: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  postalCode: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  preferredLanguage: string;
  avatarUrl: string | null;
  isVerified: boolean;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  profileId: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  guardianFirstName: string | null;
  guardianLastName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  type: "IN_PERSON" | "ONLINE" | "HOME_VISIT";
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  reason: string | null;
  notes: string | null;
  location: string | null;
  doctor: {
    id: string;
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      avatarUrl: string | null;
      city: string | null;
      wilaya: string | null;
    };
    specialties: { specialty: { id: string; name: string; description: string | null } }[];
    facilities: { facility: { id: string; name: string; type: string; address: string | null; city: string | null; wilaya: string | null; phone: string | null; email: string | null; latitude: number | string | null; longitude: number | string | null } }[];
  };
}

interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string | null;
  route: string | null;
  durationDays: number | null;
  quantity: number | null;
  instructions: string | null;
  createdAt: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  prescribedDate: string;
  startDate: string | null;
  endDate: string | null;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  notes: string | null;
  doctor: {
    id: string;
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
  items: PrescriptionItem[];
}

interface LaboratoryParameter {
  id: string;
  name: string;
  value: string;
  unit: string | null;
  referenceMin: number | string | null;
  referenceMax: number | string | null;
  flag: "NORMAL" | "LOW" | "HIGH" | "CRITICAL";
  createdAt: string;
}

interface LaboratoryResult {
  id: string;
  testName: string;
  laboratoryName: string | null;
  testDate: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  reportUrl: string | null;
  notes: string | null;
  parameters: LaboratoryParameter[];
}

interface MedicalRecord {
  id: string;
  title: string;
  diagnosis: string | null;
  symptoms: string | null;
  notes: string | null;
  recordDate: string;
  doctor: {
    id: string;
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  } | null;
}

interface Vaccination {
  id: string;
  vaccineName: string;
  dose: string | null;
  vaccinationDate: string;
  nextDueDate: string | null;
  provider: string | null;
  batchNumber: string | null;
  notes: string | null;
}

interface RefillRequest {
  id: string;
  requestedDate: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  response: string | null;
  prescription: {
    id: string;
    prescriptionNumber: string;
    prescribedDate: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    items: PrescriptionItem[];
  };
}

interface AIConversation {
  id: string;
  title: string | null;
  status: string;
  messages: { id: string; role: string; content: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardStatistics {
  appointments: {
    total: number;
    upcoming: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  prescriptions: {
    total: number;
    active: number;
    completed: number;
    expired: number;
    cancelled: number;
  };
  laboratory: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    abnormal: number;
    critical: number;
  };
  medicalRecords: { total: number };
  vaccinations: { total: number };
  refillRequests: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  aiConversations: { total: number };
}

interface DashboardResponse {
  success: boolean;
  user: DashboardUser;
  profile: Profile;
  patient: Patient;
  statistics: DashboardStatistics;
  highlights: {
    nextAppointment: Appointment | null;
    latestPrescription: Prescription | null;
    latestLaboratoryResult: LaboratoryResult | null;
    latestMedicalRecord: MedicalRecord | null;
  };
  appointments: Appointment[];
  prescriptions: Prescription[];
  laboratoryResults: LaboratoryResult[];
  medicalRecords: MedicalRecord[];
  vaccinations: Vaccination[];
  refillRequests: RefillRequest[];
  conversations: AIConversation[];
}

/* ============================================================
   HELPERS (unchanged)
============================================================ */

function formatDate(date: string | null | undefined) {
  if (!date) return "Not available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Not available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAppointmentDoctorName(appointment: Appointment) {
  return `Dr. ${appointment.doctor.profile.firstName} ${appointment.doctor.profile.lastName}`;
}

function getPrimarySpecialty(appointment: Appointment) {
  return appointment.doctor.specialties[0]?.specialty?.name ?? "General Practitioner";
}

/* ============================================================
   STAT CARD – enhanced with gradient and hover
============================================================ */

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: "violet" | "emerald" | "blue" | "amber" | "indigo" | "cyan" | "orange" | "pink" | "rose";
  delay?: number;
}

const colorMap = {
  violet: "from-sky-50 to-sky-100/60 border-sky-200 text-sky-600",
  emerald: "from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-600",
  blue: "from-blue-50 to-blue-100/60 border-blue-200 text-blue-600",
  amber: "from-amber-50 to-amber-100/60 border-amber-200 text-amber-600",
  indigo: "from-blue-50 to-blue-100/60 border-blue-200 text-blue-600",
  cyan: "from-cyan-50 to-cyan-100/60 border-cyan-200 text-cyan-600",
  orange: "from-orange-50 to-orange-100/60 border-orange-200 text-orange-600",
  pink: "from-pink-50 to-pink-100/60 border-pink-200 text-pink-600",
  rose: "from-rose-50 to-rose-100/60 border-rose-200 text-rose-600",
};

const darkColorMap = {
  violet: "from-sky-950/60 to-blue-950/40 border-slate-800 text-sky-300",
  emerald: "from-emerald-950/60 to-teal-950/40 border-slate-800 text-emerald-300",
  blue: "from-blue-950/60 to-blue-950/40 border-slate-800 text-blue-300",
  amber: "from-amber-950/60 to-orange-950/40 border-slate-800 text-amber-300",
  indigo: "from-blue-950/60 to-sky-950/40 border-slate-800 text-blue-300",
  cyan: "from-cyan-950/60 to-sky-950/40 border-slate-800 text-cyan-300",
  orange: "from-orange-950/60 to-amber-950/40 border-slate-800 text-orange-300",
  pink: "from-pink-950/60 to-rose-950/40 border-slate-800 text-pink-300",
  rose: "from-rose-950/60 to-pink-950/40 border-slate-800 text-rose-300",
};

function StatCard({ title, value, subtitle, icon, color, delay = 0 }: StatCardProps) {
  const { isDark } = usePatientTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-md ${isDark ? darkColorMap[color] : colorMap[color]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={isDark ? "text-sm font-medium text-slate-300/80" : "text-sm font-medium text-slate-600/80"}>{title}</p>
          <p className={isDark ? "mt-2 text-3xl font-bold text-white" : "mt-2 text-3xl font-bold text-slate-900"}>{value}</p>
          <p className={isDark ? "mt-1 text-xs text-slate-400/70" : "mt-1 text-xs text-slate-500/70"}>{subtitle}</p>
        </div>
        <div className={isDark ? "flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 shadow-sm backdrop-blur-sm" : "flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 shadow-sm backdrop-blur-sm"}>
          {icon}
        </div>
      </div>
      <div className={isDark ? "absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" : "absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/30 blur-2xl"} />
    </motion.div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function DashboardContent() {
  const { isDark } = usePatientTheme();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ==========================================================
     LOAD DASHBOARD (unchanged)
  ========================================================== */

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing.");
      }
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Your authentication session is invalid. Please sign in again.");
      }

      const response = await fetch("/api/dashboard/patient/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as
        | DashboardResponse
        | { success: false; error?: string; details?: string };

      if (!response.ok) {
        const errorResult = result as { error?: string; details?: string };
        throw new Error(errorResult.error || errorResult.details || "Unable to load your dashboard.");
      }
      if (!("profile" in result) || !result.profile) {
        throw new Error("Dashboard profile data was not returned.");
      }
      setDashboard(result as DashboardResponse);
    } catch (error) {
      console.error("PATIENT DASHBOARD LOAD ERROR:", error);
      setError(error instanceof Error ? error.message : "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-sky-600" size={32} />
          <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <div className={isDark ? "w-full max-w-md rounded-3xl border border-red-100 bg-slate-900/80 p-8 text-center shadow-sm" : "w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={28} />
          </div>
          <h2 className={isDark ? "mt-5 text-xl font-bold text-white" : "mt-5 text-xl font-bold text-slate-900"}>Unable to load dashboard</h2>
          <p className={isDark ? "mt-2 text-sm leading-6 text-slate-400" : "mt-2 text-sm leading-6 text-slate-500"}>{error || "Dashboard data was not returned."}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 cursor-pointer active:scale-[0.97]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    user,
    profile,
    patient,
    statistics,
    highlights,
    appointments,
    prescriptions,
    laboratoryResults,
    medicalRecords,
  } = dashboard;

  /* ==========================================================
     APPOINTMENT CHART DATA
  ========================================================== */

  const appointmentChartData = [
    { name: "Pending", value: statistics.appointments.pending },
    { name: "Confirmed", value: statistics.appointments.confirmed },
    { name: "Completed", value: statistics.appointments.completed },
    { name: "Cancelled", value: statistics.appointments.cancelled },
  ];

  /* ==========================================================
     UPCOMING APPOINTMENTS
  ========================================================== */

  const upcomingAppointments = appointments
    .filter((appointment) => {
      const date = new Date(appointment.appointmentDate);
      return date >= new Date() && appointment.status !== "CANCELLED" && appointment.status !== "NO_SHOW";
    })
    .slice(0, 4);

  /* ==========================================================
     RECENT PRESCRIPTIONS
  ========================================================== */

  const recentPrescriptions = prescriptions.slice(0, 4);

  /* ==========================================================
     RECENT LABS
  ========================================================== */

  const recentLabs = laboratoryResults.slice(0, 4);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ======================================================
          WELCOME BANNER (same design as doctor dashboard)
      ====================================================== */}
      <PatientWelcomeBanner
        patient={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          city: profile.city,
          wilaya: profile.wilaya,
          avatarUrl: profile.avatarUrl,
          accountStatus: profile.accountStatus,
          bloodType: patient.bloodType,
        }}
        stats={{
          upcomingAppointments: statistics.appointments.upcoming,
          activePrescriptions: statistics.prescriptions.active,
          pendingLabs: statistics.laboratory.pending,
        }}
        isDark={isDark}
      />

      {/* ======================================================
          STATISTICS – with animation and enhanced cards
      ====================================================== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className={isDark ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>Overview</h2>
            <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your healthcare activity from the database.</p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className={isDark ? "rounded-xl bg-slate-800 p-2 text-slate-400 transition hover:bg-slate-700 cursor-pointer active:scale-[0.97]" : "rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 cursor-pointer active:scale-[0.97]"}
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Upcoming appointments"
            value={statistics.appointments.upcoming}
            subtitle="Scheduled appointments"
            icon={<CalendarDays size={21} />}
            color="violet"
            delay={0.05}
          />
          <StatCard
            title="Completed appointments"
            value={statistics.appointments.completed}
            subtitle="Completed consultations"
            icon={<CheckCircle2 size={21} />}
            color="emerald"
            delay={0.1}
          />
          <StatCard
            title="Active prescriptions"
            value={statistics.prescriptions.active}
            subtitle="Currently active"
            icon={<Pill size={21} />}
            color="blue"
            delay={0.15}
          />
          <StatCard
            title="Laboratory results"
            value={statistics.laboratory.total}
            subtitle="Total laboratory tests"
            icon={<FlaskConical size={21} />}
            color="amber"
            delay={0.2}
          />
        </div>
      </section>

      {/* ======================================================
          SECONDARY STATISTICS
      ====================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Medical records"
          value={statistics.medicalRecords.total}
          subtitle="Medical history records"
          icon={<FileText size={21} />}
          color="indigo"
          delay={0.25}
        />
        <StatCard
          title="Vaccinations"
          value={statistics.vaccinations.total}
          subtitle="Vaccination records"
          icon={<Syringe size={21} />}
          color="cyan"
          delay={0.3}
        />
        <StatCard
          title="Pending requests"
          value={statistics.refillRequests.pending}
          subtitle="Prescription refill requests"
          icon={<RefreshCw size={21} />}
          color="orange"
          delay={0.35}
        />
        <StatCard
          title="AI conversations"
          value={statistics.aiConversations.total}
          subtitle="DOCTORZ Co. conversations"
          icon={<Activity size={21} />}
          color="pink"
          delay={0.4}
        />
      </div>

      {/* ======================================================
          MAIN GRID – chart + health summary
      ====================================================== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Appointment Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm xl:col-span-2" : "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2"}
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Appointment activity</h2>
              <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Based on your real appointment records.</p>
            </div>
            <div className={isDark ? "flex items-center gap-2 rounded-xl bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-200" : "flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"}>
              <CalendarDays size={16} />
              {statistics.appointments.total} total
            </div>
          </div>
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={appointmentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e2e8f0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b" }} />
                <Tooltip
                  contentStyle={isDark ? { borderRadius: "12px", border: "1px solid #1e293b", backgroundColor: "#0f172a", color: "#e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" } : { borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Health Summary – enhanced with icons and better layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm" : "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <HeartPulse size={22} />
            </div>
            <div>
              <h2 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>Health summary</h2>
              <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>Your current patient record</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className={isDark ? "rounded-2xl bg-slate-950/60 p-4 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"}>
              <div className="flex items-center justify-between">
                <p className={isDark ? "text-xs font-medium text-slate-400" : "text-xs font-medium text-slate-500"}>Blood type</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  {patient.bloodType ? patient.bloodType.charAt(0) : "?"}
                </div>
              </div>
              <p className={isDark ? "mt-1 font-semibold text-white" : "mt-1 font-semibold text-slate-900"}>
                {patient.bloodType || "Not provided"}
              </p>
            </div>

            <div className={isDark ? "rounded-2xl bg-slate-950/60 p-4 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"}>
              <p className={isDark ? "text-xs font-medium text-slate-400" : "text-xs font-medium text-slate-500"}>Allergies</p>
              <p className={isDark ? "mt-1 font-semibold text-white" : "mt-1 font-semibold text-slate-900"}>
                {patient.allergies || "None provided"}
              </p>
              {patient.allergies && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {patient.allergies.split(",").map((a, i) => (
                    <span key={i} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                      {a.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={isDark ? "rounded-2xl bg-slate-950/60 p-4 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"}>
              <p className={isDark ? "text-xs font-medium text-slate-400" : "text-xs font-medium text-slate-500"}>Chronic conditions</p>
              <p className={isDark ? "mt-1 font-semibold text-white" : "mt-1 font-semibold text-slate-900"}>
                {patient.chronicConditions || "None provided"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          NEXT APPOINTMENT – enhanced with animation
      ====================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className={isDark ? "rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-950/50 to-sky-950/30 p-6" : "rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50/60 p-6"}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
            <Clock3 size={22} />
          </div>
          <div>
            <h2 className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>Next appointment</h2>
            <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Your next scheduled consultation</p>
          </div>
        </div>

        {highlights.nextAppointment ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={isDark ? "mt-5 rounded-2xl bg-slate-900/80 p-5 shadow-sm hover:shadow-md transition-all" : "mt-5 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-all"}
          >
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>
                  {getAppointmentDoctorName(highlights.nextAppointment)}
                </p>
                <p className="mt-1 text-sm font-medium text-sky-600">
                  {getPrimarySpecialty(highlights.nextAppointment)}
                </p>
                <p className={isDark ? "mt-3 text-sm text-slate-400" : "mt-3 text-sm text-slate-500"}>
                  {formatDateTime(highlights.nextAppointment.appointmentDate)}
                </p>
                {highlights.nextAppointment.location && (
                  <p className="mt-1 text-sm text-slate-400">{highlights.nextAppointment.location}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                  {getStatusLabel(highlights.nextAppointment.status)}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className={isDark ? "mt-5 rounded-2xl bg-slate-900/80 p-6 text-center" : "mt-5 rounded-2xl bg-white p-6 text-center"}>
            <CalendarDays className="mx-auto text-slate-300" size={32} />
            <p className={isDark ? "mt-3 font-semibold text-slate-200" : "mt-3 font-semibold text-slate-700"}>No upcoming appointment</p>
            <p className="mt-1 text-sm text-slate-400">You currently have no scheduled appointment.</p>
          </div>
        )}
      </motion.section>

      {/* ======================================================
          UPCOMING APPOINTMENTS – with cards animation
      ====================================================== */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className={isDark ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>Upcoming appointments</h2>
            <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your next scheduled consultations.</p>
          </div>
          {upcomingAppointments.length > 0 && (
            <a href="/dashboard/patient/appointments" className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View all <ChevronRight size={16} />
            </a>
          )}
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className={isDark ? "rounded-3xl border border-dashed border-slate-800 bg-slate-900/80 p-10 text-center" : "rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center"}>
            <CalendarDays className="mx-auto text-slate-300" size={36} />
            <p className={isDark ? "mt-3 font-semibold text-slate-200" : "mt-3 font-semibold text-slate-700"}>No upcoming appointments</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ y: -4, boxShadow: "0 8px 25px -6px rgba(0,0,0,0.08)" }}
                className={isDark ? "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm transition-all" : "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all"}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <p className={isDark ? "font-bold text-white" : "font-bold text-slate-900"}>{getAppointmentDoctorName(appointment)}</p>
                      <p className="text-xs text-sky-600">{getPrimarySpecialty(appointment)}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className={isDark ? "rounded-xl bg-slate-950/60 p-3" : "rounded-xl bg-slate-50 p-3"}>
                    <p className="text-[11px] text-slate-400">Date</p>
                    <p className={isDark ? "mt-1 text-sm font-semibold text-slate-200" : "mt-1 text-sm font-semibold text-slate-700"}>
                      {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div className={isDark ? "rounded-xl bg-slate-950/60 p-3" : "rounded-xl bg-slate-50 p-3"}>
                    <p className="text-[11px] text-slate-400">Type</p>
                    <p className={isDark ? "mt-1 text-sm font-semibold text-slate-200" : "mt-1 text-sm font-semibold text-slate-700"}>
                      {getStatusLabel(appointment.type)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================
          PRESCRIPTIONS + LABS – enhanced with animation
      ====================================================== */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Prescriptions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm" : "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Recent prescriptions</h2>
              <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your latest prescriptions.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Pill size={20} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentPrescriptions.length === 0 ? (
              <div className={isDark ? "rounded-2xl bg-slate-950/60 p-6 text-center" : "rounded-2xl bg-slate-50 p-6 text-center"}>
                <Pill className="mx-auto text-slate-300" size={30} />
                <p className={isDark ? "mt-2 text-sm font-medium text-slate-400" : "mt-2 text-sm font-medium text-slate-500"}>No prescriptions yet.</p>
              </div>
            ) : (
              recentPrescriptions.map((prescription) => (
                <div key={prescription.id} className={isDark ? "rounded-2xl bg-slate-950/60 p-4 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-900"}>{prescription.prescriptionNumber}</p>
                      <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                        Dr. {prescription.doctor.profile.firstName} {prescription.doctor.profile.lastName}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                      {getStatusLabel(prescription.status)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {prescription.items.slice(0, 3).map((item) => (
                      <p key={item.id} className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"}>
                        <span className={isDark ? "font-medium text-slate-100" : "font-medium text-slate-800"}>{item.medicationName}</span> — {item.dosage}
                      </p>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{formatDate(prescription.prescribedDate)}</p>
                </div>
              ))
            )}
          </div>
        </motion.section>

        {/* Laboratory */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm" : "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Recent laboratory results</h2>
              <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your latest laboratory tests.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <FlaskConical size={20} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentLabs.length === 0 ? (
              <div className={isDark ? "rounded-2xl bg-slate-950/60 p-6 text-center" : "rounded-2xl bg-slate-50 p-6 text-center"}>
                <FlaskConical className="mx-auto text-slate-300" size={30} />
                <p className={isDark ? "mt-2 text-sm font-medium text-slate-400" : "mt-2 text-sm font-medium text-slate-500"}>No laboratory results yet.</p>
              </div>
            ) : (
              recentLabs.map((result) => (
                <div key={result.id} className={isDark ? "rounded-2xl bg-slate-950/60 p-4 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-900"}>{result.testName}</p>
                      <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                        {result.laboratoryName || "Laboratory not specified"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {getStatusLabel(result.status)}
                    </span>
                  </div>
                  {result.parameters.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.parameters.slice(0, 4).map((parameter) => (
                        <span
                          key={parameter.id}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                            parameter.flag === "CRITICAL"
                              ? "bg-red-100 text-red-700"
                              : parameter.flag === "HIGH"
                              ? "bg-orange-100 text-orange-700"
                              : parameter.flag === "LOW"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {parameter.name}: {parameter.value}
                          {parameter.unit ? ` ${parameter.unit}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-400">{formatDate(result.testDate)}</p>
                </div>
              ))
            )}
          </div>
        </motion.section>
      </div>

      {/* ======================================================
          MEDICAL RECORDS – enhanced grid
      ====================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm" : "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <FileText size={21} />
          </div>
          <div>
            <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Recent medical records</h2>
            <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Your latest medical history.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medicalRecords.length === 0 ? (
            <div className={isDark ? "rounded-2xl bg-slate-950/60 p-6 text-center md:col-span-2 lg:col-span-3" : "rounded-2xl bg-slate-50 p-6 text-center md:col-span-2 lg:col-span-3"}>
              <FileText className="mx-auto text-slate-300" size={30} />
              <p className={isDark ? "mt-2 text-sm font-medium text-slate-400" : "mt-2 text-sm font-medium text-slate-500"}>No medical records yet.</p>
            </div>
          ) : (
            medicalRecords.slice(0, 6).map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                whileHover={{ y: -2 }}
                className={isDark ? "rounded-2xl bg-slate-950/60 p-5 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-5 transition hover:bg-slate-100"}
              >
                <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-900"}>{record.title}</p>
                {record.diagnosis && (
                  <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>
                    <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                  </p>
                )}
                {record.symptoms && (
                  <p className={isDark ? "mt-2 text-sm text-slate-400" : "mt-2 text-sm text-slate-500"}>
                    <span className="font-medium">Symptoms:</span> {record.symptoms}
                  </p>
                )}
                {record.doctor && (
                  <p className="mt-3 text-xs text-slate-400">
                    Dr. {record.doctor.profile.firstName} {record.doctor.profile.lastName}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">{formatDate(record.recordDate)}</p>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* ======================================================
          PATIENT INFORMATION – enhanced with icons and animation
      ====================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm" : "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Users size={21} />
          </div>
          <div>
            <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Patient information</h2>
            <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Basic information from your profile.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Name", value: `${profile.firstName} ${profile.lastName}`, icon: "👤" },
            { label: "Email", value: profile.email, icon: "✉️" },
            { label: "Phone", value: profile.phone || "Not provided", icon: "📞" },
            { label: "Gender", value: profile.gender || "Not provided", icon: "⚥" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className={isDark ? "rounded-2xl bg-slate-950/60 p-4 transition hover:bg-slate-800" : "rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"}
            >
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className={isDark ? "mt-1 flex items-center gap-2 font-semibold text-slate-100" : "mt-1 flex items-center gap-2 font-semibold text-slate-800"}>
                <span>{item.icon}</span>
                <span className="truncate">{item.value}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}