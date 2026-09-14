"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Stethoscope,
  Pill,
  FlaskConical,
  Syringe,
  FileText,
} from "lucide-react";

const timeline = [
  {
    date: "02 Aug 2026",
    title: "General Consultation",
    description:
      "Routine medical consultation. Blood pressure slightly elevated.",
    icon: Stethoscope,
    color: "from-violet-600 to-indigo-600",
  },
  {
    date: "30 Jul 2026",
    title: "Prescription Issued",
    description:
      "Paracetamol 500mg and Vitamin D prescribed for 30 days.",
    icon: Pill,
    color: "from-emerald-500 to-green-500",
  },
  {
    date: "28 Jul 2026",
    title: "Blood Analysis",
    description:
      "Complete blood count and glucose analysis performed.",
    icon: FlaskConical,
    color: "from-cyan-500 to-blue-500",
  },
  {
    date: "18 Jun 2026",
    title: "COVID-19 Booster Vaccine",
    description:
      "Vaccination completed successfully with no adverse effects.",
    icon: Syringe,
    color: "from-orange-500 to-red-500",
  },
  {
    date: "10 Apr 2026",
    title: "Medical Report",
    description:
      "Annual health report uploaded to patient medical record.",
    icon: FileText,
    color: "from-pink-500 to-rose-500",
  },
];

export default function MedicalTimeline() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
          Timeline
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Medical History Timeline
        </h2>
      </div>

      <div className="relative ml-5 border-l-2 border-slate-200 pl-8">
        {timeline.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="relative mb-10"
            >
              <div
                className={`absolute -left-[52px] flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
              >
                <Icon size={22} />
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 transition hover:shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={16} />
                    {item.date}
                  </div>
                </div>

                <p className="mt-4 leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}