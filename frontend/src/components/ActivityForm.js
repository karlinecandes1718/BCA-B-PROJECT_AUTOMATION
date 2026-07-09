"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { formatActivityWithAI } from "../utils/aiFormatter";

export default function ActivityForm({ activity, isOpen, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Workshop");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [aiFormatted, setAiFormatted] = useState(true); // default true for AI styling
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Sync state if editing an existing activity
  useEffect(() => {
    if (activity) {
      setTitle(activity.title || "");
      setDate(activity.date || "");
      setCategory(activity.category || "Workshop");
      setDescription(activity.description || "");
      setPhotos(activity.photos || []);
      setAiFormatted(activity.aiFormatted ?? true);
    } else {
      // Reset form
      setTitle("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("Workshop");
      setDescription("");
      setPhotos([]);
      setAiFormatted(true);
    }
    setFormError("");
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Form validations
    if (!title.trim()) {
      setFormError("Activity title is required.");
      return;
    }
    if (!date) {
      setFormError("Event date is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description or notes are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const rawEntry = {
        title: title.trim(),
        date,
        category,
        description: description.trim(),
        photos,
        createdBy: activity ? activity.createdBy : "Admin", // Retain author or default
        aiFormatted: activity ? activity.aiFormatted : false // Will update below
      };

      let finalDescription = rawEntry.description;
      let finalAiFormatted = rawEntry.aiFormatted;

      // Run AI formatter if selected
      if (aiFormatted && (!activity || rawEntry.description !== activity.description || !activity.aiFormatted)) {
        finalDescription = await formatActivityWithAI(rawEntry);
        finalAiFormatted = true;
      }

      const savedActivity = {
        ...rawEntry,
        id: activity ? activity.id : `act-${Date.now()}`,
        description: finalDescription,
        aiFormatted: finalAiFormatted
      };

      onSave(savedActivity);
      onClose();
    } catch (error) {
      setFormError("Failed to format or save activity. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1E4FA3] px-6 py-4 flex items-center justify-between text-white border-b border-[#1E4FA3]/15">
          <div>
            <h3 className="text-lg font-bold">
              {activity ? "Edit Classroom Activity" : "Log New Activity"}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Classroom 3BCA-B Institutional Log
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-md transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Activity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Guest Talk on Machine Learning Trends"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Event Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="categories-list"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Select or type a category"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50"
                required
              />
              <datalist id="categories-list">
                <option value="Workshop" />
                <option value="Guest talk" />
                <option value="Hackathon" />
                <option value="Competition" />
                <option value="Seminars & Events" />
                <option value="Industrial Visit" />
                <option value="Alumni Talk" />
              </datalist>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Raw Description / Event Log Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste raw notes, speaker info, attendance summaries, lab guides, or results. The AI will structure this into the required institutional format."
              rows={6}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8] transition-all bg-slate-50/50 resize-y"
              required
            />
          </div>

          {/* Image Upload Integration */}
          <ImageUploader images={photos} onChange={setPhotos} />

          {/* AI formatting configuration */}
          <div className="bg-blue-50/60 border border-[#D9E3F0] rounded-xl p-4 flex items-start space-x-3">
            <input
              type="checkbox"
              id="aiFormattedCheckbox"
              checked={aiFormatted}
              onChange={(e) => setAiFormatted(e.target.checked)}
              className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
              <label htmlFor="aiFormattedCheckbox" className="text-sm font-bold text-[#1E4FA3] flex items-center space-x-1 cursor-pointer">
                <Sparkles className="h-4 w-4 text-[#3B7DD8] fill-blue-100" />
                <span>Format using AI Automation</span>
              </label>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Applies standard institutional header, splits notes into summary blocks, and verifies report guidelines before final save. Recommended for college audits.
              </p>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[#1E4FA3] hover:bg-[#3B7DD8] active:bg-[#1E4FA3] text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-md cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>AI Formatting...</span>
              </>
            ) : (
              <span>Save Log</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
