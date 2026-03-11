"use client";

import { motion } from "framer-motion";
import { 
  Box, 
  ArrowRight, 
  Sparkles, 
  Maximize2, 
  Layout, 
  Users, 
  ChevronRight,
  Globe
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const features = [
  {
    title: "Immersive 360° Scenes",
    description: "Upload real venue captures and design inside them with pixel-perfect accuracy.",
    icon: Globe,
    color: "bg-blue-50 text-blue-500",
  },
  {
    title: "Vast Asset Library",
    description: "Access thousands of premium furniture, lighting, and structural elements.",
    icon: Box,
    color: "bg-coral-50 text-coral-500",
  },
  {
    title: "Real-time Collaboration",
    description: "Present your designs to clients and agencies with instant shareable links.",
    icon: Users,
    color: "bg-emerald-50 text-emerald-500",
  },
];

  export default function Home() {
    const { isLoggedIn } = useAuth();
    
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 border border-coral-100 text-coral-600 text-[10px] font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" />
              The Future of Event Scénography
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-zinc-900 dark:text-zinc-50 leading-[1.1] mb-6 tracking-tight">
              Design <span className="text-coral-400 italic">immersive</span> event venues.
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed max-w-lg">
              Professional 360° platform for event agencies to design, visualize, and present scénography inside real venues.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href={isLoggedIn ? "/dashboard" : "/login"} 
                className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                Watch Demo
              </button>
            </div>

          
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
              Trusted by <span className="text-zinc-900 dark:text-zinc-50 font-bold">500+</span> agencies worldwide
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-square rounded-3xl overflow-hidden glass-card p-4">
            <div className="w-full h-full rounded-2xl overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop" 
                alt="Venue" 
                className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-coral-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Live Editor Preview</span>
                </div>
                <h3 className="text-2xl font-bold">Palais des Festivals</h3>
              </div>
            </div>
          </div>
          
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-6 -right-6 glass-card p-4 w-48 hidden md:block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Layout className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Status</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Ready to present</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-emerald-400" />
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-10 -left-10 glass-card p-5 w-56 hidden md:block"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Active Assets</h4>
              <Maximize2 className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800" />
                  <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group hover:bg-white dark:hover:bg-zinc-800/50 transition-all cursor-default"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", f.color)}>
              <f.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">{f.title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed text-sm">
              {f.description}
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-coral-500 hover:gap-3 transition-all">
              Learn more
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
