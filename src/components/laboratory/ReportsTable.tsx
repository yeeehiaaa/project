"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock3,
  AlertTriangle,
} from "lucide-react";

const reports = [
  {
    id: 1,
    test: "Complete Blood Count",
    laboratory: "Central Medical Lab",
    doctor: "Dr. Sarah Johnson",
    date: "30 Jul 2026",
    status: "Completed",
  },
  {
    id: 2,
    test: "Blood Glucose",
    laboratory: "Health Diagnostic Center",
    doctor: "Dr. Ahmed Ali",
    date: "28 Jul 2026",
    status: "Completed",
  },
  {
    id: 3,
    test: "Vitamin D",
    laboratory: "Central Medical Lab",
    doctor: "Dr. Sarah Johnson",
    date: "25 Jul 2026",
    status: "Pending",
  },
  {
    id: 4,
    test: "Kidney Function",
    laboratory: "BioLab",
    doctor: "Dr. Karim Benaissa",
    date: "20 Jul 2026",
    status: "Critical",
  },
];

function StatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={15} />
          Completed
        </span>
      );

    case "Pending":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-700">
          <Clock3 size={15} />
          Pending
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700">
          <AlertTriangle size={15} />
          Critical
        </span>
      );
  }
}

export default function ReportsTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-[34px] bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Laboratory Reports
        </h2>

        <p className="mt-2 text-slate-500">
          Browse, download and review all laboratory reports.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-semibold text-slate-500">
              <th className="px-8 py-5">Test</th>
              <th className="px-6 py-5">Laboratory</th>
              <th className="px-6 py-5">Doctor</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report, index) => (
              <motion.tr
                key={report.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.08 }}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600">
                      <FileText size={22} />
                    </div>

                    <span className="font-semibold text-slate-900">
                      {report.test}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {report.laboratory}
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {report.doctor}
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {report.date}
                </td>

                <td className="px-6 py-6">
                  {StatusBadge(report.status)}
                </td>

                <td className="px-8 py-6">
                  <div className="flex justify-end gap-3">
                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-cyan-100 hover:text-cyan-700">
                      <Eye size={18} />
                    </button>

                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-violet-100 hover:text-violet-700">
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