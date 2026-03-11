"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, ChevronDown, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { PlacedItem } from "@/components/SceneOverlay";
import { FURNITURE_ITEMS } from "@/lib/furniture";

interface Scene {
  label: string;
  dimensions?: string;
  rentPrice?: number;
  items: PlacedItem[];
}

interface ProjectContext {
  projectName: string;
  eventType: string;
  budget: number;
  scenes: Scene[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  suggestions?: string[];
}

function parseDimensions(dims?: string) {
  if (!dims) return { w: 0, h: 0, area: 0 };
  const parts = dims.replace(/m/g, "").split("x").map((v) => parseFloat(v.trim()));
  const w = parts[0] || 0;
  const h = parts[1] || 0;
  return { w, h, area: w * h };
}

function buildScenesSummary(scenes: Scene[]) {
  return scenes.map((s) => {
    const itemMap: Record<string, { label: string; price: number; qty: number }> = {};
    s.items.forEach((p) => {
      const price =
        p.item.price ?? FURNITURE_ITEMS.find((f) => f.id === p.item.id)?.price ?? 0;
      if (itemMap[p.item.id]) {
        itemMap[p.item.id].qty += 1;
      } else {
        itemMap[p.item.id] = { label: p.item.label, price, qty: 1 };
      }
    });
    return {
      label: s.label,
      dimensions: s.dimensions,
      rentPrice: s.rentPrice,
      items: Object.values(itemMap),
    };
  });
}

function BudgetBar({ context }: { context: ProjectContext }) {
  const currentSpend = context.scenes.reduce((total, s) => {
    const itemCost = s.items.reduce((sum, p) => {
      const price = p.item.price ?? FURNITURE_ITEMS.find((f) => f.id === p.item.id)?.price ?? 0;
      return sum + price;
    }, 0);
    return total + itemCost + (s.rentPrice ?? 0);
  }, 0);

  const pct = context.budget > 0 ? Math.min((currentSpend / context.budget) * 100, 100) : 0;
  const over = currentSpend > context.budget;

  return (
    <div className="px-4 py-3 border-b border-white/10">
      <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
        <span className="text-white/60">Current spend</span>
        <span className={over ? "text-red-400" : "text-emerald-400"}>
          €{currentSpend.toLocaleString()} / €{context.budget.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${over ? "bg-red-400" : "bg-emerald-400"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {over && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400 font-medium">
          <TriangleAlert className="w-3 h-3" />
          Over budget by €{(currentSpend - context.budget).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  onSuggestion,
}: {
  msg: ChatMessage;
  onSuggestion: (s: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-3`}
    >
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-coral-400 to-orange-400 flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        <div
          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-coral-500 to-orange-400 text-white rounded-br-sm shadow-sm"
              : msg.isError
              ? "bg-red-500/20 border border-red-400/30 text-red-300 rounded-bl-sm"
              : "bg-white/10 text-white/90 rounded-bl-sm border border-white/10"
          }`}
        >
          <FormattedMessage content={msg.content} />
        </div>
      </div>

      {/* Follow-up suggestion chips */}
      {!isUser && !msg.isError && msg.suggestions && msg.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="flex flex-wrap gap-1.5 mt-2 ml-9"
        >
          {msg.suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestion(s)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-xl border transition-all text-left"
              style={{
                background: "rgba(255,107,74,0.10)",
                borderColor: "rgba(255,107,74,0.30)",
                color: "rgba(255,180,160,0.95)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,74,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,74,0.10)";
              }}
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="font-bold text-white mt-2 mb-1 first:mt-0">
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-white/95 mt-1">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.match(/^[-•*]\s/)) {
          return (
            <div key={i} className="flex gap-1.5 mt-0.5">
              <span className="text-coral-300 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="mt-0.5" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      })}
    </>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-white/15 px-1 rounded text-xs">$1</code>');
}

const QUICK_PROMPTS = [
  "How many chairs do I need per scene?",
  "Optimise my budget allocation",
  "What lighting is recommended?",
  "Compare my current setup to best practices",
];

interface AIChatbotProps {
  context: ProjectContext;
}

export default function AIChatbot({ context }: AIChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (!hasGreeted) {
        setHasGreeted(true);
        const { area } = parseDimensions(context.scenes[0]?.dimensions);
        const totalScenes = context.scenes.length;
        setMessages([
          {
            role: "assistant",
            content: `Hi! I'm your EventVista AI assistant for **${context.projectName}**.\n\nI've analysed your **${totalScenes} scene${totalScenes > 1 ? "s" : ""}** (${context.eventType}) with a budget of **€${context.budget.toLocaleString()}**${area ? ` across spaces up to ${area.toFixed(0)} m²` : ""}.\n\nAsk me anything about asset quantities, budget allocation, or scenography recommendations!`,
          },
        ]);
      }
    }
  }, [open, hasGreeted, context]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: ChatMessage = { role: "user", content: text.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai-recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: context.projectName,
            eventType: context.eventType,
            budget: context.budget,
            scenes: buildScenesSummary(context.scenes),
            userMessage: text.trim(),
            history: newMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await res.json();
          if (!res.ok || data.error) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: data.error ?? "Something went wrong. Please try again.",
                isError: true,
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: data.reply,
                suggestions: data.suggestions ?? [],
              },
            ]);
          }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Network error. Check your connection and try again.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, context]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const totalCurrentSpend = context.scenes.reduce((total, s) => {
    const itemCost = s.items.reduce((sum, p) => {
      const price = p.item.price ?? FURNITURE_ITEMS.find((f) => f.id === p.item.id)?.price ?? 0;
      return sum + price;
    }, 0);
    return total + itemCost + (s.rentPrice ?? 0);
  }, 0);
  const budgetOver = totalCurrentSpend > context.budget;

  return (
    <div className="relative">
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(255,107,74,0.9) 0%, rgba(255,142,114,0.85) 100%)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,107,74,0.4)",
          boxShadow: "0 4px 24px rgba(255,107,74,0.25)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="font-bold text-[13px] leading-none mb-0.5">AI Asset Advisor</div>
            <div className="text-[10px] font-medium text-white/70 leading-none">
              {open ? "Click to collapse" : "Smart recommendations · Budget analysis"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {budgetOver && (
            <span className="bg-red-500/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Over Budget
            </span>
          )}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-white/80" />
          </motion.div>
        </div>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 480, y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden mt-2 rounded-2xl flex flex-col"
            style={{
              background: "rgba(15, 15, 20, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            {/* Budget bar */}
            {context.budget > 0 && <BudgetBar context={context} />}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-0 scrollbar-hide">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/30 text-sm">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Opening session...
                  </div>
                </div>
              )}
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} onSuggestion={sendMessage} />
                ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 mb-3"
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-coral-400 to-orange-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 border border-white/10 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-coral-400 animate-spin" />
                    <span className="text-white/50 text-sm">Analysing your project…</span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && !loading && (
              <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 hover:text-white/90 border border-white/10 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-white/8">
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about chairs, budget, lighting…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 resize-none outline-none leading-5 py-1 max-h-20 scrollbar-hide disabled:opacity-50"
                  style={{ minHeight: "28px" }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                  style={{
                    background: input.trim()
                      ? "linear-gradient(135deg, #FF6B4A, #FF8E72)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </motion.button>
              </div>
              <p className="text-[10px] text-white/25 text-center mt-1.5">
                Powered by Groq · Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
