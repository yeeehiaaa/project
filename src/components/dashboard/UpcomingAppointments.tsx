"use client";

import { CalendarDays, Clock3, Video } from "lucide-react";

const appointments = [
  {
    doctor: "Dr. Ahmed Benali",
    specialty: "Cardiologist",
    date: "Tomorrow",
    time: "10:30 AM",
  },
  {
    doctor: "Dr. Sarah Ali",
    specialty: "General Practitioner",
    date: "Friday",
    time: "02:00 PM",
  },
];

export default function UpcomingAppointments() {
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-violet-600">
            Schedule
          </p>

          <h2 className="text-2xl font-bold text-gray-900">
            Upcoming Appointments
          </h2>
        </div>

        <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
          View All
        </button>
      </div>

      <div className="space-y-5">
        {appointments.map((item) => (
          <div
            key={item.doctor}
            className="flex items-center justify-between rounded-2xl bg-gray-50 p-5 transition hover:bg-violet-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <CalendarDays className="text-violet-600" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  {item.doctor}
                </h3>

                <p className="text-sm text-gray-500">
                  {item.specialty}
                </p>

                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={15} />
                    {item.date}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock3 size={15} />
                    {item.time}
                  </span>
                </div>
              </div>
            </div>

            <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-white transition hover:bg-violet-700">
              <Video size={16} />
              Join
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}