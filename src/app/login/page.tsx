"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Box, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      if (isLogin) {
        await login(email, password);
        setFeedback({ type: "success", message: "Welcome back! Redirecting..." });
      } else {
        await signup(name, email, password);
        setFeedback({ type: "success", message: "Account created! Redirecting..." });
      }
    } catch (error: any) {
      setFeedback({ type: "error", message: error.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFeedback(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_50%),_radial-gradient(circle_at_bottom_left,_var(--tw-gradient-to),_transparent_50%)] from-coral-50/50 to-peach-50/50 dark:from-zinc-900/50 dark:to-zinc-800/50 opacity-100" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-coral-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-coral-200 dark:shadow-none">
              <Box className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
              {isLogin ? "Welcome Back" : "Join EventVista"}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center">
              {isLogin 
                ? "Enter your credentials to access your event dashboard" 
                : "Create an account to start designing your immersive events"}
            </p>
          </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-5 py-3.5 bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agency@example.com"
                  className="w-full px-5 py-3.5 bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-200 transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                />
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
                      feedback.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 group mt-4 disabled:opacity-50 shadow-lg shadow-coral-100 dark:shadow-none"
              >
                {loading ? "Processing..." : (isLogin ? "Login" : "Create Account")}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={switchMode}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-coral-500 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
