"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useApp } from "./providers";
import { useAuth } from "./auth/auth-provider";
import type { Role } from "@/lib/domain/types";

export function Navigation() {
  const { role, setRole, currentUser, setCurrentDemoUser, resetDemo, hydrated, users } = useApp();
  const { isDemo, signOut, user } = useAuth();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowUserPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roles: { value: Role; label: string; icon: string }[] = [
    { value: "learner", label: "Learner", icon: "\uD83C\uDF93" },
    { value: "instructor", label: "Instructor", icon: "\uD83D\uDC69\u200D\uD83C\uDFEB" },
    { value: "admin", label: "Admin", icon: "\u2699\uFE0F" },
  ];

  const roleIcon = (r: Role) => roles.find((x) => x.value === r)?.icon ?? "";

  // Group demo users by role
  const learners = users.filter((u) => u.role === "learner");
  const instructors = users.filter((u) => u.role === "instructor");
  const admins = users.filter((u) => u.role === "admin");

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

            {/* Demo mode: role shortcuts + user picker */}
            {isDemo && (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Role shortcut buttons */}
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

                {/* User picker dropdown */}
                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => setShowUserPicker(!showUserPicker)}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Switch demo user"
                  >
                    <span>{roleIcon(currentUser.role)}</span>
                    <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserPicker && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-[60] py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Learners group */}
                      <div className="px-3 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Learners</span>
                      </div>
                      {learners.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setCurrentDemoUser(u.id); setShowUserPicker(false); }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                            currentUser.id === u.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                          }`}
                        >
                          <span className="text-base">{"\uD83C\uDF93"}</span>
                          <span className="flex-1 truncate">{u.name}</span>
                          {u.domainId === "domain-1" && <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">EE</span>}
                          {u.domainId === "domain-2" && <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">CS</span>}
                          {currentUser.id === u.id && (
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}

                      <div className="border-t border-slate-100 my-1" />

                      {/* Instructors group */}
                      <div className="px-3 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Instructors</span>
                      </div>
                      {instructors.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setCurrentDemoUser(u.id); setShowUserPicker(false); }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                            currentUser.id === u.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                          }`}
                        >
                          <span className="text-base">{"\uD83D\uDC69\u200D\uD83C\uDFEB"}</span>
                          <span className="flex-1 truncate">{u.name}</span>
                          {u.domainId === "domain-1" && <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">EE</span>}
                          {u.domainId === "domain-2" && <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">CS</span>}
                          {currentUser.id === u.id && (
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}

                      <div className="border-t border-slate-100 my-1" />

                      {/* Admins group */}
                      <div className="px-3 py-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Admin</span>
                      </div>
                      {admins.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setCurrentDemoUser(u.id); setShowUserPicker(false); }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                            currentUser.id === u.id ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                          }`}
                        >
                          <span className="text-base">{"\u2699\uFE0F"}</span>
                          <span className="flex-1 truncate">{u.name}</span>
                          {currentUser.id === u.id && (
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authenticated user info - center (when not demo) */}
            {!isDemo && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 capitalize">
                  {role}
                </span>
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {isDemo ? (
                <>
                  <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <span>{"\u26A0\uFE0F"}</span>
                    <span>DEMO</span>
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
                </>
              ) : (
                <>
                  <div className="hidden lg:block text-xs text-slate-600 font-medium">
                    {user?.user_metadata?.name ?? user?.email ?? "User"}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                    title="Sign out"
                  >
                    <svg className="w-3.5 h-3.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              )}
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
