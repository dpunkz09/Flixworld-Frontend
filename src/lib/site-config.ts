import { API_BASE, apiFetch } from "@/lib/api";

export interface SiteConfig {
  downloadPageEnabled: boolean;
  adsenseCode:         string;
  analyticsCode:       string;
}

/**
 * If the stored value is a full <script>...</script> block, extract just the
 * inner content so it can safely be used with dangerouslySetInnerHTML.
 * If it's already plain JS (no wrapping tag), return as-is.
 * Also handles <script src="..."> by returning an empty string — those are
 * handled separately via the Script src= prop.
 */
function extractScriptContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Match <script ...>content</script>
  const match = trimmed.match(/^<script[^>]*>([\s\S]*?)<\/script>\s*$/i);
  if (match) {
    return match[1].trim();
  }

  // It's a self-closing or src-only tag — not injectable as innerHTML
  if (/^<script\b/i.test(trimmed)) {
    return '';
  }

  return trimmed;
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
  adsenseCode:         '',
  analyticsCode:       '',
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
    return {
      downloadPageEnabled: data.download_page_enabled  !== false,
      adsenseCode:         extractScriptContent(data['adsense.code']        ?? ''),
      analyticsCode:       extractScriptContent(data['analytics.code']      ?? ''),
    };
  } catch {
    return SITE_CONFIG_DEFAULT;
  }
}
