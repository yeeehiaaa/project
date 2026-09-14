"use client";

import { motion } from "framer-motion";
import {
  FlaskConical,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const results = [
  {
    test: "Complete Blood Count (CBC)",
    date: "30 Jul 2026",
    value: "Normal",
    reference: "Normal",
    status: "Normal",
    trend: "stable",
  },
  {
    test: "Blood Glucose",
    date: "30 Jul 2026",
    value: "118 mg/dL",
    reference: "70 - 99",
    status: "High",
    trend: "up",
  },
  {
    test: "Vitamin D",
    date: "29 Jul 2026",
    value: "24 ng/mL",
    reference: "30 - 100",
    status: "Low",
    trend: "down",
  },
  {
    test: "Cholesterol",
    date: "29 Jul 2026",
    value: "172 mg/dL",
    reference: "< 200",
    status: "Normal",
    trend: "stable",
  },
];

function Badge(status: string) {
  if (status === "Normal")
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
        Normal
      </span>
    );

  if (status === "High")
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
        High
      </span>
    );

  return (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
      Low
    </span>
  );
}

function Trend(type: string) {
  if (type === "up")
    return <TrendingUp className="text-red-500" size={18} />;

  if (type === "down")
    return <TrendingDown className="text-orange-500" size={18} />;

  return <Minus className="text-green-500" size={18} />;
}

export default function LaboratoryResults() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
          <FlaskConical size={30} />
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-cyan-600">
            Laboratory
          </p>

          <h2 className="text-3xl font-bold text-slate-900">
            Laboratory Results
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-sm uppercase tracking-wider text-slate-500">
              <th className="pb-4">Test</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Result</th>
              <th className="pb-4">Reference</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Trend</th>
              <th className="pb-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {results.map((item, index) => (
              <motion.tr
                key={item.test}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="py-5 font-semibold text-slate-900">
                  {item.test}
                </td>

                <td className="text-slate-500">
                  {item.date}
                </td>

                <td className="font-semibold">
                  {item.value}
                </td>

                <td className="text-slate-500">
                  {item.reference}
                </td>

                <td>{Badge(item.status)}</td>

                <td>{Trend(item.trend)}</td>

                <td>
                  <div className="flex justify-end gap-3">
                    <button className="rounded-xl bg-slate-100 p-3 transition hover:bg-slate-200">
                      <Eye size={18} />
                    </button>

                    <button className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 text-white transition hover:scale-105">
                      <Download size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}