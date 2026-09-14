"use client";

import { motion } from "framer-motion";
import {
  Search,
  Filter,
  CalendarDays,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";

export default function LaboratoryFilters() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[34px] border border-slate-100 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end">

        {/* Search */}

        <div className="flex-1">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Search size={16} />
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search laboratory test..."
              className="
                h-14
                w-full
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                pl-14
                pr-5
                text-sm
                outline-none
                transition
                focus:border-cyan-500
                focus:bg-white
              "
            />
          </div>
        </div>

        {/* Test Type */}

        <div className="w-full xl:w-64">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <FlaskConical size={16} />
            Test Type
          </label>

          <select
            className="
              h-14
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              text-sm
              outline-none
              transition
              focus:border-cyan-500
              focus:bg-white
            "
          >
            <option>All Tests</option>
            <option>Blood Analysis</option>
            <option>Urine Test</option>
            <option>Vitamin Test</option>
            <option>Hormone Test</option>
            <option>Radiology</option>
          </select>
        </div>

        {/* Status */}

        <div className="w-full xl:w-56">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CheckCircle2 size={16} />
            Status
          </label>

          <select
            className="
              h-14
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              text-sm
              outline-none
              transition
              focus:border-cyan-500
              focus:bg-white
            "
          >
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Critical</option>
          </select>
        </div>

        {/* Date */}

        <div className="w-full xl:w-56">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays size={16} />
            Date
          </label>

          <input
            type="date"
            className="
              h-14
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              text-sm
              outline-none
              transition
              focus:border-cyan-500
              focus:bg-white
            "
          />
        </div>

        {/* Filter Button */}

        <button
          className="
            flex
            h-14
            items-center
            justify-center
            gap-3
            rounded-2xl
            bg-gradient-to-r
            from-cyan-600
            to-blue-600
            px-8
            font-semibold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
          "
        >
          <Filter size={18} />
          Apply
        </button>
      </div>
    </motion.section>
  );
}