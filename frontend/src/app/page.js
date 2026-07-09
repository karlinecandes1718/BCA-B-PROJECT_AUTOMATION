"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Shield, Key, AlertCircle, Mail, Chrome } from "lucide-react";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("student");
  const [gmail, setGmail] = useState("");
  const [studentError, setStudentError] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Redirect if already logged in — runs only once when loading finishes
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show nothing while checking stored session to avoid flash
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E4FA3]"></div>
      </div>
    );
  }

  // Already logged in — show nothing (redirect effect will fire)
  if (user) return null;

  const handleStudentGmailSubmit = (e) => {
    e.preventDefault();
    setStudentError("");
    const trimmed = gmail.trim().toLowerCase();
    if (!trimmed) {
      setStudentError("Email is required.");
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@bcah\.christuniversity\.in$/.test(trimmed)) {
      setStudentError("use christ mail id only");
      return;
    }
    login("student", trimmed);
    router.replace("/dashboard");
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setAdminError("");
    if (!adminName.trim()) { setAdminError("Name is required."); return; }
    if (!adminPassword) { setAdminError("Password is required."); return; }
    if (adminPassword !== "0987") { setAdminError("Invalid administrator security code."); return; }
    login("admin", `Admin ${adminName.trim()}`);
    router.replace("/admin");
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 min-h-screen bg-white">

      {/* Header branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          3BCA-B Activity Log
        </h1>
        <p className="text-sm text-slate-600">
          Christ University Department of Computer Applications
        </p>
      </div>

      {/* Login card */}
      <div className="sm:mx-auto w-full sm:max-w-md">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setActiveTab("student"); setAdminError(""); setStudentError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "student"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Mail className="h-4 w-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("admin"); setStudentError(""); setAdminError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Shield className="h-4 w-4" /> Admin
            </button>
          </div>

          <div className="p-6 space-y-4">

            {/* ── STUDENT LOGIN ── */}
            {activeTab === "student" && (
              <div className="space-y-3">
                {/* Manual email form */}
                <form onSubmit={handleStudentGmailSubmit} className="space-y-3">
                  {studentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{studentError}</span>
                    </div>
                  )}
                  <div>
                    <label htmlFor="studentGmail" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        id="studentGmail"
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        placeholder="Enter your christ mail id"
                        autoComplete="email"
                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 transition-all"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      use christ mail id only
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                  >
                    Sign In
                  </button>
                </form>
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {activeTab === "admin" && (
              <form onSubmit={handleAdminSubmit} className="space-y-3">
                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="adminName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Enter your name"
                      autoComplete="off"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="adminPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      id="adminPassword"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••"
                      autoComplete="current-password"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Security code: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">0987</code>
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Sign In as Admin
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
