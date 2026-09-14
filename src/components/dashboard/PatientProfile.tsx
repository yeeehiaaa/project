"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  VenusAndMars,
  ShieldCheck,
  Pencil,
  Loader2,
  AlertCircle,
  Save,
  X,
  CheckCircle2,
  Sparkles,
  HeartPulse,
  FileText,
  Clock,
  Activity,
} from "lucide-react";

interface Profile {
  id: string;
  authUserId: string;
  userType: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  wilaya?: string | null;
  postalCode?: string | null;
  preferredLanguage?: string | null;
  accountStatus?: string | null;
}

interface ProfileResponse {
  success: boolean;
  userType: string;
  profile: Profile;
  user: {
    id: string;
    email: string | null;
  };
}

export default function PatientProfile() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    wilaya: "",
    postalCode: "",
    gender: "",
    birthDate: "",
  });

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/auth/profile", {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json()) as ProfileResponse | { error?: string };

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login");
            return;
          }

          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Unable to load your profile."
          );
        }

        if (!("profile" in result) || !result.profile) {
          throw new Error("Profile information was not found.");
        }

        if (!mounted) return;

        const userProfile = result.profile;

        setProfile(userProfile);

        setForm({
          firstName: userProfile.firstName ?? "",
          lastName: userProfile.lastName ?? "",
          phone: userProfile.phone ?? "",
          address: userProfile.address ?? "",
          city: userProfile.city ?? "",
          wilaya: userProfile.wilaya ?? "",
          postalCode: userProfile.postalCode ?? "",
          gender: userProfile.gender ?? "",
          birthDate: userProfile.birthDate ? userProfile.birthDate.substring(0, 10) : "",
        });
      } catch (err) {
        console.error("PROFILE PAGE ERROR:", err);

        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load your profile.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  function handleChange(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.firstName.trim()) {
        setError("First name is required.");
        setSaving(false);
        return;
      }

      if (!form.lastName.trim()) {
        setError("Last name is required.");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          wilaya: form.wilaya.trim(),
          postalCode: form.postalCode.trim(),
          gender: form.gender || null,
          birthDate: form.birthDate || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update your profile.");
      }

      setProfile(result.profile);

      setSuccess("Your profile has been updated successfully.");

      setEditing(false);
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);

      setError(err instanceof Error ? err.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={38} className="animate-spin text-violet-600" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (!profile) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-red-600">
          <AlertCircle size={22} />
          <p className="text-sm font-medium">{error || "Unable to load your profile."}</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`;
  const accountStatus = profile.accountStatus || "ACTIVE";
  const isActive = accountStatus.toUpperCase() === "ACTIVE";

  return (
    <div className="space-y-8">
      {/* ============================================================
          HEADER
      ============================================================ */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-violet-600 flex items-center gap-2">
            <Sparkles size={16} />
            Account
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-500">Manage your personal information and account details.</p>
        </div>
        {!editing ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setError("");
              setSuccess("");
              setEditing(true);
            }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300"
          >
            <Pencil size={18} />
            Edit Profile
          </motion.button>
        ) : (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditing(false);
                setError("");
                setSuccess("");
              }}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={18} />
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        )}
      </div>

      {/* ============================================================
          MESSAGES
      ============================================================ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600"
          >
            <AlertCircle size={20} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-600"
          >
            <CheckCircle2 size={20} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          TWO COLUMN LAYOUT
      ============================================================ */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN – PROFILE SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-4"
        >
          <div className="sticky top-24 space-y-6">
            {/* Profile Card */}
            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-xl">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 text-5xl font-bold shadow-lg backdrop-blur ring-4 ring-white/30">
                  {initials}
                </div>
                <h2 className="mt-4 text-2xl font-bold">{fullName}</h2>
                <p className="text-sm text-violet-100">{profile.email}</p>

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
                    <p className="text-xs text-violet-200">Patient</p>
                    <p className="mt-1 text-lg font-bold">Active</p>
                  </div>
                  <div>
                    <p className="text-xs text-violet-200">Member Since</p>
                    <p className="mt-1 text-lg font-bold">
                      {profile.birthDate
                        ? new Date(profile.birthDate).getFullYear()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-violet-200">Gender</p>
                    <p className="mt-1 text-lg font-bold">
                      {profile.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <HeartPulse size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Health</p>
                    <p className="text-sm font-semibold text-slate-700">Good</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm border border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-emerald-600">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN – EDITABLE FIELDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-8"
        >
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="rounded-[30px] bg-white/80 p-7 shadow-sm backdrop-blur-sm border border-slate-200/70">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <User size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-500">Your basic personal details</p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <ProfileField
                  label="First Name"
                  icon={<User size={18} />}
                  value={form.firstName}
                  editing={editing}
                  onChange={(value) => handleChange("firstName", value)}
                />
                <ProfileField
                  label="Last Name"
                  icon={<User size={18} />}
                  value={form.lastName}
                  editing={editing}
                  onChange={(value) => handleChange("lastName", value)}
                />
                <ProfileField
                  label="Email"
                  icon={<Mail size={18} />}
                  value={profile.email}
                  editing={false}
                />
                <ProfileField
                  label="Phone"
                  icon={<Phone size={18} />}
                  value={form.phone}
                  editing={editing}
                  onChange={(value) => handleChange("phone", value)}
                />
                <ProfileField
                  label="Date of Birth"
                  icon={<CalendarDays size={18} />}
                  value={form.birthDate}
                  editing={editing}
                  type="date"
                  onChange={(value) => handleChange("birthDate", value)}
                />
                <ProfileField
                  label="Gender"
                  icon={<VenusAndMars size={18} />}
                  value={form.gender}
                  editing={editing}
                  type="select"
                  onChange={(value) => handleChange("gender", value)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="rounded-[30px] bg-white/80 p-7 shadow-sm backdrop-blur-sm border border-slate-200/70">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <MapPin size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Address</h2>
                  <p className="text-sm text-slate-500">Your current address</p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <ProfileField
                  label="Address"
                  icon={<MapPin size={18} />}
                  value={form.address}
                  editing={editing}
                  onChange={(value) => handleChange("address", value)}
                />
                <ProfileField
                  label="City"
                  icon={<MapPin size={18} />}
                  value={form.city}
                  editing={editing}
                  onChange={(value) => handleChange("city", value)}
                />
                <ProfileField
                  label="Wilaya"
                  icon={<MapPin size={18} />}
                  value={form.wilaya}
                  editing={editing}
                  onChange={(value) => handleChange("wilaya", value)}
                />
                <ProfileField
                  label="Postal Code"
                  icon={<MapPin size={18} />}
                  value={form.postalCode}
                  editing={editing}
                  onChange={(value) => handleChange("postalCode", value)}
                />
              </div>
            </div>

            {/* Account */}
            <div className="rounded-[30px] bg-white/80 p-7 shadow-sm backdrop-blur-sm border border-slate-200/70">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Account</h2>
                  <p className="text-sm text-slate-500">Account and security information</p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <ProfileField
                  label="Account Type"
                  icon={<User size={18} />}
                  value="Patient"
                  editing={false}
                />
                <ProfileField
                  label="Account Status"
                  icon={<ShieldCheck size={18} />}
                  value={accountStatus}
                  editing={false}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE FIELD
// ============================================================

interface ProfileFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  editing: boolean;
  type?: "text" | "date" | "select";
  onChange?: (value: string) => void;
}

function ProfileField({ label, icon, value, editing, type = "text", onChange }: ProfileFieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className="text-violet-500">{icon}</span>
        {label}
      </label>
      {editing && type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        >
          <option value="">Select gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      ) : editing ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />
      ) : (
        <div className="rounded-2xl bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-800 flex items-center justify-between">
          <span>{value || "Not provided"}</span>
          {value && (
            <span className="text-xs text-emerald-500 font-medium">Verified</span>
          )}
        </div>
      )}
    </div>
  );
}