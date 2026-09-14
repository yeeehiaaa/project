"use client";

import {
  Search,
  MoreHorizontal,
  CalendarDays,
} from "lucide-react";

const appointments = [
  {
    doctor: "Dr. Ahmed Benali",
    specialty: "Cardiologist",
    date: "14 Aug 2026",
    time: "10:30 AM",
    status: "Upcoming",
  },
  {
    doctor: "Dr. Sarah Martin",
    specialty: "Dermatologist",
    date: "15 Aug 2026",
    time: "02:00 PM",
    status: "Completed",
  },
  {
    doctor: "Dr. Karim Haddad",
    specialty: "Neurologist",
    date: "17 Aug 2026",
    time: "09:00 AM",
    status: "Pending",
  },
  {
    doctor: "Dr. Lina Bensaid",
    specialty: "Dentist",
    date: "19 Aug 2026",
    time: "04:00 PM",
    status: "Cancelled",
  },
];

export default function AppointmentTable() {
  return (
    <div className="rounded-[34px] bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl">

      {/* Header */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="text-sm text-slate-500">
            Appointment History
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Recent Appointments
          </h2>

        </div>

        {/* Search */}

        <div className="relative w-full max-w-sm">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search appointment..."
            className="h-12 w-full rounded-2xl bg-slate-100 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-violet-500"
          />

        </div>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-100 text-left text-sm text-slate-500">

              <th className="pb-4">Doctor</th>

              <th className="pb-4">Date</th>

              <th className="pb-4">Time</th>

              <th className="pb-4">Status</th>

              <th className="pb-4"></th>

            </tr>

          </thead>

          <tbody>

            {appointments.map((appointment) => (

              <tr
                key={appointment.doctor}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >

                {/* Doctor */}

                <td className="py-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">

                      <CalendarDays
                        className="text-violet-600"
                        size={20}
                      />

                    </div>

                    <div>

                      <h3 className="font-semibold text-slate-900">
                        {appointment.doctor}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {appointment.specialty}
                      </p>

                    </div>

                  </div>

                </td>

                <td className="py-5 font-medium">
                  {appointment.date}
                </td>

                <td className="py-5">
                  {appointment.time}
                </td>

                <td className="py-5">

                  <span
                    className={`
                    rounded-full
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    ${
                      appointment.status === "Upcoming"
                        ? "bg-violet-100 text-violet-700"
                        : appointment.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : appointment.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                  >
                    {appointment.status}
                  </span>

                </td>

                <td className="py-5">

                  <button className="rounded-xl p-2 transition hover:bg-slate-100">

                    <MoreHorizontal size={18} />

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}