"use client";

import { motion } from "framer-motion";
import {
  Pill,
  Download,
  Eye,
  RotateCcw,
} from "lucide-react";

const prescriptions = [
  {
    id: "RX-10452",
    medication: "Amoxicillin 500mg",
    dosage: "1 capsule • 3x/day",
    doctor: "Dr. Sarah Johnson",
    start: "28 Jul 2026",
    refill: "05 Aug 2026",
    status: "Active",
  },
  {
    id: "RX-10431",
    medication: "Vitamin D3",
    dosage: "1 tablet • Daily",
    doctor: "Dr. Michael Brown",
    start: "20 Jul 2026",
    refill: "18 Aug 2026",
    status: "Active",
  },
  {
    id: "RX-10398",
    medication: "Ibuprofen 400mg",
    dosage: "When needed",
    doctor: "Dr. Emily Davis",
    start: "14 Jul 2026",
    refill: "--",
    status: "Completed",
  },
  {
    id: "RX-10372",
    medication: "Metformin 850mg",
    dosage: "1 tablet • Morning",
    doctor: "Dr. Ahmed Karim",
    start: "02 Jul 2026",
    refill: "02 Aug 2026",
    status: "Refill Soon",
  },
];

function statusClasses(status: string) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700";

    case "Completed":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function ActivePrescriptions() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
            Current Medications
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Active Prescriptions
          </h2>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-100 text-violet-600">
          <Pill size={28} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th className="px-8 py-4">Medication</th>
              <th className="px-6 py-4">Dosage</th>
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Started</th>
              <th className="px-6 py-4">Next Refill</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-8 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {prescriptions.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 transition hover:bg-violet-50/40"
              >
                <td className="px-8 py-6">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.medication}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.id}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {item.dosage}
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {item.doctor}
                </td>

                <td className="px-6 py-6 text-slate-600">
                  {item.start}
                </td>

                <td className="px-6 py-6 font-medium text-slate-700">
                  {item.refill}
                </td>

                <td className="px-6 py-6">
                  <span
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${statusClasses(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="px-8 py-6">
                  <div className="flex justify-center gap-2">
                    <button className="rounded-xl bg-slate-100 p-3 transition hover:bg-violet-100 hover:text-violet-700">
                      <Eye size={18} />
                    </button>

                    <button className="rounded-xl bg-slate-100 p-3 transition hover:bg-cyan-100 hover:text-cyan-700">
                      <Download size={18} />
                    </button>

                    <button className="rounded-xl bg-slate-100 p-3 transition hover:bg-amber-100 hover:text-amber-700">
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}