"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  Wand2,
  X,
  CheckCircle2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ChevronDown,
  Upload,
  Layers,
} from "lucide-react";
import Image from "next/image";
import { PlacedItem } from "@/components/SceneOverlay";
import { FURNITURE_ITEMS } from "@/lib/furniture";

interface AILogoIntegrationProps {
  placedItems: PlacedItem[];
  onApply: (items: PlacedItem[]) => void;
}

type Step = "idle" | "upload" | "select" | "branding" | "done";

// ─── Canvas compositing ───────────────────────────────────────────────────────

/** Load an image URL (or data URL) into an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

/**
 * Composite a logo onto a furniture image using Canvas API.
 * The logo is placed in the bottom-right quadrant, scaled to ~28% of
 * the furniture width, with a soft white pill background for legibility.
 */
async function compositeLogo(
  furnitureSrc: string,
  logoSrc: string,
  logoOpacity: number,
  logoScale: number  // 0.1 – 0.5, relative to furniture width
): Promise<string> {
  const [furnitureImg, logoImg] = await Promise.all([
    loadImage(furnitureSrc),
    loadImage(logoSrc),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = furnitureImg.naturalWidth || furnitureImg.width;
  canvas.height = furnitureImg.naturalHeight || furnitureImg.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Draw base furniture image
  ctx.drawImage(furnitureImg, 0, 0, canvas.width, canvas.height);

  // Calculate logo dimensions
  const logoW = Math.round(canvas.width * logoScale);
  const logoH = Math.round((logoImg.height / logoImg.width) * logoW);
  const padding = Math.round(canvas.width * 0.05);
  const logoX = canvas.width - logoW - padding;
  const logoY = canvas.height - logoH - padding;

  // Draw a soft pill backdrop for the logo
  const pillPad = Math.round(logoW * 0.12);
  const pillX = logoX - pillPad;
  const pillY = logoY - pillPad;
  const pillW = logoW + pillPad * 2;
  const pillH = logoH + pillPad * 2;
  const radius = Math.round(pillH * 0.35);

  ctx.save();
  ctx.globalAlpha = logoOpacity * 0.55;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.moveTo(pillX + radius, pillY);
  ctx.lineTo(pillX + pillW - radius, pillY);
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + radius);
  ctx.lineTo(pillX + pillW, pillY + pillH - radius);
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH);
  ctx.lineTo(pillX + radius, pillY + pillH);
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - radius);
  ctx.lineTo(pillX, pillY + radius);
  ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw logo on top
  ctx.save();
  ctx.globalAlpha = logoOpacity;
  ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

// ─── Furniture selector item ──────────────────────────────────────────────────

