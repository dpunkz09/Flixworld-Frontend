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
    // WebP is widely supported; AVIF gives ~50% better compression over WebP.
    // Next.js serves the best format the browser accepts via Accept header negotiation.
    formats: ["image/avif", "image/webp"],

    // Cache optimized images on disk for 30 days — TMDB posters essentially never change.
    // Without this, Next.js re-optimizes each image every 60 seconds (the default).
    // sharp (already installed) handles the one-time conversion; subsequent hits are free.
    minimumCacheTTL: 2592000,

    // Breakpoints used to generate srcset entries for full-width images (e.g. hero backdrops).
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],

    // Breakpoints for fixed/fill images like poster cards.
    imageSizes: [64, 128, 160, 256, 384],

    // Explicit remote patterns — covers TMDB posters/backdrops and YouTube thumbnails.
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Upstash / other internal assets served over HTTPS
      { protocol: "https", hostname: "**.upstash.io" },
    ],
  },
};

export default nextConfig;
