"use client";

import Link from "next/link";
import { useApp } from "./providers";
import type { Role } from "@/lib/domain/types";

export function Navigation() {
  const { role, setRole, currentUser } = useApp();

  const roles: { value: Role; label: string; icon: string }[] = [
    { value: "learner", label: "Learner", icon: "\uD83C\uDF93" },
    { value: "instructor", label: "Instructor", icon: "\uD83D\uDC69\u200D\uD83C\uDFEB" },
    { value: "admin", label: "Admin", icon: "\u2699\uFE0F" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">Class AId</span>
          </Link>

          {/* Nav links based on role */}
          <nav className="hidden md:flex items-center gap-6">
            {role === "learner" && (
              <>
                <Link href="/dashboard" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
                <Link href="/module/module-1" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Module
                </Link>
              </>
            )}
            {role === "instructor" && (
              <Link href="/insights" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Cohort Insights
              </Link>
            )}
            {role === "admin" && (
              <Link href="/registry" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Module Registry
              </Link>
            )}
          </nav>

          {/* Role switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <span>\u26A0\uFE0F</span>
              <span>DEMO MODE</span>
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    role === r.value
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="mr-1">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="hidden lg:block text-xs text-slate-500">
              {currentUser.name}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
