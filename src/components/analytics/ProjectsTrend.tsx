"use client";

import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { MonthlySeasonalData } from "@/types/analytics";

interface Props {
  data: MonthlySeasonalData[];
  peakMonth: string;
  lowMonth: string;
  growthRate: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-zinc-800 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.stroke }} />
          <span className="text-zinc-500">{p.name}:</span>
          <span className="font-semibold text-zinc-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ProjectsTrend({ data, peakMonth, lowMonth, growthRate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Projects Trend</p>
          <p className="text-sm text-zinc-500">Monthly project & revenue activity</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="text-center">
            <p className="text-zinc-400 font-medium">Peak</p>
            <p className="font-bold text-emerald-600">{peakMonth}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 font-medium">Low</p>
            <p className="font-bold text-amber-500">{lowMonth}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 font-medium">YoY Growth</p>
            <p className={`font-bold ${growthRate >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {growthRate >= 0 ? "+" : ""}{growthRate}%
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="projects"
            orientation="left"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-zinc-500 font-medium">{value}</span>}
          />
          <Line
            yAxisId="projects"
            type="monotone"
            dataKey="projects"
            name="Projects"
            stroke="#ff856a"
            strokeWidth={2}
            dot={{ r: 3, fill: "#ff856a" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Revenue ($)"
            stroke="#8B5CF6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "#8B5CF6" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
