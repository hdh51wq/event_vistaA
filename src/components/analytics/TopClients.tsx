"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowUp, ArrowDown, Minus, ExternalLink } from "lucide-react";
import type { TopClient } from "@/types/analytics";

type SortKey = keyof Pick<TopClient, "projects" | "revenue" | "averageProjectValue" | "lastProject">;

interface Props {
  clients: TopClient[];
}

export function TopClients({ clients }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...clients].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
    }
    return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <Minus className="w-3 h-3 text-zinc-300" />;
    return sortDir === "desc" ? <ArrowDown className="w-3 h-3 text-coral-500" /> : <ArrowUp className="w-3 h-3 text-coral-500" />;
  };

  const HeaderCell = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-600 transition-colors select-none"
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {label} <SortIcon col={col} />
      </div>
    </th>
  );

  if (!clients.length) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-zinc-400 text-sm">No client data available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-6 pb-0">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Clients by Revenue</p>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-zinc-100 bg-zinc-50/60">
              <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Client</th>
              <HeaderCell col="projects" label="Projects" />
              <HeaderCell col="revenue" label="Revenue" />
              <HeaderCell col="averageProjectValue" label="Avg Value" />
              <HeaderCell col="lastProject" label="Last Project" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sorted.map((client, idx) => (
              <motion.tr
                key={client.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="hover:bg-zinc-50/80 transition-colors group"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-coral-100 to-peach-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-coral-600">
                        {client.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-800 group-hover:text-coral-500 transition-colors">
                        {client.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 font-medium">{client.projects}</td>
                <td className="px-4 py-3.5 font-semibold text-zinc-800">${client.revenue.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-zinc-500">${client.averageProjectValue.toLocaleString()}</td>
                <td className="px-4 py-3.5 text-zinc-400 text-xs">{client.lastProject}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
