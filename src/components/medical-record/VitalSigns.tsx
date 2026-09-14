"use client";

import { motion } from "framer-motion";
import {
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Gauge,
} from "lucide-react";

const vitals = [
  {
    title: "Heart Rate",
    value: "72 bpm",
    status: "Normal",
    icon: HeartPulse,
    gradient: "from-red-500 to-rose-500",
  },
  {
    title: "Blood Pressure",
    value: "120 / 80",
    status: "Optimal",
    icon: Activity,
    gradient: "from-violet-600 to-indigo-600",
  },
  {
    title: "Temperature",
    value: "36.8 °C",
    status: "Normal",
    icon: Thermometer,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    title: "Oxygen Saturation",
    value: "98%",
    status: "Excellent",
    icon: Wind,
    gradient: "from-sky-500 to-cyan-500",
  },
  {
    title: "Blood Glucose",
    value: "94 mg/dL",
    status: "Healthy",
    icon: Droplets,
    gradient: "from-emerald-500 to-green-500",
  },
  {
    title: "Respiratory Rate",
    value: "16 bpm",
    status: "Normal",
    icon: Gauge,
    gradient: "from-pink-500 to-fuchsia-500",
  },
];

export default function VitalSigns() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
          Health Monitoring
        </p>

        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Vital Signs
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {vitals.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradient} shadow-lg`}
              >
                <Icon size={30} className="text-white" />
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {item.value}
              </p>

              <span className="mt-4 inline-flex rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                {item.status}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}