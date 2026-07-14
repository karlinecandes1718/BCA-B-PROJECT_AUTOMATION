"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Tag, Shield, Sparkles, Edit, Trash2 } from "lucide-react";
import { getCategoryGradient } from "../utils/mockData";

export default function ActivityCard({ activity, isAdmin, onEdit, onDelete }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getCategoryColor = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("workshop")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (c.includes("guest") || c.includes("talk")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (c.includes("hackathon")) return "bg-violet-50 text-violet-700 border-violet-200";
    return "bg-blue-50 text-[#3B7DD8] border-blue-200";
  };

  const getExcerpt = (text) => {
    if (!text) return "";
    // Strip markdown headers/markers for cleaner excerpt
    const cleanText = text
      .replace(/[#*`_-]/g, "")
      .replace(/\[.*\]\(.*\)/g, "")
      .trim();
    if (cleanText.length > 140) {
      return cleanText.substring(0, 140) + "...";
    }
    return cleanText;
  };

  // Resolve thumbnail image
  const thumbnail = activity.photos && activity.photos.length > 0
    ? activity.photos[0]
    : getCategoryGradient(activity.category);

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-[#D9E3F0]/60 hover:shadow-lg hover:border-[#3B7DD8]/20 transition-all duration-300 overflow-hidden flex flex-col group h-full hover:-translate-y-1">
        {/* Banner/Photo Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border-b border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getCategoryColor(activity.category)} shadow-md backdrop-blur-sm`}>
              {activity.category}
            </span>
            {activity.aiFormatted && (
              <span className="bg-gradient-to-r from-[#3B7DD8] to-[#2563EB] text-white border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-md backdrop-blur-sm">
                <Sparkles className="h-3 w-3 animate-pulse" />
                AI Enhanced
              </span>
            )}
          </div>
          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent group-hover:from-black/20 transition-all duration-300"></div>
        </div>

        {/* Card Content */}
        <div className="p-6 md:p-5 flex-1 flex flex-col space-y-3">
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center bg-slate-50 px-2 py-1 rounded-md">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              {new Date(activity.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {activity.createdBy && (
              <span className="flex items-center text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                <Shield className="h-3 w-3 mr-1 text-slate-400" />
                <span className="hidden sm:inline">{activity.createdBy.replace("Admin ", "")}</span>
                <span className="sm:hidden">Admin</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-lg md:text-base font-black text-[#12203A] line-clamp-2 leading-tight group-hover:text-[#3B7DD8] transition-colors duration-300">
            {activity.title}
          </h4>

          {/* Excerpt */}
          <p className="text-sm md:text-xs text-slate-600 line-clamp-3 leading-relaxed flex-1">
            {getExcerpt(activity.description)}
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D9E3F0] mt-auto">
            <Link
              href={`/activity/${activity.id}`}
              className="text-sm md:text-xs font-bold text-[#3B7DD8] hover:text-[#2563EB] flex items-center hover:underline transition-colors group-hover:scale-105 transform duration-300"
            >
              <span>View in ClassArchive</span>
              <span className="ml-1 group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>

            {isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(activity)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation"
                  title="Edit Activity"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation"
                  title="Delete Activity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#12203A] mb-3">Delete from ClassArchive?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-slate-800">"{activity.title}"</strong> from ClassArchive? This action cannot be undone.
              </p>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-200">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-400 transition-all cursor-pointer touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete(activity.id);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg cursor-pointer touch-manipulation"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
