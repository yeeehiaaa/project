"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
} from "lucide-react";

const results = [
  {
    test: "Complete Blood Count",
    date: "30 Jul 2026",
    result: "Normal",
    value: "5.4",
    range: "4.5 - 6.0",
    doctor: "Dr. Sarah Johnson",
    status: "normal",
  },
  {
    test: "Blood Glucose",
    date: "30 Jul 2026",
    result: "High",
    value: "132",
    range: "70 - 110",
    doctor: "Dr. Sarah Johnson",
    status: "high",
  },
  {
    test: "Vitamin D",
    date: "22 Jul 2026",
    result: "Low",
    value: "18",
    range: "30 - 100",
    doctor: "Dr. Ahmed Ali",
    status: "low",
  },
  {
    test: "Kidney Function",
    date: "18 Jul 2026",
    result: "Normal",
    value: "1.0",
    range: "0.7 - 1.2",
    doctor: "Dr. Ahmed Ali",
    status: "normal",
  },
];

function StatusBadge(status: string) {
  switch (status) {
    case "normal":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          Normal
        </span>
      );

    case "high":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
          <AlertTriangle size={16} />
          High
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
          <MinusCircle size={16} />
          Low
        </span>
      );
  }
}

export default function RecentResults() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Recent Laboratory Results
          </h2>

          <p className="mt-2 text-slate-500">
            Review your latest laboratory analyses.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700">
          View All

          <ArrowRight size={18} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-semibold text-slate-500">
              <th className="px-8 py-5">Test</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Value</th>
              <th className="px-6 py-5">Reference</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Doctor</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>

          <tbody>
            {results.map((item, index) => (
              <motion.tr
                key={item.test}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: index * 0.08,
                }}
                className="border-b border-slate-100 transition hover:bg-cyan-50/50"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                      <FileText size={22} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.test}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {item.result}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {item.date}
                </td>

                <td className="px-6 py-6 font-bold text-slate-900">
                  {item.value}
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {item.range}
                </td>

                <td className="px-6 py-6">
                  {StatusBadge(item.status)}
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {item.doctor}
                </td>

                <td className="px-8 py-6">
                  <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700">
                    View Report
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}