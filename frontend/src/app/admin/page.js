"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import ActivityCard from "../../components/ActivityCard";
import ActivityForm from "../../components/ActivityForm";
import { INITIAL_ACTIVITIES } from "../../utils/mockData";
import { Search, Filter, Plus, Shield, FileSpreadsheet } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Auth guard
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); return; }
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

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B7DD8]"></div>
      </div>
    );
  }

  const saveActivities = (updated) => {
    setActivities(updated);
    localStorage.setItem("bca_activities", JSON.stringify(updated));
  };

  const handleSave = (savedActivity) => {
    const exists = activities.some(a => a.id === savedActivity.id);
    if (exists) {
      saveActivities(activities.map(a => a.id === savedActivity.id ? savedActivity : a));
    } else {
      savedActivity.createdBy = user.identifier;
      saveActivities([savedActivity, ...activities]);
    }
  };

  const handleDelete = (id) => saveActivities(activities.filter(a => a.id !== id));

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

        {/* Admin Header */}
        <div className="bg-white rounded-2xl border border-[#D9E3F0] p-5 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#3B7DD8] text-xs font-extrabold uppercase tracking-wide mb-1">
              <Shield className="h-4 w-4" />
              <span>Administrator Control Dashboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">3BCA-B Records Panel</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Logged in as <span className="font-bold text-slate-700">{user.identifier}</span>. Create, edit, or remove activity logs.
            </p>
          </div>
          <button
            onClick={() => { setEditingActivity(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-[#3B7DD8] hover:bg-[#3B7DD8]/80 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#D9E3F0] p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3B7DD8] focus:ring-1 focus:ring-[#3B7DD8]/20 bg-slate-50/30"
            />
          </div>
          <div className="relative sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3B7DD8] bg-slate-50/30"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="sm:w-44 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#3B7DD8] bg-slate-50/30"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(act => (
              <ActivityCard
                key={act.id}
                activity={act}
                isAdmin={true}
                onEdit={a => { setEditingActivity(a); setIsFormOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto shadow-sm">
            <FileSpreadsheet className="h-10 w-10 text-blue-400 mx-auto mb-3 animate-pulse" />
            <h4 className="font-bold text-[#0F172A] text-base">Add your first activity</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed mb-6">
              No logs yet. Add an activity to start the classroom record.
            </p>
            <button
              onClick={() => { setEditingActivity(null); setIsFormOpen(true); }}
              className="inline-flex items-center gap-2 bg-[#3B7DD8] hover:bg-[#3B7DD8]/80 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Activity Record</span>
            </button>
          </div>
        )}

        <ActivityForm
          isOpen={isFormOpen}
          activity={editingActivity}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
