import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output creates a self-contained build — smaller, faster cold starts
  output: "standalone",
  // Silence the Turbopack warning -- no webpack config in use
  turbopack: {},
  // Disable server-side source maps in production — they consume significant
  // memory and CPU parsing .map files on every error stack trace.
  productionBrowserSourceMaps: false,
  images: {
    // Images served from TMDB/YouTube CDNs directly — no server-side transform needed.
    // This eliminates the on-demand image processing that was causing CPU spikes.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "api-backend.jpaworx.com",
        pathname: "/storage/**",
      },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.discordapp.net" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
