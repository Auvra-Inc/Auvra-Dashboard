import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function DashboardCard({ title, value, subtitle, trend, trendValue }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-zinc-200/60 p-6 flex flex-col items-center text-center">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-600 tracking-wide">{title}</h3>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl font-semibold text-zinc-900 tracking-tight">{value}</span>
        
        {trend && trend !== "neutral" && (
          <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs font-medium text-zinc-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}