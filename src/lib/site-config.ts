import { API_BASE, apiFetch } from "@/lib/api";

export interface SiteConfig {
  downloadPageEnabled: boolean;
  /** Inline JS content (no <script> tags) — use with dangerouslySetInnerHTML */
  adsenseCode:         string | null;
  /** External script src URL — use with <Script src=...> */
  adsenseSrc:          string | null;
  /** Inline JS content (no <script> tags) — use with dangerouslySetInnerHTML */
  analyticsCode:       string | null;
  /** External script src URL — use with <Script src=...> */
  analyticsSrc:        string | null;
}

/**
 * If the stored value is a full <script>...</script> block, extract just the
 * inner content so it can safely be used with dangerouslySetInnerHTML.
 * If it's already plain JS (no wrapping tag), return as-is.
 * Returns null when the value is a <script src=""> tag (handled separately).
 */
function extractScriptContent(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Self-closing or src-only tag — not injectable as innerHTML
  if (/^<script\b[^>]+src=/i.test(trimmed)) {
    return null;
  }

  // Match <script ...>content</script>
  const match = trimmed.match(/^<script[^>]*>([\s\S]*?)<\/script>\s*$/i);
  if (match) {
    return match[1].trim() || null;
  }

  // Plain JS with no wrapping tag
  if (!/^<script\b/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Extract the src attribute from a <script src="..."> tag, if present.
 */
export function extractScriptSrc(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/<script[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export const SITE_CONFIG_DEFAULT: SiteConfig = {
  downloadPageEnabled: true,
  adsenseCode:         null,
  adsenseSrc:          null,
  analyticsCode:       null,
  analyticsSrc:        null,
};

/**
 * Fetch site config from the backend public endpoint.
 * Safe to call from both server components and client-side code.
 * Uses no-store so server renders always get fresh values from the DB.
 */
export async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const res = await apiFetch(`${API_BASE}/party/config`, {
      next: { revalidate: 300 }, // revalidate every 5 minutes — safe for admin settings
    });
    if (!res.ok) return SITE_CONFIG_DEFAULT;
    const data = await res.json() as {
      download_page_enabled: boolean;
      'adsense.code':        string;
      'analytics.code':      string;
    };
    const rawAdsense  = data['adsense.code']   ?? '';
    const rawAnalytics = data['analytics.code'] ?? '';
    return {
      downloadPageEnabled: data.download_page_enabled !== false,
      adsenseCode:  extractScriptContent(rawAdsense),
      adsenseSrc:   extractScriptSrc(rawAdsense),
      analyticsCode: extractScriptContent(rawAnalytics),
      analyticsSrc:  extractScriptSrc(rawAnalytics),
    };
  } catch {
    return SITE_CONFIG_DEFAULT;
  }
}
