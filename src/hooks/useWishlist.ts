"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { WishlistItem, AddToWishlistPayload } from "@/types/wishlist";
import {
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
} from "@/lib/wishlist-api";
import { useAuth } from "@/hooks/useAuth";

export interface WishlistContextValue {
  items: WishlistItem[];
  loading: boolean;
  /** Returns true if the given tmdb_id + type is in the wishlist */
  isInWishlist: (type: "movie" | "tv", tmdbId: number) => boolean;
  toggle: (payload: AddToWishlistPayload) => Promise<void>;
  refresh: () => Promise<void>;
}

export const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  loading: false,
  isInWishlist: () => false,
  toggle: async () => {},
  refresh: async () => {},
});

export function useWishlistProvider(): WishlistContextValue {
  const { token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  // Guard against setting state after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchList = useCallback(async () => {
    if (!token) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getWishlistApi(token);
      if (mountedRef.current) setItems(data);
    } catch {
      // silently fail
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const isInWishlist = useCallback(
    (type: "movie" | "tv", tmdbId: number) =>
      items.some((i) => i.type === type && i.tmdb_id === tmdbId),
    [items]
  );

  const toggle = useCallback(
    async (payload: AddToWishlistPayload) => {
      if (!token) return;

      // Read current list via functional updater to avoid stale closure on `items`
      let wasInList = false;
      setItems((prev) => {
        wasInList = prev.some(
          (i) => i.type === payload.type && i.tmdb_id === payload.tmdb_id
        );
        if (wasInList) {
          return prev.filter(
            (i) => !(i.type === payload.type && i.tmdb_id === payload.tmdb_id)
          );
        }
        // Optimistic add
        const optimistic: WishlistItem = {
          id: -Date.now(),
          user_id: 0,
          type: payload.type,
          tmdb_id: payload.tmdb_id,
          title: payload.title ?? "",
          poster_path: payload.poster_path ?? null,
          vote_average: payload.vote_average ?? 0,
          release_date: payload.release_date ?? "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [optimistic, ...prev];
      });

      if (wasInList) {
        try {
          await removeFromWishlistApi(token, payload.type, payload.tmdb_id);
        } catch {
          await fetchList();
        }
      } else {
        try {
          const saved = await addToWishlistApi(token, payload);
          setItems((prev) =>
            prev.map((i) =>
              // Replace the optimistic placeholder (negative id) with the real record
              i.type === saved.type && i.tmdb_id === saved.tmdb_id && i.id < 0
                ? saved
                : i
            )
          );
        } catch {
          await fetchList();
        }
      }
    },
    [token, fetchList] // `items` removed — read via functional updater instead
  );

  return { items, loading, isInWishlist, toggle, refresh: fetchList };
}

export function useWishlist(): WishlistContextValue {
  return useContext(WishlistContext);
}
