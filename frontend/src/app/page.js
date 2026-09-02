"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Shield, Key, AlertCircle, Mail, Chrome, Eye, EyeOff, CheckCircle } from "lucide-react";

// ── Backend URL — read from Next.js env at build time (server-side safe) ──────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5003";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("student");
  const [gmail, setGmail] = useState("");
  const [studentError, setStudentError] = useState("");
  const [studentSuccess, setStudentSuccess] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

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

  // OTP Timer effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Show nothing while checking stored session to avoid flash
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EBF8FF] to-[#BEE3F8]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4299E1]"></div>
          <p className="text-sm text-[#4299E1] font-medium">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Already logged in — show nothing (redirect effect will fire)
  if (user) return null;

  const handleStudentGmailSubmit = async (e) => {
    e.preventDefault();
    setStudentError("");
    setStudentSuccess("");
    const trimmed = gmail.trim().toLowerCase();
    
    if (!trimmed) {
      setStudentError("Email is required.");
      return;
    }
    
    if (!/^[a-zA-Z0-9._%+-]+@(bcah\.)?christuniversity\.in$/.test(trimmed)) {
      setStudentError("Only official Christ University email addresses are accepted (@christuniversity.in or @bcah.christuniversity.in).");
      return;
    }

    if (!otpSent) {
      // Send OTP
      setOtpLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });

        const data = await response.json();

        if (!data.success) {
          setStudentError(data.message || "Failed to send OTP. Please try again.");
          setOtpLoading(false);
          return;
        }

        setOtpSent(true);
        setOtpTimer(30); // 30 second timer
        setCanResend(false);
        setStudentError("");
        
        // Show success message
        setStudentSuccess(`OTP sent successfully to ${trimmed}! Check your email.`);
        
      } catch (err) {
        setStudentError("Unable to reach the OTP server. Please try again later.");
        console.error("OTP send error:", err);
      } finally {
        setOtpLoading(false);
      }
    } else {
      // Verify OTP
      if (!otpCode || !/^\d{6}$/.test(otpCode)) {
        setStudentError("Please enter a valid 6-digit OTP code.");
        return;
      }

      setOtpLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, otp: otpCode }),
        });

        const data = await response.json();

        if (!data.success) {
          setStudentError(data.message || "Invalid OTP code. Please try again.");
          setOtpLoading(false);
          return;
        }

        // OTP verified successfully
        login("student", trimmed);
        router.replace("/dashboard");
        
      } catch (err) {
        setStudentError("Unable to verify OTP. Please try again later.");
        console.error("OTP verify error:", err);
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    const trimmed = gmail.trim().toLowerCase();
    if (!trimmed) {
      setStudentError("Email is required.");
      return;
    }
    
    setStudentError("");
    setStudentSuccess("");

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await response.json();

      if (!data.success) {
        setStudentError(data.message || "Failed to resend OTP. Please try again.");
        setOtpLoading(false);
        return;
      }

      setOtpTimer(30); // Reset timer to 30 seconds
      setCanResend(false);
      setStudentSuccess(`New OTP sent to ${trimmed}!`);
      
    } catch (err) {
      setStudentError("Unable to resend OTP. Please try again later.");
      console.error("OTP resend error:", err);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError("");
    
    const trimmedName = adminName.trim().toLowerCase();
    
    if (!trimmedName) { 
      setAdminError("Administrator name is required."); 
      return; 
    }
    
    if (!adminPassword) { 
      setAdminError("Security code is required."); 
      return; 
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, password: adminPassword }),
      });

      const data = await response.json();

      if (!data.success) {
        setAdminError(data.error || "Invalid administrator credentials.");
        return;
      }

      login("admin", `Admin ${adminName.trim()}`);
      router.replace("/admin");
    } catch (err) {
      setAdminError("Unable to reach the authentication server. Please try again later.");
      console.error("Auth error:", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 min-h-screen interactive-background">
      {/* Floating particles background */}
      <div className="floating-particles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Header branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 mb-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#4299E1] to-[#63B3ED] bg-clip-text text-transparent">
            3BCA-B Activity Portal
          </h1>
          <p className="text-sm text-[#1A365D] mt-2 font-medium">
            Christ University Department of Computer Applications
          </p>
          <div className="mt-4 flex items-center justify-center">
            <div className="h-1 w-20 bg-gradient-to-r from-[#4299E1] to-[#63B3ED] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Login card */}
      <div className="sm:mx-auto w-full sm:max-w-md pulse-glow-container">
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl login-card-interactive">

          {/* Tab bar */}
          <div className="flex border-b border-white/30 bg-gradient-to-r from-white/90 to-white/80">
            <button
              type="button"
              onClick={() => { 
                setActiveTab("student"); 
                setAdminError(""); 
                setStudentError(""); 
                setStudentSuccess("");
                setOtpSent(false);
                setOtpCode("");
                setOtpTimer(0);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all cursor-pointer tab-interactive ${
                activeTab === "student"
                  ? "bg-gradient-to-r from-[#4299E1] to-[#63B3ED] text-white shadow-md"
                  : "text-[#1A365D] hover:bg-white/50"
              }`}
            >
              <Mail className="h-4 w-4" /> Student Login
            </button>
            <button
              type="button"
              onClick={() => { 
                setActiveTab("admin"); 
                setStudentError(""); 
                setStudentSuccess("");
                setAdminError(""); 
                setOtpSent(false);
                setOtpCode("");
                setOtpTimer(0);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all cursor-pointer tab-interactive ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-[#4299E1] to-[#63B3ED] text-white shadow-md"
                  : "text-[#1A365D] hover:bg-white/50"
              }`}
            >
              <Shield className="h-4 w-4" /> Admin Login
            </button>
          </div>

          <div className="p-8 space-y-6">

            {/* ── STUDENT LOGIN ── */}
            {activeTab === "student" && (
              <div className="space-y-5">
                {/* Manual email form */}
                <form onSubmit={handleStudentGmailSubmit} className="space-y-4">
                  {studentError && (
                    <div className="bg-red-50/80 border border-red-200/50 text-red-700 p-3 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm message-slide-in">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span className="font-medium">{studentError}</span>
                    </div>
                  )}
                  {studentSuccess && (
                    <div className="bg-green-50/80 border border-green-200/50 text-green-700 p-3 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm message-slide-in">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <span className="font-medium">{studentSuccess}</span>
                    </div>
                  )}
                  <div>
                    <label htmlFor="studentGmail" className="block text-sm font-semibold text-[#1A365D] mb-2">
                      University Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4299E1]">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        id="studentGmail"
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        placeholder=""
                        autoComplete="email"
                        className="w-full border-2 border-[#BEE3F8] bg-white/80 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A365D] placeholder-[#90CDF4] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm input-enhanced hover-lift"
                      />
                    </div>
                    <p className="text-xs text-[#4299E1] font-medium mt-2 pl-1">
                      Use your official university email address
                    </p>
                  </div>
                  
                  {/* OTP Input (only shown when OTP is sent) */}
                  {otpSent && (
                    <div className="space-y-3 animate-fade-in">
                      <div>
                        <label htmlFor="otpCode" className="block text-sm font-semibold text-[#1A365D] mb-2">
                          Enter 6-digit OTP Code
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4299E1]">
                            <Key className="h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            id="otpCode"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder=""
                            autoComplete="one-time-code"
                            className="w-full border-2 border-[#BEE3F8] bg-white/80 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A365D] placeholder-[#90CDF4] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm text-center tracking-widest font-mono input-enhanced hover-lift"
                            maxLength={6}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-[#4299E1] font-medium">
                            {otpTimer > 0 ? `Resend available in ${otpTimer}s` : 'Ready to resend'}
                          </p>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={!canResend || otpLoading}
                            className={`text-xs font-medium ${canResend && !otpLoading ? 'text-[#4299E1] hover:text-[#63B3ED] cursor-pointer' : 'text-[#90CDF4] cursor-not-allowed'}`}
                          >
                            Resend OTP
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className={`w-full ${otpLoading ? 'bg-[#90CDF4] cursor-not-allowed' : 'btn-light-blue cursor-pointer'} text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2`}
                  >
                    {otpLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : otpSent ? (
                      'Verify OTP & Sign In'
                    ) : (
                      'Send OTP & Continue'
                    )}
                  </button>
                  
                  {/* Back button when OTP is sent */}
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setStudentError("");
                        setStudentSuccess("");
                      }}
                      className="w-full text-sm text-[#4299E1] font-medium hover:text-[#63B3ED] transition-colors"
                    >
                      ← Use different email
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {activeTab === "admin" && (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                {adminError && (
                  <div className="bg-red-50/80 border border-red-200/50 text-red-700 p-3 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{adminError}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="adminName" className="block text-sm font-semibold text-[#1A365D] mb-2">
                    Administrator Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4299E1]">
                      <Shield className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder=""
                      autoComplete="off"
                      className="w-full border-2 border-[#BEE3F8] bg-white/80 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A365D] placeholder-[#90CDF4] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm input-enhanced hover-lift"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-semibold text-[#1A365D] mb-2">
                    Security Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4299E1]">
                      <Key className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="adminPassword"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder=""
                      autoComplete="current-password"
                      className="w-full border-2 border-[#BEE3F8] bg-white/80 rounded-xl pl-10 pr-12 py-3 text-sm text-[#1A365D] placeholder-[#90CDF4] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4299E1] hover:text-[#63B3ED] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full btn-light-blue text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md"
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
