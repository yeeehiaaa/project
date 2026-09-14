"use client";

import { motion } from "framer-motion";
import {
  Brain,
  CircleCheckBig,
  TriangleAlert,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

const insights = [
  {
    title: "Normal Findings",
    description:
      "Your hemoglobin, white blood cells and platelet count are within the normal reference range.",
    icon: CircleCheckBig,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Abnormal Value",
    description:
      "Vitamin D is slightly below the optimal level. Increasing sun exposure and dietary intake may help.",
    icon: TriangleAlert,
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "AI Recommendation",
    description:
      "Repeat your Vitamin D test in approximately three months after following your physician's recommendations.",
    icon: Lightbulb,
    color: "bg-violet-100 text-violet-600",
  },
];

export default function AILabInsights() {
  return (
    <section className="rounded-[34px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-10 text-white shadow-xl">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
            <Brain size={32} />
          </div>

          <h2 className="text-4xl font-bold">
            MediConnect AI Laboratory Analysis
          </h2>

          <p className="mt-4 text-lg leading-8 text-violet-100">
            Our AI reviews your laboratory results, highlights abnormal values,
            explains them in simple language and generates professional medical
            recommendations for you and your healthcare provider.
          </p>
        </div>

        <button className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-violet-700 transition hover:scale-105">
          Generate Full AI Report
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {insights.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.15,
              }}
              className="rounded-3xl bg-white p-7 text-slate-900 shadow-lg"
            >
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}
              >
                <Icon size={26} />
              </div>

              <h3 className="text-xl font-bold">
                {item.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur">
        <h3 className="text-2xl font-bold">
          AI Summary
        </h3>

        <p className="mt-4 leading-8 text-violet-100">
          Overall, your laboratory profile is reassuring. Most biomarkers are
          within normal limits. The only notable finding is a mild Vitamin D
          deficiency, which is common and usually manageable through lifestyle
          modifications or supplementation. No urgent abnormalities requiring
          emergency care were detected.
        </p>
      </div>
    </section>
  );
}