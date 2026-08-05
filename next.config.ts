import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment from Windows
  // API routes are handled by Cloudflare Pages Functions in /functions
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
