"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on client-side mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bca_session");
      if (stored) {
        const session = JSON.parse(stored);
        // Optional session validation (e.g. check if expired after a long time)
        setUser(session);
      }
    } catch (e) {
      console.error("Failed to parse auth session", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync session and route guards
  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== "/" && pathname !== "/login") {
        router.replace("/");
      }
      return;
    }

    if (pathname === "/" || pathname === "/login") {
      const target = user.role === "admin" ? "/admin" : "/dashboard";
      if (pathname !== target) {
        router.replace(target);
      }
      return;
    }

    if (user.role === "student" && pathname.startsWith("/admin")) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = (role, identifier) => {
    const session = {
      role,
      identifier,
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem("bca_session", JSON.stringify(session));
    setUser(session);

    const target = role === "admin" ? "/admin" : "/dashboard";
    if (window.location.pathname !== target) {
      router.replace(target);
    }
  };

  const logout = () => {
    localStorage.removeItem("bca_session");
    setUser(null);
    router.replace("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
