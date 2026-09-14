"use client";

import { motion } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  TriangleAlert,
  CheckCircle2,
  ArrowRight,
  FileText,
  MessageCircle,
} from "lucide-react";

const findings = [
  {
    icon: CheckCircle2,
    color: "text-emerald-500",
    title: "Blood Glucose",
    description: "Your glucose level is within the normal reference range.",
  },
  {
    icon: TriangleAlert,
    color: "text-amber-500",
    title: "Total Cholesterol",
    description:
      "Your cholesterol is slightly elevated. Lifestyle changes are recommended.",
  },
  {
    icon: TriangleAlert,
    color: "text-red-500",
    title: "Vitamin D",
    description:
      "Vitamin D deficiency detected. Consider discussing supplementation with your physician.",
  },
];

export default function AIInterpretationCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-[34px] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 text-white shadow-xl"
    >
      <div className="relative overflow-hidden p-10">

        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 left-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative">

          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-md">
            <BrainCircuit size={18} />

            <span className="text-sm font-semibold">
              MediConnect AI Analysis
            </span>
          </div>

          <h2 className="mt-6 text-4xl font-bold">
            AI Laboratory Interpretation
          </h2>

          <p className="mt-4 max-w-3xl leading-8 text-violet-100">
            Our artificial intelligence analyzed your latest laboratory
            results and generated a medical summary to help you better
            understand your health status.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">

            {findings.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md"
                >
                  <Icon
                    size={30}
                    className={item.color}
                  />

                  <h3 className="mt-5 text-xl font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-violet-100">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-3xl bg-white/10 p-6 backdrop-blur-md">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={18}
                    className="text-yellow-300"
                  />

                  <span className="font-semibold">
                    AI Recommendations
                  </span>
                </div>

                <ul className="mt-5 space-y-3 text-violet-100">
                  <li>• Maintain a balanced diet rich in vegetables.</li>
                  <li>• Reduce saturated fat intake.</li>
                  <li>• Exercise at least 150 minutes per week.</li>
                  <li>• Recheck Vitamin D within 3 months.</li>
                </ul>
              </div>

              <div className="space-y-4">

                <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-violet-700 transition hover:scale-105">
                  <MessageCircle size={20} />
                  Ask AI About Results
                </button>

                <button className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-semibold backdrop-blur-md transition hover:bg-white/20">
                  <FileText size={20} />
                  Generate Medical Report
                </button>

                <button className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-semibold backdrop-blur-md transition hover:bg-white/20">
                  <ArrowRight size={20} />
                  Share With Doctor
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </motion.section>
  );
}