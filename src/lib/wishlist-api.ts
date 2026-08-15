import { API_BASE } from "@/lib/api";
import { clientApiHeaders } from "@/lib/client-fetch";
import type { WishlistItem, AddToWishlistPayload } from "@/types/wishlist";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getWishlistApi(token: string): Promise<WishlistItem[]> {
  const res = await fetch(`${API_BASE}/wishlist`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  return handleResponse<WishlistItem[]>(res);
}

export async function addToWishlistApi(
  token: string,
  payload: AddToWishlistPayload
): Promise<WishlistItem> {
  const res = await fetch(`${API_BASE}/wishlist`, {
    method: "POST",
    headers: clientApiHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    body: JSON.stringify(payload),
  });
  return handleResponse<WishlistItem>(res);
}

export async function removeFromWishlistApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number
): Promise<void> {
  await fetch(`${API_BASE}/wishlist/${type}/${tmdbId}`, {
    method: "DELETE",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
}

export async function checkWishlistApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/wishlist/${type}/${tmdbId}`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { in_wishlist: boolean };
  return data.in_wishlist;
}
