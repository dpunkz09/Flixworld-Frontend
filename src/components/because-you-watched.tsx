"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getBecauseYouWatchedApi } from "@/lib/watch-api";
import MediaRow from "@/components/media-row";
import { MediaRowSkeleton } from "@/components/skeletons";
import type { BecauseYouWatchedRow } from "@/types/api";

export default function BecauseYouWatched() {
  const { token, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<BecauseYouWatchedRow[] | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchRows = useCallback(async (t: string) => {
    setFetching(true);
    try {
      const data = await getBecauseYouWatchedApi(t);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && token) {
      void fetchRows(token);
    } else if (!authLoading && !token) {
      setRows([]); // not logged in - nothing to show
    }
  }, [authLoading, token, fetchRows]);

  // Show skeleton while auth or data is loading
  if (authLoading || fetching) {
    return (
      <div className="space-y-6">
        <MediaRowSkeleton />
        <MediaRowSkeleton />
      </div>
    );
  }

  // Nothing to show (not logged in, no history, or all seeds had no recommendations)
  if (!rows || rows.length === 0) return null;

  return (
    <div className="space-y-6">
      {rows.map((row) => (
        <MediaRow
          key={`${row.seed.type}-${row.seed.id}`}
          title={`Because you watched "${row.seed.title}"`}
          items={row.items}
        />
      ))}
    </div>
  );
}
