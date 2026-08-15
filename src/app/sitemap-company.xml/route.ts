import { fetchCompanyEntries, buildSitemapXml, sitemapResponse } from "@/lib/sitemap-helpers";

export const revalidate = 604800;

export async function GET(): Promise<Response> {
  const entries = await fetchCompanyEntries();
  return sitemapResponse(buildSitemapXml(entries), 604800);
}
