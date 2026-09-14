"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  HeartPulse,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const results = [
  {
    title: "Blood Glucose",
    value: "98",
    unit: "mg/dL",
    status: "Normal",
    reference: "70 - 100",
    color: "emerald",
    icon: Droplets,
  },
  {
    title: "Total Cholesterol",
    value: "228",
    unit: "mg/dL",
    status: "High",
    reference: "< 200",
    color: "amber",
    icon: HeartPulse,
  },
  {
    title: "Hemoglobin",
    value: "14.8",
    unit: "g/dL",
    status: "Normal",
    reference: "13 - 17",
    color: "emerald",
    icon: Activity,
  },
  {
    title: "Vitamin D",
    value: "19",
    unit: "ng/mL",
    status: "Low",
    reference: "30 - 100",
    color: "red",
    icon: ShieldAlert,
  },
];

const statusStyle = {
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-200",
    icon: "bg-emerald-100 text-emerald-600",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700",
    ring: "ring-amber-200",
    icon: "bg-amber-100 text-amber-600",
  },
  red: {
    badge: "bg-red-100 text-red-700",
    ring: "ring-red-200",
    icon: "bg-red-100 text-red-600",
  },
} as const;

export default function ResultsOverview() {
  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-cyan-600">
          Latest Results
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Health Indicators
        </h2>

        <p className="mt-2 text-slate-500">
          Your most recent laboratory measurements and their medical status.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {results.map((item, index) => {
          const Icon = item.icon;
          const style =
            statusStyle[item.color as keyof typeof statusStyle];

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -8,
              }}
              className={`
                rounded-[30px]
                border
                border-slate-100
                bg-white
                p-7
                shadow-sm
                transition-all
                duration-300
                hover:shadow-xl
                ring-1
                ${style.ring}
              `}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-3xl
                    ${style.icon}
                  `}
                >
                  <Icon size={30} />
                </div>

                <span
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-xs
                    font-bold
                    ${style.badge}
                  `}
                >
                  {item.status}
                </span>
              </div>

              <h3 className="mt-7 text-lg font-bold text-slate-900">
                {item.title}
              </h3>

              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-slate-900">
                  {item.value}
                </span>

                <span className="pb-2 text-slate-500">
                  {item.unit}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Reference
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {item.reference}
                  </p>
                </div>

                {item.status === "Normal" ? (
                  <TrendingUp
                    size={24}
                    className="text-emerald-500"
                  />
                ) : (
                  <TrendingDown
                    size={24}
                    className={
                      item.status === "High"
                        ? "text-amber-500"
                        : "text-red-500"
                    }
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}