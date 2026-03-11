"use client";

import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { FolderOpen, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import type { ProjectAnalytics } from "@/types/analytics";

const STATUS_COLORS: Record<string, string> = {
  Draft:         "#a1a1aa",
  "In Progress": "#3B82F6",
  Review:        "#f59e0b",
  Final:         "#10B981",
};

interface Props {
  data: ProjectAnalytics;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-zinc-800">{d.status}</p>
      <p className="text-zinc-500">{d.count} projects</p>
    </div>
  );
};

export function ProjectsOverview({ data }: Props) {
  const metrics = [
    { label: "Total Projects",    value: data.total,          icon: FolderOpen,    color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Completed",         value: data.completed,      icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "In Progress",       value: data.inProgress,     icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50" },
    { label: "Completion Rate",   value: `${data.conversionRate}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Projects Overview</p>

      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={72}
                innerRadius={42}
              >
                {data.byStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#a1a1aa"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {data.byStatus.map((entry) => (
            <div key={entry.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[entry.status] || "#a1a1aa" }}
                />
                <span className="text-zinc-600 text-xs font-medium">{entry.status}</span>
              </div>
              <span className="font-bold text-zinc-800 text-xs">{entry.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-zinc-100">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.bg}`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">{m.label}</p>
              <p className="font-bold text-zinc-800 text-sm">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
