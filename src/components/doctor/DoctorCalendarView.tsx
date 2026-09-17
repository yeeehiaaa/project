"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  User,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Plus,
  RotateCcw,
  Sparkles,
  FileText,
} from "lucide-react";
import type { Appointment } from "@/app/dashboard/doctor/page";

interface DoctorCalendarViewProps {
  appointments: Appointment[];
  isDark: boolean;
  selectedDate: string | null; // e.g. "2026-09-15" or null
  onSelectDate: (date: string | null) => void;
  onStartConsultation: (apt: Appointment) => void;
  onNewAppointment?: (date?: string) => void;
  onOpenPrescription?: (patientName: string) => void;
}

// Helper to construct "YYYY-MM-DD" purely from calendar coordinates without any UTC/timezone shifts
function toDateKey(year: number, monthIndex: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Helper to obtain today's local date in "YYYY-MM-DD"
function getLocalTodayKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

// Safely extract "YYYY-MM-DD" key from any appointment date representation
function extractAppointmentDateKey(appointmentDate: string | Date | null | undefined): string | null {
  if (!appointmentDate) return null;
  if (typeof appointmentDate === "string") {
    const match = appointmentDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  try {
    const d = new Date(appointmentDate);
    if (isNaN(d.getTime())) return null;
    return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
  } catch {
    return null;
  }
}

// Localized French date formatter at local noon to completely avoid midnight/DST shift bugs
function formatFrenchDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const localDate = new Date(y, m, d, 12, 0, 0);
    return localDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function DoctorCalendarView({
  appointments,
  isDark,
  selectedDate,
  onSelectDate,
  onStartConsultation,
  onNewAppointment,
  onOpenPrescription,
}: DoctorCalendarViewProps) {
  // Current view month/year in the calendar
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate) {
      const match = selectedDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1);
      }
    }
    return new Date();
  });

  // Sync calendar view month when selectedDate changes from outside
  useEffect(() => {
    if (selectedDate) {
      const match = selectedDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10) - 1;
        setViewDate((prev) => {
          if (prev.getFullYear() !== y || prev.getMonth() !== m) {
            return new Date(y, m, 1);
          }
          return prev;
        });
      }
    }
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayStr = getLocalTodayKey();
    onSelectDate(todayStr);
  };

  // Month name
  const monthName = viewDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const capitalizedMonthName =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Days in current month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week offset (Monday = 0, Sunday = 6)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday fix

  // Days in previous month for leading fillers
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Map appointments to date strings "YYYY-MM-DD"
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    try {
      const key = extractAppointmentDateKey(apt.appointmentDate);
      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(apt);
      }
    } catch {
      // ignore
    }
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Calendar cells calculation
  const calendarCells = [];
  const localTodayStr = getLocalTodayKey();

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = toDateKey(prevYear, prevMonth, d);
    calendarCells.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === localTodayStr,
      appointments: appointmentsByDate[dateStr] || [],
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = toDateKey(year, month, d);
    calendarCells.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === localTodayStr,
      appointments: appointmentsByDate[dateStr] || [],
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remainingCells = 7 - (calendarCells.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = toDateKey(nextYear, nextMonth, d);
      calendarCells.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === localTodayStr,
        appointments: appointmentsByDate[dateStr] || [],
      });
    }
  }

  // Filtered appointments for the selected date
  const appointmentsForSelectedDate = selectedDate
    ? appointmentsByDate[selectedDate] || []
    : [];

  const formattedSelectedDate = formatFrenchDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* Top Calendar Toolbar */}
      <div
        className={`p-5 rounded-3xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
          isDark
            ? "bg-slate-900/80 backdrop-blur-md border-slate-800/80 text-white"
            : "bg-white border-slate-200/90 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Agenda & Calendrier Interactif
              </h2>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                  isDark
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                Temps Réel
              </span>
            </div>
            <p
              className={`text-xs ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Cliquez sur une date pour afficher instantanément les consultations prévues.
            </p>
          </div>
        </div>

        {/* Month controls & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGoToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
          >
            Aujourd&apos;hui
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelectDate(null)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
              }`}
            >
              <RotateCcw size={13} />
              <span>Afficher tout le mois</span>
            </button>
          )}

          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Mois précédent"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs"
              }`}
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 text-xs font-bold min-w-[130px] text-center">
              {capitalizedMonthName}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Mois suivant"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNewAppointment?.(selectedDate || undefined)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Nouveau RDV</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Consultations on Left (lg:col-span-5), Calendar Month Grid on Right (lg:col-span-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DETAILS FOR SELECTED DATE (lg:col-span-5) - GAUCHE */}
        <div
          className={`lg:col-span-5 order-2 lg:order-1 p-5 rounded-3xl border shadow-md flex flex-col justify-between transition-colors ${
            isDark
              ? "bg-slate-900/80 backdrop-blur-md border-slate-800/80 text-white"
              : "bg-white border-slate-200/90 text-slate-900"
          }`}
        >
          <div>
            {/* Header of details panel */}
            <div
              className={`pb-4 border-b flex items-start justify-between gap-3 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  Consultations du jour
                </span>
                <h3 className="text-base sm:text-lg font-bold capitalize">
                  {formattedSelectedDate || "Sélectionnez une date"}
                </h3>
              </div>

              {selectedDate && (
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                    appointmentsForSelectedDate.length > 0
                      ? isDark
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : isDark
                      ? "bg-slate-800 text-slate-400 border-slate-700"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {appointmentsForSelectedDate.length} RDV
                </span>
              )}
            </div>

            {/* List of appointments for that date */}
            <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {!selectedDate ? (
                <div className="py-12 text-center space-y-2">
                  <CalendarIcon
                    size={36}
                    className={`mx-auto ${
                      isDark ? "text-slate-700" : "text-slate-300"
                    }`}
                  />
                  <p
                    className={`text-xs ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Cliquez sur une date dans la grille du calendrier pour afficher les rendez-vous associés.
                  </p>
                </div>
              ) : appointmentsForSelectedDate.length === 0 ? (
                <div
                  className={`py-12 px-4 text-center rounded-2xl border space-y-3 ${
                    isDark
                      ? "bg-slate-950/40 border-slate-800/80"
                      : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <User
                    size={32}
                    className={`mx-auto ${
                      isDark ? "text-slate-600" : "text-slate-300"
                    }`}
                  />
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Aucun rendez-vous planifié
                    </h4>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      Vous n&apos;avez aucune consultation enregistrée pour cette date.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNewAppointment?.(selectedDate || undefined)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Ajouter un RDV pour ce jour</span>
                  </button>
                </div>
              ) : (
                appointmentsForSelectedDate.map((apt) => {
                  const isUrgent = apt.aiTriageScore === "ÉLEVÉ";
                  const isVideo = apt.type === "ONLINE";
                  const isDone = apt.status === "COMPLETED";

                  return (
                    <div
                      key={apt.id}
                      className={`p-3.5 rounded-2xl border transition shadow-xs space-y-2.5 ${
                        isDark
                          ? isUrgent
                            ? "bg-rose-950/20 border-rose-500/40"
                            : isDone
                            ? "bg-slate-950/40 border-slate-800 opacity-70"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                          : isUrgent
                          ? "bg-rose-50/50 border-rose-200"
                          : isDone
                          ? "bg-slate-50 border-slate-200 opacity-80"
                          : "bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                              isDark
                                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}
                          >
                            {apt.time}
                          </div>

                          <div>
                            <h5
                              className={`text-xs sm:text-sm font-bold ${
                                isDark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {apt.patientName}
                            </h5>
                            <span
                              className={`text-[11px] ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {apt.patientAge} ans • {apt.patientGender}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1">
                          {isVideo && (
                            <span
                              className={`p-1 rounded-md border ${
                                isDark
                                  ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                                  : "bg-violet-100 text-violet-700 border-violet-200"
                              }`}
                              title="Téléconsultation"
                            >
                              <Video size={12} />
                            </span>
                          )}

                          {isUrgent && (
                            <span
                              className={`p-1 rounded-md border animate-pulse ${
                                isDark
                                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                  : "bg-rose-100 text-rose-700 border-rose-200"
                              }`}
                              title="Priorité Triage Élevée"
                            >
                              <AlertTriangle size={12} />
                            </span>
                          )}

                          {isDone && (
                            <span
                              className={`p-1 rounded-md border ${
                                isDark
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                              }`}
                              title="Consultation terminée"
                            >
                              <CheckCircle2 size={12} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <p
                        className={`text-xs ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        <strong
                          className={
                            isDark ? "text-slate-400" : "text-slate-700"
                          }
                        >
                          Motif :
                        </strong>{" "}
                        {apt.reason}
                      </p>

                      {/* Action trigger */}
                      <div className="pt-1 flex items-center justify-between">
                        <span
                          className={`text-[10px] flex items-center gap-1 ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          <Clock size={11} />
                          <span>
                            {apt.type === "ONLINE"
                              ? "Visio chiffrée"
                              : apt.type === "HOME_VISIT"
                              ? "À domicile"
                              : "En cabinet"}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onOpenPrescription && (
                            <button
                              type="button"
                              onClick={() => onOpenPrescription(apt.patientName)}
                              title="Rédiger une ordonnance"
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                                isDark
                                  ? "bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700"
                                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                              }`}
                            >
                              <FileText size={11} />
                              <span>Ordonnance</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onStartConsultation(apt)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              isDone
                                ? isDark
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                          >
                            <Stethoscope size={12} />
                            <span>{isDone ? "Détails" : "Consulter"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom helper info */}
          <div
            className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
              isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px]">
              <Sparkles size={13} className="text-indigo-500" />
              <span>Synchronisation sécurisée MediConnect</span>
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => onSelectDate(null)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* CALENDAR MONTH GRID (lg:col-span-7) - DROITE */}
        <div
          className={`lg:col-span-7 order-1 lg:order-2 p-5 rounded-3xl border shadow-md transition-colors ${
            isDark
              ? "bg-slate-900/80 backdrop-blur-md border-slate-800/80"
              : "bg-white border-slate-200/90"
          }`}
        >
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, idx) => (
              <div
                key={day}
                className={`py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  idx >= 5
                    ? "text-rose-500/80 dark:text-rose-400/80"
                    : isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              const hasAppointments = cell.appointments.length > 0;
              const isSelected = selectedDate === cell.dateString;
              const hasUrgent = cell.appointments.some(
                (a) => a.aiTriageScore === "ÉLEVÉ"
              );

              return (
                <button
                  key={`${cell.dateString}-${idx}`}
                  type="button"
                  onClick={() => onSelectDate(cell.dateString)}
                  className={`min-h-[58px] sm:min-h-[72px] p-1.5 rounded-2xl flex flex-col justify-between text-left transition-all duration-150 cursor-pointer relative border ${
                    isSelected
                      ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.02] z-10"
                      : cell.isToday
                      ? isDark
                        ? "border-indigo-500/50 bg-indigo-950/40 text-white"
                        : "border-indigo-300 bg-indigo-50/70 text-slate-900"
                      : !cell.isCurrentMonth
                      ? isDark
                        ? "border-transparent bg-slate-950/30 text-slate-600 hover:text-slate-400"
                        : "border-transparent bg-slate-100/40 text-slate-400 hover:text-slate-600"
                      : isDark
                      ? "border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/70 hover:border-slate-700 text-slate-200"
                      : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 text-slate-800 shadow-2xs"
                  }`}
                >
                  {/* Day number & Today pill */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? "text-white"
                          : cell.isToday
                          ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                          : ""
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}

                    {hasUrgent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white" : "bg-rose-500 animate-ping"
                        }`}
                        title="Alerte Triage IA"
                      />
                    )}
                  </div>

                  {/* Appointments indicator badges */}
                  {hasAppointments && (
                    <div className="mt-1 w-full flex items-center justify-between gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-tight truncate ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isDark
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold"
                        }`}
                      >
                        {cell.appointments.length} RDV
                      </span>

                      {/* Small dots for appointment types */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {cell.appointments.slice(0, 3).map((apt, i) => (
                          <span
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              isSelected
                                ? "bg-white"
                                : apt.type === "ONLINE"
                                ? "bg-violet-400"
                                : apt.aiTriageScore === "ÉLEVÉ"
                                ? "bg-rose-400"
                                : "bg-emerald-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div
            className={`mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2 text-[11px] ${
              isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
            }`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Sélectionné</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span>Téléconsultation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Prioritaire IA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>En cabinet</span>
              </div>
            </div>

            <span className="text-[10px] font-medium opacity-80">
              Total : {appointments.length} rendez-vous enregistrés
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
