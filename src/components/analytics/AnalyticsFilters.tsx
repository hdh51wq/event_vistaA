"use client";

import { useState } from "react";
import { Filter, X, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsFilters as Filters, DateRange } from "@/types/analytics";

interface Props {
  filters: Filters;
  clients: string[];
  onChange: (filters: Filters) => void;
  onExportCSV: () => void;
  loading?: boolean;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "this_month",    label: "This Month" },
  { value: "this_quarter",  label: "This Quarter" },
  { value: "this_year",     label: "This Year" },
  { value: "last_30",       label: "Last 30 Days" },
  { value: "last_90",       label: "Last 90 Days" },
  { value: "last_year",     label: "Last Year" },
  { value: "custom",        label: "Custom Range" },
];

const EVENT_TYPES = ["all", "Corporate", "Wedding", "Gala", "Conference", "Other"];

export function AnalyticsFilters({ filters, clients, onChange, onExportCSV, loading }: Props) {
  const hasCustom = filters.dateRange === "custom";

  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  const reset = () => {
    onChange({
      dateRange: "this_year",
      eventType: "all",
      client: "all",
      startDate: undefined,
      endDate: undefined,
    });
  };

  const isFiltered =
    filters.dateRange !== "this_year" ||
    filters.eventType !== "all" ||
    filters.client !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date range */}
      <div className="relative">
        <select
          value={filters.dateRange}
          onChange={e => update({ dateRange: e.target.value as DateRange })}
          className="appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 cursor-pointer font-medium shadow-sm"
        >
          {DATE_RANGE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
      </div>

      {/* Custom range */}
      {hasCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={e => update({ startDate: e.target.value })}
            className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 shadow-sm"
          />
          <span className="text-zinc-400 dark:text-zinc-500 text-sm">to</span>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={e => update({ endDate: e.target.value })}
            className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 shadow-sm"
          />
        </div>
      )}

      {/* Event type */}
      <div className="relative">
        <select
          value={filters.eventType}
          onChange={e => update({ eventType: e.target.value })}
          className="appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 cursor-pointer shadow-sm"
        >
          {EVENT_TYPES.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Event Types" : t}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
      </div>

      {/* Client filter */}
      <div className="relative">
        <select
          value={filters.client}
          onChange={e => update({ client: e.target.value })}
          className="appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 cursor-pointer shadow-sm"
        >
          <option value="all">All Clients</option>
          {clients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
      </div>

      {/* Reset */}
      {isFiltered && (
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-coral-500 hover:text-coral-600 hover:bg-coral-50 dark:hover:bg-coral-950/20 rounded-xl transition-colors"
        >
          <X className="w-3 h-3" /> Reset
        </button>
      )}

      {/* Export */}
      <button
        onClick={onExportCSV}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm disabled:opacity-50 ml-auto"
      >
        <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        Export CSV
      </button>
    </div>
  );
}
