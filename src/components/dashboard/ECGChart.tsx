"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";

const data = [
  { day: "Mon", heart: 72 },
  { day: "Tue", heart: 76 },
  { day: "Wed", heart: 73 },
  { day: "Thu", heart: 81 },
  { day: "Fri", heart: 77 },
  { day: "Sat", heart: 75 },
  { day: "Sun", heart: 74 },
];

export default function ECGChart() {
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-gray-100">

      {/* Header */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="text-sm font-medium text-violet-600">
            Weekly Analytics
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Heart Rate Monitoring
          </h2>

          <p className="mt-2 text-gray-500">
            Your average heart rate remains stable.
          </p>
        </div>

        <div className="flex gap-2">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
            Week
          </button>

          <button className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-200">
            Month
          </button>

          <button className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-200">
            Year
          </button>

        </div>

      </div>

      {/* Mini Stats */}

      <div className="mt-8 grid grid-cols-3 gap-4">

        <div className="rounded-2xl bg-violet-50 p-4">
          <p className="text-sm text-gray-500">Average</p>
          <h3 className="mt-1 text-2xl font-bold">74 bpm</h3>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm text-gray-500">Highest</p>
          <h3 className="mt-1 text-2xl font-bold">81 bpm</h3>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-sm text-gray-500">Lowest</p>
          <h3 className="mt-1 text-2xl font-bold">72 bpm</h3>
        </div>

      </div>

      {/* Chart */}

      <div className="mt-8 h-[340px]">

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>

            <defs>

              <linearGradient
                id="heartGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#7C3AED"
                  stopOpacity={0.35}
                />

                <stop
                  offset="100%"
                  stopColor="#7C3AED"
                  stopOpacity={0}
                />

              </linearGradient>

            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#E5E7EB"
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="heart"
              stroke="#7C3AED"
              strokeWidth={4}
              fill="url(#heartGradient)"
            />

          </AreaChart>
        </ResponsiveContainer>

      </div>

    </section>
  );
}