"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  MessageSquare,
  HeartPulse,
  FlaskConical,
  FileText,
  CreditCard,
  User,
  Store,
  Syringe,
} from "lucide-react";
import Link from "next/link";

export type PatientTabType =
  | "dashboard"
  | "appointments"
  | "ai_assistant"
  | "messages"
  | "medical_record"
  | "laboratory"
  | "prescriptions"
  | "pharmacies"
  | "vaccinations"
  | "profile";

interface PatientIpadDockProps {
  activeTab: PatientTabType;
  onChangeTab: (tab: PatientTabType) => void;
  isDark: boolean;
  hidden?: boolean;
}

export default function PatientIpadDock({
  activeTab,
  onChangeTab,
  isDark,
  hidden = false,
}: PatientIpadDockProps) {
  if (hidden) return null;

  const dockItems: {
    id: PatientTabType | "card";
    label: string;
    icon: React.ElementType;
    accent?: string;
    isLink?: boolean;
    href?: string;
  }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "ai_assistant", label: "AI Assistant", icon: Sparkles, accent: "text-amber-500" },
    { id: "messages", label: "Messages", icon: MessageSquare, accent: "text-sky-500" },
    { id: "medical_record", label: "Medical Record", icon: HeartPulse },
    { id: "laboratory", label: "Laboratory", icon: FlaskConical },
    { id: "prescriptions", label: "Prescriptions", icon: FileText },
    { id: "pharmacies", label: "Pharmacies", icon: Store, accent: "text-emerald-500" },
    { id: "vaccinations", label: "Vaccinations", icon: Syringe, accent: "text-emerald-500" },
    { id: "card", label: "My Health Card", icon: CreditCard, accent: "text-blue-500", isLink: true, href: "/dashboard/patient/card" },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <motion.nav
      aria-label="Patient navigation dock"
      initial={{ y: 50, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      exit={{ y: 60, opacity: 0, x: "-50%", transition: { duration: 0.18, ease: "easeOut" } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="fixed bottom-5 left-1/2 z-40 pointer-events-auto max-w-[96vw]"
    >
      <div
        className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-3xl sm:rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-300 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDark
            ? "bg-slate-950/20 hover:bg-slate-950/30 border-white/10 shadow-black/50 text-slate-200 ring-1 ring-white/10"
            : "bg-white/20 hover:bg-white/30 border-white/60 shadow-slate-950/10 text-slate-700 ring-1 ring-black/5"
        }`}
      >
        {dockItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isLink && item.href) {
            return (
              <div key={item.id} className="relative group shrink-0">
                <Link
                  href={item.href}
                  className={`relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-2xl sm:rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                    isDark
                      ? "hover:bg-white/10 text-slate-300 hover:text-white"
                      : "hover:bg-white/40 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.18, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    <Icon size={20} className="text-blue-500" />
                  </motion.div>
                </Link>

                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md border border-slate-800">
                  {item.label}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/90 rotate-45 border-r border-b border-slate-800" />
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="relative group flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => onChangeTab(item.id as PatientTabType)}
                className={`relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-2xl sm:rounded-full transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                  isActive
                    ? isDark
                      ? "bg-blue-600/85 text-white backdrop-blur-md"
                      : "bg-blue-600/90 text-white backdrop-blur-md"
                    : isDark
                    ? "hover:bg-white/10 text-slate-300 hover:text-white"
                    : "hover:bg-white/40 text-slate-600 hover:text-slate-900"
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.18, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-full h-full relative"
                >
                  <Icon size={20} className={isActive ? "text-white" : item.accent || ""} />
                </motion.div>
              </button>

              {isActive && (
                <motion.span
                  layoutId="activePatientDockDot"
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                />
              )}

              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md border border-slate-800 z-30">
                {item.label}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/90 rotate-45 border-r border-b border-slate-800" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.nav>
  );
}
