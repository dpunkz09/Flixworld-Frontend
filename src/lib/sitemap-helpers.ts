import { slugify } from "@/lib/slug";

export const SITE_BASE = "https://flixworld.xyz";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api-backend.jpaworx.com/api";

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
}

const TODAY = new Date().toISOString().slice(0, 10);

function validDate(value: string | undefined): string {
  if (value) {
    const d = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && isFinite(Date.parse(d))) {
      const year = parseInt(d.slice(0, 4), 10);
      if (year >= 1888) return d;
    }
  }
  return TODAY;
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const loc = `  <url>\n    <loc>${xmlEscape(e.url)}</loc>`;
      const date = validDate(e.lastModified);
      const lastmod = `\n    <lastmod>${date}</lastmod>`;
      const freq = e.changeFrequency
        ? `\n    <changefreq>${e.changeFrequency}</changefreq>`
        : "";
      const pri =
        e.priority != null
          ? `\n    <priority>${e.priority.toFixed(1)}</priority>`
          : "";
      return `${loc}${lastmod}${freq}${pri}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function sitemapResponse(xml: string, revalidate: number): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate`,
    },
  });
}

// ---------------------------------------------------------------------------
// Backend fetch helpers (no TMDB key needed in the frontend)
// ---------------------------------------------------------------------------

interface BackendMediaItem {
  id: number;
  title: string;
  release_date: string;
}

async function fetchBackendPages<T extends BackendMediaItem>(
  endpoint: string,
  pages: number
): Promise<T[]> {
  const fetches = Array.from({ length: pages }, (_, i) =>
    fetch(`${API_BASE}${endpoint}?page=${i + 1}`, { next: { revalidate: 86400 } })
      .then((r) => (r.ok ? (r.json() as Promise<{ items?: T[] }>) : { items: [] }))
      .then((d) => d.items ?? [])
      .catch(() => [] as T[])
  );
  const results = await Promise.all(fetches);
  return results.flat();
}

export async function fetchMovieEntries(pages = 5): Promise<SitemapEntry[]> {
  const items = await fetchBackendPages<BackendMediaItem>("/movies", pages);
  const seen = new Set<number>();
  const entries: SitemapEntry[] = [];
  for (const m of items) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    entries.push({
      url: `${SITE_BASE}/movies/${slugify(m.title, m.id)}`,
      lastModified: m.release_date || TODAY,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  return entries;
}

export async function fetchTvEntries(pages = 5): Promise<SitemapEntry[]> {
  const items = await fetchBackendPages<BackendMediaItem>("/tvseries", pages);
  const seen = new Set<number>();
  const entries: SitemapEntry[] = [];
  for (const t of items) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    entries.push({
      url: `${SITE_BASE}/tv/${slugify(t.title, t.id)}`,
      lastModified: t.release_date || TODAY,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  return entries;
}

export async function fetchPersonEntries(pages = 3): Promise<SitemapEntry[]> {
  const seen = new Set<number>();
  const entries: SitemapEntry[] = [];

  const fetches = Array.from({ length: pages }, (_, i) =>
    fetch(`${API_BASE}/person/popular?page=${i + 1}`, { next: { revalidate: 86400 } })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: Array<{ id: number; name: string }> }) => d.items ?? [])
      .catch(() => [] as Array<{ id: number; name: string }>)
  );

  const results = await Promise.all(fetches);
  for (const page of results) {
    for (const p of page) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      entries.push({
        url: `${SITE_BASE}/person/${slugify(p.name, p.id)}`,
        lastModified: TODAY,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }
  return entries;
}

export async function fetchNetworkEntries(): Promise<SitemapEntry[]> {
  // Derive networks from the backend's TV detail endpoint on popular shows
  const items = await fetchBackendPages<BackendMediaItem>("/tvseries", 2);
  const seen = new Map<number, string>();

  const BATCH = 10;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((t) =>
        fetch(`${API_BASE}/tv/${t.id}`, { next: { revalidate: 604800 } })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.networks ?? []) as Array<{ id: number; name: string }>)
          .catch(() => [] as Array<{ id: number; name: string }>)
      )
    );
    for (const networks of results) {
      for (const n of networks) {
        if (!seen.has(n.id)) seen.set(n.id, n.name);
      }
    }
  }

  return Array.from(seen.entries()).map(([id, name]) => ({
    url: `${SITE_BASE}/network/${slugify(name, id)}`,
    lastModified: TODAY,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
}

export async function fetchCompanyEntries(): Promise<SitemapEntry[]> {
  const [movieItems, tvItems] = await Promise.all([
    fetchBackendPages<BackendMediaItem>("/movies", 2),
    fetchBackendPages<BackendMediaItem>("/tvseries", 2),
  ]);

  const allItems = [
    ...movieItems.map((m) => ({ type: "movie" as const, id: m.id })),
    ...tvItems.map((t) => ({ type: "tv" as const, id: t.id })),
  ];

  const seen = new Map<number, string>();
  const BATCH = 10;

  for (let i = 0; i < allItems.length; i += BATCH) {
    const batch = allItems.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(({ type, id }) =>
        fetch(`${API_BASE}/${type}/${id}`, { next: { revalidate: 604800 } })
          .then((r) => (r.ok ? r.json() : null))
          .then(
            (d) =>
              (d?.production_companies ?? []) as Array<{ id: number; name: string }>
          )
          .catch(() => [] as Array<{ id: number; name: string }>)
      )
    );
    for (const companies of results) {
      for (const c of companies) {
        if (!seen.has(c.id)) seen.set(c.id, c.name);
      }
    }
  }

  return Array.from(seen.entries()).map(([id, name]) => ({
    url: `${SITE_BASE}/company/${slugify(name, id)}`,
    lastModified: TODAY,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
}
