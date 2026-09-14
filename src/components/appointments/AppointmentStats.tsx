"use client";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import SmallStatCard from "@/components/dashboard/SmallStatCard";

export default function AppointmentStats() {
  return (
    <div className="grid gap-8 md:grid-cols-2 2xl:grid-cols-4">

      <SmallStatCard
        title="Upcoming"
        value="12"
        icon={CalendarClock}
        color="bg-gradient-to-br from-violet-600 to-indigo-500"
        percentage="+8%"
      />

      <SmallStatCard
        title="Completed"
        value="148"
        icon={CheckCircle2}
        color="bg-gradient-to-br from-emerald-500 to-green-400"
        percentage="+12%"
      />

      <SmallStatCard
        title="Pending"
        value="5"
        icon={Clock3}
        color="bg-gradient-to-br from-amber-400 to-orange-500"
        percentage="+3%"
      />

      <SmallStatCard
        title="Cancelled"
        value="2"
        icon={XCircle}
        color="bg-gradient-to-br from-rose-500 to-red-500"
        percentage="-1%"
      />

    </div>
  );
}