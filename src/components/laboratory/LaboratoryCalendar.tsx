"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  FlaskConical,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const upcoming = [
  {
    id: 1,
    date: "08 Aug",
    title: "Complete Blood Count",
    laboratory: "MediLab Center",
    status: "Scheduled",
  },
  {
    id: 2,
    date: "18 Aug",
    title: "Vitamin D Analysis",
    laboratory: "BioLab Diagnostics",
    status: "Scheduled",
  },
];

const recent = [
  {
    id: 1,
    date: "30 Jul",
    title: "Lipid Profile",
    laboratory: "Central Laboratory",
    status: "Completed",
  },
  {
    id: 2,
    date: "21 Jul",
    title: "Urine Analysis",
    laboratory: "HealthLab",
    status: "Completed",
  },
];

export default function LaboratoryCalendar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white p-8 shadow-sm"
    >
      {/* Header */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-cyan-600">
            Laboratory Schedule
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Calendar & Timeline
          </h2>

          <p className="mt-2 text-slate-500">
            Track upcoming laboratory appointments and your latest analyses.
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-600">
          <CalendarDays size={32} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        {/* Upcoming */}

        <div>
          <h3 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Clock3 className="text-cyan-600" size={22} />
            Upcoming Tests
          </h3>

          <div className="space-y-5">
            {upcoming.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white">
                    {item.date}
                  </span>

                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {item.status}
                  </span>
                </div>

                <h4 className="mt-4 text-lg font-bold text-slate-900">
                  {item.title}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {item.laboratory}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent */}

        <div>
          <h3 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">
            <CheckCircle2
              className="text-emerald-600"
              size={22}
            />
            Recent Analyses
          </h3>

          <div className="space-y-5">
            {recent.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                    {item.date}
                  </span>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                    <FlaskConical size={22} />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      {item.title}
                    </h4>

                    <p className="text-sm text-slate-500">
                      {item.laboratory}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </motion.section>
  );
}