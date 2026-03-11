"use client";

import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { EventTypeData } from "@/types/analytics";

const TYPE_COLORS: Record<string, string> = {
  Corporate:  "#3B82F6",
  Wedding:    "#EC4899",
  Gala:       "#8B5CF6",
  Conference: "#10B981",
  Other:      "#6B7280",
};

interface Props {
  data: EventTypeData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-zinc-800">{d.type}</p>
      <p className="text-zinc-500">${d.amount.toLocaleString()}</p>
      <p className="text-zinc-400">{d.percentage}% of total</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  if (percentage < 8) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${percentage}%`}
    </text>
  );
};

export function RevenueByEventType({ data }: Props) {
  if (!data.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-full min-h-[280px]">
        <p className="text-zinc-400 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Revenue by Event Type</p>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || "#6B7280"} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {data.map((entry) => (
          <div key={entry.type} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLORS[entry.type] || "#6B7280" }}
              />
              <span className="text-zinc-600 font-medium">{entry.type}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-400">{entry.percentage}%</span>
              <span className="font-semibold text-zinc-700">${entry.amount.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
