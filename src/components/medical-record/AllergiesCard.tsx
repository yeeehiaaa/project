"use client";

import { motion } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  Pill,
  Apple,
  Flower2,
} from "lucide-react";

const allergies = [
  {
    name: "Penicillin",
    severity: "High",
    icon: Pill,
    color: "bg-red-100 text-red-600",
    badge: "bg-red-500",
  },
  {
    name: "Peanuts",
    severity: "Moderate",
    icon: Apple,
    color: "bg-orange-100 text-orange-600",
    badge: "bg-orange-500",
  },
  {
    name: "Pollen",
    severity: "Low",
    icon: Flower2,
    color: "bg-green-100 text-green-600",
    badge: "bg-green-500",
  },
];

export default function AllergiesCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg">
          <ShieldAlert size={30} />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-red-500">
            Important
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            Allergies
          </h2>
        </div>
      </div>

      <div className="space-y-5">
        {allergies.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:border-red-200 hover:shadow-lg"
            >
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}
                >
                  <Icon size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    Allergy detected
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full ${item.badge} px-5 py-2 text-sm font-semibold text-white`}
              >
                {item.severity}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={22}
            className="mt-1 text-red-600"
          />

          <div>
            <h3 className="font-bold text-red-700">
              Medical Alert
            </h3>

            <p className="mt-2 leading-7 text-red-600">
              Always inform healthcare professionals about severe allergies
              before taking medications or undergoing treatment.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}