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
    // Recover corrupted localStorage entries where description is an object { description, usage }
    const strText = typeof text === 'string' ? text : (text.description || String(text));
    // Strip markdown headers/markers for cleaner excerpt
    const cleanText = strText
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
      <div className="bg-white rounded-xl shadow-sm border border-[#D9E3F0] hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full">
        {/* Banner/Photo Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryColor(activity.category)} shadow-sm backdrop-blur-[1px]`}>
              {activity.category}
            </span>
            {activity.aiFormatted && (
              <span className="bg-[#3B7DD8] text-white border border-[#3B7DD8]/80 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                <Sparkles className="h-3 w-3 animate-pulse" />
                AI Formatted
              </span>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-slate-500 mb-2">
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
              {new Date(activity.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {activity.createdBy && (
              <span className="flex items-center text-slate-400">
                <Shield className="h-3 w-3 mr-1 text-slate-400" />
                {activity.createdBy.replace("Admin ", "")}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-base font-bold text-[#12203A] line-clamp-2 leading-snug mb-2 group-hover:text-[#3B7DD8] transition-colors">
            {activity.title}
          </h4>

          {/* Excerpt */}
          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 flex-1">
            {getExcerpt(activity.description)}
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D9E3F0] mt-auto">
            <Link
              href={`/activity/${activity.id}`}
              className="text-xs font-bold text-[#3B7DD8] hover:text-[#3B7DD8]/80 flex items-center hover:underline"
            >
              View Details →
            </Link>

            {isAdmin && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onEdit(activity)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                  title="Edit Activity"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#12203A]">Delete Activity?</h3>
              <p className="text-sm text-slate-500 mt-2">
                Are you sure you want to delete <span className="font-semibold text-slate-700">"{activity.title}"</span>? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete(activity.id);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
