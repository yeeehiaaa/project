"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Clock3,
  Pill,
  Sun,
  Sunset,
  Moon,
  Sunrise,
} from "lucide-react";

type Medication = {
  id: number;
  name: string;
  dosage: string;
  time: string;
  period: string;
  icon: typeof Sunrise;
  taken: boolean;
};

const initialMedications: Medication[] = [
  {
    id: 1,
    name: "Metformin 850mg",
    dosage: "1 tablet",
    time: "08:00 AM",
    period: "Morning",
    icon: Sunrise,
    taken: true,
  },
  {
    id: 2,
    name: "Vitamin D3",
    dosage: "1 capsule",
    time: "12:30 PM",
    period: "Afternoon",
    icon: Sun,
    taken: true,
  },
  {
    id: 3,
    name: "Amoxicillin 500mg",
    dosage: "1 capsule",
    time: "06:00 PM",
    period: "Evening",
    icon: Sunset,
    taken: false,
  },
  {
    id: 4,
    name: "Magnesium 400mg",
    dosage: "1 tablet",
    time: "10:00 PM",
    period: "Night",
    icon: Moon,
    taken: false,
  },
];

export default function MedicationSchedule() {
  const [medications, setMedications] =
    useState<Medication[]>(initialMedications);

  const toggleMedication = (id: number) => {
    setMedications((current) =>
      current.map((medication) =>
        medication.id === id
          ? {
              ...medication,
              taken: !medication.taken,
            }
          : medication
      )
    );
  };

  const completed = medications.filter(
    (medication) => medication.taken
  ).length;

  const progress =
    medications.length > 0
      ? Math.round((completed / medications.length) * 100)
      : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white p-8 shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
            Daily Treatment
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Medication Schedule
          </h2>

          <p className="mt-2 text-slate-500">
            Keep track of your medications and never miss a dose.
          </p>
        </div>

        {/* Progress */}

        <div className="flex items-center gap-4 rounded-2xl bg-violet-50 px-5 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
            <Pill size={24} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-500">
              Today's progress
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">
                {completed}/{medications.length}
              </span>

              <span className="text-sm font-medium text-violet-600">
                {progress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}

      <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
        />
      </div>

      {/* Medication List */}

      <div className="mt-8 grid gap-4">
        {medications.map((medication, index) => {
          const Icon = medication.icon;

          return (
            <motion.div
              key={medication.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.35,
              }}
              className={`group flex flex-col gap-5 rounded-[24px] border p-5 transition-all duration-300 md:flex-row md:items-center ${
                medication.taken
                  ? "border-emerald-100 bg-emerald-50/50"
                  : "border-slate-100 bg-slate-50/50 hover:border-violet-200 hover:bg-violet-50/40"
              }`}
            >
              {/* Time */}

              <div className="flex min-w-[120px] items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    medication.taken
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-violet-100 text-violet-600"
                  }`}
                >
                  <Icon size={23} />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {medication.period}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <Clock3
                      size={14}
                      className="text-slate-400"
                    />

                    <span className="font-semibold text-slate-800">
                      {medication.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medication */}

              <div className="flex-1">
                <h3
                  className={`text-lg font-bold ${
                    medication.taken
                      ? "text-slate-500 line-through"
                      : "text-slate-900"
                  }`}
                >
                  {medication.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {medication.dosage}
                </p>
              </div>

              {/* Status */}

              <div className="flex items-center justify-between gap-4">
                <span
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    medication.taken
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {medication.taken ? "Taken" : "Pending"}
                </span>

                <button
                  type="button"
                  onClick={() => toggleMedication(medication.id)}
                  aria-label={
                    medication.taken
                      ? `Mark ${medication.name} as not taken`
                      : `Mark ${medication.name} as taken`
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                    medication.taken
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-md"
                      : "border-slate-200 bg-white text-transparent hover:border-violet-500 hover:bg-violet-50"
                  }`}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Reminder */}

      <div className="mt-6 flex items-start gap-4 rounded-2xl bg-indigo-50 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <Clock3 size={20} />
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            Medication reminder
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Your next medication is{" "}
            <span className="font-semibold text-indigo-600">
              Amoxicillin 500mg
            </span>{" "}
            at 06:00 PM.
          </p>
        </div>
      </div>
    </motion.section>
  );
}