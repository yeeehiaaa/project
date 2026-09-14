"use client";

import { motion } from "framer-motion";
import {
  TriangleAlert,
  AlertCircle,
  CheckCircle2,
  Bell,
  ArrowRight,
  BrainCircuit,
} from "lucide-react";

const alerts = [
  {
    id: 1,
    test: "Vitamin D",
    value: "18 ng/mL",
    normal: "30 - 100 ng/mL",
    severity: "High Priority",
    color: "red",
    icon: TriangleAlert,
    recommendation:
      "Vitamin D deficiency detected. Consultation with your physician is recommended.",
  },
  {
    id: 2,
    test: "Total Cholesterol",
    value: "212 mg/dL",
    normal: "< 200 mg/dL",
    severity: "Medium Priority",
    color: "amber",
    icon: AlertCircle,
    recommendation:
      "Slightly elevated cholesterol. Lifestyle modifications are recommended.",
  },
  {
    id: 3,
    test: "Blood Glucose",
    value: "95 mg/dL",
    normal: "70 - 99 mg/dL",
    severity: "Normal",
    color: "emerald",
    icon: CheckCircle2,
    recommendation:
      "Your glucose level is within the normal reference range.",
  },
];

function badgeColor(color: string) {
  switch (color) {
    case "red":
      return "bg-red-100 text-red-700";

    case "amber":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function borderColor(color: string) {
  switch (color) {
    case "red":
      return "border-red-200";

    case "amber":
      return "border-amber-200";

    default:
      return "border-emerald-200";
  }
}

export default function CriticalAlerts() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col gap-6 border-b border-slate-100 p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-red-500">
            Medical Alerts
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Critical Laboratory Results
          </h2>

          <p className="mt-2 text-slate-500">
            AI continuously monitors your laboratory results and highlights
            abnormalities that may require medical attention.
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <Bell size={32} />
        </div>
      </div>

      {/* Alerts */}

      <div className="space-y-6 p-8">
        {alerts.map((alert, index) => {
          const Icon = alert.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -4,
              }}
              className={`rounded-[30px] border ${borderColor(
                alert.color
              )} p-6 transition-all hover:shadow-lg`}
            >
              <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">

                <div className="flex items-start gap-5">

                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl ${badgeColor(
                      alert.color
                    )}`}
                  >
                    <Icon size={30} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {alert.test}
                    </h3>

                    <p className="mt-3 text-slate-500">
                      AI interpretation:
                    </p>

                    <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                      {alert.recommendation}
                    </p>
                  </div>

                </div>

                <div className="grid gap-5 sm:grid-cols-3">

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Result
                    </p>

                    <h4 className="mt-2 text-xl font-bold text-slate-900">
                      {alert.value}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Reference
                    </p>

                    <h4 className="mt-2 text-lg font-bold text-slate-900">
                      {alert.normal}
                    </h4>
                  </div>

                  <div
                    className={`rounded-2xl p-4 ${badgeColor(alert.color)}`}
                  >
                    <p className="text-xs uppercase tracking-wide opacity-70">
                      Priority
                    </p>

                    <h4 className="mt-2 text-lg font-bold">
                      {alert.severity}
                    </h4>
                  </div>

                </div>

              </div>

              <div className="mt-8 flex flex-wrap gap-4">

                <button className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition hover:-translate-y-1 hover:shadow-lg">
                  <BrainCircuit size={18} />
                  Ask AI
                </button>

                <button className="flex items-center gap-3 rounded-2xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                  <ArrowRight size={18} />
                  Book Appointment
                </button>

              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}