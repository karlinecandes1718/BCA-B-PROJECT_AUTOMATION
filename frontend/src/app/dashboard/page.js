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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E4FA3]"></div>
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

        {/* Welcome Message */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">Welcome, {getFirstName(user.identifier)}</h2>
          <p className="text-sm text-slate-600">Browse the official archive of technical sessions and events.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 bg-white"
            />
          </div>
          <div className="relative sm:w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 bg-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="sm:w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(act => (
              <ActivityCard key={act.id} activity={act} isAdmin={false} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto shadow-sm">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-[#0F172A] text-base">No activities found</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              No logs match your search or no activities have been recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
