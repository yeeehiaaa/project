"use client";

import {
  CalendarDays,
  Clock3,
  Video,
  MapPin,
  ChevronRight,
} from "lucide-react";

const appointments = [
  {
    doctor: "Dr. Ahmed Benali",
    specialty: "Cardiologist",
    date: "Tomorrow",
    time: "10:30 AM",
    location: "Video Consultation",
    avatar: "/avatars/doctor1.jpg",
    color: "from-violet-600 to-indigo-600",
  },
  {
    doctor: "Dr. Sarah Martin",
    specialty: "Dermatologist",
    date: "Friday",
    time: "02:00 PM",
    location: "Medical Center",
    avatar: "/avatars/doctor2.jpg",
    color: "from-emerald-500 to-green-400",
  },
];

export default function UpcomingAppointments() {
  return (
    <div className="space-y-6">

      {/* Upcoming */}

      <div className="rounded-[34px] bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-xl">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-900">
            Upcoming
          </h2>

          <button className="rounded-xl bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-100">
            View All
          </button>

        </div>

        <div className="space-y-5">

          {appointments.map((appointment) => (

            <div
              key={appointment.doctor}
              className="rounded-3xl border border-slate-100 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="flex items-center gap-4">

                <img
                  src={appointment.avatar}
                  alt={appointment.doctor}
                  className="h-16 w-16 rounded-2xl object-cover"
                />

                <div>

                  <h3 className="font-bold text-slate-900">
                    {appointment.doctor}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {appointment.specialty}
                  </p>

                </div>

              </div>

              <div className="mt-6 space-y-3">

                <div className="flex items-center gap-3 text-sm text-slate-600">

                  <CalendarDays
                    size={17}
                    className="text-violet-600"
                  />

                  {appointment.date}

                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600">

                  <Clock3
                    size={17}
                    className="text-violet-600"
                  />

                  {appointment.time}

                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600">

                  <MapPin
                    size={17}
                    className="text-violet-600"
                  />

                  {appointment.location}

                </div>

              </div>

              <button
                className={`
                  mt-6
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-gradient-to-r
                  ${appointment.color}
                  py-3
                  font-semibold
                  text-white
                  shadow-lg
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-xl
                `}
              >
                <Video size={18} />

                Join Consultation

              </button>

            </div>

          ))}

        </div>

      </div>

      {/* Quick Actions */}

      <div className="rounded-[34px] bg-gradient-to-br from-violet-600 to-indigo-600 p-7 text-white shadow-xl">

        <h2 className="text-xl font-bold">
          Quick Actions
        </h2>

        <div className="mt-6 space-y-3">

          <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-5 py-4 transition hover:bg-white/20">

            Book New Appointment

            <ChevronRight size={18} />

          </button>

          <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-5 py-4 transition hover:bg-white/20">

            Find a Specialist

            <ChevronRight size={18} />

          </button>

          <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-5 py-4 transition hover:bg-white/20">

            Medical History

            <ChevronRight size={18} />

          </button>

        </div>

      </div>

    </div>
  );
}