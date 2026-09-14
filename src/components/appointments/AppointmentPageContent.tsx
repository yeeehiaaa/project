"use client";

import { CalendarPlus } from "lucide-react";
import { motion } from "framer-motion";

import AppointmentStats from "./AppointmentStats";
import AppointmentCalendar from "./AppointmentCalendar";
import UpcomingAppointments from "./UpcomingAppointments";
import AppointmentTable from "./AppointmentTable";

export default function AppointmentPageContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-8"
    >
      {/* Header */}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
            Appointment Center
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Manage Your Appointments
          </h1>

          <p className="mt-2 text-slate-500">
            View, schedule and manage all your consultations.
          </p>
        </div>

        <button
          className="
          flex
          items-center
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-violet-600
          to-indigo-600
          px-6
          py-4
          font-semibold
          text-white
          shadow-lg
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-xl
          "
        >
          <CalendarPlus size={20} />

          New Appointment
        </button>

      </div>

      {/* Stats */}

      <AppointmentStats />

      {/* Main Grid */}

      <div className="grid gap-8 xl:grid-cols-[2fr_420px]">

        <AppointmentTable />

        <AppointmentCalendar />

        <UpcomingAppointments />

      </div>

    </motion.div>
  );
}