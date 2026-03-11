"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { FurnitureItem, FURNITURE_ITEMS } from "@/lib/furniture";
import FurnitureUploadModal from "./FurnitureUploadModal";
import { Plus, User as UserIcon, Library } from "lucide-react";

export type { FurnitureItem };


interface FurniturePanelProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: FurnitureItem) => void;
}

export default function FurniturePanel({ open, onClose, onAdd }: FurniturePanelProps) {
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const customItems = (user?.customFurniture || []) as FurnitureItem[];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="furniture-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-72 z-30 flex flex-col shadow-2xl"
            style={{
              background: "rgba(15,15,15,0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-coral-400" />
                <span className="text-white font-bold text-sm tracking-tight uppercase">Furniture Library</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
              {/* My Items Section */}
              <div className="px-5 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">My Items</h3>
                  </div>
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-coral-500 hover:bg-coral-600 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-coral-500/20"
                  >
                    <Plus className="w-3 h-3" />
                    Upload
                  </button>
                </div>

                {customItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {customItems.map((item) => (
                      <FurnitureCard key={item.id} item={item} onAdd={onAdd} />
                    ))}
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border border-dashed border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5 text-white/20 group-hover:text-white/60" />
                    </div>
                    <p className="text-[10px] text-white/30 font-medium text-center leading-relaxed">
                      No custom items yet.<br/>Click to upload your own.
                    </p>
                  </div>
                )}
              </div>

              {/* Standard Library Section */}
              <div className="px-5 py-2">
                <div className="flex items-center gap-2 mb-4">
                  <Library className="w-3.5 h-3.5 text-zinc-500" />
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Standard Assets</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FURNITURE_ITEMS.map((item) => (
                    <FurnitureCard key={item.id} item={item} onAdd={onAdd} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FurnitureUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          // Success handled by updateUser in modal
        }}
      />
    </>
  );
}

function FurnitureCard({ item, onAdd }: { item: FurnitureItem; onAdd: (item: FurnitureItem) => void }) {
  return (
    <button
      onClick={() => onAdd(item)}
      className="group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 cursor-pointer text-left relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div className="w-16 h-16 flex items-center justify-center relative z-10">
        <Image
          src={item.views.front}
          alt={item.label}
          width={64}
          height={64}
          className="object-contain w-full h-full drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
          unoptimized
        />
      </div>
      <div className="flex flex-col items-center gap-0.5 relative z-10 w-full">
        <span className="text-white/70 text-[11px] font-semibold text-center leading-tight w-full truncate">
          {item.label}
        </span>
        <span className="text-coral-400 text-[10px] font-bold">
          ${item.price?.toLocaleString() || "0"}
        </span>
      </div>
      
      {/* Decorative background pulse */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral-500/0 via-coral-500/0 to-coral-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
