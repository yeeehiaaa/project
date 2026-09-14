"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeftRight,
} from "lucide-react";

const comparisons = [
  {
    name: "Blood Glucose",
    previous: "104 mg/dL",
    current: "95 mg/dL",
    status: "Improved",
    icon: TrendingDown,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    name: "Total Cholesterol",
    previous: "235 mg/dL",
    current: "212 mg/dL",
    status: "Improved",
    icon: TrendingDown,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    name: "Vitamin D",
    previous: "18 ng/mL",
    current: "24 ng/mL",
    status: "Improving",
    icon: TrendingUp,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    name: "Hemoglobin",
    previous: "14.0 g/dL",
    current: "14.1 g/dL",
    status: "Stable",
    icon: Minus,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
];

export default function CompareResults() {
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
            Health Evolution
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Compare Laboratory Results
          </h2>

          <p className="mt-2 text-slate-500">
            Compare your latest laboratory values with previous analyses.
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-600">
          <ArrowLeftRight size={30} />
        </div>
      </div>

      <div className="space-y-5">

        {comparisons.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -3,
              }}
              className="rounded-[28px] border border-slate-100 p-6 transition-all hover:shadow-lg"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Previous laboratory value vs latest result
                  </p>
                </div>

                <div className="flex items-center gap-8">

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Previous
                    </p>

                    <h4 className="mt-1 text-xl font-bold text-slate-700">
                      {item.previous}
                    </h4>
                  </div>

                  <ArrowLeftRight
                    className="text-slate-300"
                    size={24}
                  />

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Current
                    </p>

                    <h4 className="mt-1 text-2xl font-bold text-slate-900">
                      {item.current}
                    </h4>
                  </div>

                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl px-5 py-3 ${item.bg}`}
                >
                  <Icon
                    size={22}
                    className={item.color}
                  />

                  <span className={`font-semibold ${item.color}`}>
                    {item.status}
                  </span>
                </div>

              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">

                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      index === 0
                        ? "85%"
                        : index === 1
                        ? "80%"
                        : index === 2
                        ? "62%"
                        : "50%",
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.8,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                />

              </div>

            </motion.div>
          );
        })}

      </div>
    </motion.section>
  );
}