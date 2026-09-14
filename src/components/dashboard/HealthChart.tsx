"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { day: "Mon", value: 72 },
  { day: "Tue", value: 74 },
  { day: "Wed", value: 71 },
  { day: "Thu", value: 76 },
  { day: "Fri", value: 75 },
  { day: "Sat", value: 73 },
  { day: "Sun", value: 72 },
];

export default function HealthChart() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Health Trends
          </h2>

          <p className="text-sm text-gray-500">
            Heart rate over the last 7 days
          </p>
        </div>

        <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
          Average 73 bpm
        </span>

      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="day" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#7C3AED"
            strokeWidth={4}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
          />

        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}