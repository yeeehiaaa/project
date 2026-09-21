"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  CalendarDays,
  BrainCircuit,
  HeartPulse,
  FlaskConical,
  FileText,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const mainMenu = [
  {
    title: "Dashboard",
    href: "/dashboard/patient",
    icon: LayoutDashboard,
  },
  {
    title: "Appointments",
    href: "/dashboard/patient/appointments",
    icon: CalendarDays,
  },
  {
    title: "AI Assistant",
    href: "/dashboard/patient/ai-assistant",
    icon: BrainCircuit,
  },
];

const healthMenu = [
  {
    title: "Medical Record",
    href: "/dashboard/patient/medical-record",
    icon: HeartPulse,
  },
  {
    title: "Laboratory",
    href: "/dashboard/patient/laboratory",
    icon: FlaskConical,
  },
  {
    title: "Prescriptions",
    href: "/dashboard/patient/prescriptions",
    icon: FileText,
  },
];

type Profile = {
  id: string;
  authUserId: string;
  userType: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  accountStatus: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("SESSION ERROR:", sessionError);
          if (mounted) router.replace("/login");
          return;
        }

        const session = sessionData.session;

        if (!session) {
          console.error("No active Supabase session.");
          if (mounted) router.replace("/login");
          return;
        }

        const accessToken = session.access_token;

        if (!accessToken) {
          console.error("No access token found.");
          if (mounted) router.replace("/login");
          return;
        }

        const response = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const text = await response.text();
        let result: any = {};

        try {
          result = text ? JSON.parse(text) : {};
        } catch {
          console.error("Profile API returned invalid JSON:", text);
          if (mounted) setLoadingProfile(false);
          return;
        }

        if (!response.ok) {
          console.error("Profile API error:", result);

          if (response.status === 401 && mounted) {
            const { data: refreshData, error: refreshError } =
              await supabase.auth.refreshSession();

            if (!refreshError && refreshData.session) {
              const refreshedToken = refreshData.session.access_token;
              const retryResponse = await fetch("/api/auth/profile", {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${refreshedToken}`,
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              });

              const retryText = await retryResponse.text();
              let retryResult: any = {};

              try {
                retryResult = retryText ? JSON.parse(retryText) : {};
              } catch {
                retryResult = {};
              }

              if (retryResponse.ok) {
                if (mounted) {
                  setProfile(retryResult.profile);
                  setLoadingProfile(false);
                }
                return;
              }
            }

            if (mounted) {
              await supabase.auth.signOut();
              router.replace("/login");
            }
            return;
          }

          if (mounted) setLoadingProfile(false);
          return;
        }

        if (!result.profile) {
          console.error("Profile missing from API response:", result);
          if (mounted) setLoadingProfile(false);
          return;
        }

        if (mounted) {
          setProfile(result.profile);
          setLoadingProfile(false);
        }
      } catch (error) {
        console.error("LOAD PROFILE ERROR:", error);
        if (mounted) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        setLoggingOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
      setLoggingOut(false);
    }
  };

  const firstName = profile?.firstName?.trim() || "";
  const lastName = profile?.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || profile?.email?.split("@")[0] || "Patient";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "P";

  return (
    <>

      <aside
        className="sidebar-scroll flex h-screen max-h-screen min-h-full w-full flex-col overflow-y-auto bg-white/50 px-4 py-6 backdrop-blur-sm"
      >
        {/* ==========================================
            LOGO — more compact and centered
        ========================================== */}
        <Link
          href="/dashboard/patient"
          className="mb-10 flex items-center gap-3 px-2"
        >
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 shadow-md"
          >
            <Sparkles size={22} className="text-white" />
          </motion.div>

          <div className="leading-tight">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              DOCTORZ Co.
            </h2>
            <p className="text-xs font-medium text-slate-400">AI Healthcare</p>
          </div>
        </Link>

        {/* ==========================================
            MAIN MENU
        ========================================== */}
        <div>
          <p className="mb-4 pl-2 text-[11px] font-bold uppercase tracking-[3px] text-slate-400">
            Main Menu
          </p>

          <div className="space-y-2">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/70 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`transition-opacity duration-200 ${
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                      }`}
                    />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ==========================================
            HEALTH
        ========================================== */}
        <div className="mt-10">
          <p className="mb-4 pl-2 text-[11px] font-bold uppercase tracking-[3px] text-slate-400">
            Health
          </p>

          <div className="space-y-2">
            {healthMenu.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/70 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`transition-opacity duration-200 ${
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                      }`}
                    />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ==========================================
            DIVIDER
        ========================================== */}
        <div className="my-8 h-px rounded-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* ==========================================
            AI CARD — more subtle and compact
        ========================================== */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs text-violet-100">Available 24/7</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-violet-100">
            Ask about symptoms, medications, or your medical history.
          </p>
          <Link
            href="/dashboard/patient/ai-assistant"
            className="mt-4 block w-full rounded-xl bg-white py-2.5 text-center text-sm font-semibold text-violet-700 transition hover:scale-[1.02] hover:bg-violet-50"
          >
            Open AI Assistant
          </Link>
        </motion.div>

        {/* ==========================================
            BOTTOM USER CARD — cleaner and more compact
        ========================================== */}
        <div className="mt-auto pt-8">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-white p-5 shadow-md"
          >
            <div className="flex items-center gap-3">
              {loadingProfile ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100">
                  <Loader2 size={20} className="animate-spin text-violet-600" />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-bold text-white ring-2 ring-violet-100">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900">
                  {loadingProfile ? "Loading..." : displayName}
                </h3>
                <p className="truncate text-xs text-slate-500">
                  {profile?.email || "Patient"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Link
                href="/dashboard/patient/profile"
                className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600"
              >
                <User size={18} />
                <span className="font-medium">My Profile</span>
              </Link>

              <Link
                href="/dashboard/patient/settings"
                className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 transition-all duration-200 hover:bg-violet-50 hover:text-violet-600"
              >
                <Settings size={18} />
                <span className="font-medium">Settings</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500 transition-all duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}
                <span className="font-medium">
                  {loggingOut ? "Logging out..." : "Logout"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </aside>
    </>
  );
}