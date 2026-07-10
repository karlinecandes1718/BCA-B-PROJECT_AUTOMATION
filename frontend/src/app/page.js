"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Shield, Key, AlertCircle, Mail, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("student");
  
  // Student Email State
  const [gmail, setGmail] = useState("");
  const [studentError, setStudentError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  
  // Student OTP Verification State
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter Email, 2 = Verify OTP
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Admin form state
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
  }, [loading, user, router]);

  // Show nothing while checking stored session to avoid flash
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F0F7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B7DD8]"></div>
      </div>
    );
  }

  // Already logged in — show nothing (redirect effect will fire)
  if (user) return null;

  // Send OTP handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setStudentError("");
    setSuccessMessage("");

    const trimmed = gmail.trim().toLowerCase();
    if (!trimmed) {
      setStudentError("Email is required.");
      return;
    }

    // Validate strictly that it's a @bcah.christuniversity.in email address
    const christEmailRegex = /^[a-zA-Z0-9._%+-]+@bcah\.christuniversity\.in$/i;
    if (!christEmailRegex.test(trimmed)) {
      setStudentError("Access Denied. Only official @bcah.christuniversity.in email addresses are allowed.");
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpStep(2);
        setSuccessMessage(data.message || "Verification code sent to your Christ email.");
      } else {
        setStudentError(data.error || "Failed to send verification code. Please check your setup.");
      }
    } catch (err) {
      console.error(err);
      setStudentError("An error occurred. Please check your connection and try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setStudentError("");
    setSuccessMessage("");

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setStudentError("Please enter the verification code.");
      return;
    }

    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setStudentError("Verification code must be 6 digits.");
      return;
    }

    setVerifyingOtp(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: gmail.trim().toLowerCase(), otp: trimmedOtp }),
      });

      const data = await res.json();

      if (data.success) {
        login("student", gmail.trim().toLowerCase());
        router.replace("/dashboard");
      } else {
        setStudentError(data.error || "Invalid verification code. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setStudentError("Verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Admin login handler
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
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-[#E0F2FE] via-[#F0F7FF] to-[#EFF6FF] relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-300/30 blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-300/25 blur-[120px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      {/* Content Container */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4 mb-8">
        <div className="flex justify-center">
          <div className="bg-[#3B7DD8] p-3 rounded-2xl shadow-md text-white border border-white/20 hover:scale-105 transition-transform duration-300">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            3BCA-B Activity Log
          </h1>
          <p className="text-xs font-bold text-[#3B7DD8] uppercase tracking-widest mt-1">
            Department of Computer Applications
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-2">
            Archiving workshops, guest lectures, seminars and hackathon records.
          </p>
        </div>
      </div>

      {/* Card Wrapper */}
      <div className="relative z-10 sm:mx-auto w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          
          {/* Tab Selection */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab("student");
                setAdminError("");
                setStudentError("");
                setSuccessMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "student"
                  ? "bg-[#3B7DD8] text-white"
                  : "text-slate-500 hover:bg-blue-50/50"
              }`}
            >
              <Mail className="h-4 w-4" /> Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setStudentError("");
                setSuccessMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-[#3B7DD8] text-white"
                  : "text-slate-500 hover:bg-blue-50/50"
              }`}
            >
              <Shield className="h-4 w-4" /> Admin Portal
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {/* ── STUDENT LOGIN FLOW ── */}
            {activeTab === "student" && (
              <div className="space-y-4">
                
                {studentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{studentError}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Step 1: Email Input */}
                {otpStep === 1 ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="studentGmail" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Christ Gmail ID
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
                          placeholder="e.g. student.name@christuniversity.in"
                          autoComplete="email"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                        Enter your official Christ University email. A verification code will be sent.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingOtp}
                      className="w-full bg-[#3B7DD8] hover:bg-[#3B7DD8]/90 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {sendingOtp ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <span>Send Verification Code</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: OTP Verification */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label htmlFor="verificationOtp" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Verification Code (OTP)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Key className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          id="verificationOtp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          autoComplete="one-time-code"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50 text-center tracking-widest font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-[10px] text-slate-400">
                          Code sent to: <span className="font-semibold text-slate-600">{gmail}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtpStep(1)}
                          className="text-[10px] text-[#3B7DD8] font-bold hover:underline"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                      >
                        Resend
                      </button>
                      <button
                        type="submit"
                        disabled={verifyingOtp}
                        className="flex-1 bg-[#3B7DD8] hover:bg-[#3B7DD8]/90 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        {verifyingOtp ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Verify & Login</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {activeTab === "admin" && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="adminName" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Administrator Name
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
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="adminPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Default code: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700">0987</code>
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#3B7DD8] hover:bg-[#3B7DD8]/90 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Sign In as Administrator
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
