"use client";

import { supabase } from "@/lib/supabase";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import {
  CalendarDays,
  Clock,
  Search,
  Filter,
  Plus,
  ChevronDown,
  MapPin,
  Video,
  Home,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { usePatientTheme } from "@/components/patient/PatientThemeContext";

/* =========================================================
   TYPES
========================================================= */

type Appointment = {
  id: string;

  doctorName: string;

  specialty: string;

  date: string;

  type:
    | "IN_PERSON"
    | "ONLINE"
    | "HOME_VISIT";

  status:
    | "PENDING"
    | "CONFIRMED"
    | "RESCHEDULED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";

  previousDate: string | null;

  location: string;

  avatar: string;

  notes: string;
};

type AppointmentStatus =
  | "UPCOMING"
  | "PAST"
  | "CANCELLED";

type AppointmentType =
  | "ALL"
  | "IN_PERSON"
  | "ONLINE"
  | "HOME_VISIT";

/* =========================================================
   COMPONENT
========================================================= */

export default function AppointmentsPage() {
  const { isDark } = usePatientTheme();

  /* =======================================================
     STATES
  ======================================================= */

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<AppointmentStatus>("UPCOMING");

  const [filterType, setFilterType] =
    useState<AppointmentType>("ALL");

  const [showFilters, setShowFilters] =
    useState(false);

  const [selectedAppointment, setSelectedAppointment] =
    useState<string | null>(null);

  /* =======================================================
     FETCH APPOINTMENTS
  ======================================================= */

  const fetchAppointments = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "You are not authenticated."
      );
    }

    const response = await fetch(
      "/api/patient/appointments",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
        },

        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to fetch appointments."
      );
    }

    setAppointments(
      Array.isArray(data.appointments)
        ? data.appointments
        : []
    );
  } catch (err) {
    console.error(
      "Error fetching appointments:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Failed to load appointments."
    );
  } finally {
    setLoading(false);
  }
}, []);

  /* =======================================================
     NEGOTIATION ACTIONS (patient decisions)
  ======================================================= */

  const [actingId, setActingId] = useState<string | null>(null);
  const [proposeFor, setProposeFor] = useState<string | null>(null);
  const [proposeDate, setProposeDate] = useState("");
  const [actionError, setActionError] = useState("");

  const patchAppointment = async (id: string, body: Record<string, unknown>) => {
    setActingId(id);
    setActionError("");
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("You are not authenticated.");
      }
      const res = await fetch("/api/patient/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({ appointmentId: id, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed.");
      const upd = data.appointment;
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: upd.status, date: upd.date, previousDate: upd.previousDate ?? a.previousDate }
            : a
        )
      );
      setProposeFor(null);
      setProposeDate("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActingId(null);
    }
  };

  const fmtSlot = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  /* =======================================================
     LOAD APPOINTMENTS
  ======================================================= */

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const filteredAppointments =
    useMemo(() => {
      let filtered = [
        ...appointments,
      ];

      /*
       * SEARCH
       */

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (query) {
        filtered =
          filtered.filter(
            (appointment) => {
              return (
                appointment.doctorName
                  ?.toLowerCase()
                  .includes(query) ||
                appointment.specialty
                  ?.toLowerCase()
                  .includes(query) ||
                appointment.location
                  ?.toLowerCase()
                  .includes(query)
              );
            }
          );
      }

      /*
       * STATUS
       */

      if (
        activeTab ===
        "UPCOMING"
      ) {
        filtered =
          filtered.filter(
            (appointment) =>
              appointment.status ===
                "PENDING" ||
              appointment.status ===
                "CONFIRMED" ||
              appointment.status ===
                "RESCHEDULED"
          );
      }

      if (
        activeTab ===
        "PAST"
      ) {
        filtered =
          filtered.filter(
            (appointment) =>
              appointment.status ===
                "COMPLETED" ||
              appointment.status ===
                "NO_SHOW"
          );
      }

      if (
        activeTab ===
        "CANCELLED"
      ) {
        filtered =
          filtered.filter(
            (appointment) =>
              appointment.status ===
              "CANCELLED"
          );
      }

      /*
       * TYPE
       */

      if (
        filterType !==
        "ALL"
      ) {
        filtered =
          filtered.filter(
            (appointment) =>
              appointment.type ===
              filterType
          );
      }

      /*
       * SORT
       *
       * Upcoming:
       * earliest first
       *
       * Past/cancelled:
       * newest first
       */

      filtered.sort(
        (a, b) => {
          const dateA =
            new Date(
              a.date
            ).getTime();

          const dateB =
            new Date(
              b.date
            ).getTime();

          if (
            activeTab ===
            "UPCOMING"
          ) {
            return (
              dateA - dateB
            );
          }

          return (
            dateB - dateA
          );
        }
      );

      return filtered;
    },
    [
      appointments,
      searchQuery,
      activeTab,
      filterType,
    ]
  );

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    return {
      total:
        appointments.length,

      upcoming:
        appointments.filter(
          (appointment) =>
            appointment.status ===
              "CONFIRMED" ||
            appointment.status ===
              "PENDING" ||
            appointment.status ===
              "RESCHEDULED"
        ).length,

      completed:
        appointments.filter(
          (appointment) =>
            appointment.status ===
            "COMPLETED"
        ).length,

      cancelled:
        appointments.filter(
          (appointment) =>
            appointment.status ===
            "CANCELLED"
        ).length,
    };
  }, [appointments]);

  /* =======================================================
     HELPERS
  ======================================================= */

  const getStatusColor = (
    status: Appointment["status"]
  ) => {
    const colors: Record<
      Appointment["status"],
      string
    > = {
      CONFIRMED:
        "bg-emerald-50 text-emerald-700 border-emerald-200",

      PENDING:
        "bg-amber-50 text-amber-700 border-amber-200",

      RESCHEDULED:
        "bg-violet-50 text-violet-700 border-violet-200",

      COMPLETED:
        "bg-blue-50 text-blue-700 border-blue-200",

      CANCELLED:
        "bg-rose-50 text-rose-700 border-rose-200",

      NO_SHOW:
        "bg-slate-50 text-slate-700 border-slate-200",
    };

    return (
      colors[status] ??
      "bg-slate-50 text-slate-700 border-slate-200"
    );
  };

  const statusLabel = (status: Appointment["status"]): string => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "CONFIRMED":
        return "Confirmed";
      case "RESCHEDULED":
        return "New slot proposed";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "NO_SHOW":
        return "No show";
      default:
        return status;
    }
  };

  const getStatusIcon = (
    status: Appointment["status"]
  ) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <CheckCircle size={14} />
        );

      case "COMPLETED":
        return (
          <CheckCircle size={14} />
        );

      case "CANCELLED":
        return (
          <XCircle size={14} />
        );

      case "PENDING":
        return (
          <Clock size={14} />
        );

      case "RESCHEDULED":
        return (
          <CalendarDays size={14} />
        );

      case "NO_SHOW":
        return (
          <AlertCircle size={14} />
        );

      default:
        return (
          <Clock size={14} />
        );
    }
  };

  const getTypeIcon = (
    type: Appointment["type"]
  ) => {
    switch (type) {
      case "IN_PERSON":
        return (
          <MapPin size={16} />
        );

      case "ONLINE":
        return (
          <Video size={16} />
        );

      case "HOME_VISIT":
        return (
          <Home size={16} />
        );

      default:
        return (
          <MapPin size={16} />
        );
    }
  };

  const getTypeLabel = (
    type: string
  ) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const formatDate = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleDateString(
      "en-GB",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleTimeString(
      "en-GB",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const isToday = (
    dateString: string
  ) => {
    const today =
      new Date();

    const date =
      new Date(dateString);

    return (
      date.getFullYear() ===
        today.getFullYear() &&
      date.getMonth() ===
        today.getMonth() &&
      date.getDate() ===
        today.getDate()
    );
  };

  const isTomorrow = (
    dateString: string
  ) => {
    const tomorrow =
      new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const date =
      new Date(dateString);

    return (
      date.getFullYear() ===
        tomorrow.getFullYear() &&
      date.getMonth() ===
        tomorrow.getMonth() &&
      date.getDate() ===
        tomorrow.getDate()
    );
  };

  const getDateLabel = (
    dateString: string
  ) => {
    if (
      isToday(dateString)
    ) {
      return "Today";
    }

    if (
      isTomorrow(dateString)
    ) {
      return "Tomorrow";
    }

    return formatDate(
      dateString
    );
  };

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("ALL");
    setActiveTab("UPCOMING");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className={`p-6 rounded-3xl border shadow-md transition-colors ${
          isDark ? "bg-slate-900/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isDark ? "bg-sky-500/15 border-sky-500/30 text-sky-300" : "bg-sky-50 border-sky-200 text-sky-600"}`}>
              <CalendarDays size={24} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">My Appointments</h1>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Book, track and negotiate your visits.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/patient/appointments"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
          >
            <Plus size={20} />
            Book Appointment
          </Link>
        </div>

      </div>
      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* TOTAL */}

        <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm" : "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm"}>
          <div className="flex items-center justify-between">

            <div>
              <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                Total
              </p>

              <p className={isDark ? "mt-1 text-2xl font-bold text-white" : "mt-1 text-2xl font-bold text-slate-900"}>
                {stats.total}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <CalendarDays size={22} />
            </div>

          </div>
        </div>

        {/* UPCOMING */}

        <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm" : "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm"}>
          <div className="flex items-center justify-between">

            <div>
              <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                Upcoming
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {stats.upcoming}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar size={22} />
            </div>

          </div>
        </div>

        {/* COMPLETED */}

        <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm" : "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm"}>
          <div className="flex items-center justify-between">

            <div>
              <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-600">
                {stats.completed}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle size={22} />
            </div>

          </div>
        </div>

        {/* CANCELLED */}

        <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm" : "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm"}>
          <div className="flex items-center justify-between">

            <div>
              <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                Cancelled
              </p>

              <p className="mt-1 text-2xl font-bold text-rose-600">
                {stats.cancelled}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle size={22} />
            </div>

          </div>
        </div>

      </div>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="relative max-w-md flex-1">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search by doctor, specialty, or location..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            className={isDark ? "w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-sm transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" : "w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none backdrop-blur-sm transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"}
          />

        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                (value) => !value
              )
            }
            className={isDark ? "flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-sm transition hover:bg-slate-800 hover:text-sky-300 cursor-pointer active:scale-[0.97]" : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition hover:bg-sky-50 hover:text-sky-600 cursor-pointer active:scale-[0.97]"}
          >
            <Filter size={16} />

            Filters

            <ChevronDown
              size={16}
              className={`transition-transform ${
                showFilters
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {filterType !==
            "ALL" && (
            <span className={isDark ? "rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300" : "rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"}>
              {getTypeLabel(
                filterType
              )}
            </span>
          )}

        </div>

      </div>

      {/* =================================================
          FILTER PANEL
      ================================================= */}

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="overflow-hidden"
          >
            <div className={isDark ? "rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm" : "rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm"}>

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div>
                  <p className={isDark ? "text-sm font-semibold text-slate-200" : "text-sm font-semibold text-slate-700"}>
                    Filter by Type
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Choose an appointment type.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="text-xs font-medium text-sky-600 hover:text-sky-700 transition cursor-pointer active:scale-[0.97]"
                >
                  Clear filters
                </button>

              </div>

              <div className="mt-4 flex flex-wrap gap-2">

                {[
                  "ALL",
                  "IN_PERSON",
                  "ONLINE",
                  "HOME_VISIT",
                ].map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFilterType(
                          type as AppointmentType
                        )
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer active:scale-[0.97] ${
                        filterType ===
                        type
                          ? "bg-sky-600 text-white hover:bg-sky-500"
                          : isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-sky-500/15 hover:text-sky-300"
                      : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                      }`}
                    >
                      {type ===
                      "ALL"
                        ? "All Types"
                        : getTypeLabel(
                            type
                          )}
                    </button>
                  )
                )}

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          TABS
      ================================================= */}

      <div className={isDark ? "flex gap-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-1 shadow-sm backdrop-blur-sm" : "flex gap-1 rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-sm backdrop-blur-sm"}>

        {[
          {
            key: "UPCOMING",
            label: "Upcoming",
            icon: Calendar,
            count:
              stats.upcoming,
          },

          {
            key: "PAST",
            label: "Past",
            icon: CheckCircle,
            count:
              stats.completed,
          },

          {
            key: "CANCELLED",
            label: "Cancelled",
            icon: XCircle,
            count:
              stats.cancelled,
          },
        ].map(
          (tab) => {
            const Icon =
              tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.key as AppointmentStatus
                  )
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer active:scale-[0.97] ${
                  activeTab ===
                  tab.key
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-blue-600 hover:to-sky-400"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-sky-50"
                }`}
              >
                <Icon size={16} />

                {tab.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab ===
                    tab.key
                      ? "bg-white/20 text-white"
                      : isDark
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          }
        )}

      </div>

      {/* =================================================
          APPOINTMENTS
      ================================================= */}

      <div className="space-y-4">

        {/* LOADING */}

        {loading && (
          <div className={isDark ? "flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/80 p-16 backdrop-blur-sm" : "flex flex-col items-center justify-center rounded-3xl border border-slate-200/70 bg-white/80 p-16 backdrop-blur-sm"}>

            <Loader2
              size={36}
              className="animate-spin text-sky-600"
            />

            <p className={isDark ? "mt-4 text-sm text-slate-400" : "mt-4 text-sm text-slate-500"}>
              Loading your appointments...
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-white/80 p-12 text-center backdrop-blur-sm">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle
                  size={32}
                  className="text-red-500"
                />
              </div>

              <h3 className={isDark ? "mt-4 text-lg font-semibold text-white" : "mt-4 text-lg font-semibold text-slate-900"}>
                Failed to load appointments
              </h3>

              <p className={isDark ? "mt-2 max-w-md text-sm text-slate-400" : "mt-2 max-w-md text-sm text-slate-500"}>
                {error}
              </p>

              <button
                type="button"
                onClick={
                  fetchAppointments
                }
                className={isDark ? "mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500/15 px-5 py-2.5 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25 cursor-pointer active:scale-[0.97]" : "mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-50 px-5 py-2.5 text-sm font-medium text-sky-600 transition hover:bg-sky-100 cursor-pointer active:scale-[0.97]"}
              >
                <RefreshCw
                  size={16}
                />
                Retry
              </button>

            </div>
          )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredAppointments.length ===
            0 && (
            <div className={isDark ? "rounded-3xl border border-slate-800 bg-slate-900/80 p-16 text-center backdrop-blur-sm" : "rounded-3xl border border-slate-200/70 bg-white/80 p-16 text-center backdrop-blur-sm"}>

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                <CalendarDays
                  size={40}
                />
              </div>

              <h3 className={isDark ? "mt-4 text-xl font-semibold text-white" : "mt-4 text-xl font-semibold text-slate-900"}>
                No appointments found
              </h3>

              <p className={isDark ? "mt-2 text-sm text-slate-400" : "mt-2 text-sm text-slate-500"}>
                {searchQuery ||
                filterType !==
                  "ALL"
                  ? "Try adjusting your search or filters."
                  : activeTab ===
                    "UPCOMING"
                  ? "You don't have any upcoming appointments."
                  : activeTab ===
                    "PAST"
                  ? "You don't have any past appointments."
                  : "You don't have any cancelled appointments."}
              </p>

              {(searchQuery ||
                filterType !==
                  "ALL") && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className={isDark ? "mt-4 rounded-xl bg-sky-500/15 px-5 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25 cursor-pointer active:scale-[0.97]" : "mt-4 rounded-xl bg-sky-50 px-5 py-2 text-sm font-medium text-sky-600 transition hover:bg-sky-100 cursor-pointer active:scale-[0.97]"}
                >
                  Clear filters
                </button>
              )}

              {!searchQuery &&
                filterType ===
                  "ALL" &&
                activeTab ===
                  "UPCOMING" && (
                  <Link
                    href="/dashboard/patient/appointments"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 cursor-pointer active:scale-[0.97]"
                  >
                    <Plus
                      size={17}
                    />
                    Book an Appointment
                  </Link>
                )}

            </div>
          )}

        {/* LIST */}

        {!loading &&
          !error &&
          filteredAppointments.length >
            0 &&
          filteredAppointments.map(
            (
              appointment,
              index
            ) => {
              const isSelected =
                selectedAppointment ===
                appointment.id;

              return (
                <motion.div
                  key={
                    appointment.id
                  }
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.04,
                  }}
                  className={
                    isDark
                      ? `group rounded-3xl border bg-slate-900/80 backdrop-blur-sm transition-all hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-sky-500/50 shadow-lg shadow-sky-950/50"
                            : "border-slate-800 shadow-sm hover:border-sky-500/40 hover:shadow-xl"
                        }`
                      : `group rounded-3xl border bg-white/80 backdrop-blur-sm transition-all hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-sky-300 shadow-lg shadow-sky-100/50"
                            : "border-slate-200/70 shadow-sm hover:border-sky-200 hover:shadow-xl"
                        }`
                  }
                >

                  <div className="p-5">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      {/* DOCTOR */}

                      <div className="flex min-w-0 items-start gap-4">

                        {/* DATE BADGE */}
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-md">
                          <span className="text-xl font-black leading-none">
                            {new Date(appointment.date).getDate()}
                          </span>
                          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-90">
                            {new Date(appointment.date).toLocaleDateString(
                              "en-GB",
                              { month: "short" }
                            )}
                          </span>
                        </div>

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-lg font-bold text-white shadow-md">
                          {appointment.avatar ||
                            "DR"}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>
                              {appointment.doctorName}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusIcon(
                                appointment.status
                              )}

                              {statusLabel(
                                appointment.status
                              )}
                            </span>

                            <span className={isDark ? "rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300" : "rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-600"}>
                              {getDateLabel(
                                appointment.date
                              )}
                            </span>

                          </div>

                          <p className="text-sm font-medium text-sky-600">
                            {appointment.specialty}
                          </p>

                          <div className={isDark ? "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400" : "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500"}>

                            <span className="flex items-center gap-1.5">
                              <Calendar
                                size={14}
                                className="text-slate-400"
                              />

                              {formatDate(
                                appointment.date
                              )}
                            </span>

                            <span className="flex items-center gap-1.5">
                              <Clock
                                size={14}
                                className="text-slate-400"
                              />

                              {formatTime(
                                appointment.date
                              )}
                            </span>

                            <span className="flex items-center gap-1.5">
                              {getTypeIcon(
                                appointment.type
                              )}

                              {getTypeLabel(
                                appointment.type
                              )}
                            </span>

                            {appointment.location && (
                              <span className="flex max-w-[220px] items-center gap-1.5 truncate">
                                <MapPin
                                  size={14}
                                  className="shrink-0 text-slate-400"
                                />

                                {appointment.location}
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 items-center gap-2 self-start md:self-center">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAppointment(
                              isSelected
                                ? null
                                : appointment.id
                            )
                          }
                          className={isDark ? "flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-sky-300 transition hover:bg-sky-500/15 cursor-pointer active:scale-[0.97]" : "flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-sky-600 transition hover:bg-sky-50 cursor-pointer active:scale-[0.97]"}
                        >
                          Details

                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              isSelected
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        {appointment.type === "ONLINE" &&
                          (appointment.status === "CONFIRMED" ||
                            appointment.status === "RESCHEDULED") && (
                            <Link
                              href={`/call/${appointment.id}`}
                              className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
                            >
                              📹 Join
                            </Link>
                          )}

                      </div>

                    </div>

                    {/* EXPANDED */}

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                          }}
                          transition={{
                            duration: 0.25,
                          }}
                          className={isDark ? "mt-4 overflow-hidden border-t border-slate-800 pt-4" : "mt-4 overflow-hidden border-t border-slate-200/70 pt-4"}
                        >

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            <div>
                              <p className="text-xs font-medium text-slate-400">
                                Notes
                              </p>

                              <p className={isDark ? "mt-1 text-sm text-slate-200" : "mt-1 text-sm text-slate-700"}>
                                {appointment.notes ||
                                  "No additional notes."}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-400">
                                Type
                              </p>

                              <p className={isDark ? "mt-1 text-sm font-medium text-slate-200" : "mt-1 text-sm font-medium text-slate-700"}>
                                {getTypeLabel(
                                  appointment.type
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-400">
                                Location
                              </p>

                              <p className={isDark ? "mt-1 text-sm text-slate-200" : "mt-1 text-sm text-slate-700"}>
                                {appointment.location ||
                                  "Not specified."}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">

                              {/* Doctor counter-proposal : accept or refuse */}
                              {appointment.status === "RESCHEDULED" && (
                                <div className={`w-full rounded-2xl border p-3.5 ${isDark ? "bg-violet-500/10 border-violet-500/30" : "bg-violet-50 border-violet-200"}`}>
                                  <p className={`text-xs font-bold ${isDark ? "text-violet-300" : "text-violet-700"}`}>
                                    The doctor proposes a new slot
                                  </p>
                                  <p className={`mt-1 text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                                    {appointment.previousDate && (
                                      <span className="line-through opacity-60 mr-2">
                                        {fmtSlot(appointment.previousDate)}
                                      </span>
                                    )}
                                    <span className="font-bold">→ {fmtSlot(appointment.date)}</span>
                                  </p>
                                  {actionError && (
                                    <p className="mt-1 text-[11px] font-semibold text-rose-500">{actionError}</p>
                                  )}
                                  <div className="mt-2.5 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={actingId === appointment.id}
                                      onClick={() => patchAppointment(appointment.id, { action: "accept" })}
                                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 cursor-pointer active:scale-[0.97] disabled:opacity-50"
                                    >
                                      {actingId === appointment.id ? "…" : "Accept new slot"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={actingId === appointment.id}
                                      onClick={() => patchAppointment(appointment.id, { action: "refuse" })}
                                      className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 border border-rose-200 transition hover:bg-rose-100 cursor-pointer active:scale-[0.97] disabled:opacity-50"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              )}

                              {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                                <>
                                  <button
                                    type="button"
                                    disabled={actingId === appointment.id}
                                    onClick={() => {
                                      if (confirm("Cancel this appointment?")) {
                                        patchAppointment(appointment.id, { action: "cancel" });
                                      }
                                    }}
                                    className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 cursor-pointer active:scale-[0.97] disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProposeFor(proposeFor === appointment.id ? null : appointment.id);
                                      setProposeDate("");
                                      setActionError("");
                                    }}
                                    className={isDark ? "rounded-xl bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25 cursor-pointer active:scale-[0.97]" : "rounded-xl bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 transition hover:bg-sky-100 cursor-pointer active:scale-[0.97]"}
                                  >
                                    Propose another slot
                                  </button>
                                </>
                              )}

                              {proposeFor === appointment.id && (
                                <div className={`w-full rounded-2xl border p-3.5 flex flex-col sm:flex-row gap-2 sm:items-center ${isDark ? "bg-slate-900 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                                  <input
                                    type="datetime-local"
                                    value={proposeDate}
                                    min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                                    onChange={(e) => setProposeDate(e.target.value)}
                                    className={isDark ? "flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-sky-500" : "flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:border-sky-500"}
                                  />
                                  <button
                                    type="button"
                                    disabled={!proposeDate || actingId === appointment.id}
                                    onClick={() =>
                                      patchAppointment(appointment.id, {
                                        action: "propose",
                                        appointmentDate: new Date(proposeDate).toISOString(),
                                      })
                                    }
                                    className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500 cursor-pointer active:scale-[0.97] disabled:opacity-50"
                                  >
                                    {actingId === appointment.id ? "Sending…" : "Send to doctor"}
                                  </button>
                                </div>
                              )}

                              {actionError && appointment.status !== "RESCHEDULED" && (
                                <p className="w-full text-[11px] font-semibold text-rose-500">{actionError}</p>
                              )}

                            </div>

                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                </motion.div>
              );
            }
          )}

      </div>
    </div>
  );
}