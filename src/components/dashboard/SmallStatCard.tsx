"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface SmallStatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  percentage: string;
}

const data = [
  { v: 30 },
  { v: 45 },
  { v: 40 },
  { v: 58 },
  { v: 54 },
  { v: 68 },
  { v: 64 },
];

export default function SmallStatCard({
  title,
  value,
  icon: Icon,
  color,
  percentage,
}: SmallStatCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon
            size={26}
            className="text-white"
          />
        </div>

        <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          <TrendingUp size={14} />
          {percentage}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          {value}
        </h2>
      </div>

      <div className="mt-5 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`gradient-${title}`}
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

            <Area
              type="monotone"
              dataKey="v"
              stroke="#7C3AED"
              strokeWidth={3}
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Last 7 days
        </span>

        <button className="text-sm font-semibold text-violet-600 hover:text-violet-700">
          View →
        </button>
      </div>
    </motion.div>
  );
}