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
            // Prevents clickjacking - allows same-origin frames (e.g. embedded player)
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            // HSTS - tells browsers to always use HTTPS for this domain.
            // max-age=31536000 = 1 year (Google's recommended minimum).
            // includeSubDomains covers all subdomains.
            // preload opts into browser HSTS preload lists (submit at hstspreload.org).
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            // Prevents MIME-type sniffing attacks
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Stops the browser from sending the full referrer URL to third-party sites
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Permissions policy: restrict access to sensitive browser APIs
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
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
