"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

interface PatientDashboardLayoutProps {
  children: ReactNode;
}

export default function PatientDashboardLayout({ children }: PatientDashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Sidebar */}
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}