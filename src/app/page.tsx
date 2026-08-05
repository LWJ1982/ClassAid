"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AppProvider } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { MainContent } from "@/components/main-content";

export default function Home() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <MainContent />
          </main>
          <footer className="border-t border-slate-200 bg-white py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                Class AId &mdash; AI-Powered Readiness & Learning Assurance Platform
              </p>
              <p className="text-xs text-slate-400">
                Prototype Demo &middot; Assessment is advisory only &middot; Does not certify practical competence
              </p>
            </div>
          </footer>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
