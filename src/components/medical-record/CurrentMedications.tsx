"use client";

import { motion } from "framer-motion";
import {
  Pill,
  Clock3,
  UserRound,
  CalendarDays,
  RefreshCcw,
} from "lucide-react";

const medications = [
  {
    name: "Paracetamol",
    dosage: "500 mg",
    frequency: "2x / day",
    doctor: "Dr. Sarah Johnson",
    start: "12 Jul 2026",
    progress: 75,
    color: "from-violet-600 to-indigo-600",
  },
  {
    name: "Vitamin D3",
    dosage: "2000 IU",
    frequency: "1x / day",
    doctor: "Dr. Ahmed Benali",
    start: "04 Jun 2026",
    progress: 45,
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Amoxicillin",
    dosage: "1 g",
    frequency: "3x / day",
    doctor: "Dr. Emily Carter",
    start: "30 Jul 2026",
    progress: 20,
    color: "from-emerald-500 to-green-500",
  },
];

export default function CurrentMedications() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
          Treatment
        </p>

        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Current Medications
        </h2>
      </div>

      <div className="space-y-6">
        {medications.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.08,
            }}
            className="rounded-3xl border border-slate-100 bg-slate-50 p-6 transition-all duration-300 hover:border-violet-200 hover:shadow-lg"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-5">

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
                >
                  <Pill size={28} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-slate-500">
                    {item.dosage}
                  </p>

                  <div className="mt-5 grid gap-4 text-sm text-slate-600 md:grid-cols-3">

                    <div className="flex items-center gap-2">
                      <Clock3 size={16} />
                      {item.frequency}
                    </div>

                    <div className="flex items-center gap-2">
                      <UserRound size={16} />
                      {item.doctor}
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      {item.start}
                    </div>

                  </div>
                </div>

              </div>

              <div className="w-full lg:w-80">

                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Treatment Progress
                  </span>

                  <span className="font-bold text-violet-600">
                    {item.progress}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
                    style={{
                      width: `${item.progress}%`,
                    }}
                  />
                </div>

                <button
                  className="
                    mt-5
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-gradient-to-r
                    from-violet-600
                    to-indigo-600
                    py-3
                    font-semibold
                    text-white
                    shadow-md
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-xl
                  "
                >
                  <RefreshCcw size={18} />
                  Renew Prescription
                </button>

              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}