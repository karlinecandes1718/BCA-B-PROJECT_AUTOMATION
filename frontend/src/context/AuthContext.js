"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read session from localStorage exactly once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bca_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role && parsed.identifier) {
          setUser(parsed);
        }
      }
    } catch (e) {
      localStorage.removeItem("bca_session");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (role, identifier) => {
    const session = { role, identifier, loggedInAt: new Date().toISOString() };
    localStorage.setItem("bca_session", JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem("bca_session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}