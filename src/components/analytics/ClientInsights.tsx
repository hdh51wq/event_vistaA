"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserPlus, RefreshCw } from "lucide-react";
import type { ClientAnalytics } from "@/types/analytics";

const INDUSTRY_COLORS = ["#ff856a","#3B82F6","#8B5CF6","#10B981","#f59e0b","#6B7280"];

interface Props {
  data: ClientAnalytics;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-zinc-800">{d.industry}</p>
      <p className="text-zinc-400">{d.percentage}%</p>
    </div>
  );
};

export function ClientInsights({ data }: Props) {
  const retentionRate = data.total > 0
    ? Math.round((data.returning / data.total) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-6"
    >
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Client Insights</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Clients", value: data.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "New Clients", value: data.new, icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Retention Rate", value: `${retentionRate}%`, icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${m.bg}`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className="text-lg font-bold text-zinc-900">{m.value}</p>
            <p className="text-xs text-zinc-400 font-medium">{m.label}</p>
          </div>
        ))}
      </div>

      {data.byIndustry.length > 0 && (
        <>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">By Event Type</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={data.byIndustry}
                  dataKey="percentage"
                  nameKey="industry"
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={30}
                >
                  {data.byIndustry.map((entry, i) => (
                    <Cell key={entry.industry} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {data.byIndustry.map((entry, i) => (
                <div key={entry.industry} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }}
                    />
                    <span className="text-zinc-600 font-medium">{entry.industry}</span>
                  </div>
                  <span className="text-zinc-400 font-semibold">{entry.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