function FurnitureToggle({
  placed,
  selected,
  onToggle,
}: {
  placed: PlacedItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const imgSrc = placed.item.views.front;
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all text-left ${
        selected
          ? "bg-violet-500/20 border-violet-500/50 text-violet-200"
          : "bg-white/5 border-white/10 text-white/60 hover:border-white/25 hover:text-white/80"
      }`}
    >
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
        <img src={imgSrc} alt={placed.item.label} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold truncate">{placed.item.label}</div>
        <div className="text-[10px] opacity-60">uid: {placed.uid.replace("item-", "#")}</div>
      </div>
      {selected ? (
        <ToggleRight className="w-5 h-5 text-violet-400 shrink-0" />
      ) : (
        <ToggleLeft className="w-5 h-5 opacity-40 shrink-0" />
      )}
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AILogoIntegration({ placedItems, onApply }: AILogoIntegrationProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");

  // Logo state
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoOpacity, setLogoOpacity] = useState(0.85);
  const [logoScale, setLogoScale] = useState(0.28);

  // Selection state — which placed item UIDs to brand
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());

  // Progress
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("idle");
    setLogoDataUrl(null);
    setLogoFileName("");
    setSelectedUids(new Set());
    setProgress(0);
    setErrorMsg("");
  }, []);

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
      setLogoFileName(file.name);
      setStep("select");
    };
    reader.readAsDataURL(file);
    // Reset the input so re-uploading same file triggers change
    e.target.value = "";
  }, []);

  // ── Toggle all ──────────────────────────────────────────────────────────────
  const toggleAll = useCallback(() => {
    if (selectedUids.size === placedItems.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(placedItems.map((p) => p.uid)));
    }
  }, [placedItems, selectedUids.size]);

  // ── Apply branding ─────────────────────────────────────────────────────────
  const handleApplyBranding = useCallback(async () => {
    if (!logoDataUrl || selectedUids.size === 0) return;
    setStep("branding");
    setProgress(0);
    setErrorMsg("");

    const itemsToProcess = placedItems.filter((p) => selectedUids.has(p.uid));
    const updatedMap = new Map<string, string>(); // uid → brandedSrc
    let done = 0;

    for (const placed of itemsToProcess) {
      try {
        const furnitureSrc =
          placed.item.views[placed.facing] ?? placed.item.views.front;
        const branded = await compositeLogo(furnitureSrc, logoDataUrl, logoOpacity, logoScale);
        updatedMap.set(placed.uid, branded);
      } catch (err) {
        console.warn("Logo composite failed for", placed.uid, err);
        // Skip — leave item unbranded rather than crashing the whole batch
      }
      done++;
      setProgress(Math.round((done / itemsToProcess.length) * 100));
    }

    // Merge brandedSrc into placed items
    const newItems = placedItems.map((p) =>
      updatedMap.has(p.uid) ? { ...p, brandedSrc: updatedMap.get(p.uid) } : p
    );
    onApply(newItems);
    setStep("done");
  }, [logoDataUrl, selectedUids, placedItems, logoOpacity, logoScale, onApply]);

  // ── Remove all branding ────────────────────────────────────────────────────
  const handleRemoveBranding = useCallback(() => {
    onApply(placedItems.map((p) => ({ ...p, brandedSrc: undefined })));
    reset();
  }, [placedItems, onApply, reset]);

  const brandedCount = placedItems.filter((p) => p.brandedSrc).length;
  const allSelected = selectedUids.size === placedItems.length && placedItems.length > 0;

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
            "linear-gradient(135deg, rgba(15,118,110,0.88) 0%, rgba(52,211,153,0.80) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(52,211,153,0.35)",
          boxShadow: "0 4px 24px rgba(15,118,110,0.25)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-bold text-[13px] leading-none mb-0.5">AI Logo Integration</div>
            <div className="text-[10px] font-medium text-white/70 leading-none">
              {open
                ? "Click to collapse"
                : brandedCount > 0
                ? `${brandedCount} item${brandedCount > 1 ? "s" : ""} branded · Click to manage`
                : "Embed client logo on furniture with Canvas AI"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brandedCount > 0 && (
            <span className="bg-emerald-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {brandedCount} branded
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
              background: "rgba(10, 18, 16, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(52,211,153,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            {/* ── IDLE ──────────────────────────────────────────── */}
            {step === "idle" && (
              <div className="p-5">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-none mb-1.5">
                      Logo Integration
                    </h3>
                    <p className="text-white/50 text-[11px] leading-relaxed">
                      Upload your client&apos;s logo and the Canvas API will composite it onto
                      selected furniture items in the scene — great for branded event proposals.
                    </p>
                  </div>
                </div>

                {/* How it works */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { icon: <Upload className="w-4 h-4" />, label: "Upload logo", color: "text-teal-400 bg-teal-500/15 border-teal-500/25" },
                    { icon: <Wand2 className="w-4 h-4" />, label: "Select items", color: "text-violet-400 bg-violet-500/15 border-violet-500/25" },
                    { icon: <Sparkles className="w-4 h-4" />, label: "Apply & brand", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/25" },
                  ].map((s, i) => (
                    <div key={i} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center ${s.color}`}>
                      {s.icon}
                      <span className="text-[9px] font-semibold leading-tight">{s.label}</span>
                    </div>
                  ))}
                </div>

                {placedItems.length === 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/80 text-[10px] leading-relaxed">
                    No furniture is placed in this scene yet. Add some items first using the
                    Furniture Panel or AI Auto-Design.
                  </div>
                )}

                {brandedCount > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-emerald-300 text-[11px] font-semibold">{brandedCount} item{brandedCount > 1 ? "s" : ""} currently branded.</span>
                      <button
                        onClick={handleRemoveBranding}
                        className="ml-2 text-[10px] text-red-400 underline underline-offset-2 hover:text-red-300"
                      >
                        Remove all branding
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={placedItems.length === 0}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #0f766e, #34d399)",
                    boxShadow: "0 4px 16px rgba(15,118,110,0.4)",
                  }}
                >
                  <ImagePlus className="w-4 h-4" />
                  Upload Client Logo
                </motion.button>
              </div>
            )}

            {/* ── UPLOAD / SELECT ────────────────────────────────── */}
            {(step === "upload" || step === "select") && logoDataUrl && (
              <div className="p-5 flex flex-col gap-4">
                {/* Logo preview */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={logoDataUrl} alt="logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[12px] font-semibold truncate">{logoFileName}</div>
                    <div className="text-white/40 text-[10px]">Logo uploaded · ready to configure</div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-teal-400 border border-teal-500/30 px-2 py-1 rounded-lg hover:bg-teal-500/10 transition-all"
                  >
                    Change
                  </button>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wider block mb-1.5">
                      Opacity · {Math.round(logoOpacity * 100)}%
                    </label>
                    <input
                      type="range" min={30} max={100} step={5}
                      value={Math.round(logoOpacity * 100)}
                      onChange={(e) => setLogoOpacity(Number(e.target.value) / 100)}
                      className="w-full accent-teal-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 font-semibold uppercase tracking-wider block mb-1.5">
                      Size · {Math.round(logoScale * 100)}%
                    </label>
                    <input
                      type="range" min={10} max={50} step={2}
                      value={Math.round(logoScale * 100)}
                      onChange={(e) => setLogoScale(Number(e.target.value) / 100)}
                      className="w-full accent-teal-400"
                    />
                  </div>
                </div>

                {/* Select furniture */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                      Select Furniture to Brand
                    </span>
                    <button
                      onClick={toggleAll}
                      className="text-[10px] text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  {placedItems.length === 0 ? (
                    <div className="text-white/30 text-[11px] text-center py-4">No items in scene.</div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-52 overflow-y-auto scrollbar-hide">
                      {placedItems.map((placed) => (
                        <FurnitureToggle
                          key={placed.uid}
                          placed={placed}
                          selected={selectedUids.has(placed.uid)}
                          onToggle={() =>
                            setSelectedUids((prev) => {
                              const next = new Set(prev);
                              next.has(placed.uid) ? next.delete(placed.uid) : next.add(placed.uid);
                              return next;
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-none px-3 py-2.5 rounded-xl text-[11px] font-semibold text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleApplyBranding}
                    disabled={selectedUids.size === 0}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #0f766e, #34d399)",
                      boxShadow: "0 4px 14px rgba(15,118,110,0.35)",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Brand {selectedUids.size} Item{selectedUids.size !== 1 ? "s" : ""}
                  </motion.button>
                </div>
              </div>
            )}

            {/* ── BRANDING ──────────────────────────────────────── */}
            {step === "branding" && (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-5">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(15,118,110,0.3), rgba(52,211,153,0.2))",
                      border: "1px solid rgba(52,211,153,0.3)",
                    }}
                  >
                    <Layers className="w-7 h-7 text-teal-300" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-teal-400/40 animate-ping" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm mb-1">Compositing logo…</p>
                  <p className="text-white/40 text-[11px]">
                    Canvas API is rendering your logo onto {selectedUids.size} furniture item{selectedUids.size !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-teal-400"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
                <div className="flex items-center gap-2 text-teal-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[11px] font-medium">{progress}% complete</span>
                </div>
                {errorMsg && (
                  <p className="text-red-400 text-[11px] text-center">{errorMsg}</p>
                )}
              </div>
            )}

            {/* ── DONE ──────────────────────────────────────────── */}
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
                  <p className="text-white font-bold text-sm mb-1">Logo Applied!</p>
                  <p className="text-white/50 text-[11px]">
                    {selectedUids.size} item{selectedUids.size !== 1 ? "s" : ""} now display your client&apos;s logo. You can still drag and resize them.
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleRemoveBranding}
                    className="flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    Remove Branding
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 px-3 py-2 rounded-xl text-[11px] font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Brand Again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
