"use client";

import { motion } from "framer-motion";
import { FlaskConical, ShieldCheck, Sparkles } from "lucide-react";

export default function LaboratoryHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-10 text-white shadow-xl"
    >
      {/* Background Glow */}

      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
        {/* Left */}

        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-md">
            <Sparkles size={16} />

            <span className="text-sm font-semibold tracking-wide">
              Smart Laboratory Center
            </span>
          </div>

          <h1 className="text-5xl font-extrabold leading-tight">
            Laboratory
            <br />
            <span className="text-cyan-100">
              Results & Diagnostics
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-cyan-100">
            Access all your laboratory analyses, monitor important health
            indicators, download reports and follow the evolution of your
            medical results over time.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-md">
              <p className="text-sm text-cyan-100">
                Total Reports
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                24
              </h3>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-md">
              <p className="text-sm text-cyan-100">
                Last Analysis
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                30 Jul 2026
              </h3>
            </div>

            <div className="rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-md">
              <p className="text-sm text-cyan-100">
                Overall Status
              </p>

              <h3 className="mt-1 flex items-center gap-2 text-2xl font-bold">
                <ShieldCheck size={22} />
                Healthy
              </h3>
            </div>
          </div>
        </div>

        {/* Right */}

        <motion.div
          animate={{
            y: [0, -12, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
          }}
          className="flex justify-center"
        >
          <div className="flex h-64 w-64 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl">
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-white text-cyan-600 shadow-2xl">
              <FlaskConical size={90} strokeWidth={1.7} />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}