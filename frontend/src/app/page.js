"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Shield, Key, AlertCircle, Mail, CheckCircle, RotateCw, Eye, EyeOff } from "lucide-react";

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
  
  // 30-second Resend Cooldown Countdown state
  const [resendCooldown, setResendCooldown] = useState(0);

  // Admin form state
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

    // Frontend validation: email ends with @bcah.christuniversity.in
    const christEmailRegex = /^[a-zA-Z0-9._%+-]+@bcah\.christuniversity\.in$/i;
    if (!christEmailRegex.test(trimmed)) {
      setStudentError("Please use your official university email ID.");
      return;
    }

    setSendingOtp(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const res = await fetch(`${apiUrl}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpStep(2);
        setResendCooldown(30); // Start 30 seconds countdown
        setSuccessMessage(data.message || "Verification code sent to your Christ email.");
      } else {
        setStudentError(data.error || data.message || "Failed to send verification code.");
      }
    } catch (err) {
      console.error(err);
      setStudentError("An error occurred. Please check your connection and try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setStudentError("");
    setSuccessMessage("");
    setSendingOtp(true);

    const trimmed = gmail.trim().toLowerCase();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const res = await fetch(`${apiUrl}/api/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResendCooldown(30); // Reset 30 seconds countdown
        setSuccessMessage(data.message || "A new verification code has been sent.");
      } else {
        setStudentError(data.error || data.message || "Failed to resend verification code.");
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const res = await fetch(`${apiUrl}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: gmail.trim().toLowerCase(), otp: trimmedOtp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        login("student", gmail.trim().toLowerCase());
        router.replace("/dashboard");
      } else {
        setStudentError(data.error || data.message || "Invalid verification code.");
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
    
    if (!adminName.trim()) { 
      setAdminError("Name is required."); 
      return; 
    }
    
    if (!adminPassword) { 
      setAdminError("Security code is required."); 
      return; 
    }
    
    // Validate admin name (case-insensitive)
    const validAdmins = ["shruthika", "karline", "deepanshu"];
    const normalizedName = adminName.trim().toLowerCase();
    
    if (!validAdmins.includes(normalizedName)) {
      setAdminError("Access denied. You are not authorized to access the admin portal.");
      return;
    }
    
    // Validate password
    if (adminPassword !== "CHRIST@0987") { 
      setAdminError("Invalid security code."); 
      return; 
    }
    
    login("admin", `Admin ${adminName.trim()}`);
    router.replace("/admin");
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-[#E0F2FE] via-[#F0F7FF] to-[#EFF6FF] relative overflow-hidden">
      
      {/* Enhanced Decorative Elements */}
      <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-blue-300/40 to-sky-300/30 blur-[150px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-sky-300/30 to-blue-400/25 blur-[150px] pointer-events-none animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-gradient-to-r from-purple-200/20 to-pink-200/20 blur-[120px] pointer-events-none"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-blue-400/60 rounded-full animate-ping"></div>
        <div className="absolute top-[60%] right-[15%] w-3 h-3 bg-sky-300/50 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-purple-400/40 rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-[40%] right-[25%] w-1 h-1 bg-blue-500/60 rounded-full animate-pulse delay-700"></div>
      </div>

      {/* Enhanced Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      {/* Content Container with Enhanced Mobile Support */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-6 mb-8 px-2">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-[#3B7DD8] to-[#2563EB] p-4 rounded-3xl shadow-xl text-white border border-white/30 hover:scale-105 transition-all duration-500 hover:shadow-2xl">
            <BookOpen className="h-10 w-10 md:h-8 md:w-8" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl md:text-3xl font-black text-slate-800 tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
            ClassArchive
          </h1>
          <div className="bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] bg-clip-text text-transparent">
            <p className="text-sm font-bold uppercase tracking-[0.2em] mt-2">
              3BCA-B Activity Portal
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-4 px-4">
            Your comprehensive archive for workshops, guest lectures, seminars and hackathon records.
          </p>
        </div>
      </div>

      {/* Enhanced Card Wrapper with Mobile Optimization */}
      <div className="relative z-10 sm:mx-auto w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden hover:shadow-3xl transition-all duration-500 hover:border-white/80">
          
          {/* Enhanced Tab Selection with Mobile Touch Targets */}
          <div className="flex border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-slate-100/60 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab("student");
                setAdminError("");
                setStudentError("");
                setSuccessMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-5 md:py-4 text-xs font-extrabold tracking-wider uppercase transition-all duration-300 cursor-pointer touch-manipulation ${
                activeTab === "student"
                  ? "bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] text-white shadow-lg"
                  : "text-slate-500 hover:bg-blue-50/70 hover:text-[#3B7DD8]"
              }`}
            >
              <Mail className="h-4 w-4" /> 
              <span className="hidden xs:inline">Student</span>
              <span className="xs:hidden">Student</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setStudentError("");
                setSuccessMessage("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-5 md:py-4 text-xs font-extrabold tracking-wider uppercase transition-all duration-300 cursor-pointer touch-manipulation ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] text-white shadow-lg"
                  : "text-slate-500 hover:bg-blue-50/70 hover:text-[#3B7DD8]"
              }`}
            >
              <Shield className="h-4 w-4" /> 
              <span className="hidden xs:inline">Admin</span>
              <span className="xs:hidden">Admin</span>
            </button>
          </div>

          <div className="p-8 sm:p-8 space-y-6 bg-gradient-to-b from-white/50 to-white/80 backdrop-blur-sm">

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
                        University Email ID
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
                          placeholder="e.g. student.name@university.in"
                          autoComplete="email"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-3.5 md:py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50 hover:bg-white touch-manipulation"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 leading-normal">
                        Enter your official university email. A verification code will be sent.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingOtp}
                      className="w-full bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white py-4 md:py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2 touch-manipulation hover:scale-[1.02] active:scale-[0.98]"
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
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-3.5 md:py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50 text-center tracking-widest font-mono font-bold hover:bg-white touch-manipulation"
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
                          className="text-[10px] text-[#3B7DD8] font-bold hover:underline cursor-pointer"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || sendingOtp}
                        className={`flex-1 border border-slate-200 text-xs font-bold tracking-wide uppercase py-4 md:py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 touch-manipulation ${
                          resendCooldown > 0 || sendingOtp
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "hover:bg-slate-50 hover:border-slate-300 text-slate-600 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                      >
                        <RotateCw className={`h-3.5 w-3.5 ${sendingOtp ? "animate-spin" : ""}`} />
                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
                      </button>
                      <button
                        type="submit"
                        disabled={verifyingOtp}
                        className="flex-1 bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white py-4 md:py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2 touch-manipulation hover:scale-[1.02] active:scale-[0.98]"
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
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-3.5 md:py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50 hover:bg-white touch-manipulation"
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
                      type={showPassword ? "text" : "password"}
                      id="adminPassword"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-10 py-3.5 md:py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 transition-all bg-slate-50/50 hover:bg-white touch-manipulation"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors touch-manipulation"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Authorized administrators only
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white py-4 md:py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer touch-manipulation hover:scale-[1.02] active:scale-[0.98]"
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
