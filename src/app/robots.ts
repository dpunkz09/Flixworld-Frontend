import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://flixworld.xyz";
  return {
    rules: [
      // Block aggressive crawlers that are generating huge log volume
      {
        userAgent: [
          "SemrushBot",
          "AhrefsBot",
          "MJ12bot",
          "DotBot",
          "Bytespider",
          "PetalBot",
          "YandexBot",
          "BingBot",
          "Amazonbot",
          "Amzn-SearchBot",
          "Claude-SearchBot",
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "cohere-ai",
          "PerplexityBot",
        ],
        disallow: ["/"],
      },
      // Default rules for well-behaved crawlers (Google, etc.)
      {
        userAgent: "*",
        allow: [
          "/",
          "/movies",
          "/tv",
          "/country",
          "/search",
          "/person/",
          "/network/",
          "/company/",
          "/keyword/",
          "/about",
          "/contact",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/api/",
          "/watch/",
          "/profile",
          "/my-list",
          "/login",
          "/register",
          "/offline",
          "/admin",
          "/download",
          "/_next/",
        ],
      },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/sitemap-movie.xml`,
      `${base}/sitemap-tv.xml`,
      `${base}/sitemap-person.xml`,
      `${base}/sitemap-network.xml`,
      `${base}/sitemap-company.xml`,
    ],
  };
}
