"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { LoginResponse, Role } from "../../types";

interface AuthContextValue {
  user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    locale: string;
    timezone: string;
    is_verified: boolean;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
  } | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("sp_access") : null;
    if (storedToken) {
      fetchUser(storedToken).then((userData) => {
        setUser(userData);
        setToken(storedToken);
        setIsLoading(false);
      }).catch(() => {
        localStorage.removeItem("sp_access");
        localStorage.removeItem("sp_refresh");
        setUser(null);
        setToken(null);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

   async function fetchUser(accessToken: string) {
     try {
       const response = await fetch("/api/auth/me", {
         headers: { Authorization: `Bearer ${accessToken}` },
       });
       if (!response.ok) return null;
       const data = await response.json();
       return {
         id: data.user?.id || data.id,
         email: data.user?.email || data.email,
         username: data.user?.username || data.username,
         role: data.user?.role || "USER",
         locale: data.user?.locale || "",
         timezone: data.user?.timezone || "",
         is_verified: data.user?.is_verified || false,
         is_active: data.user?.is_active || false,
         is_staff: data.user?.is_staff || false,
         is_superuser: data.user?.is_superuser || false,
       };
     } catch {
       return null;
     }
   }

  async function login(email: string, password: string) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.detail || "Connexion impossible.");
    }

    const { access, refresh, user } = data;
    localStorage.setItem("sp_access", access);
    localStorage.setItem("sp_refresh", refresh);
    setUser(user);
    setToken(access);
    return true;
  }

  async function logout() {
    const access = localStorage.getItem("sp_access");
    const refresh = localStorage.getItem("sp_refresh");

    if (refresh) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
      } catch {
        // Ignorer les erreurs réseau
      }
    }

    localStorage.removeItem("sp_access");
    localStorage.removeItem("sp_refresh");
    setUser(null);
    setToken(null);
    router.push("/admin/connexion");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
