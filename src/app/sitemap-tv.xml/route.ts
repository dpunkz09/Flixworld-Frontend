import { fetchTvEntries, buildSitemapXml, sitemapResponse } from "@/lib/sitemap-helpers";

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const entries = await fetchTvEntries(10);
  return sitemapResponse(buildSitemapXml(entries), 86400);
}
