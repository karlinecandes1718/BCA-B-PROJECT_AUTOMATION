"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Shield, Key, AlertCircle, Mail } from "lucide-react";

export default function LoginPage() {
  const { login, loading } = useAuth();

  const [activeTab, setActiveTab] = useState("student"); // "student" | "admin"
  
  // Student form state (Gmail)
  const [gmail, setGmail] = useState("");
  const [studentError, setStudentError] = useState("");

  // Admin form state
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F8FC]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4FA3] mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Loading portal...</p>
        </div>
      </div>
    );
  }

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    setStudentError("");

    const trimmedGmail = gmail.trim().toLowerCase();

    if (!trimmedGmail) {
      setStudentError("Gmail address is required.");
      return;
    }

    // Strict Gmail validation
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(trimmedGmail)) {
      setStudentError("Please enter a valid Gmail address (ending in @gmail.com).");
      return;
    }

    login("student", trimmedGmail);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setAdminError("");

    if (!adminName.trim()) {
      setAdminError("Name is required.");
      return;
    }

    if (!adminPassword) {
      setAdminError("Password is required.");
      return;
    }

    if (adminPassword !== "0987") {
      setAdminError("Invalid administrator security code.");
      return;
    }

    login("admin", `Admin ${adminName.trim()}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F5F8FC] relative overflow-hidden min-h-screen">
      
      {/* Dynamic Aesthetic Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/15 blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.25] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <div className="flex justify-center">
          <div className="bg-[#1E4FA3] p-4 rounded-2xl shadow-lg text-white border border-white/10 relative group hover:scale-105 transition-transform duration-300">
            <BookOpen className="h-10 w-10" />
            <div className="absolute -inset-0.5 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black text-[#12203A] tracking-tight sm:text-4xl">
            3BCA-B Activity Log
          </h2>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
            Department of Computer Applications
          </p>
        </div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed px-4">
          Institutional registry portal to log and archive workshops, speaker events, and hackathon records.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        {/* Glassmorphic Login Card */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-white/40 space-y-6">
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
            <button
              onClick={() => {
                setActiveTab("student");
                setAdminError("");
              }}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === "student"
                  ? "bg-white text-[#1E4FA3] shadow-sm border border-slate-200/20"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Student Portal
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setStudentError("");
              }}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-[#1E4FA3] shadow-sm border border-slate-200/20"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Admin Portal
            </button>
          </div>

          {/* Student Login Form (Gmail only) */}
          {activeTab === "student" && (
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              {studentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              <div>
                <label htmlFor="studentGmail" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Gmail Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    id="studentGmail"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-white/70"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Enter your Gmail account. Access is restricted to accounts ending with <span className="font-bold text-slate-500">@gmail.com</span>.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E4FA3] hover:bg-[#3B7DD8] active:bg-[#1E4FA3] text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-[0.99] duration-150"
              >
                Sign In as Student
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              {adminError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Admin Name */}
                <div>
                  <label htmlFor="adminName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Administrator Name
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" /> {/* Standard icon */}
                    </div>
                    <input
                      type="text"
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Enter administrator name"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-white/70"
                      required
                    />
                  </div>
                </div>

                {/* Admin Password */}
                <div>
                  <label htmlFor="adminPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Security Code / Password
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      id="adminPassword"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-white/70"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Default developer code: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-600">0987</code>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E4FA3] hover:bg-[#3B7DD8] active:bg-[#1E4FA3] text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer transform active:scale-[0.99] duration-150"
              >
                Sign In as Administrator
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
