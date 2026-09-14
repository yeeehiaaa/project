"use client";

import { motion } from "framer-motion";
import {
  Activity,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", glucose: 112, cholesterol: 228 },
  { month: "Feb", glucose: 108, cholesterol: 223 },
  { month: "Mar", glucose: 105, cholesterol: 219 },
  { month: "Apr", glucose: 101, cholesterol: 216 },
  { month: "May", glucose: 99, cholesterol: 214 },
  { month: "Jun", glucose: 97, cholesterol: 213 },
  { month: "Jul", glucose: 95, cholesterol: 212 },
];

export default function HealthTrendChart() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-[34px] border border-slate-100 bg-white p-8 shadow-sm"
    >
      {/* Header */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[3px] text-cyan-600">
            Health Analytics
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Health Trend
          </h2>

          <p className="mt-2 text-slate-500">
            Evolution of your laboratory values over the last seven months.
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-100 text-cyan-600">
          <Activity size={30} />
        </div>
      </div>

      {/* Legend */}

      <div className="mb-8 flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-cyan-500" />

          <span className="text-sm font-medium text-slate-600">
            Blood Glucose
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-violet-500" />

          <span className="text-sm font-medium text-slate-600">
            Cholesterol
          </span>
        </div>
      </div>

      {/* Chart */}

      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#64748b", fontSize: 13 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "none",
                boxShadow: "0 12px 30px rgba(0,0,0,.08)",
              }}
            />

            <Line
              type="monotone"
              dataKey="glucose"
              stroke="#06b6d4"
              strokeWidth={4}
              dot={{
                r: 5,
                fill: "#06b6d4",
              }}
              activeDot={{
                r: 7,
              }}
            />

            <Line
              type="monotone"
              dataKey="cholesterol"
              stroke="#8b5cf6"
              strokeWidth={4}
              dot={{
                r: 5,
                fill: "#8b5cf6",
              }}
              activeDot={{
                r: 7,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl bg-cyan-50 p-5">
          <div className="flex items-center gap-3">
            <TrendingUp
              size={22}
              className="text-cyan-600"
            />

            <h3 className="font-bold text-slate-900">
              Blood Glucose
            </h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your blood glucose has gradually improved during the last
            seven months and is now within the recommended range.
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 p-5">
          <div className="flex items-center gap-3">
            <TrendingUp
              size={22}
              className="text-violet-600"
            />

            <h3 className="font-bold text-slate-900">
              Cholesterol
            </h3>
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Cholesterol levels continue to decrease thanks to your
            treatment and healthier lifestyle.
          </p>
        </div>
      </div>
    </motion.section>
  );
}