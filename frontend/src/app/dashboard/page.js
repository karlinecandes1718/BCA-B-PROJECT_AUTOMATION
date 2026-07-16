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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EBF8FF] to-[#BEE3F8]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4299E1]"></div>
          <p className="text-sm text-[#4299E1] font-medium">Loading dashboard...</p>
        </div>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EBF8FF] to-[#BEE3F8]">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Welcome Message */}
        <div className="space-y-2">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#4299E1] to-[#63B3ED] bg-clip-text text-transparent">
              Welcome, {getFirstName(user.identifier)}!
            </h2>
            <p className="text-sm text-[#1A365D] font-medium mt-1">
              Browse the official archive of technical sessions and events.
            </p>
            <div className="mt-4 flex items-center">
              <div className="h-1 w-16 bg-gradient-to-r from-[#4299E1] to-[#63B3ED] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4299E1] pointer-events-none" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border-2 border-[#BEE3F8] bg-white/80 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A365D] placeholder-[#90CDF4] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm"
            />
          </div>
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4299E1] pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-[#BEE3F8] bg-white/80 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1A365D] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="sm:w-48 border-2 border-[#BEE3F8] bg-white/80 rounded-xl px-4 py-3 text-sm text-[#1A365D] focus:outline-none focus:border-[#4299E1] focus:ring-2 focus:ring-[#4299E1]/20 transition-all backdrop-blur-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(act => (
              <ActivityCard key={act.id} activity={act} isAdmin={false} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border-2 border-dashed border-[#BEE3F8] p-12 text-center max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-[#90CDF4] mx-auto mb-4" />
            <h4 className="font-bold text-[#1A365D] text-lg">No activities found</h4>
            <p className="text-sm text-[#4299E1] font-medium mt-2 leading-relaxed">
              No logs match your search or no activities have been recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
