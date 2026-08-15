import { NextRequest, NextResponse } from "next/server";
import { searchMulti } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  if (!query.trim()) {
    return NextResponse.json({ items: [], page: 1, total_pages: 0, total_results: 0 });
  }

  try {
    const result = await searchMulti(query, page);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
