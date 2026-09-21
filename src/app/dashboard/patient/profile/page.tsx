"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  VenusAndMars,
  ShieldCheck,
  HeartPulse,
  AlertCircle,
  Loader2,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Sparkles,
  Activity,
  Clock,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";

// ======================================================
// TYPES
// ======================================================

interface Profile {
  id: string;
  authUserId: string;
  userType: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string | null;
  gender: "MALE" | "FEMALE" | null;
  birthDate: string | null;
  preferredLanguage: string | null;
  phone: string | null;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
  accountStatus: string;
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
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  wilaya: string;
  postalCode: string;
  preferredLanguage: string;
  gender: "" | "MALE" | "FEMALE";
  birthDate: string;
}

// ======================================================
// PAGE
// ======================================================

export default function PatientProfilePage() {
  const router = useRouter();
  const { isDark } = usePatientTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    wilaya: "",
    postalCode: "",
    preferredLanguage: "fr",
    gender: "",
    birthDate: "",
  });

  // ======================================================
  // LOAD PROFILE
  // ======================================================

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("SESSION ERROR:", sessionError);
        setError("Unable to retrieve your session.");
        return;
      }

      const session = sessionData.session;
      if (!session) {
        setError("You are not authenticated.");
        return;
      }

      const response = await fetch("/api/patient/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load your profile.");
      }

      if (!result.profile) {
        throw new Error("Profile data was not returned.");
      }

      const loadedProfile = result.profile as Profile;
      setProfile(loadedProfile);
      setPatient(result.patient ?? null);

      // Prepare form
      setFormData({
        firstName: loadedProfile.firstName || "",
        lastName: loadedProfile.lastName || "",
        phone: loadedProfile.phone || "",
        address: loadedProfile.address || "",
        city: loadedProfile.city || "",
        wilaya: loadedProfile.wilaya || "",
        postalCode: loadedProfile.postalCode || "",
        preferredLanguage: loadedProfile.preferredLanguage || "fr",
        gender: loadedProfile.gender || "",
        birthDate: loadedProfile.birthDate ? loadedProfile.birthDate.substring(0, 10) : "",
      });
    } catch (error) {
      console.error("PROFILE LOADING ERROR:", error);
      setError(error instanceof Error ? error.message : "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadProfile();
  }, []);

  // ======================================================
  // UPDATE FORM
  // ======================================================

  function updateField(field: keyof FormData, value: string) {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }

  // ======================================================
  // SAVE
  // ======================================================

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!formData.firstName.trim()) {
        setError("First name is required.");
        return;
      }

      if (!formData.lastName.trim()) {
        setError("Last name is required.");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setError("Your authentication session is invalid.");
        return;
      }

      const session = sessionData.session;

      const response = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          wilaya: formData.wilaya,
          postalCode: formData.postalCode,
          preferredLanguage: formData.preferredLanguage,
          gender: formData.gender || null,
          birthDate: formData.birthDate || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update your profile.");
      }

      if (result.profile) {
        setProfile(result.profile);
      }

      setEditing(false);
      setSuccess("Your profile has been updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);
      setError(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  // ======================================================
  // CANCEL EDIT
  // ======================================================

  function handleCancel() {
    if (!profile) return;

    setFormData({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || "",
      address: profile.address || "",
      city: profile.city || "",
      wilaya: profile.wilaya || "",
      postalCode: profile.postalCode || "",
      preferredLanguage: profile.preferredLanguage || "fr",
      gender: profile.gender || "",
      birthDate: profile.birthDate ? profile.birthDate.substring(0, 10) : "",
    });

    setEditing(false);
    setError("");
  }

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <main
        className={
          isDark
            ? "flex min-h-screen items-center justify-center bg-transparent p-6"
            : "flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6"
        }
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={38} className="animate-spin text-sky-600" />
          <p className={isDark ? "text-sm font-medium text-slate-400" : "text-sm font-medium text-slate-500"}>Loading your profile...</p>
        </div>
      </main>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (!profile) {
    return (
      <main
        className={
          isDark
            ? "flex min-h-screen items-center justify-center bg-transparent p-6"
            : "flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6"
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={
            isDark
              ? "w-full max-w-lg rounded-[32px] bg-slate-900/80 p-10 text-center shadow-xl border border-slate-800"
              : "w-full max-w-lg rounded-[32px] bg-white p-10 text-center shadow-xl"
          }
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle size={30} />
          </div>
          <h1 className={isDark ? "mt-6 text-2xl font-bold text-white" : "mt-6 text-2xl font-bold text-slate-900"}>Unable to load your profile</h1>
          <p className={isDark ? "mt-3 text-slate-400" : "mt-3 text-slate-500"}>{error || "Profile information is unavailable."}</p>
          <button
            onClick={loadProfile}
            className="mt-8 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 font-semibold text-white transition hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
          >
            Try Again
          </button>
        </motion.div>
      </main>
    );
  }

  // ======================================================
  // DISPLAY VALUES
  // ======================================================

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`;
  const birthDate = profile.birthDate
    ? new Date(profile.birthDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not provided";

  const accountStatus = profile.accountStatus || "ACTIVE";
  const isActive = accountStatus.toUpperCase() === "ACTIVE";

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <main
      className={
        isDark
          ? "min-h-screen bg-transparent p-6 lg:p-10"
          : "min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6 lg:p-10"
      }
    >
      <div className="mx-auto max-w-7xl">
        {/* Two-Column Layout with Sticky Left */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* LEFT COLUMN – Sticky */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  href="/dashboard/patient"
                  className={
                    isDark
                      ? "inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-sky-300 backdrop-blur-sm transition hover:bg-sky-500/15 hover:text-sky-200 border border-slate-800 cursor-pointer active:scale-[0.97]"
                      : "inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-sky-600 backdrop-blur-sm transition hover:bg-sky-50 hover:text-sky-700 border border-slate-200/70 cursor-pointer active:scale-[0.97]"
                  }
                >
                  <ArrowLeft size={18} />
                  Back to Dashboard
                </Link>
              </motion.div>

              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-sky-600 via-blue-600 to-blue-600 p-6 text-white shadow-xl"
              >
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 text-5xl font-bold shadow-lg backdrop-blur ring-4 ring-white/30">
                    {initials}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold">{fullName}</h2>
                  <p className="text-sm text-sky-100">{profile.email}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-500/30 text-emerald-100"
                          : "bg-amber-500/30 text-amber-100"
                      }`}
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isActive ? "bg-emerald-300" : "bg-amber-300"
                        } animate-pulse`}
                      />
                      {accountStatus}
                    </span>
                  </div>

                  <div className="mt-6 grid w-full grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <div>
                      <p className="text-xs text-sky-200">Patient</p>
                      <p className="mt-1 text-lg font-bold">Active</p>
                    </div>
                    <div>
                      <p className="text-xs text-sky-200">Member</p>
                      <p className="mt-1 text-lg font-bold">
                        {profile.birthDate ? new Date(profile.birthDate).getFullYear() : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-sky-200">Gender</p>
                      <p className="mt-1 text-lg font-bold">
                        {profile.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={
                    isDark
                      ? "rounded-2xl bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm border border-slate-800"
                      : "rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm border border-slate-200/70"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Status</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {profile.isVerified ? "Verified" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={
                    isDark
                      ? "rounded-2xl bg-slate-900/80 p-4 shadow-sm backdrop-blur-sm border border-slate-800"
                      : "rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm border border-slate-200/70"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Type</p>
                      <p className="text-sm font-semibold text-sky-600">Patient</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN – Scrollable */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  >
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                  >
                    <CheckCircle2 size={20} />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={
                  isDark
                    ? "rounded-[30px] bg-slate-900/80 p-8 shadow-sm backdrop-blur-sm border border-slate-800"
                    : "rounded-[30px] bg-white/80 p-8 shadow-sm backdrop-blur-sm border border-slate-200/70"
                }
              >
                {/* Header with Edit Button */}
                <div
                  className={
                    isDark
                      ? "flex flex-col justify-between gap-4 pb-6 border-b border-slate-800 md:flex-row md:items-center"
                      : "flex flex-col justify-between gap-4 pb-6 border-b border-slate-200/70 md:flex-row md:items-center"
                  }
                >
                  <div>
                    <h1 className={isDark ? "text-2xl font-bold text-white" : "text-2xl font-bold text-slate-900"}>Profile Details</h1>
                    <p className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Manage your personal information</p>
                  </div>
                  {!editing ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setEditing(true);
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 font-semibold text-white transition hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97]"
                    >
                      <Pencil size={18} />
                      Edit Profile
                    </motion.button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className={
                          isDark
                            ? "flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 font-semibold text-slate-200 transition hover:bg-slate-700 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                            : "flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                        }
                      >
                        <X size={18} />
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 font-semibold text-white transition hover:from-blue-600 hover:to-sky-400 cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? "Saving..." : "Save Changes"}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* PERSONAL INFORMATION */}
                <section className="mt-8">
                  <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Personal Information</h2>
                  <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your basic personal details</p>

                  {editing ? (
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <InputField
                        label="First Name"
                        value={formData.firstName}
                        onChange={(value) => updateField("firstName", value)}
                      />
                      <InputField
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(value) => updateField("lastName", value)}
                      />
                      <InputField
                        label="Phone"
                        value={formData.phone}
                        onChange={(value) => updateField("phone", value)}
                        type="tel"
                      />
                      <InputField
                        label="Date of Birth"
                        value={formData.birthDate}
                        onChange={(value) => updateField("birthDate", value)}
                        type="date"
                      />
                      <SelectField
                        label="Gender"
                        value={formData.gender}
                        onChange={(value) => updateField("gender", value)}
                        options={[
                          { value: "", label: "Select gender" },
                          { value: "MALE", label: "Male" },
                          { value: "FEMALE", label: "Female" },
                        ]}
                      />
                      <InputField
                        label="Preferred Language"
                        value={formData.preferredLanguage}
                        onChange={(value) => updateField("preferredLanguage", value)}
                      />
                      <div className="md:col-span-2">
                        <label className={isDark ? "mb-2 block text-sm font-semibold text-slate-200" : "mb-2 block text-sm font-semibold text-slate-700"}>Email</label>
                        <div
                          className={
                            isDark
                              ? "flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                              : "flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          }
                        >
                          <Mail size={19} className="text-slate-400" />
                          <span className={isDark ? "text-slate-400" : "text-slate-500"}>{profile.email}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Email cannot be changed from this page.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      <InfoCard icon={<User size={20} />} label="First Name" value={profile.firstName} />
                      <InfoCard icon={<User size={20} />} label="Last Name" value={profile.lastName} />
                      <InfoCard icon={<Mail size={20} />} label="Email" value={profile.email} />
                      <InfoCard icon={<Phone size={20} />} label="Phone" value={profile.phone || "Not provided"} />
                      <InfoCard icon={<CalendarDays size={20} />} label="Date of Birth" value={birthDate} />
                      <InfoCard
                        icon={<VenusAndMars size={20} />}
                        label="Gender"
                        value={profile.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : "Not provided"}
                      />
                    </div>
                  )}
                </section>

                {/* ADDRESS SECTION */}
                <section
                  className={
                    isDark
                      ? "mt-8 pt-8 border-t border-slate-800"
                      : "mt-8 pt-8 border-t border-slate-200/70"
                  }
                >
                  <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Address</h2>
                  <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your current address</p>

                  {editing ? (
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <InputField
                        label="Address"
                        value={formData.address}
                        onChange={(value) => updateField("address", value)}
                      />
                      <InputField
                        label="City"
                        value={formData.city}
                        onChange={(value) => updateField("city", value)}
                      />
                      <InputField
                        label="Wilaya"
                        value={formData.wilaya}
                        onChange={(value) => updateField("wilaya", value)}
                      />
                      <InputField
                        label="Postal Code"
                        value={formData.postalCode}
                        onChange={(value) => updateField("postalCode", value)}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      <InfoCard icon={<MapPin size={20} />} label="Address" value={profile.address || "Not provided"} />
                      <InfoCard icon={<MapPin size={20} />} label="City" value={profile.city || "Not provided"} />
                      <InfoCard icon={<MapPin size={20} />} label="Wilaya" value={profile.wilaya || "Not provided"} />
                      <InfoCard icon={<MapPin size={20} />} label="Postal Code" value={profile.postalCode || "Not provided"} />
                    </div>
                  )}
                </section>

                {/* HEALTH INFORMATION */}
                {patient && (
                  <section
                    className={
                      isDark
                        ? "mt-8 pt-8 border-t border-slate-800"
                        : "mt-8 pt-8 border-t border-slate-200/70"
                    }
                  >
                    <h2 className={isDark ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>Health Information</h2>
                    <p className={isDark ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>Your medical record details</p>

                    <div className="mt-4 grid gap-5 md:grid-cols-3">
                      <InfoCard
                        icon={<HeartPulse size={20} />}
                        label="Blood Type"
                        value={patient.bloodType || "Not provided"}
                      />
                      <InfoCard
                        icon={<AlertCircle size={20} />}
                        label="Allergies"
                        value={patient.allergies || "None provided"}
                      />
                      <InfoCard
                        icon={<Activity size={20} />}
                        label="Chronic Conditions"
                        value={patient.chronicConditions || "None provided"}
                      />
                    </div>
                  </section>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ======================================================
// INFO CARD
// ======================================================

function InfoCard({
  icon,
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  const { isDark } = usePatientTheme();
  const resolvedValueClass =
    valueClassName === "text-slate-900" ? (isDark ? "text-white" : "text-slate-900") : valueClassName;
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className={
        isDark
          ? "rounded-2xl bg-slate-950/60 p-5 transition hover:bg-sky-500/10 border border-slate-800"
          : "rounded-2xl bg-slate-50 p-5 transition hover:bg-sky-50"
      }
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">{icon}</div>
        <p className={isDark ? "text-sm font-medium text-slate-400" : "text-sm font-medium text-slate-500"}>{label}</p>
      </div>
      <p className={`mt-4 break-words text-base font-semibold ${resolvedValueClass}`}>{value}</p>
    </motion.div>
  );
}

// ======================================================
// INPUT FIELD
// ======================================================

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const { isDark } = usePatientTheme();
  return (
    <div>
      <label className={isDark ? "mb-2 block text-sm font-semibold text-slate-200" : "mb-2 block text-sm font-semibold text-slate-700"}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={
          isDark
            ? "w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20"
            : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        }
      />
    </div>
  );
}

// ======================================================
// SELECT FIELD
// ======================================================

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const { isDark } = usePatientTheme();
  return (
    <div>
      <label className={isDark ? "mb-2 block text-sm font-semibold text-slate-200" : "mb-2 block text-sm font-semibold text-slate-700"}>{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={
          isDark
            ? "w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20"
            : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}