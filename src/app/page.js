"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, User, Shield, Key, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("student"); // "student" | "admin"
  
  // Student form state
  const [rollNumber, setRollNumber] = useState("");
  const [studentError, setStudentError] = useState("");

  // Admin form state
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Guard: if already logged in, redirect away from login page
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

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

    if (!rollNumber.trim()) {
      setStudentError("Roll number is required.");
      return;
    }

    login("student", rollNumber.trim().toUpperCase());
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
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F5F8FC]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="flex justify-center">
          <div className="bg-[#1E4FA3] p-3.5 rounded-2xl shadow-md text-white">
            <BookOpen className="h-10 w-10" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-[#12203A] tracking-tight">
          3BCA-B Activity Log
        </h2>
        <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
          Department of Computer Applications. Log and audit official class workshops, guest talks, and competitions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow-sm border border-[#D9E3F0] space-y-6">
          
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200/50">
            <button
              onClick={() => {
                setActiveTab("student");
                setAdminError("");
              }}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
                activeTab === "student"
                  ? "bg-white text-[#1E4FA3] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="h-4 w-4 mr-1.5" />
              Student Portal
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setStudentError("");
              }}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-md text-sm font-bold transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-[#1E4FA3] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Admin Portal
            </button>
          </div>

          {/* Student Login Form */}
          {activeTab === "student" && (
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              {studentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              <div>
                <label htmlFor="rollNumber" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Roll Number
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="Enter your roll number (e.g. 21BCA05)"
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50 uppercase font-medium"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Enter any valid roll number allocated to 3BCA-B.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E4FA3] hover:bg-[#3B7DD8] active:bg-[#1E4FA3] text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Sign In as Student
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              {adminError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Admin Name */}
                <div>
                  <label htmlFor="adminName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Administrator Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                {/* Admin Password */}
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Security Code / Password
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      id="adminPassword"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Default developer code: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-600">0987</code>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1E4FA3] hover:bg-[#3B7DD8] active:bg-[#1E4FA3] text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
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
