"use client";

import {
  Activity,
  HeartPulse,
  Droplets,
  Weight,
} from "lucide-react";

const stats = [
  {
    title: "Blood Pressure",
    value: "120 / 80",
    icon: Activity,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Heart Rate",
    value: "72 bpm",
    icon: HeartPulse,
    color: "bg-red-100 text-red-500",
  },
  {
    title: "Oxygen",
    value: "98%",
    icon: Droplets,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    title: "Weight",
    value: "71 kg",
    icon: Weight,
    color: "bg-green-100 text-green-600",
  },
];

export default function HealthOverview() {
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-gray-100">
      <div className="mb-6">
        <p className="text-sm font-medium text-violet-600">
          Daily Overview
        </p>

        <h2 className="text-2xl font-bold text-gray-900">
          Health Overview
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-violet-50"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon size={22} />
              </div>

              <p className="text-sm text-gray-500">
                {item.title}
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {item.value}
              </h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}