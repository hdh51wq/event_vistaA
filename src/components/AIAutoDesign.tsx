"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Camera,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Eye,
  LayoutGrid,
  DollarSign,
  RefreshCw,
  X,
  Play,
} from "lucide-react";
import { PlacedItem } from "@/components/SceneOverlay";
import { FURNITURE_ITEMS } from "@/lib/furniture";
import type { VisualDesignResponse, PlacementSuggestion } from "@/app/api/ai-visual-design/route";

interface AIAutoDesignProps {
  /** Called to capture a JPEG base64 screenshot of the current 360° canvas */
  onCapture: () => Promise<string | null>;
  /** Current event type */
  eventType: string;
  /** Current scene label */
  sceneLabel: string;
  /** Current scene dimensions */
  dimensions?: string;
  /** Called when the user confirms the auto-placement */
  onApply: (items: PlacedItem[]) => void;
  /** Existing placed items (to merge or replace) */
  currentItems: PlacedItem[];
}

type Step = "idle" | "capturing" | "analysing" | "preview" | "placing" | "done" | "error";

let uidSeed = 9000;
function nextUid() {
  return `ai-${++uidSeed}`;
}

function convertSuggestionToPlacedItems(suggestions: PlacementSuggestion[]): PlacedItem[] {
  const result: PlacedItem[] = [];
  for (const suggestion of suggestions) {
    const furnitureItem = FURNITURE_ITEMS.find((f) => f.id === suggestion.id);
    if (!furnitureItem) continue;
    for (const placement of suggestion.placements) {
      result.push({
        uid: nextUid(),
        item: furnitureItem,
        yaw: placement.yaw,
        pitch: placement.pitch,
        width: furnitureItem.defaultWidth,
        height: furnitureItem.defaultHeight,
        facing: placement.facing,
        flipX: false,
        locked: false,
      });
    }
  }
  return result;
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step | string; label: string; icon: React.ReactNode }[] = [
    { key: "capturing", label: "Capture", icon: <Camera className="w-3.5 h-3.5" /> },
    { key: "analysing", label: "Analyse", icon: <Eye className="w-3.5 h-3.5" /> },
    { key: "preview",   label: "Preview", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { key: "placing",   label: "Apply",   icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];
  const activeIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-1.5 justify-center py-3 px-4 border-b border-white/10">
      {steps.map((s, i) => {
        const done = activeIdx > i;
        const active = activeIdx === i;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                done
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : active
                  ? "bg-coral-500/25 text-coral-300 border border-coral-500/40"
                  : "bg-white/5 text-white/30 border border-white/10"
              }`}
            >
              {done ? <CheckCircle2 className="w-3 h-3" /> : s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-px ${done ? "bg-emerald-500/40" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecommendationCard({ suggestion }: { suggestion: PlacementSuggestion }) {
  const item = FURNITURE_ITEMS.find((f) => f.id === suggestion.id);
  const total = (item?.price ?? 0) * suggestion.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coral-500/30 to-orange-400/20 flex items-center justify-center shrink-0 border border-coral-500/20">
        <LayoutGrid className="w-4 h-4 text-coral-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-white/90 leading-none mb-0.5">
          {suggestion.label}
        </div>
        <div className="text-[10px] text-white/50">
          {suggestion.quantity} unit{suggestion.quantity > 1 ? "s" : ""} · {suggestion.placements.length} placement{suggestion.placements.length > 1 ? "s" : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[12px] font-bold text-emerald-400">€{total.toLocaleString()}</div>
        <div className="text-[9px] text-white/40">€{item?.price ?? 0}/unit</div>
      </div>
    </motion.div>
  );
}

export default function AIAutoDesign({
  onCapture,
  eventType,
  sceneLabel,
  dimensions,
  onApply,
  currentItems,
}: AIAutoDesignProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<VisualDesignResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mergeMode, setMergeMode] = useState<"replace" | "merge">("replace");
  const capturedImageRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setStep("idle");
    setResult(null);
    setErrorMsg("");
    capturedImageRef.current = null;
  }, []);

  const runAnalysis = useCallback(async () => {
    setStep("capturing");
    setResult(null);
    setErrorMsg("");

    // 1. Capture screenshot
    const imageBase64 = await onCapture();
    if (!imageBase64) {
      setStep("error");
      setErrorMsg("Could not capture the scene. Please try again.");
      return;
    }
    capturedImageRef.current = imageBase64;

    // 2. Send to Vision AI
    setStep("analysing");
    try {
      const res = await fetch("/api/ai-visual-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          eventType,
          sceneLabel,
          dimensions: dimensions ?? "unknown",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStep("error");
        setErrorMsg(data.error ?? "AI analysis failed. Please try again.");
        return;
      }

      // ── Diagnostic: log raw API response ────────────────────────────────
      console.group("%c[AIAutoDesign] API Response", "color: #a78bfa; font-weight: bold");
      console.log("layoutStyle:", data.layoutStyle);
      console.log("sceneAnalysis:", data.sceneAnalysis);
      console.log("totalEstimatedCost:", data.totalEstimatedCost);
      (data.recommendations ?? []).forEach((rec: any) => {
        console.group(`  Furniture: ${rec.label} (×${rec.quantity})`);
        (rec.placements ?? []).forEach((p: any, i: number) => {
          const yawDeg = ((p.yaw ?? 0) * 180 / Math.PI).toFixed(1);
          const pitchDeg = ((p.pitch ?? 0) * 180 / Math.PI).toFixed(1);
          const pitchLabel =
            (p.pitch ?? 0) > 0
              ? "⬇ FLOOR ✅"
              : (p.pitch ?? 0) < 0
              ? "⬆ CEILING (bad!)"
              : "≈ horizon";
          console.log(`  [${i}] yaw=${p.yaw?.toFixed(3)} (${yawDeg}°) | pitch=${p.pitch?.toFixed(3)} (${pitchDeg}°) ${pitchLabel} | facing=${p.facing}`);
        });
        console.groupEnd();
      });
      console.groupEnd();
      // ────────────────────────────────────────────────────────────────────

      setResult(data as VisualDesignResponse);
      setStep("preview");
    } catch (e) {
      setStep("error");
      setErrorMsg("Network error. Please check your connection.");
    }
  }, [onCapture, eventType, sceneLabel, dimensions]);

  const handleApply = useCallback(() => {
    if (!result) return;
    setStep("placing");

    const newItems = convertSuggestionToPlacedItems(result.recommendations ?? []);

    // ── Diagnostic: log final PlacedItem coordinates ─────────────────────
    console.group("%c[AIAutoDesign] PlacedItems written to scene", "color: #34d399; font-weight: bold");
    newItems.forEach((item, i) => {
      const yawDeg = (item.yaw * 180 / Math.PI).toFixed(1);
      const pitchDeg = (item.pitch * 180 / Math.PI).toFixed(1);
      const pitchLabel =
        item.pitch > 0 ? "⬇ FLOOR ✅" : item.pitch < 0 ? "⬆ CEILING (bad!)" : "≈ horizon";
      console.log(
        `[${i}] ${item.item.label} | uid=${item.uid} | yaw=${item.yaw.toFixed(3)} (${yawDeg}°) | pitch=${item.pitch.toFixed(3)} (${pitchDeg}°) | facing=${item.facing} | ${pitchLabel}`
      );
    });
    console.groupEnd();
    // ─────────────────────────────────────────────────────────────────────

    setTimeout(() => {
      if (mergeMode === "merge") {
        onApply([...currentItems, ...newItems]);
      } else {
        onApply(newItems);
      }
      setStep("done");
    }, 600);
  }, [result, mergeMode, currentItems, onApply]);

  const totalPlacements =
    result?.recommendations?.reduce((sum, r) => sum + (r.placements?.length ?? 0), 0) ?? 0;

  return (
    <div className="relative">
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.88) 0%, rgba(167,139,250,0.80) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(167,139,250,0.35)",
          boxShadow: "0 4px 24px rgba(124,58,237,0.25)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-bold text-[13px] leading-none mb-0.5">AI Auto-Design</div>
            <div className="text-[10px] font-medium text-white/70 leading-none">
              {open ? "Click to collapse" : "Visual scene analysis · Smart furniture placement"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step === "done" && (
            <span className="bg-emerald-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Applied
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-white/80" />
          </motion.div>
        </div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden mt-2 rounded-2xl flex flex-col"
            style={{
              background: "rgba(12, 10, 22, 0.94)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(167,139,250,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            {/* Step indicator (only during active flow) */}
            {step !== "idle" && step !== "done" && step !== "error" && (
              <StepIndicator step={step} />
            )}

            {/* ── IDLE ─────────────────────────────────────────── */}
            {step === "idle" && (
              <div className="p-5">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <Wand2 className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-none mb-1.5">
                      AI Visual Auto-Design
                    </h3>
                    <p className="text-white/50 text-[11px] leading-relaxed">
                      Takes a snapshot of your current 360° scene, sends it to Vision AI to analyse
                      the room layout, then automatically places the right furniture at optimal
                      positions based on the space and your event type.
                    </p>
                  </div>
                </div>

                {/* How it works */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { icon: <Camera className="w-4 h-4" />, label: "Capture scene", color: "text-blue-400 bg-blue-500/15 border-blue-500/25" },
                    { icon: <Eye className="w-4 h-4" />, label: "Vision analysis", color: "text-violet-400 bg-violet-500/15 border-violet-500/25" },
                    { icon: <LayoutGrid className="w-4 h-4" />, label: "Generate layout", color: "text-coral-400 bg-coral-500/15 border-coral-500/25" },
                    { icon: <Sparkles className="w-4 h-4" />, label: "Auto-place", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25" },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center ${step.color}`}
                    >
                      {step.icon}
                      <span className="text-[9px] font-semibold leading-tight">{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <p className="text-[10px] text-amber-300/80 leading-relaxed">
                    Analysing <strong className="text-amber-300">{sceneLabel}</strong> for a{" "}
                    <strong className="text-amber-300">{eventType}</strong> event
                    {dimensions ? ` (${dimensions})` : ""}.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={runAnalysis}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                  }}
                >
                  <Play className="w-4 h-4" />
                  Analyse &amp; Auto-Design Scene
                </motion.button>
              </div>
            )}

            {/* ── CAPTURING / ANALYSING ────────────────────────── */}
            {(step === "capturing" || step === "analysing") && (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-5">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.2))",
                      border: "1px solid rgba(167,139,250,0.3)",
                    }}
                  >
                    {step === "capturing" ? (
                      <Camera className="w-7 h-7 text-violet-300" />
                    ) : (
                      <Eye className="w-7 h-7 text-violet-300" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-violet-400/40 animate-ping" />
                </div>

                <div className="text-center">
                  <p className="text-white font-semibold text-sm mb-1">
                    {step === "capturing" ? "Capturing 360° Scene…" : "Analysing with Vision AI…"}
                  </p>
                  <p className="text-white/40 text-[11px]">
                    {step === "capturing"
                      ? "Taking a high-quality snapshot of the current view"
                      : "Llama 4 Scout is reading the room layout and planning placement"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-violet-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[11px] font-medium">
                    {step === "capturing" ? "Rendering frame…" : "Processing image…"}
                  </span>
                </div>
              </div>
            )}

            {/* ── PREVIEW ──────────────────────────────────────── */}
            {step === "preview" && result && (
              <div className="flex flex-col">
                {/* Scene analysis */}
                <div className="px-4 pt-4 pb-3 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Scene Analysis</span>
                    <span className="ml-auto text-[10px] font-semibold text-white/40 bg-white/8 px-2 py-0.5 rounded-full">
                      {result.layoutStyle}
                    </span>
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">{result.sceneAnalysis}</p>
                </div>

                {/* Design reasoning */}
                <div className="px-4 pt-3 pb-3 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Wand2 className="w-3.5 h-3.5 text-coral-400" />
                    <span className="text-[10px] font-bold text-coral-400 uppercase tracking-widest">Design Strategy</span>
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">{result.designReasoning}</p>
                </div>

                {/* Recommendations list */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2 mb-2.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                      Furniture Plan
                    </span>
                    <span className="ml-auto text-[10px] text-white/40">
                      {totalPlacements} items to place
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto scrollbar-hide">
                    {(result.recommendations ?? []).map((rec, i) => (
                      <RecommendationCard key={i} suggestion={rec} />
                    ))}
                  </div>
                </div>

                {/* Cost summary */}
                <div className="px-4 py-3 mx-4 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-emerald-400/70 font-medium">Estimated furniture cost</div>
                    <div className="text-lg font-bold text-emerald-400 leading-none">
                      €{(result.totalEstimatedCost ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Merge / Replace toggle */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                    {(["replace", "merge"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setMergeMode(mode)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          mergeMode === mode
                            ? "bg-violet-500/30 text-violet-300 border border-violet-500/40"
                            : "text-white/40 hover:text-white/60"
                        }`}
                      >
                        {mode === "replace" ? "Replace existing" : "Merge with existing"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-none px-3 py-2.5 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-analyse
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleApply}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply {totalPlacements} Placements
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── PLACING ──────────────────────────────────────── */}
            {step === "placing" && (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-300 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm mb-1">Placing furniture…</p>
                  <p className="text-white/40 text-[11px]">Anchoring {totalPlacements} items in the scene</p>
                </div>
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              </div>
            )}

            {/* ── DONE ─────────────────────────────────────────── */}
            {step === "done" && (
              <div className="flex flex-col items-center justify-center py-10 px-6 gap-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm mb-1">Auto-Design Applied!</p>
                  <p className="text-white/50 text-[11px]">
                    {totalPlacements} items placed in your scene. Drag to fine-tune any position.
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-xl text-[11px] font-semibold text-violet-400 bg-violet-500/15 border border-violet-500/25 hover:bg-violet-500/25 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run another analysis
                </button>
              </div>
            )}

            {/* ── ERROR ────────────────────────────────────────── */}
            {step === "error" && (
              <div className="flex flex-col items-center justify-center py-10 px-6 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm mb-1">Analysis Failed</p>
                  <p className="text-white/50 text-[11px] max-w-xs leading-relaxed">{errorMsg}</p>
                </div>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-xl text-[11px] font-semibold text-red-400 bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
