"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { LogOut, BookOpen, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  if (!user) return null;

  const confirmLogout = () => {
    setShowConfirmLogout(false);
    logout();
    router.replace("/");
  };

  const getShortName = (id) => {
    if (!id) return "";
    if (id.includes("@")) {
      const namePart = id.split("@")[0];
      return namePart.length > 14 ? namePart.substring(0, 12) + ".." : namePart;
    }
    return id.replace("Admin ", "");
  };

  return (
    <>
      <nav className="bg-[#3B7DD8] text-white shadow-md border-b border-[#3B7DD8]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Branding */}
            <Link
              href={user.role === "admin" ? "/admin" : "/dashboard"}
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            >
              <div className="bg-white/10 p-2 rounded-md">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-wide block leading-none text-white">3BCA-B</span>
                <span className="text-xs text-slate-200 font-medium">Activity Portal</span>
              </div>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Desktop identity */}
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs text-blue-200 font-medium uppercase tracking-wider flex items-center gap-1">
                  {user.role === "admin"
                    ? <><Shield className="h-3 w-3" /> Administrator</>
                    : <><UserIcon className="h-3 w-3" /> Student</>
                  }
                </span>
                <span className="text-sm font-semibold truncate max-w-[180px]">{user.identifier}</span>
              </div>

              {/* Mobile identity */}
              <div className="md:hidden bg-white/10 px-2.5 py-1.5 rounded-md">
                <span className="text-xs font-semibold">{getShortName(user.identifier)}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={() => setShowConfirmLogout(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-red-600 px-3.5 py-2 rounded-md text-sm font-medium transition-colors border border-white/5 shadow-sm cursor-pointer"
                title="Logout from session"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout confirmation modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#0F172A]">Confirm Logout</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to end your session? You will need to log in again to access the portal.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
