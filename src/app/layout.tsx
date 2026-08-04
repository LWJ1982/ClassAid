import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class AId — Readiness & Learning Assurance",
  description: "AI-powered readiness and learning assurance platform. Configurable, text-first preparation for structured learning activities.",
  keywords: ["readiness", "learning", "assessment", "AI", "education", "safety", "competency"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen text-slate-900">
        {children}
      </body>
    </html>
  );
}
