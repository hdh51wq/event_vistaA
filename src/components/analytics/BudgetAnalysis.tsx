"use client";

import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DollarSign } from "lucide-react";
import type { BudgetAnalytics } from "@/types/analytics";

const CATEGORY_COLORS = [
  "#ff856a","#3B82F6","#8B5CF6","#10B981","#f59e0b","#EC4899","#6B7280"
];

interface Props {
  data: BudgetAnalytics;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-zinc-800 mb-1">{label}</p>
      <p className="text-zinc-500">${payload[0].value.toLocaleString()}</p>
      <p className="text-zinc-400">{payload[0].payload.percentage}% of budget</p>
    </div>
  );
};

export function BudgetAnalysis({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Budget Breakdown</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Avg per Project</p>
              <p className="font-bold text-zinc-900">${data.average.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="text-zinc-400 font-medium">vs Estimate</p>
          <p className={`font-bold ${data.actualVsBudget >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {data.actualVsBudget >= 0 ? "+" : ""}{data.actualVsBudget}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data.byCategory} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <YAxis
            dataKey="category"
            type="category"
            tick={{ fontSize: 10, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {data.byCategory.map((entry, i) => (
              <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
