"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const glucoseData = [
  { month: "Jan", value: 108 },
  { month: "Feb", value: 112 },
  { month: "Mar", value: 118 },
  { month: "Apr", value: 115 },
  { month: "May", value: 110 },
  { month: "Jun", value: 104 },
];

const cholesterolData = [
  { month: "Jan", value: 198 },
  { month: "Feb", value: 194 },
  { month: "Mar", value: 188 },
  { month: "Apr", value: 183 },
  { month: "May", value: 180 },
  { month: "Jun", value: 176 },
];

const hemoglobinData = [
  { month: "Jan", value: 13.1 },
  { month: "Feb", value: 13.3 },
  { month: "Mar", value: 13.4 },
  { month: "Apr", value: 13.8 },
  { month: "May", value: 14.1 },
  { month: "Jun", value: 14.2 },
];

const vitaminDData = [
  { month: "Jan", value: 19 },
  { month: "Feb", value: 21 },
  { month: "Mar", value: 25 },
  { month: "Apr", value: 28 },
  { month: "May", value: 32 },
  { month: "Jun", value: 37 },
];

const charts = [
  {
    title: "Blood Glucose",
    subtitle: "mg/dL",
    color: "#06B6D4",
    data: glucoseData,
  },
  {
    title: "Cholesterol",
    subtitle: "mg/dL",
    color: "#7C3AED",
    data: cholesterolData,
  },
  {
    title: "Hemoglobin",
    subtitle: "g/dL",
    color: "#10B981",
    data: hemoglobinData,
  },
  {
    title: "Vitamin D",
    subtitle: "ng/mL",
    color: "#F97316",
    data: vitaminDData,
  },
];

export default function HealthTrends() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Health Trends
        </h2>

        <p className="mt-2 text-slate-500">
          Monitor the evolution of your laboratory values over time.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {charts.map((chart, index) => (
          <motion.div
            key={chart.title}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: index * 0.08,
            }}
            className="rounded-[32px] bg-white p-7 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {chart.title}
                </h3>

                <p className="text-sm text-slate-500">
                  {chart.subtitle}
                </p>
              </div>

              <div
                className="h-4 w-4 rounded-full"
                style={{
                  background: chart.color,
                }}
              />
            </div>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={chart.data}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="#E2E8F0"
                  />

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chart.color}
                    strokeWidth={4}
                    dot={{
                      r: 5,
                    }}
                    activeDot={{
                      r: 8,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}