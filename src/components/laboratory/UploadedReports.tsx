"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  Calendar,
  HardDrive,
  FileCheck,
} from "lucide-react";

const reports = [
  {
    id: 1,
    name: "Complete Blood Count.pdf",
    laboratory: "MediLab Center",
    date: "30 Jul 2026",
    size: "2.3 MB",
    type: "Blood Analysis",
  },
  {
    id: 2,
    name: "Urine Analysis.pdf",
    laboratory: "HealthLab",
    date: "21 Jul 2026",
    size: "1.7 MB",
    type: "Urine Test",
  },
  {
    id: 3,
    name: "Vitamin D Report.pdf",
    laboratory: "BioLab Diagnostics",
    date: "14 Jul 2026",
    size: "2.9 MB",
    type: "Vitamin Test",
  },
  {
    id: 4,
    name: "Lipid Profile.pdf",
    laboratory: "Central Laboratory",
    date: "05 Jul 2026",
    size: "3.4 MB",
    type: "Cholesterol",
  },
];

export default function UploadedReports() {
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
            Documents
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Laboratory Reports
          </h2>

          <p className="mt-2 text-slate-500">
            View, download or upload your laboratory reports.
          </p>
        </div>

        <button
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            bg-gradient-to-r
            from-cyan-600
            to-blue-600
            px-6
            py-4
            font-semibold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
          "
        >
          <Upload size={20} />
          Upload Report
        </button>
      </div>

      {/* Reports */}

      <div className="space-y-5 p-8">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.08,
            }}
            whileHover={{
              y: -3,
            }}
            className="
              flex
              flex-col
              gap-6
              rounded-[28px]
              border
              border-slate-100
              p-6
              transition-all
              duration-300
              hover:border-cyan-200
              hover:shadow-lg
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            {/* Left */}

            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-600">
                <FileText size={32} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {report.name}
                </h3>

                <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <FileCheck size={16} />
                    {report.type}
                  </span>

                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    {report.date}
                  </span>

                  <span className="flex items-center gap-2">
                    <HardDrive size={16} />
                    {report.size}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  {report.laboratory}
                </p>
              </div>
            </div>

            {/* Right */}

            <div className="flex gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 transition hover:bg-cyan-100 hover:text-cyan-600">
                <Eye size={19} />
              </button>

              <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 transition hover:bg-cyan-100 hover:text-cyan-600">
                <Download size={19} />
              </button>

              <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition hover:bg-red-100">
                <Trash2 size={19} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}