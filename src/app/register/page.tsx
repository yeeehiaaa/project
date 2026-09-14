"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Sparkles,
  Stethoscope,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type Role = "patient" | "doctor" | "pharmacy" | "laboratory";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    role: "patient" as Role,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    gender: "" as "MALE" | "FEMALE" | "OTHER" | "",
    phone: "",
    address: "",
    city: "",
    wilaya: "",
    guardianFirstName: "",
    guardianLastName: "",
    guardianEmail: "",
    guardianPhone: "",
    guardianRelation: "",
  });

  const [isMinor, setIsMinor] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Check if user is a minor when birth date changes
  useEffect(() => {
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      setIsMinor(calculatedAge < 18);
    } else {
      setAge(null);
      setIsMinor(false);
    }
  }, [formData.birthDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2) return "First name must be at least 2 characters";
        return null;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2) return "Last name must be at least 2 characters";
        return null;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        return null;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(value)) return "Password must contain at least one number";
        return null;
      case "confirmPassword":
        if (value !== formData.password) return "Passwords do not match";
        return null;
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (value.trim().length < 8) return "Please enter a valid phone number";
        return null;
      case "birthDate":
        if (!value) return "Birth date is required";
        if (isNaN(new Date(value).getTime())) return "Invalid date format";
        return null;
      case "gender":
        if (!value) return "Gender is required";
        return null;
      default:
        return null;
    }
  };

  const getFieldError = (name: string): string | null => {
    if (!touched[name]) return null;
    const value = formData[name as keyof typeof formData] as string;
    return validateField(name, value);
  };

  const isFieldValid = (name: string): boolean => {
    if (!touched[name]) return true;
    const value = formData[name as keyof typeof formData] as string;
    return !validateField(name, value);
  };

  const getGuardianError = (field: string): string | null => {
    if (!isMinor || !touched[`guardian${field}`]) return null;
    const value = formData[`guardian${field}` as keyof typeof formData] as string;
    if (!value.trim()) return `${field} is required for minors`;
    return null;
  };

  const isGuardianValid = (field: string): boolean => {
    if (!isMinor || !touched[`guardian${field}`]) return true;
    const value = formData[`guardian${field}` as keyof typeof formData] as string;
    return !!value.trim();
  };

  const validateForm = (): boolean => {
    const required = ["firstName", "lastName", "email", "password", "confirmPassword", "phone", "birthDate", "gender"];
    for (const field of required) {
      const value = formData[field as keyof typeof formData] as string;
      if (validateField(field, value)) {
        setTouched((prev) => ({ ...prev, [field]: true }));
        return false;
      }
    }
    if (isMinor) {
      const guardianFields = ["firstName", "lastName", "Email", "Phone", "Relation"];
      for (const field of guardianFields) {
        const value = formData[`guardian${field}` as keyof typeof formData] as string;
        if (!value.trim()) {
          setTouched((prev) => ({ ...prev, [`guardian${field}`]: true }));
          return false;
        }
      }
    }
    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {

// Log the full error for debugging
      console.error("Supabase signUp error:", authError);
      console.error("Error message:", authError.message);
      console.error("Error status:", authError.status);

        if (authError.message && authError.message.toLowerCase().includes("already registered")) {
          throw new Error("This email is already registered. Please sign in instead.");
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account.");
      }

      // 2. Create profile via API - FIXED: using /api/register
      const profileData = {
        authUserId: authData.user.id,
        role: formData.role,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        wilaya: formData.wilaya.trim() || null,
        guardian: isMinor
          ? {
              firstName: formData.guardianFirstName.trim(),
              lastName: formData.guardianLastName.trim(),
              email: formData.guardianEmail.trim(),
              phone: formData.guardianPhone.trim(),
              relation: formData.guardianRelation.trim(),
            }
          : null,
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("API returned non-JSON:", text.substring(0, 200));
        throw new Error("Server returned an error page. Please try again later.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create profile.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/patient");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">Registration Successful!</h2>
          <p className="mt-3 text-slate-600">
            Your account has been created. Please check your email to verify your account.
          </p>
          <p className="mt-2 text-sm text-slate-400">Redirecting to dashboard...</p>
          <Loader2 className="mx-auto mt-4 animate-spin text-violet-600" size={28} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* LEFT PANEL – Brand & Info */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative hidden w-1/2 flex-col justify-center bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-12 text-white lg:flex"
      >
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sparkles size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">MediConnect</h1>
              <p className="text-sm text-violet-200">AI Healthcare Platform</p>
            </div>
          </div>

          <h2 className="mt-12 text-4xl font-bold leading-tight">Start your healthcare journey</h2>
          <p className="mt-4 max-w-md text-lg text-violet-100">
            Create your account and access intelligent healthcare services powered by AI.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Stethoscope, text: "Connect with trusted doctors" },
              { icon: HeartPulse, text: "Access your medical records securely" },
              { icon: Sparkles, text: "AI-powered health assistance 24/7" },
              { icon: ShieldCheck, text: "HIPAA-compliant & secure" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur-sm"
              >
                <item.icon size={20} className="text-violet-200" />
                <span className="text-sm text-violet-50">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 border-t border-white/10 pt-8">
            <p className="text-sm text-violet-200">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-white underline underline-offset-2 hover:text-violet-100">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL – Registration Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2 lg:p-12"
      >
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MediConnect</h1>
              <p className="text-xs text-slate-400">AI Healthcare</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
            <p className="mt-2 text-slate-600">Join the future of healthcare.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm">
                {error}
                {error.toLowerCase().includes("already registered") && (
                  <span>
                    {" "}
                    <Link href="/login" className="font-semibold underline hover:text-red-800">
                      Sign in here
                    </Link>
                  </span>
                )}
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">I am registering as a</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { value: "patient", label: "Patient", icon: User },
                  { value: "doctor", label: "Doctor", icon: Stethoscope },
                  { value: "pharmacy", label: "Pharmacist", icon: Users },
                  { value: "laboratory", label: "Lab Staff", icon: Sparkles },
                ].map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, role: role.value as Role }))}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        isSelected
                          ? "border-violet-600 bg-violet-50 text-violet-700 shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/50"
                      }`}
                    >
                      <Icon size={22} />
                      <span className="text-xs font-medium">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                    getFieldError("firstName")
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : isFieldValid("firstName")
                      ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                      : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                  } outline-none focus:ring-4`}
                  placeholder="John"
                />
                {getFieldError("firstName") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("firstName")}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                    getFieldError("lastName")
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : isFieldValid("lastName")
                      ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                      : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                  } outline-none focus:ring-4`}
                  placeholder="Doe"
                />
                {getFieldError("lastName") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("lastName")}</p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border pl-11 pr-4 py-3 text-slate-900 transition ${
                      getFieldError("email")
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                        : isFieldValid("email")
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                    } outline-none focus:ring-4`}
                    placeholder="you@example.com"
                  />
                </div>
                {getFieldError("email") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("email")}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border pl-11 pr-4 py-3 text-slate-900 transition ${
                      getFieldError("phone")
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                        : isFieldValid("phone")
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                    } outline-none focus:ring-4`}
                    placeholder="+213 5XX XX XX XX"
                  />
                </div>
                {getFieldError("phone") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("phone")}</p>
                )}
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                      getFieldError("password")
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                        : isFieldValid("password") && formData.password
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                    } outline-none focus:ring-4`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {getFieldError("password") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("password")}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">Min 8 chars with uppercase, lowercase & number</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                      getFieldError("confirmPassword")
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                        : isFieldValid("confirmPassword") && formData.confirmPassword
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                    } outline-none focus:ring-4`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {getFieldError("confirmPassword") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("confirmPassword")}</p>
                )}
              </div>
            </div>

            {/* Birth Date & Gender */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border pl-11 pr-4 py-3 text-slate-900 transition ${
                      getFieldError("birthDate")
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                        : isFieldValid("birthDate") && formData.birthDate
                        ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                        : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                    } outline-none focus:ring-4`}
                  />
                </div>
                {getFieldError("birthDate") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("birthDate")}</p>
                )}
                {age !== null && (
                  <p className="mt-1 text-xs text-slate-500">
                    You are {age} years old {isMinor && "(Minor)"}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                    getFieldError("gender")
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                      : isFieldValid("gender") && formData.gender
                      ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                      : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                  } outline-none focus:ring-4`}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {getFieldError("gender") && (
                  <p className="mt-1 text-xs text-red-500">{getFieldError("gender")}</p>
                )}
              </div>
            </div>

            {/* Address Fields */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="123 Street"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="Algiers"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Wilaya</label>
                <input
                  type="text"
                  name="wilaya"
                  value={formData.wilaya}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="Alger"
                />
              </div>
            </div>

            {/* Guardian Fields – shown only for minors */}
            {isMinor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-6"
              >
                <div className="flex items-center gap-2 text-violet-700">
                  <Users size={20} />
                  <h3 className="font-semibold">Guardian Information (Required)</h3>
                </div>
                <p className="mb-4 text-sm text-violet-600">
                  Since you are under 18, please provide your guardian's details.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Guardian First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="guardianFirstName"
                      value={formData.guardianFirstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                        getGuardianError("firstName")
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                          : isGuardianValid("firstName")
                          ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                      } outline-none focus:ring-4`}
                      placeholder="Guardian first name"
                    />
                    {getGuardianError("firstName") && (
                      <p className="mt-1 text-xs text-red-500">{getGuardianError("firstName")}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Guardian Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="guardianLastName"
                      value={formData.guardianLastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                        getGuardianError("lastName")
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                          : isGuardianValid("lastName")
                          ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                      } outline-none focus:ring-4`}
                      placeholder="Guardian last name"
                    />
                    {getGuardianError("lastName") && (
                      <p className="mt-1 text-xs text-red-500">{getGuardianError("lastName")}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Guardian Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                        getGuardianError("Email")
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                          : isGuardianValid("Email")
                          ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                      } outline-none focus:ring-4`}
                      placeholder="guardian@example.com"
                    />
                    {getGuardianError("Email") && (
                      <p className="mt-1 text-xs text-red-500">{getGuardianError("Email")}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Guardian Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                        getGuardianError("Phone")
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                          : isGuardianValid("Phone")
                          ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                      } outline-none focus:ring-4`}
                      placeholder="+213 5XX XX XX XX"
                    />
                    {getGuardianError("Phone") && (
                      <p className="mt-1 text-xs text-red-500">{getGuardianError("Phone")}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Relationship to Guardian <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="guardianRelation"
                      value={formData.guardianRelation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border px-4 py-3 text-slate-900 transition ${
                        getGuardianError("Relation")
                          ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200"
                          : isGuardianValid("Relation")
                          ? "border-green-300 bg-green-50 focus:border-green-400 focus:ring-green-200"
                          : "border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100"
                      } outline-none focus:ring-4`}
                      placeholder="e.g., Father, Mother, Legal Guardian"
                    />
                    {getGuardianError("Relation") && (
                      <p className="mt-1 text-xs text-red-500">{getGuardianError("Relation")}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Terms & Submit */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="terms" className="cursor-pointer text-sm text-slate-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-violet-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-violet-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !termsAccepted}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-sm text-slate-500 lg:hidden">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-violet-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}