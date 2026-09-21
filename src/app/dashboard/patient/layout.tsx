"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { HeartPulse, Sun, Moon, CreditCard, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PatientThemeContext } from "@/components/patient/PatientThemeContext";
import DoctorzBrand from "@/components/brand/DoctorzBrand";

type DashboardTheme = "light" | "dark";

interface PatientDashboardLayoutProps {
  children: ReactNode;
}

export default function PatientDashboardLayout({ children }: PatientDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ============================================================
  // THEME (White / Dark Sapphire — same as doctor dashboard)
  // ============================================================
  const [theme, setTheme] = useState<DashboardTheme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mediconnect_patient_theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("mediconnect_patient_theme", next);
    } catch {
      // ignore
    }
  };

  const isDark = theme === "dark";

  // The virtual card is a standalone full-screen page (same as the doctor
  // card): no dashboard header, no dock — the card has its own top bar.
  // NOTE: this flag is only READ after all hooks below (Rules of Hooks:
  // hooks must run in the same order on every render).
  const isCardPage = pathname?.endsWith("/card") ?? false;

  // ============================================================
  // PATIENT IDENTITY (avatar pill + health card)
  // ============================================================
  const [patientInfo, setPatientInfo] = useState({
    name: "Patient",
    initials: "PT",
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    let mounted = true;
    async function loadIdentity() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const first = data?.profile?.firstName || "";
        const last = data?.profile?.lastName || "";
        const full = `${first} ${last}`.trim();
        if (mounted && full) {
          setPatientInfo({
            name: full,
            initials:
              `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "PT",
            avatarUrl: data?.profile?.avatarUrl || null,
          });
        }
      } catch {
        // keep fallback identity
      }
    }
    loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  // Standalone card page AFTER all hooks (Rules of Hooks).
  if (isCardPage) {
    return <>{children}</>;
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 relative overflow-x-hidden ${
        isDark
          ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white"
          : "bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white"
      }`}
    >
      {/* Ambient backdrops (same style as doctor dashboard) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {isDark ? (
          <>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-blue-600/10 blur-[140px] rounded-full" />
            <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </>
        ) : (
          <>
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-100/60 blur-[100px] rounded-full" />
            <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-100/40 blur-[100px] rounded-full" />
          </>
        )}
      </div>

      {/* ============================================================
          TOP CLINICAL HEADER (same as doctor dashboard)
      ============================================================ */}
      <header
        className={`sticky top-0 z-40 px-4 sm:px-6 py-3.5 transition-colors duration-200 border-b ${
          isDark
            ? "bg-slate-950/80 backdrop-blur-md border-slate-800/80 shadow-xl"
            : "bg-white/95 backdrop-blur-md border-slate-200/90 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/dashboard/patient" className="flex items-center gap-2.5 group shrink-0">
              <span className="group-hover:scale-105 transition">
                <DoctorzBrand isDark={isDark} size={40} />
              </span>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
                      isDark
                        ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    Patient Space
                  </span>
                </div>
                <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Patient Portal & Secure Telehealth
                </p>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* THEME TOGGLE */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to White theme" : "Switch to Dark Sapphire theme"}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] shrink-0 ${
                isDark
                  ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/40"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-300/80"
              }`}
            >
              {isDark ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span className="hidden md:inline">White Theme</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-blue-600" />
                  <span className="hidden md:inline">Dark Sapphire</span>
                </>
              )}
            </button>

            {/* Health Card Link */}
            <Link
              href="/dashboard/patient/card"
              title="View my virtual health card"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-[0.97] group shrink-0 ${
                isDark
                  ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/30"
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              }`}
            >
              <CreditCard size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">My Health Card</span>
            </Link>

            {/* Patient Pill */}
            <div className={`flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l shrink-0 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <Link href="/dashboard/patient/profile" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 via-blue-700 to-sky-600 border border-blue-400/40 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 hover:scale-105 transition">
                {patientInfo.avatarUrl ? (
                  <Image
                    src={patientInfo.avatarUrl}
                    alt={patientInfo.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{patientInfo.initials}</span>
                )}
              </Link>

              <div className="hidden lg:block text-left max-w-[120px] xl:max-w-[150px]">
                <p className={`text-xs font-bold leading-tight truncate ${isDark ? "text-white" : "text-slate-900"}`} title={patientInfo.name}>
                  {patientInfo.name}
                </p>
                <p className="text-[11px] text-blue-500 font-medium leading-none truncate">Patient</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                  isDark
                    ? "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                }`}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN CONTENT (tabbed patient dashboard)
      ============================================================ */}
      {/* NOTE: no z-index here on purpose — a z-index would trap fixed
          modals (lab report, etc.) under the sticky header. */}
      <main className="relative max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 pb-32 sm:pb-40">
        <PatientThemeContext.Provider value={{ theme, isDark }}>
          {children}
        </PatientThemeContext.Provider>
      </main>
    </div>
  );
}
