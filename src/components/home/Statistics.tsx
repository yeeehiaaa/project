"use client";

import {
  Users,
  Stethoscope,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    number: "120K+",
    title: "Patients",
    description: "Patients registered on the platform",
  },
  {
    icon: Stethoscope,
    number: "250+",
    title: "Doctors",
    description: "Certified healthcare professionals",
  },
  {
    icon: CalendarCheck,
    number: "80K+",
    title: "Appointments",
    description: "Appointments successfully completed",
  },
  {
    icon: ShieldCheck,
    number: "99.9%",
    title: "Security",
    description: "Medical data protection",
  },
];

export default function Statistics() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            Our Numbers
          </span>

          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Trusted by Thousands
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            MediConnect AI simplifies healthcare for patients,
            doctors, pharmacies and laboratories.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-3xl border border-gray-100 bg-white p-8 shadow-lg transition duration-300 hover:-translate-y-2 hover:border-violet-300 hover:shadow-2xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                  <Icon size={30} />
                </div>

                <h3 className="mt-8 text-4xl font-extrabold text-gray-900">
                  {item.number}
                </h3>

                <h4 className="mt-3 text-xl font-semibold text-gray-800">
                  {item.title}
                </h4>

                <p className="mt-3 leading-7 text-gray-500">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}