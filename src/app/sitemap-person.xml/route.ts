import { fetchPersonEntries, buildSitemapXml, sitemapResponse } from "@/lib/sitemap-helpers";

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const entries = await fetchPersonEntries(10);
  return sitemapResponse(buildSitemapXml(entries), 86400);
}
