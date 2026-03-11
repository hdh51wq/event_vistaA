"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Calendar, MoreVertical, LayoutGrid, List, X,
  MapPin, User, Tag, FolderOpen, BarChart2, Archive, TrendingUp,
  TrendingDown, Layers, Clock, ChevronDown, FileText,
  Briefcase, DollarSign, CreditCard, Pencil, Trash2, Copy, Zap,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth, Project } from "@/lib/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "Draft" | "In Progress" | "Review" | "Final";
type EventType = "Wedding" | "Conference" | "Gala Dinner";
type SortOption =
  | "updatedAt_desc" | "updatedAt_asc"
  | "name_asc"       | "name_desc"
  | "createdAt_desc" | "createdAt_asc";

type BillingStatus = "pending" | "paid" | "cancelled";

interface ProjectForm {
  name: string;
  client: string;
  event: string;
  eventType: EventType;
  location: string;
  status: Status;
  budget: string;
  currency: string;
  billingStatus: BillingStatus;
}

const EMPTY_FORM: ProjectForm = {
  name: "", client: "", event: "", eventType: "Wedding",
  location: "", status: "Draft", budget: "", currency: "USD", billingStatus: "pending",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string; activeBg: string; activeBorder: string }> = {
  "Draft":       { label: "Draft",       bg: "bg-zinc-100",    text: "text-zinc-600",    dot: "bg-zinc-400",    activeBg: "bg-zinc-100",    activeBorder: "border-zinc-400" },
  "In Progress": { label: "In Progress", bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    activeBg: "bg-blue-100",    activeBorder: "border-blue-400" },
  "Review":      { label: "Review",      bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   activeBg: "bg-amber-100",   activeBorder: "border-amber-400" },
  "Final":       { label: "Final",       bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", activeBg: "bg-emerald-100", activeBorder: "border-emerald-400" },
};

const BILLING_CONFIG: Record<BillingStatus, { bg: string; border: string; text: string }> = {
  pending:   { bg: "bg-amber-100",   border: "border-amber-300",   text: "text-amber-700" },
  paid:      { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700" },
  cancelled: { bg: "bg-red-100",     border: "border-red-300",     text: "text-red-600" },
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updatedAt_desc",  label: "Last Updated (Newest)" },
  { value: "updatedAt_asc",   label: "Last Updated (Oldest)" },
  { value: "name_asc",        label: "Name (A–Z)" },
  { value: "name_desc",       label: "Name (Z–A)" },
  { value: "createdAt_desc",  label: "Created (Newest)" },
  { value: "createdAt_asc",   label: "Created (Oldest)" },
];

const CURRENCIES = ["USD","EUR","GBP","MAD","AED","CAD","CHF","JPY"];
const EVENT_TYPES: { type: EventType; label: string; emoji: string; description: string; bg: string; thumb: string }[] = [
  {
    type: "Wedding",
    label: "Wedding",
    emoji: "💍",
    description: "Elegant wedding ceremonies & receptions",
    bg: "from-rose-50 to-pink-50",
    thumb: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800&auto=format&fit=crop",
  },
  {
    type: "Conference",
    label: "Conference",
    emoji: "🎤",
    description: "Professional corporate conferences & summits",
    bg: "from-blue-50 to-indigo-50",
    thumb: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop",
  },
  {
    type: "Gala Dinner",
    label: "Gala Dinner",
    emoji: "✨",
    description: "Luxurious gala dinners & award evenings",
    bg: "from-amber-50 to-yellow-50",
    thumb: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=800&auto=format&fit=crop",
  },
];
const STATUSES: Status[] = ["Draft","In Progress","Review","Final"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function computeStats(projects: Project[], now: Date) {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = projects.filter(p => new Date(p.createdAt) >= thisMonthStart);
  const lastMonth = projects.filter(
    p => new Date(p.createdAt) >= lastMonthStart && new Date(p.createdAt) < thisMonthStart
  );

  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  return {
    total:   { value: projects.length,                                      change: pct(thisMonth.length, lastMonth.length) },
    active:  { value: projects.filter(p => p.status === "In Progress").length, change: pct(thisMonth.filter(p => p.status === "In Progress").length, lastMonth.filter(p => p.status === "In Progress").length) },
    revenue: { value: projects.reduce((s, p) => s + (p.budget ?? 0), 0),   change: pct(thisMonth.reduce((s,p)=>s+(p.budget??0),0), lastMonth.reduce((s,p)=>s+(p.budget??0),0)) },
    pending: { value: projects.filter(p => p.status === "Draft").length,   change: pct(thisMonth.filter(p => p.status === "Draft").length, lastMonth.filter(p => p.status === "Draft").length) },
  };
}

function sortProjects(list: Project[], sort: SortOption): Project[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case "updatedAt_desc": return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      case "updatedAt_asc":  return +new Date(a.updatedAt) - +new Date(b.updatedAt);
      case "name_asc":       return a.name.localeCompare(b.name);
      case "name_desc":      return b.name.localeCompare(a.name);
      case "createdAt_desc": return +new Date(b.createdAt) - +new Date(a.createdAt);
      case "createdAt_asc":  return +new Date(a.createdAt) - +new Date(b.createdAt);
    }
  });
}

