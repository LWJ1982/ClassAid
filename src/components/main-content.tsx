"use client";

import { useApp } from "./providers";
import { MainRouter } from "./main-router";

export function MainContent() {
  const { hydrated } = useApp();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading Class AId...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <MainRouter />
    </div>
  );
}
