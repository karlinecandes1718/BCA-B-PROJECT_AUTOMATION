"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/Navbar";
import { INITIAL_ACTIVITIES, getCategoryGradient } from "../../../utils/mockData";
import {
  ArrowLeft, Calendar, Shield, Sparkles, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function ActivityDetail() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activity, setActivity] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [found, setFound] = useState(true);

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/"); }
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bca_activities");
      const all = stored ? JSON.parse(stored) : INITIAL_ACTIVITIES;
      const a = all.find(x => x.id === id);
      if (a) { setActivity(a); } else { setFound(false); }
    } catch { setFound(false); }
  }, [id]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E4FA3]"></div>
      </div>
    );
  }

  if (!found || !activity) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="space-y-4 max-w-sm">
            <h3 className="text-xl font-bold text-[#0F172A]">Activity Not Found</h3>
            <p className="text-sm text-slate-500">This log may have been deleted.</p>
            <Link
              href={user.role === "admin" ? "/admin" : "/dashboard"}
              className="inline-flex items-center gap-2 bg-[#1E4FA3] text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = activity.photos?.length > 0 ? activity.photos : [getCategoryGradient(activity.category)];

  const getCatColor = (c) => {
    const cat = (c || "").toLowerCase();
    if (cat.includes("workshop")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (cat.includes("guest") || cat.includes("talk")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (cat.includes("hackathon")) return "bg-violet-50 text-violet-700 border-violet-200";
    return "bg-blue-50 text-[#1E4FA3] border-blue-200";
  };

  const renderMd = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      const t = line.trim();
      if (t.startsWith("# ")) return <h2 key={i} className="text-xl font-black text-[#0F172A] border-b border-[#D9E3F0] pb-2 mt-6 mb-3">{t.slice(2)}</h2>;
      if (t.startsWith("### ")) return <h3 key={i} className="text-base font-extrabold text-[#1E4FA3] mt-4 mb-2">{t.slice(4)}</h3>;
      if (t.startsWith("#### ")) return <h4 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{t.slice(5)}</h4>;
      if (t === "---") return <hr key={i} className="border-t border-[#D9E3F0] my-4" />;
      if (t.startsWith("- ") || t.startsWith("* ")) return <li key={i} className="text-sm text-slate-600 ml-4 list-disc leading-relaxed">{parseBold(t.slice(2))}</li>;
      if (/^\d+\.\s/.test(t)) return <li key={i} className="text-sm text-slate-600 ml-4 list-decimal leading-relaxed">{parseBold(t.replace(/^\d+\.\s/, ""))}</li>;
      if (!t) return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm text-slate-600 leading-relaxed mb-2">{parseBold(t)}</p>;
    });
  };

  const parseBold = (text) =>
    text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-bold text-slate-800">{p.slice(2, -2)}</strong>
        : p
    );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back row */}
        <div className="flex items-center justify-between">
          <Link
            href={user.role === "admin" ? "/admin" : "/dashboard"}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1E4FA3] hover:text-[#3B7DD8] bg-white px-3 py-2 rounded-lg border border-[#D9E3F0] shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Feed
          </Link>
          {activity.aiFormatted && (
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Formatted
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Gallery */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-[#D9E3F0] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeImg]} alt="Activity" className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => setActiveImg(p => (p + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {activeImg + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex justify-center gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${i === activeImg ? "w-4 bg-[#1E4FA3]" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-[#D9E3F0] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="space-y-3">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getCatColor(activity.category)}`}>
                {activity.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] leading-snug">
                {activity.title}
              </h2>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D9E3F0] text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Event Date</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(activity.date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Logged By</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    {activity.createdBy}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-5 border-t border-[#D9E3F0] space-y-1">
              {renderMd(activity.description)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
