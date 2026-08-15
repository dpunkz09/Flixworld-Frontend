import type { MetadataRoute } from "next";
import { COUNTRIES } from "@/types/tmdb";

const BASE = "https://flixworld.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/movies`,        lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/tv`,            lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/country`,       lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/search`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`,       lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`,         lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const countryPages: MetadataRoute.Sitemap = COUNTRIES.map((c) => ({
    url: `${BASE}/country/${c.code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...countryPages];
}
