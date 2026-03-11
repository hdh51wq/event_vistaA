"use client";

import Link from "next/link";
import { LayoutGrid, Settings, Box, Home, User, LogOut, BarChart3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Guard: only render auth-dependent UI after client hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (pathname === "/login") return null;

  const navItems = [
    { icon: Home, label: "Home", href: "/", show: true },
    { icon: LayoutGrid, label: "Projects", href: "/dashboard", show: isLoggedIn },
    { icon: BarChart3, label: "Analytics", href: "/analytics", show: isLoggedIn },
    { icon: Settings, label: "Settings", href: "/settings", show: isLoggedIn },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl">
      <div className="glass-nav rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-coral-400 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-800 dark:text-zinc-100">EventVista</span>
        </Link>

        {/* Nav links — only shown after mount to avoid auth mismatch */}
        <div className="hidden md:flex items-center gap-1">
          {mounted && navItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  isActive
                    ? "bg-coral-50 dark:bg-coral-950/30 text-coral-600 dark:text-coral-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {/* User menu — only after mount */}
          {mounted && isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md rounded-2xl transition-all group border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">{user?.name}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Agency Admin</span>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-coral-100 to-peach-100 dark:from-coral-900/30 dark:to-peach-900/30 rounded-xl flex items-center justify-center overflow-hidden border border-coral-200 dark:border-coral-800 group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5 text-coral-600 dark:text-coral-400" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-zinc-50 dark:border-zinc-800 mb-2 sm:hidden">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Agency Admin</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => { logout(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
