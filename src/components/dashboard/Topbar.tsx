"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  MessageCircle,
  Settings,
  Moon,
  ChevronDown,
  Loader2,
  User,
  LogOut,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type PatientProfile = {
  id: string;
  authUserId: string;
  userType: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  accountStatus: string;
  isVerified: boolean;
};

type DashboardResponse = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
  };
  profile?: PatientProfile;
  patient?: {
    id: string;
    profileId: string;
    bloodType: string | null;
    allergies: string | null;
    chronicConditions: string | null;
  };
  error?: string;
};

export default function Topbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     LOAD PATIENT PROFILE
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadPatientProfile = async () => {
      try {
        setLoadingProfile(true);
        setError(null);

        // 1. Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("TOPBAR SESSION ERROR:", sessionError);
          if (mounted) {
            setError("Unable to load session.");
            setLoadingProfile(false);
          }
          return;
        }

        const session = sessionData.session;
        if (!session) {
          if (mounted) {
            setError("No active session.");
            setLoadingProfile(false);
          }
          return;
        }

        const accessToken = session.access_token;
        if (!accessToken) {
          if (mounted) {
            setError("Authentication token missing.");
            setLoadingProfile(false);
          }
          return;
        }

        // 2. Try to fetch the profile
        const response = await fetch("/api/dashboard/patient/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        // 3. If response is not OK, fallback to session data
        if (!response.ok) {
          console.warn(`Profile API returned ${response.status}, falling back to session user.`);
          if (mounted && session.user) {
            const fallbackProfile: PatientProfile = {
              id: session.user.id,
              authUserId: session.user.id,
              userType: "PATIENT",
              email: session.user.email || "",
              firstName: session.user.user_metadata?.first_name || session.user.email?.split("@")[0] || "Patient",
              lastName: session.user.user_metadata?.last_name || "",
              phone: null,
              avatarUrl: null,
              accountStatus: "ACTIVE",
              isVerified: false,
            };
            setProfile(fallbackProfile);
            setLoadingProfile(false);
            setError(null);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        // 4. Parse JSON
        const text = await response.text();
        let result: DashboardResponse | null = null;
        try {
          result = text ? JSON.parse(text) : null;
        } catch (parseError) {
          console.error("TOPBAR INVALID API RESPONSE (not JSON):", text.substring(0, 200));
          // Fallback to session
          if (mounted && session.user) {
            const fallbackProfile: PatientProfile = {
              id: session.user.id,
              authUserId: session.user.id,
              userType: "PATIENT",
              email: session.user.email || "",
              firstName: session.user.user_metadata?.first_name || session.user.email?.split("@")[0] || "Patient",
              lastName: session.user.user_metadata?.last_name || "",
              phone: null,
              avatarUrl: null,
              accountStatus: "ACTIVE",
              isVerified: false,
            };
            setProfile(fallbackProfile);
            setLoadingProfile(false);
            setError(null);
            return;
          }
          throw new Error("Invalid JSON response");
        }

        // 5. Check success flag and profile existence
        if (!result || !result.success || !result.profile) {
          console.warn("TOPBAR API returned success:false or missing profile, falling back to session.");
          // Fallback to session
          if (mounted && session.user) {
            const fallbackProfile: PatientProfile = {
              id: session.user.id,
              authUserId: session.user.id,
              userType: "PATIENT",
              email: session.user.email || "",
              firstName: session.user.user_metadata?.first_name || session.user.email?.split("@")[0] || "Patient",
              lastName: session.user.user_metadata?.last_name || "",
              phone: null,
              avatarUrl: null,
              accountStatus: "ACTIVE",
              isVerified: false,
            };
            setProfile(fallbackProfile);
            setLoadingProfile(false);
            setError(null);
            return;
          }
          throw new Error(result?.error || "Unable to load patient profile.");
        }

        // 6. Success
        if (mounted) {
          setProfile(result.profile);
          setLoadingProfile(false);
        }
      } catch (error) {
        console.error("TOPBAR PROFILE LOAD ERROR:", error);
        // Final fallback attempt
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (mounted && session?.user) {
            const fallbackProfile: PatientProfile = {
              id: session.user.id,
              authUserId: session.user.id,
              userType: "PATIENT",
              email: session.user.email || "",
              firstName: session.user.user_metadata?.first_name || session.user.email?.split("@")[0] || "Patient",
              lastName: session.user.user_metadata?.last_name || "",
              phone: null,
              avatarUrl: null,
              accountStatus: "ACTIVE",
              isVerified: false,
            };
            setProfile(fallbackProfile);
            setLoadingProfile(false);
            setError(null);
            return;
          }
        } catch (fallbackError) {
          // ignore
        }
        if (mounted) {
          setError("Unable to load profile.");
          setLoadingProfile(false);
        }
      }
    };

    loadPatientProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("TOPBAR LOGOUT ERROR:", error);
    }
  };

  /* ============================================================
     PROFILE DATA
  ============================================================ */

  const firstName = profile?.firstName?.trim() || "";
  const lastName = profile?.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || profile?.email?.split("@")[0] || "Patient";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";
  const avatarUrl = profile?.avatarUrl || "/avatars/patient.png";

  /* ============================================================
     HANDLE SEARCH
  ============================================================ */

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    console.log("Dashboard search:", query);
  };

  /* ============================================================
     TOGGLE DARK MODE
  ============================================================ */

  const handleDarkMode = () => {
    setDarkMode((previous) => !previous);
  };

  /* ============================================================
     RETURN
  ============================================================ */

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-6 px-6 lg:px-10">
        {/* =====================================================
            LEFT TITLE (fixed width, always visible)
        ===================================================== */}
        <div className="hidden flex-shrink-0 overflow-hidden whitespace-nowrap lg:block" style={{ width: 280 }}>
          <p className="text-xs font-semibold uppercase tracking-[2px] text-violet-600">
            MediConnect AI
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            Health Dashboard
          </h1>
        </div>

        {/* =====================================================
            SEARCH BAR (takes remaining space)
        ===================================================== */}
        <form onSubmit={handleSearchSubmit} className="min-w-0 flex-1">
          <div className="relative w-full">
            <label
              htmlFor="dashboard-search"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 cursor-text"
            >
              <Search size={18} className="text-slate-400" />
            </label>

            <input
              id="dashboard-search"
              type="search"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm outline-none transition-all duration-200 focus:border-violet-400 focus:bg-white focus:shadow-md focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </form>

        {/* =====================================================
            RIGHT ACTIONS (fixed width, no shrink)
        ===================================================== */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={handleDarkMode}
            aria-label="Toggle dark mode"
            className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-600 hover:shadow-md ${
              darkMode
                ? "bg-violet-100 text-violet-600"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Moon size={19} />
          </button>

          {/* Messages */}
          <button
            type="button"
            aria-label="Messages"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-600 hover:shadow-md"
          >
            <MessageCircle size={19} />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-600 hover:shadow-md"
          >
            <Bell size={19} />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </button>

          {/* Settings */}
          <button
            type="button"
            aria-label="Settings"
            className="hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-violet-600 hover:shadow-md xl:flex"
          >
            <Settings size={19} />
          </button>

          <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block" />

          {/* ===================================================
              PROFILE BUTTON
          =================================================== */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-2 py-1.5 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md"
            >
              {/* Avatar */}
              {loadingProfile ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <Loader2 size={18} className="animate-spin text-violet-600" />
                </div>
              ) : profile?.avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white ring-2 ring-white shadow-sm">
                  {initials}
                </div>
              )}

              {/* Name */}
              <div className="hidden max-w-[120px] text-left xl:block">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {loadingProfile ? "Loading..." : displayName}
                </h3>
                <p className="truncate text-xs text-slate-500">Patient</p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 ${
                  profileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* =================================================
                PROFILE DROPDOWN
            ================================================= */}
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                {/* Profile summary */}
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{displayName}</p>
                      <p className="truncate text-xs text-slate-500">{profile?.email || "Patient"}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <a
                  href="/dashboard/patient/profile"
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-600"
                >
                  <User size={17} />
                  My Profile
                </a>

                <a
                  href="/dashboard/patient/settings"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-600"
                >
                  <Settings size={17} />
                  Settings
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================
          ERROR INDICATOR
      ======================================================= */}
      {error && !loadingProfile && (
        <div className="border-t border-red-100 bg-red-50 px-10 py-1.5 text-xs font-medium text-red-600">
          {error}
        </div>
      )}
    </header>
  );
}