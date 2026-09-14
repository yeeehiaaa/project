"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Pill,
  ArrowRight,
} from "lucide-react";

const interactions = [
  {
    id: 1,
    medications: ["Amoxicillin 500mg", "Metformin 850mg"],
    severity: "Low",
    description:
      "No significant interaction is expected between these medications when taken as prescribed.",
    recommendation:
      "Continue your prescribed treatment and follow your doctor's instructions.",
  },
  {
    id: 2,
    medications: ["Ibuprofen 400mg", "Metformin 850mg"],
    severity: "Moderate",
    description:
      "Regular use of anti-inflammatory medicines may require additional monitoring in some patients.",
    recommendation:
      "Use only as directed and discuss frequent use with your doctor or pharmacist.",
  },
];

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "Low":
      return {
        badge: "bg-emerald-100 text-emerald-700",
        icon: "bg-emerald-100 text-emerald-600",
        border: "border-emerald-100",
      };

    case "Moderate":
      return {
        badge: "bg-amber-100 text-amber-700",
        icon: "bg-amber-100 text-amber-600",
        border: "border-amber-100",
      };

    default:
      return {
        badge: "bg-red-100 text-red-700",
        icon: "bg-red-100 text-red-600",
        border: "border-red-100",
      };
  }
}

export default function DrugInteractions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white p-8 shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <ShieldCheck size={24} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[3px] text-emerald-600">
                Medication Safety
              </p>

              <h2 className="mt-1 text-3xl font-bold text-slate-900">
                Drug Interactions
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-2xl leading-7 text-slate-500">
            Review potential interactions between your medications and
            understand when you should ask your doctor or pharmacist for
            advice.
          </p>
        </div>

        {/* Safety badge */}

        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4">
          <CheckCircle2
            size={22}
            className="text-emerald-600"
          />

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
              Overall Safety
            </p>

            <p className="mt-1 font-bold text-emerald-800">
              No major interactions
            </p>
          </div>
        </div>
      </div>

      {/* Interaction list */}

      <div className="mt-8 space-y-4">
        {interactions.map((interaction, index) => {
          const styles = getSeverityStyles(interaction.severity);

          return (
            <motion.div
              key={interaction.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.35,
              }}
              className={`rounded-[26px] border ${styles.border} bg-slate-50/60 p-6 transition-all duration-300 hover:shadow-md`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* Medications */}

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {interaction.medications.map((medication, medicationIndex) => (
                      <div
                        key={medication}
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                          <Pill size={16} />
                        </div>

                        <span className="font-semibold text-slate-800">
                          {medication}
                        </span>

                        {medicationIndex <
                          interaction.medications.length - 1 && (
                          <ArrowRight
                            size={16}
                            className="ml-2 text-slate-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Description */}

                  <div className="mt-5">
                    <div className="flex items-center gap-2">
                      <Info
                        size={17}
                        className="text-slate-400"
                      />

                      <h3 className="font-semibold text-slate-800">
                        Interaction information
                      </h3>
                    </div>

                    <p className="mt-2 leading-6 text-slate-500">
                      {interaction.description}
                    </p>
                  </div>

                  {/* Recommendation */}

                  <div className="mt-5 rounded-2xl bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                      Recommended action
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {interaction.recommendation}
                    </p>
                  </div>
                </div>

                {/* Severity */}

                <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end">
                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold ${styles.badge}`}
                  >
                    {interaction.severity} Risk
                  </span>

                  {interaction.severity === "Moderate" ? (
                    <AlertTriangle
                      size={22}
                      className="text-amber-500"
                    />
                  ) : (
                    <CheckCircle2
                      size={22}
                      className="text-emerald-500"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer warning */}

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-amber-50 p-5">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-600"
        />

        <p className="text-sm leading-6 text-amber-900">
          <span className="font-semibold">Important:</span>{" "}
          Interaction information is provided for educational purposes.
          Always inform your doctor and pharmacist about every medication,
          supplement, or treatment you are taking before making changes to
          your medication.
        </p>
      </div>
    </motion.section>
  );
}