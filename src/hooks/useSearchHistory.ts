"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/types/api";

const KEYWORDS_KEY = "fw_search_keywords";
const ITEMS_KEY = "fw_search_items";
const MAX_KEYWORDS = 10;
const MAX_ITEMS = 12;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

export function useSearchHistory() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<MediaItem[]>([]);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setKeywords(readStorage<string[]>(KEYWORDS_KEY, []));
    setRecentItems(readStorage<MediaItem[]>(ITEMS_KEY, []));
  }, []);

  const pushKeyword = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setKeywords((prev) => {
      const next = [trimmed, ...prev.filter((k) => k !== trimmed)].slice(
        0,
        MAX_KEYWORDS
      );
      writeStorage(KEYWORDS_KEY, next);
      return next;
    });
  }, []);

  const removeKeyword = useCallback((query: string) => {
    setKeywords((prev) => {
      const next = prev.filter((k) => k !== query);
      writeStorage(KEYWORDS_KEY, next);
      return next;
    });
  }, []);

  const clearKeywords = useCallback(() => {
    setKeywords([]);
    writeStorage(KEYWORDS_KEY, []);
  }, []);

  const pushItem = useCallback((item: MediaItem) => {
    setRecentItems((prev) => {
      const next = [
        item,
        ...prev.filter((i) => !(i.id === item.id && i.type === item.type)),
      ].slice(0, MAX_ITEMS);
      writeStorage(ITEMS_KEY, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number, type: "movie" | "tv") => {
    setRecentItems((prev) => {
      const next = prev.filter((i) => !(i.id === id && i.type === type));
      writeStorage(ITEMS_KEY, next);
      return next;
    });
  }, []);

  const clearItems = useCallback(() => {
    setRecentItems([]);
    writeStorage(ITEMS_KEY, []);
  }, []);

  return {
    keywords,
    recentItems,
    pushKeyword,
    removeKeyword,
    clearKeywords,
    pushItem,
    removeItem,
    clearItems,
  };
}
