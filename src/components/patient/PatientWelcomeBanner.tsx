"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  FlaskConical,
  Pill,
  CalendarDays,
  Plus,
} from "lucide-react";

export interface PatientBannerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  wilaya: string | null;
  avatarUrl: string | null;
  accountStatus: string;
  bloodType: string | null;
}

export interface PatientBannerStats {
  upcomingAppointments: number;
  activePrescriptions: number;
  pendingLabs: number;
}

function initialsOf(firstName: string, lastName: string): string {
  return `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase() || "PT";
}

function statusLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function PatientWelcomeBanner({
  patient,
  stats,
  isDark,
  showActions = true,
}: {
  patient: PatientBannerData;
  stats: PatientBannerStats;
  isDark: boolean;
  showActions?: boolean;
}) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fullName = `${patient.firstName} ${patient.lastName}`.trim() || "Patient";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 transition-colors ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-slate-800/90 text-white"
          : "bg-gradient-to-br from-white via-blue-50/40 to-slate-50 border-slate-200/90 text-slate-900"
      }`}
    >
      {/* Decorative ambient background glows */}
      <div
        className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-blue-600/15" : "bg-blue-200/35"
        }`}
        aria-hidden="true"
      />
      <div
        className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isDark ? "bg-sky-600/10" : "bg-sky-100/35"
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Side: Avatar, Name & Info */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div
              className={`h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden p-0.5 border ${
                isDark
                  ? "bg-gradient-to-tr from-blue-500 via-sky-500 to-blue-600 border-blue-400/30"
                  : "bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 border-blue-200"
              }`}
            >
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-slate-800 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-inner">
                {patient.avatarUrl ? (
                  <Image
                    src={patient.avatarUrl}
                    alt={fullName}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-700 via-blue-800 to-sky-900 flex items-center justify-center text-white">
                    <span>{initialsOf(patient.firstName, patient.lastName)}</span>
                  </div>
                )}
              </div>
            </div>

            <div
              title="Verified patient"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white"
            >
              <CheckCircle2 size={13} strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isDark
                    ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
              >
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Verified Patient • {statusLabel(patient.accountStatus)}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <CalendarIcon size={12} className="opacity-80" />
                <span>{todayFormatted}</span>
              </span>
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {greeting},{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-sky-600 to-blue-700 dark:from-blue-300 dark:via-sky-200 dark:to-white">
                {fullName}
              </span>
            </h1>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span
                className={`font-semibold ${
                  isDark ? "text-blue-300" : "text-blue-700"
                }`}
              >
                Blood type {patient.bloodType || "—"}
              </span>
              <span className={isDark ? "text-slate-600" : "text-slate-300"}>•</span>
              <span
                className={`font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {[patient.city, patient.wilaya].filter(Boolean).join(", ") || patient.email}
              </span>
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
                <CalendarDays size={12} className="text-blue-500" />
                <span>
                  <strong>{stats.upcomingAppointments}</strong> upcoming
                </span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                  isDark
                    ? "bg-slate-950/70 border-slate-800 text-slate-300"
                    : "bg-white/80 border-slate-200 text-slate-700 shadow-2xs"
                }`}
              >
                <Pill size={12} className="text-blue-500" />
                <span>
                  <strong>{stats.activePrescriptions}</strong> active Rx
                </span>
              </span>

              {stats.pendingLabs > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                    isDark
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <FlaskConical size={12} className="text-amber-500" />
                  <span>
                    <strong>{stats.pendingLabs}</strong> pending labs
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        {showActions && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/dashboard/patient/appointments/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white text-xs font-semibold transition cursor-pointer active:scale-[0.97]"
          >
            <Plus size={15} />
            <span>Book Appointment</span>
          </Link>

          <Link
            href="/dashboard/patient/card"
            title="View my health card"
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <CreditCard size={14} className="text-blue-500" />
            <span className="hidden sm:inline">Health Card</span>
          </Link>
        </div>
        )}
      </div>
    </motion.div>
  );
}
