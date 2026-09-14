"use client";

import { motion } from "framer-motion";
import {
  HeartPulse,
  Activity,
  Brain,
  Pill,
  CheckCircle2,
} from "lucide-react";

const history = [
  {
    title: "Hypertension",
    diagnosed: "12 Jan 2023",
    doctor: "Dr. Sarah Johnson",
    status: "Controlled",
    icon: Activity,
    color: "from-red-500 to-rose-500",
  },
  {
    title: "Asthma",
    diagnosed: "18 Sep 2018",
    doctor: "Dr. Ahmed Benali",
    status: "Stable",
    icon: HeartPulse,
    color: "from-sky-500 to-cyan-500",
  },
  {
    title: "Migraine",
    diagnosed: "07 Apr 2022",
    doctor: "Dr. Emily Carter",
    status: "Occasional",
    icon: Brain,
    color: "from-violet-600 to-indigo-600",
  },
  {
    title: "Vitamin D Deficiency",
    diagnosed: "14 Jun 2025",
    doctor: "Dr. James Wilson",
    status: "Under Treatment",
    icon: Pill,
    color: "from-amber-500 to-orange-500",
  },
];

export default function MedicalHistory() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
          Medical Background
        </p>

        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Medical History
        </h2>
      </div>

      <div className="space-y-5">
        {history.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:border-violet-200 hover:shadow-lg"
            >
              <div className="flex items-start gap-5">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color} shadow-lg`}
                >
                  <Icon size={28} className="text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      {item.title}
                    </h3>

                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                      <CheckCircle2 size={16} />
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">
                        Diagnosed
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {item.diagnosed}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Primary Doctor
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {item.doctor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}