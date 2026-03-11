"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface Project {
  _id: string;
  name: string;
  client: string;
  event: string;
  eventType: 'Wedding' | 'Conference' | 'Gala Dinner';
  location: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Final';
  thumbnail: string;
  sceneCount: number;
  budget: number;
  currency: string;
  billingStatus: 'pending' | 'paid' | 'cancelled';
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  agencyName: string;
  phone?: string;
  address?: string;
  customFurniture?: Array<{
    id: string;
    label: string;
    views: {
      front: string;
      back?: string;
      left?: string;
      right?: string;
    };
    defaultWidth: number;
    defaultHeight: number;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  saveProfile: (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  projects: Project[];
  fetchProjects: () => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  // `loading` stays true until the client has read localStorage.
  // Components that redirect based on auth (e.g. dashboard) must wait for
  // loading === false before acting so they don't redirect on first render.
  // suppressHydrationWarning on the wrapping div handles the SSR mismatch.
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("eventvista_user");
    const savedToken = localStorage.getItem("eventvista_token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("eventvista_user", JSON.stringify(data.user));
    localStorage.setItem("eventvista_token", data.token);
    router.push("/dashboard");
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("eventvista_user", JSON.stringify(data.user));
    localStorage.setItem("eventvista_token", data.token);
    router.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setProjects([]);
    localStorage.removeItem("eventvista_user");
    localStorage.removeItem("eventvista_token");
    router.push("/");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("eventvista_user", JSON.stringify(updatedUser));
    }
  };

  const saveProfile = async (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Update failed");
    const updatedUser = { ...user, ...json.user } as User;
    setUser(updatedUser);
    localStorage.setItem("eventvista_user", JSON.stringify(updatedUser));
  };

  const deleteAccount = async (password: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch("/api/auth/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Delete failed");
    setUser(null);
    setToken(null);
    setProjects([]);
    localStorage.removeItem("eventvista_user");
    localStorage.removeItem("eventvista_token");
    router.push("/");
  };

  const fetchProjects = async () => {
    if (!token) return;
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setProjects(data);
  };

  const createProject = async (projectData: Partial<Project>) => {
    if (!token) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create project");
    setProjects(prev => [data, ...prev]);
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    if (!token) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update project");
    setProjects(prev => prev.map(p => p._id === id ? data : p));
  };

  const deleteProject = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete project");
    setProjects(prev => prev.filter(p => p._id !== id));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      signup,
      logout,
      updateUser,
      saveProfile,
      deleteAccount,
      isLoggedIn: !!user,
      loading,
      projects,
      fetchProjects,
      createProject,
      updateProject,
      deleteProject,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
