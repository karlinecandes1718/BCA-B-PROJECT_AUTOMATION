"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import ActivityCard from "../../components/ActivityCard";
import { INITIAL_ACTIVITIES } from "../../utils/mockData";
import { Search, Filter, Clock, AlertCircle } from "lucide-react";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Auth guard — redirect if not logged in or is admin
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/"); return; }
    if (user.role === "admin") { router.replace("/admin"); return; }
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load activities
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bca_activities");
      if (stored) {
        setActivities(JSON.parse(stored));
      } else {
        localStorage.setItem("bca_activities", JSON.stringify(INITIAL_ACTIVITIES));
        setActivities(INITIAL_ACTIVITIES);
      }
    } catch {
      setActivities(INITIAL_ACTIVITIES);
    }
  }, []);

  if (loading || !user || user.role !== "student") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B7DD8]"></div>
      </div>
    );
  }

  // Extract first name from email
  const getFirstName = (email) => {
    const name = email.split("@")[0].split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const categories = ["All", "CPCG", "SESSIONS", "ANNOUNCEMENTS"];

  const filtered = activities
    .filter(a => {
      const q = searchQuery.toLowerCase();
      const matchSearch = a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      const matchCat = selectedCategory === "All" || a.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
      return sortBy === "newest" ? db - da : da - db;
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Welcome Message with ClassArchive Branding */}
        <div className="space-y-2 px-4 sm:px-0">
          <h2 className="text-2xl md:text-xl font-bold text-slate-900">Welcome to ClassArchive, {getFirstName(user.identifier)}</h2>
          <p className="text-sm text-slate-600">Browse the comprehensive archive of technical sessions, workshops, and events.</p>
        </div>

        {/* Enhanced Mobile-First Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-lg flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-3.5 md:py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 bg-white transition-all hover:border-slate-400 touch-manipulation"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1 sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-3.5 md:py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 bg-white transition-all hover:border-slate-400 touch-manipulation"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 sm:w-40 border border-slate-300 rounded-xl px-3 py-3.5 md:py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#3B7DD8] focus:ring-2 focus:ring-[#3B7DD8]/20 bg-white transition-all hover:border-slate-400 touch-manipulation"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Enhanced Responsive Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0">
            {filtered.map(act => (
              <ActivityCard key={act.id} activity={act} isAdmin={false} />
            ))}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-dashed border-slate-300/60 p-12 text-center max-w-md mx-auto shadow-lg">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h4 className="font-bold text-[#0F172A] text-lg mb-2">No Activities Found</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              No activities match your search criteria. Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
