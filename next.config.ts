import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  productionBrowserSourceMaps: false,
  
  // High-Performance memory & build limits
  experimental: {
    // Limits the memory consumed by caching compiler threads
    webpackMemoryOptimizations: true,
    // Prevents Next.js from spawning excessive worker processes on Ubuntu
    cpus: 2, 
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            value: "autoplay=(), camera=(), microphone=()",
          },
        ],
      },
    ];
  },

  images: {
    unoptimized: true,
    // Wildcard remote patterns. Since you are using unoptimized: true, 
    // you can safely catch all secure origins or clean up redundant ones.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
