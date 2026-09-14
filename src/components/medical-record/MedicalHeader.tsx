"use client";

import { motion } from "framer-motion";
import {
  FileHeart,
  CalendarDays,
  Download,
  Share2,
} from "lucide-react";

export default function MedicalHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[34px] bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}

        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
            <FileHeart size={38} className="text-white" />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[3px] text-violet-600">
              MediConnect AI
            </p>

            <h1 className="mt-1 text-4xl font-bold text-slate-900">
              Medical Record
            </h1>

            <div className="mt-3 flex items-center gap-2 text-slate-500">
              <CalendarDays size={18} />

              <span className="text-sm">
                Last updated: July 29, 2026
              </span>
            </div>
          </div>
        </div>

        {/* Right */}

        <div className="flex flex-wrap gap-4">
          <button
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-6
              py-4
              font-semibold
              text-slate-700
              shadow-sm
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-violet-200
              hover:text-violet-600
              hover:shadow-lg
            "
          >
            <Share2 size={20} />

            Share Record
          </button>

          <button
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              bg-gradient-to-r
              from-violet-600
              to-indigo-600
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
            <Download size={20} />

            Download PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
}