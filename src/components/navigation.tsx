"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "./providers";
import type { Role } from "@/lib/domain/types";

export function Navigation() {
  const { role, setRole, currentUser, resetDemo, hydrated } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const roles: { value: Role; label: string; icon: string }[] = [
    { value: "learner", label: "Learner", icon: "\uD83C\uDF93" },
    { value: "instructor", label: "Instructor", icon: "\uD83D\uDC69\u200D\uD83C\uDFEB" },
    { value: "admin", label: "Admin", icon: "\u2699\uFE0F" },
  ];

  if (!hydrated) {
    return (
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CA</span>
              </div>
              <span className="font-bold text-slate-900 text-lg">Class AId</span>
            </div>
            <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CA</span>
              </div>
              <span className="font-bold text-slate-900 text-lg hidden sm:block">Class AId</span>
            </Link>

            {/* Role switcher - center */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 sm:p-1">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      role === r.value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span className="sm:mr-1">{r.icon}</span>
                    <span className="hidden sm:inline">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <span>\u26A0\uFE0F</span>
                <span>DEMO</span>
              </div>
              <div className="hidden lg:block text-xs text-slate-500">
                {currentUser.name}
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                title="Reset demo to fresh state"
              >
                <svg className="w-3.5 h-3.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Reset Demo?</h3>
                <p className="text-sm text-slate-500">This clears all progress and returns to a fresh state.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { resetDemo(); setShowResetConfirm(false); }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
