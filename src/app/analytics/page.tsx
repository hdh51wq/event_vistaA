"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { RevenueByEventType } from "@/components/analytics/RevenueByEventType";
import { ProjectsOverview } from "@/components/analytics/ProjectsOverview";
import { ProjectsTrend } from "@/components/analytics/ProjectsTrend";
import { TopClients } from "@/components/analytics/TopClients";
import { ClientInsights } from "@/components/analytics/ClientInsights";
import { BudgetAnalysis } from "@/components/analytics/BudgetAnalysis";
import { PerformanceMetrics } from "@/components/analytics/PerformanceMetrics";
import { SeasonalTrends } from "@/components/analytics/SeasonalTrends";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import type { AnalyticsData, AnalyticsFilters as Filters } from "@/types/analytics";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-xl ${className}`} />
  );
}

function SectionSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, token, projects } = useAuth();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    dateRange: "this_year",
    eventType: "all",
    client: "all",
  });

  // Unique clients from local project list for filter dropdown
  const clientList = useMemo(() => {
    const names = projects.map(p => p.client).filter((c): c is string => !!c && c !== "");
    return [...new Set(names)].sort();
  }, [projects]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("dateRange", filters.dateRange);
      if (filters.eventType && filters.eventType !== "all") params.set("eventType", filters.eventType);
      if (filters.client && filters.client !== "all") params.set("client", filters.client);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load analytics");
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    if (isLoggedIn && token) fetchData();
  }, [fetchData, isLoggedIn, token]);

  // ── Export CSV ──
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Month", "Revenue", "Projects"],
      ...data.trends.seasonalData.map(d => [d.month, d.revenue, d.projects]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventvista-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !isLoggedIn) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-coral-100 to-peach-100 dark:from-coral-900/30 dark:to-peach-900/30 rounded-2xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-coral-500" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">Insights and performance metrics for your agency</p>
        </div>
      </div>
      <button
        onClick={fetchData}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm disabled:opacity-50 self-start md:self-auto"
      >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.header>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <AnalyticsFilters
          filters={filters}
          clients={clientList}
          onChange={setFilters}
          onExportCSV={handleExportCSV}
          loading={loading}
        />
      </motion.div>

      {/* ── Error ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 flex items-center gap-4 border-l-4 border-l-red-400"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-zinc-800">Failed to load analytics</p>
            <p className="text-sm text-zinc-500">{error}</p>
          </div>
          <button onClick={fetchData} className="btn-primary text-sm py-2 px-4">
            Retry
          </button>
        </motion.div>
      )}

      {/* ── Loading Skeletons ── */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><SectionSkeleton /></div>
            <SectionSkeleton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
          <SectionSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {data && (
        <div className="space-y-6">

          {/* Revenue Section */}
          <section>
            <p className="text-xs font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest mb-3 pl-1">Revenue</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart
                  data={data.revenue.byMonth}
                  total={data.revenue.total}
                  comparison={data.revenue.comparison}
                />
              </div>
              <RevenueByEventType data={data.revenue.byEventType} />
            </div>
          </section>

          {/* Projects Section */}
          <section>
            <p className="text-xs font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest mb-3 pl-1">Projects</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProjectsOverview data={data.projects} />
              <ProjectsTrend
                data={data.trends.seasonalData}
                peakMonth={data.trends.peakMonth}
                lowMonth={data.trends.lowMonth}
                growthRate={data.trends.growthRate}
              />
            </div>
          </section>

          {/* Performance Section */}
          <section>
            <p className="text-xs font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest mb-3 pl-1">Performance</p>
            <PerformanceMetrics data={data} />
          </section>

          {/* Clients Section */}
          <section>
            <p className="text-xs font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest mb-3 pl-1">Clients</p>
            <TopClients clients={data.clients.topClients} />
            <div className="mt-6">
              <ClientInsights data={data.clients} />
            </div>
          </section>

          {/* Budget & Seasonal */}
          <section>
            <p className="text-xs font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-widest mb-3 pl-1">Budget & Seasonality</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BudgetAnalysis data={data.budget} />
              <SeasonalTrends
                data={data.trends.seasonalData}
                peakMonth={data.trends.peakMonth}
                lowMonth={data.trends.lowMonth}
                growthRate={data.trends.growthRate}
              />
            </div>
          </section>

        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && data && data.projects.total === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center glass-card"
        >
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="text-lg font-semibold text-zinc-700 mb-1">No data for this period</p>
          <p className="text-sm text-zinc-400">Create some projects or adjust the date range to see analytics</p>
        </motion.div>
      )}

    </div>
  );
}
