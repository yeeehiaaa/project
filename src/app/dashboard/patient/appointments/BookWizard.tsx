"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Video,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Star,
  Clock,
  FileText,
  Check,
} from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  available: boolean;
  avatar: string;
  isPremium?: boolean;
};

type AppointmentType = "IN_PERSON" | "ONLINE" | "HOME_VISIT";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00",
];

const TYPE_META: { id: AppointmentType; label: string; hint: string }[] = [
  { id: "IN_PERSON", label: "In person", hint: "At the clinic" },
  { id: "ONLINE", label: "Video call", hint: "From home" },
  { id: "HOME_VISIT", label: "Home visit", hint: "Doctor comes to you" },
];

function typeIcon(t: AppointmentType, size = 18) {
  if (t === "ONLINE") return <Video size={size} />;
  if (t === "HOME_VISIT") return <Home size={size} />;
  return <MapPin size={size} />;
}

/* =====================================================
   BOOKING WIZARD (shared) — professional 3-step flow
   1. Choose doctor  2. Date & time  3. Details & confirm
   Props : backHref (back button), doneHref + doneLabel (success).
===================================================== */

interface BookWizardProps {
  backHref?: string;
  showBack?: boolean;
  doneHref?: string;
  doneLabel?: string;
}

export default function BookWizard({
  backHref = "/dashboard/patient",
  showBack = true,
  doneHref = "/dashboard/patient",
  doneLabel = "Back to dashboard",
}: BookWizardProps) {
  const router = useRouter();
  const { isDark } = usePatientTheme();

  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("");
  const [type, setType] = useState<AppointmentType>("IN_PERSON");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /* ---------- load doctors ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          throw new Error("You are not authenticated. Please log in again.");
        }
        const res = await fetch("/api/patient/doctors", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load doctors.");
        if (mounted) setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load doctors.");
      } finally {
        if (mounted) setLoadingDoctors(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
    );
  }, [doctors, searchQuery]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId) || null,
    [doctors, doctorId]
  );

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const canNext1 = !!doctorId;
  const canNext2 = !!date && !!time;

  /* ---------- book ---------- */
  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date || !time) return;
    setBooking(true);
    setError("");
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("You are not authenticated. Please log in again.");
      }
      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          doctorId,
          date,
          time,
          type,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Booking failed.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  const card = isDark
    ? "rounded-3xl border border-slate-800 bg-slate-900/80 text-white"
    : "rounded-3xl border border-slate-200 bg-white text-slate-900";
  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-sky-500 ${
    isDark
      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
  }`;

  const steps = ["Doctor", "Date & time", "Confirm"];

  /* ---------- success ---------- */
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${card} p-10 text-center shadow-md`}
        >
          <CheckCircle size={48} className="mx-auto text-emerald-500" />
          <h1 className="mt-4 text-xl font-bold">Request sent!</h1>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {selectedDoctor?.name} will accept your request or propose another slot.
            You will be notified of the decision here.
          </p>
          <div className="mt-6 flex gap-2.5 justify-center">
            <Link
              href={doneHref}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-blue-600 hover:to-sky-400 transition cursor-pointer active:scale-[0.97]"
            >
              {doneLabel}
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setStep(1);
                setDoctorId("");
                setTime("");
                setReason("");
                setNotes("");
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer active:scale-[0.97] ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Book another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href={backHref}
            title="Back to dashboard"
            className={`p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
              isDark ? "border-slate-800 text-slate-300 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowLeft size={16} />
          </Link>
        )}
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            New appointment
          </h1>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Choose a doctor, pick a slot, the doctor confirms.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex-1 flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white"
                      : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check size={14} /> : n}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${active ? (isDark ? "text-white" : "text-slate-900") : "text-slate-400"}`}>
                {label}
              </span>
              {n < steps.length && (
                <div className={`flex-1 h-0.5 rounded ${done ? "bg-emerald-500" : isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* STEP 1 — doctor */}
      {step === 1 && (
        <div className={`${card} p-5 sm:p-6 shadow-md space-y-4`}>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, specialty, city..."
              className={`${inputCls} !pl-10`}
            />
          </div>
          {loadingDoctors ? (
            <div className="flex py-16 items-center justify-center">
              <Loader2 className="animate-spin text-sky-500" size={28} />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No doctors found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredDoctors.map((d) => {
                const selected = d.id === doctorId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDoctorId(d.id)}
                    className={`text-left p-4 rounded-2xl border transition cursor-pointer active:scale-[0.98] ${
                      selected
                        ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5"
                        : isDark
                          ? "border-slate-800 bg-slate-950/50 hover:border-slate-600"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {d.avatar || d.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate flex items-center gap-1.5">
                          {d.name}
                          {d.isPremium && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-white">
                              ★ PREMIUM
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-sky-500 font-semibold truncate">{d.specialty}</p>
                      </div>
                      {selected && <CheckCircle size={18} className="ml-auto shrink-0 text-sky-500" />}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={11} /> {d.location || "—"}
                      </span>
                      {d.rating > 0 && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Star size={11} className="text-amber-400" /> {d.rating}
                        </span>
                      )}
                      {!d.available && (
                        <span className="shrink-0 font-semibold text-slate-400">• Busy</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canNext1}
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-blue-600 hover:to-sky-400 transition cursor-pointer active:scale-[0.97] disabled:opacity-40"
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — date & time */}
      {step === 2 && (
        <div className={`${card} p-5 sm:p-6 shadow-md space-y-5`}>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Day</span>
            </label>
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="inline-flex items-center gap-1.5"><Clock size={12} /> Time slot</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TIME_SLOTS.map((t) => {
                const selected = time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono border transition cursor-pointer active:scale-95 ${
                      selected
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white border-transparent"
                        : isDark
                          ? "border-slate-700 text-slate-300 hover:border-sky-500"
                          : "border-slate-200 text-slate-700 hover:border-sky-500"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer active:scale-[0.97] ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              type="button"
              disabled={!canNext2}
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-blue-600 hover:to-sky-400 transition cursor-pointer active:scale-[0.97] disabled:opacity-40"
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — details & confirm */}
      {step === 3 && (
        <form onSubmit={handleBook} className={`${card} p-5 sm:p-6 shadow-md space-y-4`}>
          {/* Summary */}
          <div className={`p-4 rounded-2xl border text-sm ${isDark ? "bg-sky-500/5 border-sky-500/20" : "bg-sky-50 border-sky-200"}`}>
            <p className="font-bold">{selectedDoctor?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDoctor?.specialty} •{" "}
              {date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }) : ""}{" "}
              at {time || "—"}
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Visit type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_META.map((t) => {
                const selected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer active:scale-[0.97] ${
                      selected
                        ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5"
                        : isDark
                          ? "border-slate-800 bg-slate-950/50 hover:border-slate-600"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span className={`mx-auto w-fit block ${selected ? "text-sky-500" : "text-slate-400"}`}>
                      {typeIcon(t.id)}
                    </span>
                    <span className="block mt-1 text-[11px] font-bold">{t.label}</span>
                    <span className="block text-[10px] text-slate-400">{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Reason for visit
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Chest pain, follow-up, prescription renewal..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="inline-flex items-center gap-1.5"><FileText size={12} /> Notes (optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the doctor should know..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer active:scale-[0.97] ${
                isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              type="submit"
              disabled={booking}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-blue-600 hover:to-sky-400 transition cursor-pointer active:scale-[0.97] disabled:opacity-50"
            >
              {booking ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {booking ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
