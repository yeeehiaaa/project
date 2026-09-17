"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar as CalendarIcon,
  Plus,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Video,
  Activity,
} from "lucide-react";

interface DoctorWelcomeBannerProps {
  doctorInfo: {
    id: string;
    name: string;
    specialty: string;
    cabinet: string;
    license: string;
    status: "DISPONIBLE" | "EN_CONSULTATION" | "PAUSE";
    rating: number;
    reviewsCount: number;
    avatarUrl: string | null;
  };
  isDark: boolean;
  todayCount: number;
  waitingCount: number;
  teleconsultCount: number;
  urgentCount: number;
  onNewAppointment: () => void;
  onOpenCalendar: () => void;
  doctorInitials: string;
}

export default function DoctorWelcomeBanner({
  doctorInfo,
  isDark,
  todayCount,
  waitingCount,
  teleconsultCount,
  urgentCount,
  onNewAppointment,
  onOpenCalendar,
  doctorInitials,
}: DoctorWelcomeBannerProps) {
  // Determine greeting based on current local hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Bonjour"
      : currentHour < 18
      ? "Bon après-midi"
      : "Bonsoir";

  const todayFormatted = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Capitalize first letter of weekday
  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 shadow-lg transition-colors ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800/90 text-white"
          : "bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 border-slate-200/90 text-slate-900"
      }`}
    >
      {/* Decorative ambient background glows */}
      <div
        className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-indigo-600/15" : "bg-indigo-200/35"
        }`}
        aria-hidden="true"
      />
      <div
        className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-violet-600/10" : "bg-violet-100/35"
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Side: Avatar, Real Name, Specialty & Bio */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          {/* Doctor Picture / Avatar with real-time status ring */}
          <div className="relative shrink-0">
            <div
              className={`h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden shadow-xl p-0.5 border ${
                isDark
                  ? "bg-gradient-to-tr from-indigo-500 via-violet-500 to-indigo-600 border-indigo-400/30"
                  : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 border-indigo-200"
              }`}
            >
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-slate-800 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-inner">
                {doctorInfo.avatarUrl ? (
                  <Image
                    src={doctorInfo.avatarUrl}
                    alt={doctorInfo.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 flex items-center justify-center text-white">
                    <span>{doctorInitials}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Official Certification Check Badge */}
            <div
              title="Praticien certifié Ordre National des Médecins"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-md"
            >
              <CheckCircle2 size={13} strokeWidth={3} />
            </div>
          </div>

          {/* Greeting text and information */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isDark
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                    : "bg-indigo-100 text-indigo-800 border-indigo-200"
                }`}
              >
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Praticien Enregistré • {doctorInfo.license || "ONM / RPPS Certifié"}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <CalendarIcon size={12} className="opacity-80" />
                <span>{capitalizedDate}</span>
              </span>
            </div>

            {/* Welcome Title */}
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {greeting},{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 dark:from-indigo-300 dark:via-violet-200 dark:to-white">
                {doctorInfo.name || "Dr. Sarah Khelifi"}
              </span>
            </h1>

            {/* Specialty & Affiliation */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span
                className={`font-semibold ${
                  isDark ? "text-indigo-300" : "text-indigo-700"
                }`}
              >
                {doctorInfo.specialty || "Médecin Spécialiste"}
              </span>
              <span className={isDark ? "text-slate-600" : "text-slate-300"}>•</span>
              <div
                className={`flex items-center gap-1 font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <Building size={13} className="shrink-0 opacity-80" />
                <span className="truncate max-w-[280px] sm:max-w-none">
                  {doctorInfo.cabinet || "Cabinet Médical MediConnect"}
                </span>
              </div>
            </div>

            {/* Micro Stats pill bar */}
            <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                  isDark
                    ? "bg-slate-950/70 border-slate-800 text-slate-300"
                    : "bg-white/80 border-slate-200 text-slate-700 shadow-2xs"
                }`}
              >
                <Activity size={12} className="text-indigo-500" />
                <span>
                  <strong>{todayCount}</strong> consultation{todayCount > 1 ? "s" : ""} au planning
                </span>
              </span>

              {waitingCount > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                    isDark
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <Clock size={12} className="text-amber-500" />
                  <span>
                    <strong>{waitingCount}</strong> en attente
                  </span>
                </span>
              )}

              {teleconsultCount > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                    isDark
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                      : "bg-violet-50 border-violet-200 text-violet-800"
                  }`}
                >
                  <Video size={12} className="text-violet-500" />
                  <span>
                    <strong>{teleconsultCount}</strong> visio
                  </span>
                </span>
              )}

              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300 font-semibold animate-pulse">
                  <Sparkles size={12} className="text-rose-500" />
                  <span>{urgentCount} priorité IA</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Nouveau RDV */}
          <button
            type="button"
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Nouveau RDV</span>
          </button>

          {/* Calendrier interactif */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-xs ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <CalendarIcon size={14} className="text-indigo-500" />
            <span>Calendrier</span>
          </button>

          {/* Carte Virtuelle 3D */}
          <Link
            href="/doctor/card"
            title="Consulter ma carte professionnelle 3D"
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-xs ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border-slate-700"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
            }`}
          >
            <CreditCard size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Carte 3D</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
