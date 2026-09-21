"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePatientTheme } from "@/components/patient/PatientThemeContext";
import BookWizard from "./BookWizard";

// Standalone booking page : /dashboard/patient/appointments
// (the appointments LIST lives in the dashboard tab).
export default function AppointmentsBookingPage() {
  const { isDark } = usePatientTheme();

  return (
    <div className="space-y-4 pb-10">
      <Link
        href="/dashboard/patient"
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
          isDark
            ? "border-slate-800 text-slate-300 hover:bg-slate-800"
            : "border-slate-200 text-slate-600 hover:bg-slate-100"
        }`}
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      <BookWizard
        backHref="/dashboard/patient"
        doneHref="/dashboard/patient"
        doneLabel="Back to dashboard"
      />
    </div>
  );
}
