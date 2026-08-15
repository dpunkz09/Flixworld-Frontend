import { API_BASE, apiFetch } from "@/lib/api";

export interface SiteConfig {
  downloadPageEnabled: boolean;
  adsenseCode:         string;
  analyticsCode:       string;
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
      adsenseCode:         data['adsense.code']        ?? '',
      analyticsCode:       data['analytics.code']      ?? '',
    };
  } catch {
    return SITE_CONFIG_DEFAULT;
  }
}
