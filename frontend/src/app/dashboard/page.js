"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ActivityCard from "../../components/ActivityCard";
import { INITIAL_ACTIVITIES } from "../../utils/mockData";
import { Search, Filter, BookOpen, Clock, AlertCircle } from "lucide-react";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest"

  // Load activities from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("bca_activities");
    if (stored) {
      try {
        setActivities(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored activities", e);
        setActivities(INITIAL_ACTIVITIES);
      }
    } else {
      // Seed with initial activities
      localStorage.setItem("bca_activities", JSON.stringify(INITIAL_ACTIVITIES));
      setActivities(INITIAL_ACTIVITIES);
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F8FC]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4FA3] mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500">Redirecting to session...</p>
        </div>
      </div>
    );
  }

  // Categories list for filtering - dynamically generated from current database logs
  const categories = ["All", ...new Set(activities.map((act) => act.category).filter(Boolean))];

  // Filter and sort activities
  const filteredActivities = activities
    .filter((act) => {
      const matchSearch =
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory =
        selectedCategory === "All" ||
        act.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-[#D9E3F0] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-black text-[#12203A]">3BCA-B Class Log Feed</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
            Welcome, <span className="font-bold text-slate-700">{user.identifier}</span>. Here is the official archive of technical sessions, seminars, and events conducted for our batch.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1E4FA3]">
          <Clock className="h-4 w-4" />
          <span>Active Session</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl border border-[#D9E3F0] p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by keywords (e.g. React, Cyber, security)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3B7DD8] transition-all bg-slate-50/30"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3B7DD8] transition-all bg-slate-50/30"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3B7DD8] transition-all bg-slate-50/30"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((act) => (
            <ActivityCard key={act.id} activity={act} isAdmin={false} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="flex justify-center text-slate-400 mb-3">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h4 className="font-bold text-[#12203A] text-base">No activities logged yet</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            There are no logs matching your search parameters or no class activities have been recorded.
          </p>
        </div>
      )}

    </div>
  );
}
