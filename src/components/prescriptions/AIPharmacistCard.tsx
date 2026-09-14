"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Pill,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const medicationInfo = {
  name: "Amoxicillin 500mg",
  purpose:
    "Antibiotic commonly prescribed to treat certain bacterial infections.",
  dosage: "1 capsule, 3 times daily",
  duration: "7 days",
  commonEffects: [
    "Nausea",
    "Mild stomach discomfort",
    "Diarrhea",
  ],
  precautions: [
    "Take exactly as prescribed.",
    "Complete the treatment unless your doctor tells you otherwise.",
    "Tell your doctor if you have a penicillin allergy.",
  ],
};

export default function AIPharmacistCard() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 p-8 text-white shadow-xl"
    >
      {/* Background decoration */}

      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute -bottom-32 left-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative">
        {/* Header */}

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 shadow-lg backdrop-blur-md">
              <Sparkles size={30} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
                  AI Pharmacist
                </span>

                <span className="flex items-center gap-1.5 text-xs text-indigo-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Available 24/7
                </span>
              </div>

              <h2 className="mt-3 text-3xl font-bold">
                Understand your medication
              </h2>

              <p className="mt-2 max-w-2xl leading-7 text-indigo-100">
                Get an easy-to-understand explanation of your prescription,
                including its purpose, dosage, precautions and common side
                effects.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-violet-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <Sparkles size={18} />

            {showDetails ? "Hide Analysis" : "Analyze Medication"}

            <ArrowRight
              size={18}
              className={`transition-transform duration-300 ${
                showDetails ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>

        {/* Medication summary */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Pill size={20} />
              </div>

              <div>
                <p className="text-xs text-indigo-200">
                  Medication
                </p>

                <p className="mt-1 font-semibold">
                  {medicationInfo.name}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs text-indigo-200">
                  Dosage
                </p>

                <p className="mt-1 font-semibold">
                  {medicationInfo.dosage}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <p className="text-xs text-indigo-200">
                  Treatment
                </p>

                <p className="mt-1 font-semibold">
                  {medicationInfo.duration}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI analysis */}

        <motion.div
          initial={false}
          animate={{
            height: showDetails ? "auto" : 0,
            opacity: showDetails ? 1 : 0,
            marginTop: showDetails ? 24 : 0,
          }}
          className="overflow-hidden"
        >
          <div className="rounded-[28px] bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Sparkles size={22} />
              </div>

              <div>
                <h3 className="font-bold">
                  MediConnect AI Analysis
                </h3>

                <p className="text-sm text-slate-500">
                  Simplified medication information
                </p>
              </div>
            </div>

            {/* Purpose */}

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                What is it for?
              </p>

              <p className="mt-2 leading-7 text-slate-600">
                {medicationInfo.purpose}
              </p>
            </div>

            {/* Two columns */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-amber-50 p-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={18}
                    className="text-amber-600"
                  />

                  <h4 className="font-semibold text-amber-800">
                    Common side effects
                  </h4>
                </div>

                <ul className="mt-4 space-y-2">
                  {medicationInfo.commonEffects.map((effect) => (
                    <li
                      key={effect}
                      className="flex items-center gap-2 text-sm text-amber-900"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                      {effect}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={18}
                    className="text-emerald-600"
                  />

                  <h4 className="font-semibold text-emerald-800">
                    Important precautions
                  </h4>
                </div>

                <ul className="mt-4 space-y-2">
                  {medicationInfo.precautions.map((precaution) => (
                    <li
                      key={precaution}
                      className="flex items-start gap-2 text-sm text-emerald-900"
                    >
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      {precaution}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Disclaimer */}

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <MessageCircle
                size={18}
                className="mt-0.5 shrink-0 text-violet-600"
              />

              <p className="text-xs leading-5 text-slate-500">
                MediConnect AI provides educational information and does not
                replace advice from your doctor or pharmacist. Never change
                your medication or dosage based only on AI recommendations.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}