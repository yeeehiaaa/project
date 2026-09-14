"use client";

import { motion } from "framer-motion";
import {
  Pill,
  Clock3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const stats = [
  {
    title: "Active Medications",
    value: "8",
    subtitle: "Currently prescribed",
    icon: Pill,
    gradient: "from-violet-600 to-indigo-600",
    progress: "88%",
  },
  {
    title: "Today's Doses",
    value: "5",
    subtitle: "Scheduled today",
    icon: Clock3,
    gradient: "from-cyan-500 to-blue-600",
    progress: "65%",
  },
  {
    title: "Refills Remaining",
    value: "3",
    subtitle: "Need renewal soon",
    icon: RefreshCw,
    gradient: "from-amber-400 to-orange-500",
    progress: "45%",
  },
  {
    title: "Adherence",
    value: "97%",
    subtitle: "Medication compliance",
    icon: ShieldCheck,
    gradient: "from-emerald-500 to-green-600",
    progress: "97%",
  },
];

export default function PrescriptionStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
            }}
            whileHover={{
              y: -6,
            }}
            className="group overflow-hidden rounded-[30px] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <h2 className="mt-3 text-4xl font-bold text-slate-900">
                  {item.value}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {item.subtitle}
                </p>
              </div>

              <div
                className={`
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-3xl
                  bg-gradient-to-br
                  ${item.gradient}
                  text-white
                  shadow-lg
                  transition-transform
                  duration-300
                  group-hover:scale-110
                `}
              >
                <Icon size={30} />
              </div>
            </div>

            <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: item.progress,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                }}
                className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}