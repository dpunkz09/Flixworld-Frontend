import { fetchNetworkEntries, buildSitemapXml, sitemapResponse } from "@/lib/sitemap-helpers";

export const revalidate = 604800;

export async function GET(): Promise<Response> {
  const entries = await fetchNetworkEntries();
  return sitemapResponse(buildSitemapXml(entries), 604800);
}
