"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  Download,
  Eye,
  CalendarDays,
  Clock3,
  UserRound,
  FileText,
} from "lucide-react";

const prescriptionHistory = [
  {
    id: "RX-10284",
    medication: "Amoxicillin 500mg",
    doctor: "Dr. Sarah Johnson",
    date: "12 Jun 2026",
    duration: "7 days",
    status: "Completed",
  },
  {
    id: "RX-10192",
    medication: "Ibuprofen 400mg",
    doctor: "Dr. Emily Davis",
    date: "28 May 2026",
    duration: "5 days",
    status: "Completed",
  },
  {
    id: "RX-10074",
    medication: "Vitamin D3",
    doctor: "Dr. Michael Brown",
    date: "10 May 2026",
    duration: "30 days",
    status: "Completed",
  },
  {
    id: "RX-09981",
    medication: "Omeprazole 20mg",
    doctor: "Dr. Ahmed Karim",
    date: "22 Apr 2026",
    duration: "14 days",
    status: "Completed",
  },
  {
    id: "RX-09863",
    medication: "Paracetamol 500mg",
    doctor: "Dr. Sarah Johnson",
    date: "05 Apr 2026",
    duration: "5 days",
    status: "Completed",
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700";

    case "Expired":
      return "bg-slate-100 text-slate-600";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-violet-100 text-violet-700";
  }
}

export default function PrescriptionHistory() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-[34px] border border-slate-100 bg-white shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col justify-between gap-5 border-b border-slate-100 px-8 py-7 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <ClipboardList size={27} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[3px] text-indigo-600">
              Medical History
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              Prescription History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review your previous prescriptions and download their documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
          <FileText size={18} className="text-indigo-600" />

          <span className="text-sm font-semibold text-slate-700">
            {prescriptionHistory.length} prescriptions
          </span>
        </div>
      </div>

      {/* Desktop Table */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-8 py-4">Prescription</th>
              <th className="px-6 py-4">Doctor</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-8 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {prescriptionHistory.map((prescription, index) => (
              <motion.tr
                key={prescription.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.3,
                }}
                className="border-t border-slate-100 transition-colors hover:bg-indigo-50/30"
              >
                {/* Prescription */}

                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <FileText size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {prescription.medication}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {prescription.id}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Doctor */}

                <td className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <UserRound
                      size={16}
                      className="text-slate-400"
                    />

                    <span className="text-sm font-medium text-slate-700">
                      {prescription.doctor}
                    </span>
                  </div>
                </td>

                {/* Date */}

                <td className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      size={16}
                      className="text-slate-400"
                    />

                    <span className="text-sm text-slate-600">
                      {prescription.date}
                    </span>
                  </div>
                </td>

                {/* Duration */}

                <td className="px-6 py-6">
                  <div className="flex items-center gap-2">
                    <Clock3
                      size={16}
                      className="text-slate-400"
                    />

                    <span className="text-sm text-slate-600">
                      {prescription.duration}
                    </span>
                  </div>
                </td>

                {/* Status */}

                <td className="px-6 py-6">
                  <span
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${getStatusStyles(
                      prescription.status
                    )}`}
                  >
                    {prescription.status}
                  </span>
                </td>

                {/* Actions */}

                <td className="px-8 py-6">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      aria-label={`View ${prescription.id}`}
                      className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-violet-100 hover:text-violet-700"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      type="button"
                      aria-label={`Download ${prescription.id}`}
                      className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Cards */}

      <div className="space-y-4 p-6 lg:hidden">
        {prescriptionHistory.map((prescription, index) => (
          <motion.div
            key={prescription.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.06,
              duration: 0.3,
            }}
            className="rounded-[24px] border border-slate-100 bg-slate-50/60 p-5"
          >
            {/* Top */}

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <FileText size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    {prescription.medication}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {prescription.id}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyles(
                  prescription.status
                )}`}
              >
                {prescription.status}
              </span>
            </div>

            {/* Details */}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3">
                <div className="flex items-center gap-2">
                  <UserRound
                    size={15}
                    className="text-slate-400"
                  />

                  <span className="text-xs text-slate-400">
                    Doctor
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {prescription.doctor}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-slate-400"
                  />

                  <span className="text-xs text-slate-400">
                    Date
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {prescription.date}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <div className="flex items-center gap-2">
                  <Clock3
                    size={15}
                    className="text-slate-400"
                  />

                  <span className="text-xs text-slate-400">
                    Duration
                  </span>
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {prescription.duration}
                </p>
              </div>

              <div className="flex items-end justify-end gap-2 rounded-xl bg-white p-3">
                <button
                  type="button"
                  aria-label={`View ${prescription.id}`}
                  className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-violet-100 hover:text-violet-700"
                >
                  <Eye size={17} />
                </button>

                <button
                  type="button"
                  aria-label={`Download ${prescription.id}`}
                  className="rounded-xl bg-slate-100 p-3 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <Download size={17} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}

      <div className="border-t border-slate-100 px-8 py-5">
        <p className="text-xs leading-5 text-slate-400">
          Prescription documents are stored securely in your medical record.
          Downloaded documents should be kept private and shared only with
          authorized healthcare professionals.
        </p>
      </div>
    </motion.section>
  );
}