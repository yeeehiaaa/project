"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  MapPin,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function UpcomingLab() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="overflow-hidden rounded-[34px] bg-white shadow-sm"
    >
      <div className="grid lg:grid-cols-[1.4fr_380px]">
        {/* Left */}

        <div className="p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
              <FlaskConical size={30} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Upcoming Laboratory Test
              </h2>

              <p className="mt-1 text-slate-500">
                Your next scheduled examination
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <CalendarDays
                size={22}
                className="mb-3 text-cyan-600"
              />

              <p className="text-sm text-slate-500">
                Date
              </p>

              <h3 className="mt-2 text-lg font-bold text-slate-900">
                12 August 2026
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <Clock3
                size={22}
                className="mb-3 text-cyan-600"
              />

              <p className="text-sm text-slate-500">
                Time
              </p>

              <h3 className="mt-2 text-lg font-bold text-slate-900">
                09:30 AM
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <MapPin
                size={22}
                className="mb-3 text-cyan-600"
              />

              <p className="text-sm text-slate-500">
                Laboratory
              </p>

              <h3 className="mt-2 text-lg font-bold text-slate-900">
                Central Medical Lab
              </h3>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-cyan-100 bg-cyan-50 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck
                size={24}
                className="text-cyan-600"
              />

              <h3 className="text-lg font-bold text-slate-900">
                Preparation Instructions
              </h3>
            </div>

            <ul className="mt-5 space-y-3 text-slate-600">
              <li>• Fast for at least 8 hours before your blood test.</li>
              <li>• Drink plenty of water before arriving.</li>
              <li>• Bring your medical prescription and ID.</li>
              <li>• Continue medications only if advised by your physician.</li>
            </ul>
          </div>
        </div>

        {/* Right */}

        <div className="flex flex-col justify-between bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-8 text-white">
          <div>
            <p className="text-sm uppercase tracking-[3px] text-cyan-100">
              Appointment Status
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Confirmed
            </h2>

            <p className="mt-5 leading-7 text-cyan-100">
              Your laboratory appointment has been successfully confirmed.
              Please arrive approximately 15 minutes before your scheduled
              time.
            </p>
          </div>

          <div>
            <div className="mb-3 flex justify-between text-sm">
              <span>Preparation</span>
              <span>90%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "90%" }}
                transition={{
                  duration: 1,
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <button className="mt-8 flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-semibold text-cyan-700 transition hover:scale-[1.02]">
              View Appointment

              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}