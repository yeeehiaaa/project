"use client";

import { motion } from "framer-motion";
import {
  TestTube2,
  Clock3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const stats = [
  {
    title: "Total Tests",
    value: "24",
    subtitle: "Laboratory analyses",
    icon: TestTube2,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    title: "Pending",
    value: "2",
    subtitle: "Awaiting results",
    icon: Clock3,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    title: "Completed",
    value: "22",
    subtitle: "Successfully completed",
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    title: "Critical",
    value: "0",
    subtitle: "Require attention",
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-600",
  },
];

export default function LaboratoryStats() {
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
              delay: index * 0.08,
              duration: 0.4,
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
                  width:
                    index === 0
                      ? "95%"
                      : index === 1
                      ? "20%"
                      : index === 2
                      ? "88%"
                      : "5%",
                }}
                transition={{
                  delay: 0.2,
                  duration: 0.8,
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