function projectToForm(p: Project): ProjectForm {
  return {
    name:          p.name          ?? "",
    client:        p.client        ?? "",
    event:         p.event         ?? "",
    eventType:     p.eventType     ?? "Other",
    location:      p.location      ?? "",
    status:        p.status        ?? "Draft",
    budget:        p.budget != null ? String(p.budget) : "",
    currency:      p.currency      ?? "USD",
    billingStatus: p.billingStatus ?? "pending",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, change, icon: Icon, color, prefix = "" }: {
  title: string; value: number; change: number;
  icon: React.ElementType; color: "blue"|"green"|"yellow"|"purple"; prefix?: string;
}) {
  const borderColor = { blue:"border-l-blue-500", green:"border-l-emerald-500", yellow:"border-l-amber-500", purple:"border-l-purple-500" }[color];
  const iconBg      = { 
    blue:"bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400", 
    green:"bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400", 
    yellow:"bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400", 
    purple:"bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" 
  }[color];
  const isPositive  = change >= 0;
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className={cn("glass-card p-6 border-l-4 flex items-start gap-4", borderColor)}>
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{prefix}{value.toLocaleString()}</p>
        <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{change}% vs last month
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ThreeDotsMenu({ onEdit, onDuplicate, onDelete }: {
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
            <motion.div initial={{ opacity:0, scale:0.95, y:-4 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.95, y:-4 }} transition={{ duration:0.12 }}
              className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => { onEdit(); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Pencil className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /> Edit
              </button>
              <button onClick={() => { onDuplicate(); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <Copy className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" /> Duplicate
              </button>
              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
              <button onClick={() => { onDelete(); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 text-red-500">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectDropdown<T extends string>({ value, onChange, options, placeholder }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value as T)}
        className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 cursor-pointer">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
    </div>
  );
}

// ─── Shared Modal Form Fields ─────────────────────────────────────────────────

function ProjectFormFields({ form, setForm }: {
  form: ProjectForm;
  setForm: React.Dispatch<React.SetStateAction<ProjectForm>>;
}) {
  const set = (key: keyof ProjectForm) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Project Name */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Tag className="w-3 h-3" /> Project Name *
        </label>
        <input required type="text" placeholder="e.g. Summer Gala 2026"
          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          value={form.name} onChange={e => set("name")(e.target.value)} />
      </div>

      {/* Client */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <User className="w-3 h-3" /> Client
        </label>
        <input type="text" placeholder="Client name"
          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          value={form.client} onChange={e => set("client")(e.target.value)} />
      </div>

      {/* Event Name */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Calendar className="w-3 h-3" /> Event Name
        </label>
        <input type="text" placeholder="Event type or title"
          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          value={form.event} onChange={e => set("event")(e.target.value)} />
      </div>

      {/* Location */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <MapPin className="w-3 h-3" /> Location
        </label>
        <input type="text" placeholder="Venue address or city"
          className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          value={form.location} onChange={e => set("location")(e.target.value)} />
      </div>

       {/* Event Type */}
       <div className="space-y-3 md:col-span-2">
         <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
           <Briefcase className="w-3 h-3" /> Event Type *
         </label>
         <div className="grid grid-cols-3 gap-3">
           {EVENT_TYPES.map(et => {
             const active = form.eventType === et.type;
             return (
               <button key={et.type} type="button"
                 onClick={() => setForm(f => ({ ...f, eventType: et.type }))}
                 className={cn(
                   "relative rounded-2xl overflow-hidden border-2 transition-all text-left group",
                   active ? "border-coral-400 shadow-md" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                 )}>
                 {/* Mini preview */}
                 <div className="aspect-[4/3] w-full relative overflow-hidden">
                   <img src={et.thumb} alt={et.label}
                     className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                   <div className={cn(
                     "absolute inset-0 transition-opacity",
                     active ? "bg-coral-500/20" : "bg-zinc-900/10 dark:bg-black/40 group-hover:bg-zinc-900/5 dark:group-hover:bg-black/20"
                   )} />
                   {active && (
                     <div className="absolute top-2 right-2 w-5 h-5 bg-coral-500 rounded-full flex items-center justify-center shadow">
                       <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                     </div>
                   )}
                 </div>
                 <div className={cn("p-2.5 bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950", et.bg)}>
                   <p className={cn("text-xs font-bold leading-tight", active ? "text-coral-600 dark:text-coral-400" : "text-zinc-700 dark:text-zinc-400")}>
                     {et.emoji} {et.label}
                   </p>
                 </div>
               </button>
             );
           })}
         </div>
       </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-3 h-3" /> Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = form.status === s;
            return (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all",
                  active
                    ? `${cfg.activeBg} ${cfg.activeBorder} ${cfg.text} dark:bg-zinc-800 dark:border-coral-500/50 dark:text-zinc-100`
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-700"
                )}>
                <span className={cn("w-2 h-2 rounded-full shrink-0", active ? cfg.dot : "bg-zinc-300 dark:bg-zinc-700")} />
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget + Currency */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <DollarSign className="w-3 h-3" /> Budget
        </label>
        <div className="flex gap-2">
          <div className="relative">
            <select value={form.currency} onChange={e => set("currency")(e.target.value)}
              className="appearance-none h-full pl-3 pr-7 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200 cursor-pointer font-medium">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
          </div>
          <input type="number" min="0" step="0.01" placeholder="0.00"
            className="flex-1 px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100"
            value={form.budget} onChange={e => set("budget")(e.target.value)} />
        </div>
      </div>

      {/* Billing Status */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="w-3 h-3" /> Billing Status
        </label>
        <div className="flex gap-2">
          {(["pending","paid","cancelled"] as BillingStatus[]).map(s => {
            const cfg = BILLING_CONFIG[s];
            return (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, billingStatus: s }))}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                  form.billingStatus === s
                    ? `${cfg.bg} ${cfg.border} ${cfg.text} dark:bg-opacity-20`
                    : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function ModalShell({
  open, onClose, title, subtitle, onSubmit, submitLabel, loading, children,
}: {
  open: boolean; onClose: () => void; title: string; subtitle: string;
  onSubmit: (e: React.FormEvent) => void; submitLabel: string;
  loading: boolean; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose} className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.95, y:20 }}
              className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col border border-zinc-100 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}>
              <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                </button>
              </div>
              <form onSubmit={onSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
                {children}
                <div className="flex items-center gap-4 pt-2">
                  <button type="button" disabled={loading} onClick={onClose}
                    className="flex-1 px-6 py-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-2xl font-semibold transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-[2] btn-primary py-4 text-base shadow-lg shadow-coral-100 dark:shadow-none disabled:opacity-50">
                    {loading ? "Saving…" : submitLabel}
                  </button>
                </div>
              </form>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, projects, fetchProjects, createProject, updateProject, deleteProject } = useAuth();

  const [view, setView]               = useState<"grid"|"list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [loading, setLoading]         = useState(false);

  const [searchRaw, setSearchRaw]     = useState("");
  const search                        = useDebounce(searchRaw, 300);
  const [statusFilter, setStatusFilter] = useState<Status|"">("");
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType|"">("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [sort, setSort]               = useState<SortOption>("updatedAt_desc");
  const [showArchived, setShowArchived] = useState(false);

  const [createForm, setCreateForm] = useState<ProjectForm>(EMPTY_FORM);
  const [editForm,   setEditForm]   = useState<ProjectForm>(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn) {
      fetchProjects();
    } else {
      router.push("/login");
    }
  }, [authLoading, isLoggedIn, fetchProjects, router]);

  // When edit modal opens, seed form from project
  useEffect(() => {
    if (editProject) setEditForm(projectToForm(editProject));
  }, [editProject]);

  // ── Filtering ──
  const filtered = useCallback(() => {
    let list = [...projects];
    if (showArchived) {
      list = list.filter(p => p.status === "Final");
    } else {
      if (statusFilter) list = list.filter(p => p.status === statusFilter);
    }
    if (eventTypeFilter) list = list.filter(p => p.eventType === eventTypeFilter);
    if (dateFrom) list = list.filter(p => new Date(p.updatedAt) >= new Date(dateFrom));
    if (dateTo)   list = list.filter(p => new Date(p.updatedAt) <= new Date(dateTo + "T23:59:59"));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.client ?? "").toLowerCase().includes(q) ||
        (p.event  ?? "").toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q)
      );
    }
    return sortProjects(list, sort);
  }, [projects, search, statusFilter, eventTypeFilter, dateFrom, dateTo, sort, showArchived]);

  const visibleProjects = filtered();
  
  // Only compute stats client-side to avoid hydration mismatch
  const [stats, setStats] = useState({
    total: { value: 0, change: 0 },
    active: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
    pending: { value: 0, change: 0 },
  });
  
  useEffect(() => {
    const now = new Date();
    setStats(computeStats(projects, now));
  }, [projects]);

  // ── Handlers ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject({
        name: createForm.name, client: createForm.client,
        event: createForm.event, eventType: createForm.eventType,
        location: createForm.location, status: createForm.status,
        budget: createForm.budget ? parseFloat(createForm.budget) : 0,
        currency: createForm.currency, billingStatus: createForm.billingStatus,
      });
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      toast.success("Project created!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject) return;
    setLoading(true);
    try {
      await updateProject(editProject._id, {
        name: editForm.name, client: editForm.client,
        event: editForm.event, eventType: editForm.eventType,
        location: editForm.location, status: editForm.status,
        budget: editForm.budget ? parseFloat(editForm.budget) : 0,
        currency: editForm.currency, billingStatus: editForm.billingStatus,
      });
      setEditProject(null);
      toast.success("Project updated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteProject(deleteTarget._id);
      setDeleteTarget(null);
      toast.success("Project deleted");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (project: Project) => {
    setLoading(true);
    try {
      await createProject({
        name: `${project.name} (Copy)`,
        client: project.client, event: project.event,
        eventType: project.eventType, location: project.location,
        status: "Draft", budget: project.budget,
        currency: project.currency, billingStatus: "pending",
      });
      toast.success("Project duplicated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Active Event toggle — sets status to "In Progress"
  const handleToggleActive = async (project: Project) => {
    const newStatus: Status = project.status === "In Progress" ? "Draft" : "In Progress";
    try {
      await updateProject(project._id, { status: newStatus });
      toast.success(newStatus === "In Progress" ? "Marked as Active!" : "Marked as Draft");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (authLoading || !isLoggedIn) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ── */}
      <motion.header initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Project Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and design your immersive event scénographies</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2 self-start md:self-auto">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </motion.header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { title:"Total Projects",      ...stats.total,   icon:FolderOpen,  color:"blue"   as const },
          { title:"Active Events",       ...stats.active,  icon:Layers,      color:"green"  as const },
          { title:"This Month's Revenue", value:stats.revenue.value, change:stats.revenue.change, icon:BarChart2, color:"purple" as const, prefix:"$" },
          { title:"Pending Proposals",   ...stats.pending, icon:FileText,    color:"yellow" as const },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="flex flex-wrap gap-3">
          <Link href="/templates"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <FolderOpen className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Templates
          </Link>
          <Link href="/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <BarChart2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Analytics
          </Link>
          <button
            onClick={() => { setShowArchived(v => !v); setStatusFilter(""); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-all shadow-sm",
              showArchived
                ? "bg-coral-50 border-coral-300 text-coral-600 dark:bg-coral-950/20 dark:border-coral-800 dark:text-coral-400"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            )}>
            <Archive className="w-4 h-4" /> {showArchived ? "Showing Archived" : "Archived"}
          </button>
        </motion.div>

        {/* ── Search + Filters ── */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input type="text" placeholder="Search by name, client, event, location…"
                value={searchRaw} onChange={e => setSearchRaw(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all" />
              {searchRaw && (
                <button onClick={() => setSearchRaw("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <SelectDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl self-start">
              <button onClick={() => setView("grid")}
                className={cn("p-1.5 rounded-lg transition-all", view==="grid" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")}
                className={cn("p-1.5 rounded-lg transition-all", view==="list" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <SelectDropdown value={statusFilter} onChange={v => { setStatusFilter(v); setShowArchived(false); }}
              options={[
                { value:"Draft", label:"Draft" }, { value:"In Progress", label:"In Progress" },
                { value:"Review", label:"Review" }, { value:"Final", label:"Final" },
              ] as { value: Status; label: string }[]}
              placeholder="All Statuses" />
            <SelectDropdown value={eventTypeFilter} onChange={setEventTypeFilter}
               options={[
                 { value:"Wedding", label:"💍 Wedding" },
                 { value:"Conference", label:"🎤 Conference" },
                 { value:"Gala Dinner", label:"✨ Gala Dinner" },
               ] as { value: EventType; label: string }[]}
               placeholder="All Types" />
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200" />
              <span className="text-zinc-400 dark:text-zinc-500 text-sm">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-coral-200" />
            </div>
            {(statusFilter || eventTypeFilter || dateFrom || dateTo || searchRaw || showArchived) && (
              <button
                onClick={() => { setStatusFilter(""); setEventTypeFilter(""); setDateFrom(""); setDateTo(""); setSearchRaw(""); setShowArchived(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-coral-500 hover:text-coral-600 hover:bg-coral-50 dark:hover:bg-coral-950/20 rounded-xl transition-colors">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {visibleProjects.length} project{visibleProjects.length !== 1 ? "s" : ""}
            </span>
          </div>
      </motion.div>

      {/* ── Projects Grid / List ── */}
      {visibleProjects.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-zinc-400" />
          </div>
            <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No results found</p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Try adjusting your search or filters</p>
          </motion.div>
        ) : view === "grid" ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProjects.map((project, idx) => (
              <motion.div key={project._id} layout initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:idx*0.05 }}
                className="group glass-card overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={project.thumbnail || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop"}
                    alt={project.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={project.status} />
                  </div>
                  {/* Active Event toggle pill */}
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleActive(project); }}
                    title={project.status === "In Progress" ? "Mark as Draft" : "Mark as Active"}
                    className={cn(
                      "absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all",
                      project.status === "In Progress"
                        ? "bg-blue-500 border-blue-600 text-white shadow"
                        : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    )}>
                    <Zap className="w-2.5 h-2.5" />
                    {project.status === "In Progress" ? "Active" : "Set Active"}
                  </button>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link href={`/editor?id=${project._id}`}
                      className="btn-primary py-2 px-5 text-sm" onClick={e => e.stopPropagation()}>
                      Open Editor
                    </Link>
                  </div>
                </div>
                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-coral-500 transition-colors truncate pr-2 text-sm leading-snug">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ThreeDotsMenu
                          onEdit={()      => setEditProject(project)}
                          onDuplicate={()  => handleDuplicate(project)}
                          onDelete={()    => setDeleteTarget(project)}
                        />
                      </div>
                  </div>
                  {project.client && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 truncate flex items-center gap-1">
                      <User className="w-3 h-3 shrink-0" /> {project.client}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {project.sceneCount ?? 0} scene{(project.sceneCount ?? 0) !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* New project card */}
            <motion.div onClick={() => setIsCreateOpen(true)} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-coral-300 dark:hover:border-coral-800 hover:bg-coral-50/30 dark:hover:bg-coral-900/10 transition-all cursor-pointer group min-h-[220px]">
              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-coral-100 dark:group-hover:bg-coral-900/30 transition-colors">
                <Plus className="w-6 h-6 text-zinc-400 dark:text-zinc-500 group-hover:text-coral-500" />
              </div>
              <p className="font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-coral-600 transition-colors text-sm">Create New</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Start a fresh project</p>
            </motion.div>
          </motion.div>
      ) : (
        /* ── List View ── */
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/60">
                {["Name","Client","Event","Updated","Status","Active","Actions"].map(col => (
                  <th key={col} className="px-5 py-3.5 text-left text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {visibleProjects.map((project, idx) => (
                <motion.tr key={project._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:idx*0.03 }} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={project.thumbnail || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop"}
                        alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-100 dark:border-zinc-800" />
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-coral-500 transition-colors">{project.name}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Layers className="w-3 h-3" /> {project.sceneCount ?? 0} scenes
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{project.client || <span className="text-zinc-300 dark:text-zinc-700">—</span>}</td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{project.event  || <span className="text-zinc-300 dark:text-zinc-700">—</span>}</td>
                  <td className="px-5 py-4 text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix:true })}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={project.status} /></td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleActive(project)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                        project.status === "In Progress"
                          ? "bg-blue-500 border-blue-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-blue-300 hover:text-blue-500"
                      )}>
                      <Zap className="w-3 h-3" />
                      {project.status === "In Progress" ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/editor?id=${project._id}`}
                        className="text-xs font-medium text-coral-500 hover:text-coral-600 hover:underline">Open</Link>
                      <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ThreeDotsMenu
                        onEdit={()      => setEditProject(project)}
                        onDuplicate={()  => handleDuplicate(project)}
                        onDelete={()    => setDeleteTarget(project)}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* ── Create Modal ── */}
      <ModalShell open={isCreateOpen} onClose={() => { setIsCreateOpen(false); setCreateForm(EMPTY_FORM); }}
        title="Create New Project" subtitle="Set up your event workspace"
        onSubmit={handleCreate} submitLabel="Create Project" loading={loading}>
        <ProjectFormFields form={createForm} setForm={setCreateForm} />
      </ModalShell>

      {/* ── Edit Modal ── */}
      <ModalShell open={!!editProject} onClose={() => setEditProject(null)}
        title="Edit Project" subtitle={editProject?.name ?? ""}
        onSubmit={handleEdit} submitLabel="Save Changes" loading={loading}>
        <ProjectFormFields form={editForm} setForm={setEditForm} />
      </ModalShell>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 relative text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-1">Delete Project?</h3>
              <p className="text-sm text-zinc-500 mb-6">
                <span className="font-semibold text-zinc-700">"{deleteTarget.name}"</span> will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-2xl font-semibold transition-all text-sm">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-all text-sm disabled:opacity-50">
                  {loading ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
