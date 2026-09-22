"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Sparkles,
  CreditCard,
  User,
} from "lucide-react";
import Link from "next/link";

export type DoctorTabType =
  | "agenda"
  | "calendar"
  | "messenger"
  | "patients"
  | "prescriptions"
  | "ai_assistant"
  | "community"
  | "profile";

interface DoctorIpadDockProps {
  activeTab: DoctorTabType;
  onChangeTab: (tab: DoctorTabType) => void;
  isDark: boolean;
  unreadMessagesCount?: number;
  urgentCount?: number;
  hidden?: boolean;
}

export default function DoctorIpadDock({
  activeTab,
  onChangeTab,
  isDark,
  unreadMessagesCount = 2,
  urgentCount = 0,
  hidden = false,
}: DoctorIpadDockProps) {
  if (hidden) return null;
  const dockItems: {
    id: DoctorTabType | "card";
    label: string;
    icon: React.ElementType;
    isLink?: boolean;
    href?: string;
    badge?: number | null;
    badgeColor?: string;
  }[] = [
    {
      id: "agenda",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      badge: urgentCount > 0 ? urgentCount : null,
      badgeColor: "bg-rose-500",
    },
    {
      id: "calendar",
      label: "Calendrier",
      icon: Calendar,
    },
    {
      id: "messenger",
      label: "Messagerie",
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: "bg-indigo-600",
    },
    {
      id: "patients",
      label: "Liste des Patients",
      icon: Users,
    },
    {
      id: "prescriptions",
      label: "Ordonnances",
      icon: FileText,
    },
    {
      id: "ai_assistant",
      label: "Co-Pilote IA",
      icon: Sparkles,
    },
    {
      id: "community",
      label: "Communauté",
      icon: Users,
    },
    {
      id: "card",
      label: "Carte Virtuelle 3D",
      icon: CreditCard,
      isLink: true,
      href: "/doctor/card",
    },
    {
      id: "profile",
      label: "Profil Praticien",
      icon: User,
    },
  ];

  return (
    <motion.nav
      aria-label="Navigation Principale Style iPad"
      initial={{ y: 50, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      exit={{ y: 60, opacity: 0, x: "-50%", transition: { duration: 0.18, ease: "easeOut" } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="fixed bottom-5 left-1/2 z-40 pointer-events-auto max-w-[96vw]"
    >
      <div
        className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-3xl sm:rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
          isDark
            ? "bg-slate-950/20 hover:bg-slate-950/30 border-white/10 shadow-black/50 text-slate-200 ring-1 ring-white/10"
            : "bg-white/20 hover:bg-white/30 border-white/60 shadow-slate-950/10 text-slate-700 ring-1 ring-black/5"
        }`}
      >
        {dockItems.map((item, index) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isLink && item.href) {
            return (
              <div key={item.id} className="relative group shrink-0">
                <Link
                  href={item.href}
                  className={`relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-2xl sm:rounded-full transition-all duration-200 cursor-pointer ${
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
                    <Icon size={20} className="text-indigo-500" />
                  </motion.div>
                </Link>

                {/* Floating Tooltip */}
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
                onClick={() => onChangeTab(item.id as DoctorTabType)}
                className={`relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-2xl sm:rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isDark
                      ? "bg-indigo-600/85 text-white shadow-lg shadow-indigo-600/40 backdrop-blur-md"
                      : "bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30 backdrop-blur-md"
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
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? "text-white"
                        : item.id === "ai_assistant"
                        ? "text-amber-500"
                        : item.id === "messenger"
                        ? "text-sky-500"
                        : ""
                    }
                  />

                  {/* Badge Notification */}
                  {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full ${
                        item.badgeColor || "bg-rose-500"
                      } text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-xs animate-pulse`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </button>

              {/* Active Indicator Dot under icon like iPadOS Dock */}
              {isActive && (
                <motion.span
                  layoutId="activeDockDot"
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                />
              )}

              {/* Floating Tooltip */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md border border-slate-800 z-30">
                {item.label}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/90 rotate-45 border-r border-b border-slate-800" />
              </div>

              {/* Optional separator after 6th element */}
              {index === 5 && (
                <div
                  className={`hidden sm:block absolute -right-1.5 top-1/2 -translate-y-1/2 h-6 w-px ${
                    isDark ? "bg-white/15" : "bg-black/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.nav>
  );
}
