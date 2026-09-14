"use client";

import { supabase } from "@/lib/supabase";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Stethoscope,
  User,
  FileText,
  Video,
  Home,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  Search,
  Star,
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
};

type AppointmentType =
  | "IN_PERSON"
  | "ONLINE"
  | "HOME_VISIT";

/* =====================================================
   TIME SLOTS
===================================================== */

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

/* =====================================================
   PAGE
===================================================== */

export default function NewAppointmentPage() {
  const router = useRouter();

  /* ===================================================
     STATES
  =================================================== */

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [showDoctorSearch, setShowDoctorSearch] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedDoctor, setSelectedDoctor] =
    useState<Doctor | null>(null);

  const [touched, setTouched] =
    useState<Record<string, boolean>>({});

  /* ===================================================
     FORM DATA
  =================================================== */

  const [formData, setFormData] = useState<{
    doctorId: string;
    date: string;
    time: string;
    type: AppointmentType;
    location: string;
    reason: string;
    notes: string;
  }>({
    doctorId: "",
    date: "",
    time: "",
    type: "IN_PERSON",
    location: "",
    reason: "",
    notes: "",
  });

  /* ===================================================
     TODAY
  =================================================== */

  const today = useMemo(() => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  /* ===================================================
     FETCH DOCTORS
  =================================================== */

  useEffect(() => {
  let mounted = true;

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setError("");

      /* =================================================
         GET AUTHENTICATED SESSION
      ================================================= */

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Unable to verify your authentication session."
        );
      }

      if (!session?.access_token) {
        throw new Error(
          "You are not authenticated. Please log in again."
        );
      }

      /* =================================================
         FETCH DOCTORS
      ================================================= */

      const response = await fetch(
        "/api/patient/doctors",
        {
          method: "GET",

          cache: "no-store",

          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const text = await response.text();

      let data: {
        success?: boolean;
        doctors?: Doctor[];
        error?: string;
      } = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load doctors."
        );
      }

      if (!mounted) {
        return;
      }

      setDoctors(
        Array.isArray(data.doctors)
          ? data.doctors
          : []
      );
    } catch (err) {
      console.error(
        "Error fetching doctors:",
        err
      );

      if (mounted) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load doctors."
        );
      }
    } finally {
      if (mounted) {
        setLoadingDoctors(false);
      }
    }
  };

  fetchDoctors();

  return () => {
    mounted = false;
  };
}, []);

  /* ===================================================
     HANDLE FORM CHANGE
  =================================================== */

  const handleChange = (
    field:
      | "doctorId"
      | "date"
      | "time"
      | "type"
      | "location"
      | "reason"
      | "notes",
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));

    setError("");
  };

  /* ===================================================
     SELECT DOCTOR
  =================================================== */

  const handleDoctorSelect = (
    doctor: Doctor
  ) => {
    if (!doctor.available) {
      return;
    }

    setSelectedDoctor(doctor);

    setFormData((previous) => ({
      ...previous,
      doctorId: doctor.id,
    }));

    setTouched((previous) => ({
      ...previous,
      doctorId: true,
    }));

    setShowDoctorSearch(false);
    setSearchQuery("");
    setError("");
  };

  /* ===================================================
     FILTER DOCTORS
  =================================================== */

  const filteredDoctors = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      return (
        doctor.name
          .toLowerCase()
          .includes(query) ||
        doctor.specialty
          .toLowerCase()
          .includes(query) ||
        doctor.location
          .toLowerCase()
          .includes(query)
      );
    });
  }, [doctors, searchQuery]);

  /* ===================================================
     VALIDATION
  =================================================== */

  const validateForm = () => {
    if (!formData.doctorId || !selectedDoctor) {
      setError(
        "Please select a doctor."
      );
      return false;
    }

    if (!formData.date) {
      setError(
        "Please select a date."
      );
      return false;
    }

    if (formData.date < today) {
      setError(
        "Please select today or a future date."
      );
      return false;
    }

    if (!formData.time) {
      setError(
        "Please select a time."
      );
      return false;
    }

    if (
      formData.type === "IN_PERSON" &&
      !formData.location.trim()
    ) {
      setError(
        "Please enter the appointment location."
      );
      return false;
    }

    if (
      formData.type === "HOME_VISIT" &&
      !formData.location.trim()
    ) {
      setError(
        "Please enter your home address."
      );
      return false;
    }

    return true;
  };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    setTouched({
      doctorId: true,
      date: true,
      time: true,
      location: true,
    });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      /* ===============================================
         GET CURRENT SESSION
      =============================================== */

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          "Unable to verify your authentication session."
        );
      }

      if (!session?.access_token) {
        throw new Error(
          "You are not authenticated. Please log in again."
        );
      }

      /* ===============================================
         SEND APPOINTMENT TO API
      =============================================== */

      const response = await fetch(
        "/api/patient/appointments",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            doctorId: formData.doctorId,

            date: formData.date,

            time: formData.time,

            type: formData.type,

            location:
              formData.location.trim() || null,

            reason:
              formData.reason.trim() || null,

            notes:
              formData.notes.trim() || null,
          }),
        }
      );

      const text = await response.text();

      let result: {
        success?: boolean;
        appointment?: unknown;
        error?: string;
        message?: string;
      } = {};

      try {
        result = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Failed to book appointment."
        );
      }

      /* ===============================================
         SUCCESS
      =============================================== */

      setSuccess(true);

      setTimeout(() => {
        router.push(
          "/dashboard/patient/appointments"
        );

        router.refresh();
      }, 1800);
    } catch (err) {
      console.error(
        "Booking appointment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to book appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================
     TYPE ICON
  =================================================== */

  const getTypeIcon = (
    type: AppointmentType
  ) => {
    switch (type) {
      case "IN_PERSON":
        return <MapPin size={18} />;

      case "ONLINE":
        return <Video size={18} />;

      case "HOME_VISIT":
        return <Home size={18} />;

      default:
        return <MapPin size={18} />;
    }
  };

  /* ===================================================
     TYPE LABEL
  =================================================== */

  const getTypeLabel = (
    type: AppointmentType
  ) => {
    switch (type) {
      case "IN_PERSON":
        return "In Person";

      case "ONLINE":
        return "Online";

      case "HOME_VISIT":
        return "Home Visit";

      default:
        return type;
    }
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
            <Sparkles size={16} />
            Book Appointment
          </div>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Book an Appointment
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Schedule a consultation with a healthcare professional.
          </p>
        </div>

        <Link
          href="/dashboard/patient/appointments"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition hover:bg-violet-50 hover:text-violet-600"
        >
          <ArrowLeft size={18} />
          Back to Appointments
        </Link>

      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success ? (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="rounded-3xl border border-emerald-200 bg-white/80 p-12 text-center shadow-lg backdrop-blur-sm"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle
              size={40}
              className="text-emerald-600"
            />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            Appointment Booked!
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-slate-500">
            Your appointment has been scheduled successfully.
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Redirecting to appointments...
          </p>

          <Loader2
            className="mx-auto mt-4 animate-spin text-violet-600"
            size={28}
          />
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div className="grid gap-6 lg:grid-cols-3">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="space-y-6 lg:col-span-2">

              {/* =================================================
                  DOCTOR
              ================================================= */}

              <div className="relative z-30 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Stethoscope size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Select Doctor
                    </h2>

                    <p className="text-sm text-slate-500">
                      Choose a healthcare professional.
                    </p>
                  </div>

                </div>

                <div className="relative">

                  <button
                    type="button"
                    onClick={() =>
                      setShowDoctorSearch(
                        (value) => !value
                      )
                    }
                    disabled={loadingDoctors}
                    className={`flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left transition ${
                      selectedDoctor
                        ? "border-violet-300 bg-violet-50/50"
                        : "border-slate-200 hover:border-violet-200"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >

                    {selectedDoctor ? (
                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
                          {selectedDoctor.avatar || "DR"}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {selectedDoctor.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {selectedDoctor.specialty}
                            {" • "}
                            {selectedDoctor.location}
                          </p>
                        </div>

                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-400">

                        <Search size={18} />

                        <span>
                          {loadingDoctors
                            ? "Loading doctors..."
                            : "Search for a doctor..."}
                        </span>

                      </div>
                    )}

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-slate-400 transition-transform ${
                        showDoctorSearch
                          ? "rotate-180"
                          : ""
                      }`}
                    />

                  </button>

                  {/* =================================================
                      DOCTOR DROPDOWN
                  ================================================= */}

                  {showDoctorSearch && !loadingDoctors && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                    >

                      <div className="relative mb-2">

                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          type="text"
                          placeholder="Search by name, specialty, or location..."
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                          autoFocus
                        />

                      </div>

                      <div className="space-y-1">

                        {filteredDoctors.length === 0 ? (
                          <div className="py-6 text-center">

                            <p className="text-sm font-medium text-slate-600">
                              {doctors.length === 0
                                ? "No doctors available."
                                : "No doctors found."}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Try another search.
                            </p>

                          </div>
                        ) : (
                          filteredDoctors.map(
                            (doctor) => (
                              <button
                                key={doctor.id}
                                type="button"
                                disabled={
                                  !doctor.available
                                }
                                onClick={() =>
                                  handleDoctorSelect(
                                    doctor
                                  )
                                }
                                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                                  doctor.available
                                    ? "hover:bg-violet-50"
                                    : "cursor-not-allowed opacity-50"
                                }`}
                              >

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
                                  {doctor.avatar || "DR"}
                                </div>

                                <div className="min-w-0 flex-1">

                                  <p className="font-medium text-slate-900">
                                    {doctor.name}
                                  </p>

                                  <p className="truncate text-sm text-slate-500">
                                    {doctor.specialty}
                                  </p>

                                  <p className="truncate text-xs text-slate-400">
                                    {doctor.location}
                                  </p>

                                </div>

                                <div className="shrink-0 text-right">

                                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">

                                    <Star
                                      size={14}
                                      fill="currentColor"
                                    />

                                    {Number.isFinite(
                                      doctor.rating
                                    )
                                      ? doctor.rating.toFixed(1)
                                      : "0.0"}

                                  </span>

                                  <p
                                    className={`text-xs ${
                                      doctor.available
                                        ? "text-emerald-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {doctor.available
                                      ? "Available"
                                      : "Not available"}
                                  </p>

                                </div>

                              </button>
                            )
                          )
                        )}

                      </div>

                    </motion.div>
                  )}

                </div>

                {touched.doctorId &&
                  !selectedDoctor && (
                    <p className="mt-2 text-sm text-red-500">
                      Please select a doctor.
                    </p>
                  )}

              </div>

              {/* =================================================
                  DATE + TIME
              ================================================= */}

              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Date & Time
                    </h2>

                    <p className="text-sm text-slate-500">
                      When would you like to be seen?
                    </p>
                  </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* DATE */}

                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Date
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="date"
                      min={today}
                      value={formData.date}
                      onChange={(event) =>
                        handleChange(
                          "date",
                          event.target.value
                        )
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition ${
                        touched.date &&
                        !formData.date
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      }`}
                    />

                    {touched.date &&
                      !formData.date && (
                        <p className="mt-1 text-sm text-red-500">
                          Please select a date.
                        </p>
                      )}

                  </div>

                  {/* TIME */}

                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Time
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      value={formData.time}
                      onChange={(event) =>
                        handleChange(
                          "time",
                          event.target.value
                        )
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition ${
                        touched.time &&
                        !formData.time
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      }`}
                    >

                      <option value="">
                        Select time
                      </option>

                      {timeSlots.map(
                        (slot) => (
                          <option
                            key={slot}
                            value={slot}
                          >
                            {slot}
                          </option>
                        )
                      )}

                    </select>

                    {touched.time &&
                      !formData.time && (
                        <p className="mt-1 text-sm text-red-500">
                          Please select a time.
                        </p>
                      )}

                  </div>

                </div>

              </div>

              {/* =================================================
                  APPOINTMENT TYPE
              ================================================= */}

              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Appointment Type
                    </h2>

                    <p className="text-sm text-slate-500">
                      Choose how you want to meet.
                    </p>
                  </div>

                </div>

                <div className="grid gap-3 sm:grid-cols-3">

                  {[
                    {
                      value:
                        "IN_PERSON" as AppointmentType,
                      label: "In Person",
                      description:
                        "Visit the doctor.",
                    },
                    {
                      value:
                        "ONLINE" as AppointmentType,
                      label: "Online",
                      description:
                        "Video consultation.",
                    },
                    {
                      value:
                        "HOME_VISIT" as AppointmentType,
                      label: "Home Visit",
                      description:
                        "Doctor visits you.",
                    },
                  ].map((type) => {

                    const isSelected =
                      formData.type ===
                      type.value;

                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          handleChange(
                            "type",
                            type.value
                          )
                        }
                        className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                          isSelected
                            ? "border-violet-600 bg-violet-50 text-violet-700 shadow-md"
                            : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/50"
                        }`}
                      >

                        {getTypeIcon(
                          type.value
                        )}

                        <span className="text-sm font-semibold">
                          {type.label}
                        </span>

                        <span className="text-xs text-slate-400">
                          {type.description}
                        </span>

                      </button>
                    );
                  })}

                </div>

              </div>

              {/* =================================================
                  DETAILS
              ================================================= */}

              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <FileText size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Additional Details
                    </h2>

                    <p className="text-sm text-slate-500">
                      Provide more information about your visit.
                    </p>
                  </div>

                </div>

                <div className="space-y-4">

                  {/* LOCATION */}

                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-slate-700">

                      {formData.type ===
                      "HOME_VISIT"
                        ? "Home Address"
                        : "Location"}

                      {(formData.type ===
                        "IN_PERSON" ||
                        formData.type ===
                          "HOME_VISIT") && (
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      )}

                    </label>

                    <input
                      type="text"
                      value={
                        formData.location
                      }
                      onChange={(event) =>
                        handleChange(
                          "location",
                          event.target.value
                        )
                      }
                      placeholder={
                        formData.type ===
                        "HOME_VISIT"
                          ? "Enter your home address"
                          : formData.type ===
                            "IN_PERSON"
                          ? "Clinic or hospital address"
                          : "Optional online meeting information"
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition ${
                        touched.location &&
                        (formData.type ===
                          "IN_PERSON" ||
                          formData.type ===
                            "HOME_VISIT") &&
                        !formData.location.trim()
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      }`}
                    />

                    {touched.location &&
                      (formData.type ===
                        "IN_PERSON" ||
                        formData.type ===
                          "HOME_VISIT") &&
                      !formData.location.trim() && (
                        <p className="mt-1 text-sm text-red-500">
                          {formData.type ===
                          "HOME_VISIT"
                            ? "Please enter your home address."
                            : "Please enter the appointment location."}
                        </p>
                      )}

                  </div>

                  {/* REASON */}

                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Reason for Visit
                    </label>

                    <input
                      type="text"
                      value={
                        formData.reason
                      }
                      onChange={(event) =>
                        handleChange(
                          "reason",
                          event.target.value
                        )
                      }
                      placeholder="Briefly describe why you're booking this appointment."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />

                  </div>

                  {/* NOTES */}

                  <div>

                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Notes
                    </label>

                    <textarea
                      value={
                        formData.notes
                      }
                      onChange={(event) =>
                        handleChange(
                          "notes",
                          event.target.value
                        )
                      }
                      placeholder="Any additional information for the doctor..."
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="space-y-6">

              {/* =================================================
                  PATIENT INFO
              ================================================= */}

              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-sm">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <User size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Your Information
                    </h2>

                    <p className="text-sm text-slate-500">
                      Your information is taken from your account.
                    </p>
                  </div>

                </div>

                <div className="rounded-2xl bg-violet-50 p-4">

                  <p className="text-xs font-medium uppercase tracking-wide text-violet-500">
                    Logged in patient
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    Your account information
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your appointment will automatically be linked to your authenticated patient account.
                  </p>

                </div>

              </div>

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-lg">

                <h3 className="font-semibold text-white/80">
                  Appointment Summary
                </h3>

                <div className="mt-4 space-y-3 text-sm">

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
                    <span className="text-violet-100">
                      Doctor
                    </span>

                    <span className="max-w-[170px] truncate text-right font-medium">
                      {selectedDoctor
                        ? selectedDoctor.name
                        : "Not selected"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">

                    <span className="text-violet-100">
                      Specialty
                    </span>

                    <span className="max-w-[170px] truncate text-right font-medium">
                      {selectedDoctor
                        ? selectedDoctor.specialty
                        : "Not selected"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">

                    <span className="text-violet-100">
                      Date
                    </span>

                    <span className="font-medium">
                      {formData.date
                        ? new Date(
                            `${formData.date}T00:00:00`
                          ).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Not set"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-2">

                    <span className="text-violet-100">
                      Time
                    </span>

                    <span className="font-medium">
                      {formData.time ||
                        "Not set"}
                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-violet-100">
                      Type
                    </span>

                    <span className="font-medium">
                      {getTypeLabel(
                        formData.type
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>
                    {error}
                  </span>

                </div>
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  loadingDoctors
                }
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >

                {loading ? (
                  <span className="flex items-center justify-center gap-3">

                    <Loader2
                      size={20}
                      className="animate-spin"
                    />

                    Booking...

                  </span>
                ) : (
                  "Book Appointment"
                )}

              </button>

            </div>

          </div>

        </form>
      )}

    </div>
  );
}