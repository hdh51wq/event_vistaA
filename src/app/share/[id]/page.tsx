"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  User,
  Info,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Share2,
  FileText,
  X,
  Layout,
  Sofa,
  DollarSign,
  Maximize2,
  Layers,
  FileCheck
} from "lucide-react";
import { useState, useEffect, useRef, use, useMemo } from "react";
import dynamic from "next/dynamic";
import SceneOverlay, { PlacedItem } from "@/components/SceneOverlay";
import { PanoramaViewerHandle } from "@/components/PanoramaViewer";
import { FURNITURE_ITEMS } from "@/lib/furniture";

const PanoramaViewer = dynamic(() => import("@/components/PanoramaViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
      <div className="text-white/60 text-sm font-medium animate-pulse">Loading 360° scene…</div>
    </div>
  ),
});

const AGENCY_INFO = {
  name: "EventVista Elite Scenography",
  email: "hello@eventvista.com",
  website: "www.eventvista.com",
  phone: "+33 1 23 45 67 89",
  location: "Paris, France"
};

const BASE = "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG";

const EVENT_SCENES: Record<string, { label: string; src: string; dimensions: string; setup: string; rent: number }[]> = {
  Wedding: [
    { label: "Dancing Hall",  src: `${BASE}/dancing_hall.jpg`, dimensions: "25m x 40m", setup: "24h", rent: 1500 },
    { label: "Music Hall",    src: `${BASE}/music_hall_02.jpg`, dimensions: "30m x 50m", setup: "36h", rent: 2200 },
    { label: "Pillared Hall", src: `${BASE}/solitude_interior.jpg`, dimensions: "20m x 30m", setup: "18h", rent: 1200 },
  ],
  Conference: [
    { label: "Main Theater",   src: `${BASE}/theater_02.jpg`, dimensions: "40m x 60m", setup: "48h", rent: 3500 },
    { label: "Stage Hall",     src: `${BASE}/theater_01.jpg`, dimensions: "35m x 45m", setup: "36h", rent: 2800 },
    { label: "Lecture Hall",   src: `${BASE}/school_hall.jpg`, dimensions: "20m x 25m", setup: "12h", rent: 800 },
    { label: "Screening Room", src: `${BASE}/cinema_hall.jpg`, dimensions: "15m x 20m", setup: "12h", rent: 600 },
  ],
  "Gala Dinner": [
    { label: "Grand Hall",    src: `${BASE}/old_hall.jpg`, dimensions: "45m x 70m", setup: "60h", rent: 4500 },
    { label: "Entrance Hall", src: `${BASE}/entrance_hall.jpg`, dimensions: "15m x 30m", setup: "24h", rent: 1000 },
    { label: "Long Gallery",  src: `${BASE}/large_corridor.jpg`, dimensions: "10m x 80m", setup: "36h", rent: 1800 },
  ],
};

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const panoramaRef = useRef<PanoramaViewerHandle | null>(null);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setProject(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const eventType = project?.eventType || "Wedding";
  const scenes = EVENT_SCENES[eventType] || EVENT_SCENES["Wedding"];
  const currentScene = scenes[sceneIndex];
  const sceneKey = `${eventType}::${sceneIndex}`;
  const placedItems = project?.data?.[sceneKey] || [];

  // Data Aggregation for Report
  const inventorySummary = useMemo(() => {
    if (!project?.data) return [];
    const summary: Record<string, { label: string; count: number; price: number }> = {};
    
    Object.values(project.data).forEach((sceneItems: any) => {
      if (Array.isArray(sceneItems)) {
        sceneItems.forEach((p: any) => {
          const key = p.item.id;
          if (!summary[key]) {
            const staticItem = FURNITURE_ITEMS.find(fi => fi.id === p.item.id);
            summary[key] = { 
              label: p.item.label, 
              count: 0, 
              price: p.item.price || staticItem?.price || 0 
            };
          }
          summary[key].count++;
        });
      }
    });
    return Object.values(summary);
  }, [project]);

  const totalFurniture = inventorySummary.reduce((acc, f) => acc + (f.price * f.count), 0);
  const totalVenue = scenes.reduce((acc, s) => acc + s.rent, 0);
  const finalInvestment = totalFurniture + totalVenue + (totalFurniture * 0.15) + 2500;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-coral-200 border-t-coral-500 rounded-full animate-spin" />
          <p className="text-zinc-400 font-medium">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Presentation not found</h1>
          <p className="text-zinc-500">The link might have expired or is incorrect.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-zinc-50 relative">
      {/* Interactive 360 Viewer (Always as Background) */}
      <div className="absolute inset-0 z-0">
        <PanoramaViewer ref={panoramaRef} src={currentScene.src} />
        <SceneOverlay
          placedItems={placedItems}
          viewerRef={panoramaRef}
          readOnly={true}
        />
        
        {/* Brand Watermark */}
        <div className="absolute bottom-6 right-8 z-10 opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Powered by</p>
          <span className="text-sm font-black text-zinc-900 tracking-tighter">EventVista</span>
        </div>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 p-6 pointer-events-none">
        <div className="flex items-start justify-between">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card !bg-white/90 p-5 max-w-md pointer-events-auto"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-coral-100 text-coral-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                Exclusive Preview
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Interactive Proposal
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 leading-tight mb-1">{project.name}</h1>
            <p className="text-sm text-zinc-500 font-medium mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {project.location || "Location not specified"}
            </p>
            
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
              <button 
                onClick={() => setShowReport(!showReport)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  showReport 
                  ? "bg-zinc-900 text-white" 
                  : "bg-coral-500 text-white hover:bg-coral-600"
                }`}
              >
                {showReport ? <X className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {showReport ? "CLOSE REPORT" : "VIEW FULL PROPOSAL"}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card !bg-zinc-900/90 !text-white p-5 max-w-xs pointer-events-auto border-none"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-coral-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Designed By</p>
            </div>
            <h2 className="text-lg font-bold mb-3">{AGENCY_INFO.name}</h2>
            <p className="text-[10px] text-white/50 leading-relaxed font-medium">Professional Event Scenography & 3D Visualization Specialists.</p>
          </motion.div>
        </div>
      </div>

      {/* Report Modal / Sidebar Overlay */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-full max-w-2xl bg-white/95 backdrop-blur-xl z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] overflow-y-auto"
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <p className="text-[10px] text-coral-500 font-black uppercase tracking-[0.2em] mb-2">Technical Proposal</p>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Project Details & Quotation</h2>
                </div>
                <button 
                  onClick={() => setShowReport(false)}
                  className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* 1. Project Overview */}
              <section className="mb-12">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" /> 1. Project Overview
                </h3>
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                  <p className="text-zinc-600 leading-relaxed mb-6">
                    This comprehensive proposal details the creative vision and technical execution for <span className="font-bold text-zinc-900">{project.name}</span>. 
                    Our focus is to deliver an immersive {project.eventType.toLowerCase()} experience that merges high-end furniture curation with strategic spatial planning.
                  </p>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Client</p>
                      <p className="font-bold text-zinc-800">{project.client || "Valued Client"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Event Type</p>
                      <p className="font-bold text-zinc-800">{project.eventType}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Technical Specs */}
              <section className="mb-12">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" /> 2. Venue Technical Specs
                </h3>
                <div className="space-y-3">
                  {scenes.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-coral-50 flex items-center justify-center text-coral-500 font-bold text-xs">
                          S{i+1}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{s.label}</p>
                          <p className="text-[10px] text-zinc-400 font-medium uppercase">{s.dimensions} • Setup: {s.setup}</p>
                        </div>
                      </div>
                      <p className="font-bold text-zinc-700 text-sm">${s.rent.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Inventory */}
              <section className="mb-12">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Sofa className="w-4 h-4" /> 3. Furniture Inventory
                </h3>
                <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-zinc-500">Item</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 text-center">Qty</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 text-right">Unit</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {inventorySummary.map((f, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-800">{f.label}</td>
                          <td className="px-4 py-3 text-center text-zinc-600 font-medium">{f.count}</td>
                          <td className="px-4 py-3 text-right text-zinc-500 font-medium">${f.price}</td>
                          <td className="px-4 py-3 text-right font-bold text-zinc-900">${(f.price * f.count).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Budget */}
              <section className="mb-12">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 4. Budget Summary
                </h3>
                <div className="space-y-4 p-6 bg-coral-50/30 border border-coral-100 rounded-2xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Furniture & Elements</span>
                    <span className="font-bold text-zinc-900">${totalFurniture.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Venue Total Rent</span>
                    <span className="font-bold text-zinc-900">${totalVenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Logistics & Installation (15%)</span>
                    <span className="font-bold text-zinc-900">${(totalFurniture * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Agency Professional Fee</span>
                    <span className="font-bold text-zinc-900">$2,500</span>
                  </div>
                  <div className="pt-4 border-t border-coral-100 flex justify-between">
                    <span className="font-black text-coral-600 uppercase tracking-widest text-xs self-center">Investment Total</span>
                    <span className="text-2xl font-black text-zinc-900">${finalInvestment.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              {/* 5. Footer */}
              <section className="pt-8 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><FileCheck className="w-3 h-3 text-green-500" /> PROPOSAL VALID FOR 30 DAYS</span>
                </div>
                <p>© 2026 EVENTVISTA • {AGENCY_INFO.website}</p>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive HUD Overlay (When report is closed) */}
      {!showReport && (
        <>
          {/* 360° Instructions */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: [10, 0, 0, -20]
              }}
              transition={{ 
                duration: 6, 
                times: [0, 0.1, 0.7, 1],
                delay: 1,
                ease: "easeInOut"
              }}
              className="bg-black/30 backdrop-blur-md text-white text-xs font-semibold px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10"
            >
              <div className="flex items-center gap-1">
                <span className="animate-pulse">↔️</span>
              </div>
              <span>Click and drag to explore the 360° space</span>
            </motion.div>
          </div>

          {/* Scene Selector Overlay */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-card !bg-white/95 px-5 py-3 flex items-center gap-6 shadow-2xl"
            >
              <div className="flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-coral-500" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 mr-3">Scenes</span>
              </div>
              <div className="flex items-center gap-3">
                {scenes.map((scene, i) => (
                  <button
                    key={i}
                    onClick={() => setSceneIndex(i)}
                    className={`relative group flex flex-col items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
                      i === sceneIndex
                        ? "bg-coral-50 text-coral-600 scale-105"
                        : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${i === sceneIndex ? "opacity-100" : "opacity-60"}`}>
                      {scene.label}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${i === sceneIndex ? "bg-coral-500 shadow-[0_0_8px_rgba(255,107,74,0.5)]" : "bg-zinc-200"}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
