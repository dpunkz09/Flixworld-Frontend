import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://flixworld.xyz";
  return {
    rules: [
      // Allow social sharing crawlers explicitly - these must be able to
      // read og: tags for link previews on Facebook, Twitter, WhatsApp, LinkedIn, etc.
      {
        userAgent: [
          "facebookexternalhit",
          "Facebot",
          "Twitterbot",
          "WhatsApp",
          "LinkedInBot",
          "Slackbot",
          "TelegramBot",
          "Discordbot",
          "Googlebot",
          "Bingbot",
          "Yandex"
        ],
        allow: ["/"],
      },
      // Block aggressive SEO crawlers and AI scrapers that generate log noise
      {
        userAgent: [
          "SemrushBot",
          "AhrefsBot",
          "MJ12bot",
          "DotBot",
          "Bytespider",
          "PetalBot",
          "YandexBot",
          "Amazonbot",
          "Amzn-SearchBot",
          "Claude-SearchBot",
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "cohere-ai",
          "PerplexityBot",
          "Outbrain",
          "Exabot",
          "SISTRIX Crawler",
          "Ezooms",
          "Diffbot",
          "CensysInspect",
          "OgScrper",
          "SeznamBot",
          "Neevabot",
          "ZoominfoBot",
          "Pandalytics",
          "SiteAuditBot",
          "MetaInspector",
          "AdsBot-Google",
          "Google-Extended",
          "Feedfetcher-Google",
          "ias-va",
          "ias-ie",
          "weborama-fetcher",
          "SirdataBot"
        ],
        disallow: ["/"],
      },
      // Default rules for well-behaved crawlers (Googlebot, etc.)
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
