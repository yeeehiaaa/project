"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  FileCheck,
  FileHeart,
  ScanLine,
} from "lucide-react";

const documents = [
  {
    title: "Blood Test Report",
    type: "Laboratory",
    date: "30 Jul 2026",
    icon: FileCheck,
    color: "from-cyan-500 to-blue-500",
  },
  {
    title: "Prescription",
    type: "Medication",
    date: "29 Jul 2026",
    icon: FileHeart,
    color: "from-violet-600 to-indigo-600",
  },
  {
    title: "Chest X-Ray",
    type: "Radiology",
    date: "14 Jul 2026",
    icon: ScanLine,
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Consultation Report",
    type: "Medical Report",
    date: "10 Jul 2026",
    icon: FileText,
    color: "from-orange-500 to-red-500",
  },
];

export default function MedicalDocuments() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
          Documents
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Medical Documents
        </h2>
      </div>

      <div className="space-y-5">
        {documents.map((doc, index) => {
          const Icon = doc.icon;

          return (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-slate-50 p-6 transition hover:border-violet-200 hover:shadow-lg lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${doc.color} text-white shadow-lg`}
                >
                  <Icon size={28} />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {doc.title}
                  </h3>

                  <p className="mt-1 text-slate-500">
                    {doc.type}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {doc.date}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex items-center gap-2 rounded-2xl bg-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-300">
                  <Eye size={18} />
                  Preview
                </button>

                <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 font-medium text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                  <Download size={18} />
                  Download
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}