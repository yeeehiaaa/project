"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Syringe,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

const vaccines = [
  {
    name: "COVID-19 Booster",
    date: "18 Jun 2026",
    next: "18 Jun 2027",
    status: "Completed",
    color: "from-violet-600 to-indigo-600",
  },
  {
    name: "Influenza",
    date: "10 Oct 2025",
    next: "10 Oct 2026",
    status: "Due Soon",
    color: "from-cyan-500 to-blue-500",
  },
  {
    name: "Tetanus",
    date: "05 Apr 2023",
    next: "05 Apr 2033",
    status: "Up to Date",
    color: "from-emerald-500 to-green-500",
  },
];

export default function VaccinationCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
          <ShieldCheck size={30} />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
            Immunization
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            Vaccination Record
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        {vaccines.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-3xl border border-slate-100 bg-slate-50 p-6 transition hover:border-violet-200 hover:shadow-lg"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
                >
                  <Syringe size={28} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      Last Dose: {item.date}
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      Next Dose: {item.next}
                    </div>
                  </div>
                </div>
              </div>

              <span className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 font-semibold text-green-700">
                <CheckCircle2 size={18} />
                {item.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}