"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const days = [
  28, 29, 30, 31,
  1, 2, 3,
  4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31,
];

const timeSlots = [
  "09:00 AM",
  "10:30 AM",
  "11:30 AM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
];

export default function AppointmentCalendar() {
  return (
    <div className="rounded-[34px] bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">

      {/* Header */}

      <div className="mb-8 flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            Calendar
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            August 2026
          </h2>

        </div>

        <div className="flex gap-3">

          <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition hover:bg-violet-100">
            <ChevronLeft size={18} />
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition hover:bg-violet-100">
            <ChevronRight size={18} />
          </button>

        </div>

      </div>

      {/* Week */}

      <div className="mb-4 grid grid-cols-7">

        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-slate-500"
          >
            {day}
          </div>
        ))}

      </div>

      {/* Days */}

      <div className="grid grid-cols-7 gap-3">

        {days.map((day, index) => {

          const active = day === 14;

          return (

            <button
              key={index}
              className={`
                h-14
                rounded-2xl
                text-sm
                font-semibold
                transition-all
                duration-300
                ${
                  active
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg"
                    : "bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                }
              `}
            >
              {day}
            </button>

          );
        })}

      </div>

      {/* Available Times */}

      <div className="mt-10">

        <div className="mb-5 flex items-center gap-2">

          <Clock3
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-bold text-slate-900">
            Available Time Slots
          </h3>

        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {timeSlots.map((time) => (

            <button
              key={time}
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                py-4
                text-sm
                font-semibold
                text-slate-700
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-violet-300
                hover:bg-violet-50
                hover:text-violet-700
                hover:shadow-md
              "
            >
              {time}
            </button>

          ))}

        </div>

      </div>

    </div>
  );
}