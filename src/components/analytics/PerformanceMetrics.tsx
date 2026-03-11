"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Clock, Target, DollarSign, BarChart3, Star, TrendingUp, TrendingDown,
} from "lucide-react";
import type { AnalyticsData } from "@/types/analytics";

interface Props {
  data: AnalyticsData;
}

export function PerformanceMetrics({ data }: Props) {
  const avgDealSize = data.projects.total > 0
    ? Math.round(data.revenue.total / data.projects.total)
    : 0;

  // Only compute date client-side to avoid hydration mismatch
  const [projectsPerMonth, setProjectsPerMonth] = useState("0.0");
  
  useEffect(() => {
    const now = new Date();
    const value = data.projects.total > 0
      ? (data.projects.total / Math.max(now.getMonth() + 1, 1)).toFixed(1)
      : "0.0";
    setProjectsPerMonth(value);
  }, [data.projects.total]);

  const metrics = [
    {
      label: "Avg Project Duration",
      value: `${data.projects.averageDuration} days`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: null,
    },
    {
      label: "Win Rate",
      value: `${data.projects.conversionRate}%`,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: data.projects.conversionRate >= 50 ? "up" : "down",
    },
    {
      label: "Avg Deal Size",
      value: `$${avgDealSize.toLocaleString()}`,
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
      trend: data.revenue.comparison.percentage >= 0 ? "up" : "down",
    },
    {
      label: "Projects / Month",
      value: projectsPerMonth,
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: null,
    },
    {
      label: "YoY Growth",
      value: `${data.trends.growthRate >= 0 ? "+" : ""}${data.trends.growthRate}%`,
      icon: data.trends.growthRate >= 0 ? TrendingUp : TrendingDown,
      color: data.trends.growthRate >= 0 ? "text-emerald-600" : "text-red-500",
      bg: data.trends.growthRate >= 0 ? "bg-emerald-50" : "bg-red-50",
      trend: data.trends.growthRate >= 0 ? "up" : "down",
    },
    {
      label: "Active Clients",
      value: data.clients.total,
      icon: Star,
      color: "text-coral-500",
      bg: "bg-coral-50",
      trend: data.clients.new > 0 ? "up" : null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5">Performance Metrics</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {metrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + idx * 0.05 }}
            className="p-4 bg-zinc-50/60 rounded-xl hover:bg-zinc-100/60 transition-colors"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${m.bg}`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className="text-xl font-bold text-zinc-900">{m.value}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{m.label}</p>
            {m.trend && (
              <div className={`flex items-center gap-0.5 mt-1 text-xs font-medium ${m.trend === "up" ? "text-emerald-500" : "text-red-400"}`}>
                {m.trend === "up"
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                <span>{m.trend === "up" ? "Trending up" : "Trending down"}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
