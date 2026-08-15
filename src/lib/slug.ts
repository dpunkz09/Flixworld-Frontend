/**
 * Converts a title + numeric ID into a URL-safe slug.
 * Example: slugify("The Island", 1138749) → "the-island-1138749"
 */
export function slugify(title: string, id: number | string): string {
  const titlePart = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")   // keep only alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-{2,}/g, "-")          // collapse multiple hyphens
    .slice(0, 60)                    // cap length
    .replace(/-+$/, "");             // strip trailing hyphens

  return titlePart ? `${titlePart}-${id}` : String(id);
}

/**
 * Extracts the numeric TMDB ID from the end of a slug.
 * Example: extractId("the-island-1138749") → "1138749"
 * Works even if the slug is just a bare numeric ID (backward compat).
 */
export function extractId(slug: string): string {
  const match = slug.match(/(\d+)$/);
  return match ? match[1] : slug;
}
