"use client";

import {
  CalendarDays,
  Clock3,
  Video,
  Pill,
  Sparkles,
  HeartPulse,
  ChevronRight,
} from "lucide-react";

const medications = [
  {
    name: "Paracetamol",
    dosage: "500 mg",
    color: "bg-red-100 text-red-500",
  },
  {
    name: "Vitamin D",
    dosage: "1000 IU",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    name: "Amoxicillin",
    dosage: "250 mg",
    color: "bg-green-100 text-green-600",
  },
];

const recommendations = [
  "Drink at least 2L of water",
  "Walk 30 minutes today",
  "Sleep 8 hours tonight",
];

export default function RightSidebar() {
  return (
<div className="sticky top-6 space-y-6">
  
      {/* Doctor */}

      <div className="rounded-[32px] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl">

        <div className="flex items-center gap-4">

          <img
            src="https://i.pravatar.cc/150?img=12"
            alt="doctor"
            className="h-16 w-16 rounded-full object-cover"
          />

          <div>

            <h2 className="font-bold text-gray-900">
              Dr Ahmed Benali
            </h2>

            <p className="text-sm text-gray-500">
              Cardiologist
            </p>

          </div>

        </div>

        <div className="mt-6 rounded-2xl bg-violet-50 p-5">

          <div className="flex items-center gap-2">

            <CalendarDays
              size={18}
              className="text-violet-600"
            />

            <span className="font-medium">
              Tomorrow
            </span>

          </div>

          <div className="mt-3 flex items-center gap-2">

            <Clock3
              size={18}
              className="text-violet-600"
            />

            <span>
              10:30 AM
            </span>

          </div>

        </div>

        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700">

          <Video size={18} />

          Join Consultation

        </button>

      </div>

      {/* Medications */}

      <div className="rounded-[32px] bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="font-bold text-gray-900">
            Medications
          </h2>

          <ChevronRight size={18} />

        </div>

        <div className="space-y-4">

          {medications.map((med) => (

            <div
              key={med.name}
              className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
            >

              <div className="flex items-center gap-3">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${med.color}`}
                >
                  <Pill size={18} />
                </div>

                <div>

                  <p className="font-semibold">
                    {med.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {med.dosage}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* AI */}

      <div className="rounded-[32px] bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-lg">

        <div className="flex items-center gap-3">

          <Sparkles />

          <h2 className="text-lg font-bold">
            AI Recommendations
          </h2>

        </div>

        <div className="mt-6 space-y-4">

          {recommendations.map((item) => (

            <div
              key={item}
              className="rounded-xl bg-white/10 p-3 backdrop-blur"
            >
              {item}
            </div>

          ))}

        </div>

      </div>

      {/* Health */}

      <div className="rounded-[32px] bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:shadow-xl transition-all duration-300">

        <div className="flex items-center gap-3">

          <HeartPulse className="text-red-500" />

          <h2 className="font-bold">
            Health Status
          </h2>

        </div>

        <div className="mt-6">

          <div className="flex justify-between text-sm">

            <span>Overall</span>

            <span className="font-semibold text-green-600">
              Excellent
            </span>

          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">

            <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />

          </div>

          <p className="mt-4 text-sm text-gray-500">
            AI estimates your health score at
            <span className="ml-1 font-bold text-violet-600">
              92%
            </span>
          </p>

        </div>

      </div>

    </div>
  );
}