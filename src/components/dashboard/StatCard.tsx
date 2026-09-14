import { LucideIcon, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon className="text-white" size={28} />
        </div>

        <div className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-600">
          <TrendingUp size={15} />
          {change}
        </div>

      </div>

      <h3 className="mt-6 text-sm text-gray-500">
        {title}
      </h3>

      <h2 className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </h2>

    </div>
  );
}