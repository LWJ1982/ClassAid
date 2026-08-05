import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @cloudflare/next-on-pages requires these settings
  experimental: {
    // Enable edge runtime for API routes on Cloudflare
  },
};

export default nextConfig;
