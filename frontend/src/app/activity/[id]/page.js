"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { INITIAL_ACTIVITIES, getCategoryGradient } from "../../../utils/mockData";
import { ArrowLeft, Calendar, Tag, Shield, Sparkles, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function ActivityDetail() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activity, setActivity] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("bca_activities");
    let allActivities = INITIAL_ACTIVITIES;

    if (stored) {
      try {
        allActivities = JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored activities", e);
      }
    }

    const found = allActivities.find((act) => act.id === id);
    setActivity(found || null);
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F8FC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4FA3]"></div>
      </div>
    );
  }

  // Guard: Redirect to login if user session is empty
  if (!user) {
    return null;
  }

  if (!activity) {
    return (
      <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Activity Log Not Found</h3>
        <p className="text-sm text-slate-500">
          The activity log with identifier <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600 font-mono font-bold">{id}</code> does not exist or has been deleted.
        </p>
        <Link
          href={user.role === "admin" ? "/admin" : "/dashboard"}
          className="inline-flex items-center space-x-1.5 bg-[#1E4FA3] hover:bg-[#3B7DD8] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Feed</span>
        </Link>
      </div>
    );
  }

  const images = activity.photos && activity.photos.length > 0
    ? activity.photos
    : [getCategoryGradient(activity.category)];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getCategoryColor = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("workshop")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (c.includes("guest") || c.includes("talk")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (c.includes("hackathon")) return "bg-violet-50 text-violet-700 border-violet-200";
    return "bg-blue-50 text-[#1E4FA3] border-blue-200";
  };

  // Safe inline Markdown parser to styled React elements
  const renderDescription = (text) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 1 (e.g. # TITLE)
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-xl sm:text-2xl font-black text-[#12203A] border-b border-[#D9E3F0] pb-2 mt-6 mb-4">
            {trimmed.substring(2)}
          </h1>
        );
      }
      
      // Heading 3 (e.g. ### SECTION)
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-base font-extrabold text-[#1E4FA3] mt-5 mb-2 flex items-center">
            {trimmed.substring(4)}
          </h3>
        );
      }

      // Heading 4 (e.g. #### SUBSECTION)
      if (trimmed.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-1.5">
            {trimmed.substring(5)}
          </h4>
        );
      }

      // Divider (e.g. ---)
      if (trimmed === "---") {
        return <hr key={idx} className="border-t border-[#D9E3F0] my-4" />;
      }

      // Bullets (e.g. - list item or 1. list item)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.substring(2);
        return (
          <ul key={idx} className="list-disc list-outside pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li className="leading-relaxed">
              {parseInlineStyles(content)}
            </li>
          </ul>
        );
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed.replace(/^\d+\.\s/, "");
        return (
          <ol key={idx} className="list-decimal list-outside pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li className="leading-relaxed">
              {parseInlineStyles(content)}
            </li>
          </ol>
        );
      }

      // Footnotes / italic text (e.g. *italic*)
      if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
        return (
          <p key={idx} className="text-xs italic text-slate-400 mt-2 mb-2 leading-relaxed">
            {trimmed.substring(1, trimmed.length - 1)}
          </p>
        );
      }

      // Empty Line
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Regular Paragraph
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
          {parseInlineStyles(trimmed)}
        </p>
      );
    });
  };

  // Helper to parse bold (**text**)
  const parseInlineStyles = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold text-slate-800">{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navigation Row */}
      <div className="flex items-center justify-between">
        <Link
          href={user.role === "admin" ? "/admin" : "/dashboard"}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#1E4FA3] hover:text-[#3B7DD8] transition-colors bg-white px-3 py-2 rounded-lg border border-[#D9E3F0] shadow-sm hover:shadow"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>

        {activity.aiFormatted && (
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 fill-indigo-100" />
            <span>AI Audit-Ready Record</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Media Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-[#D9E3F0] overflow-hidden shadow-sm relative group aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeImageIndex]}
              alt={`Activity visual ${activeImageIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />
            
            {/* Gallery Navigation Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                  title="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
                  title="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">
                  {activeImageIndex + 1} of {images.length}
                </div>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="flex justify-center space-x-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-all cursor-pointer ${
                    activeImageIndex === idx ? "bg-[#1E4FA3] w-4" : "bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Text Information & Details (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#D9E3F0] p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Metadata Block */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getCategoryColor(activity.category)} shadow-sm`}>
                {activity.category}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#12203A] tracking-tight leading-snug">
              {activity.title}
            </h2>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D9E3F0] text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Event Date</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {new Date(activity.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Logged By</span>
                <span className="font-bold text-slate-700 flex items-center">
                  <Shield className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  {activity.createdBy}
                </span>
              </div>
            </div>
          </div>

          {/* Description Content */}
          <div className="pt-6 border-t border-[#D9E3F0] space-y-4 text-justify">
            {renderDescription(activity.description)}
          </div>

        </div>

      </div>
    </div>
  );
}
