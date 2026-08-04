"use client";

import { AppProvider } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { MainRouter } from "@/components/main-router";

export default function Home() {
  return (
    <AppProvider>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MainRouter />
      </main>
    </AppProvider>
  );
}
