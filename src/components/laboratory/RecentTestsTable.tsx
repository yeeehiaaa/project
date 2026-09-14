"use client";

import { motion } from "framer-motion";
import {
  Search,
  Download,
  Eye,
  FlaskConical,
  CheckCircle2,
  Clock3,
  AlertTriangle,
} from "lucide-react";

const tests = [
  {
    id: "#LAB-2401",
    test: "Complete Blood Count",
    laboratory: "MediLab Center",
    doctor: "Dr. Sarah Johnson",
    date: "30 Jul 2026",
    status: "Completed",
  },
  {
    id: "#LAB-2402",
    test: "Blood Glucose",
    laboratory: "BioLab Diagnostics",
    doctor: "Dr. Ahmed Ali",
    date: "28 Jul 2026",
    status: "Pending",
  },
  {
    id: "#LAB-2403",
    test: "Lipid Profile",
    laboratory: "Central Laboratory",
    doctor: "Dr. Michael Brown",
    date: "25 Jul 2026",
    status: "Completed",
  },
  {
    id: "#LAB-2404",
    test: "Vitamin D",
    laboratory: "MediLab Center",
    doctor: "Dr. Sarah Johnson",
    date: "21 Jul 2026",
    status: "Critical",
  },
  {
    id: "#LAB-2405",
    test: "Kidney Function",
    laboratory: "HealthLab",
    doctor: "Dr. Emily Smith",
    date: "15 Jul 2026",
    status: "Completed",
  },
];

export default function RecentTestsTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col gap-6 border-b border-slate-100 p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-cyan-600">
            Laboratory History
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Recent Laboratory Tests
          </h2>
        </div>

        <div className="relative w-full lg:w-96">
          <Search
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            placeholder="Search laboratory test..."
            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th className="px-8 py-5">Test</th>
              <th className="px-6 py-5">Laboratory</th>
              <th className="px-6 py-5">Doctor</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tests.map((test, index) => (
              <motion.tr
                key={test.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.05,
                }}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
                      <FlaskConical size={24} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {test.test}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {test.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 text-slate-700">
                  {test.laboratory}
                </td>

                <td className="px-6 text-slate-700">
                  {test.doctor}
                </td>

                <td className="px-6 text-slate-500">
                  {test.date}
                </td>

                <td className="px-6">
                  {test.status === "Completed" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      Completed
                    </span>
                  )}

                  {test.status === "Pending" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                      <Clock3 size={16} />
                      Pending
                    </span>
                  )}

                  {test.status === "Critical" && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                      <AlertTriangle size={16} />
                      Critical
                    </span>
                  )}
                </td>

                <td className="px-8">
                  <div className="flex justify-end gap-3">
                    <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition hover:bg-cyan-100 hover:text-cyan-600">
                      <Eye size={18} />
                    </button>

                    <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition hover:bg-cyan-100 hover:text-cyan-600">
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