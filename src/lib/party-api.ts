import { API_BASE, apiFetch } from "@/lib/api";

export interface PartyRoomInfo {
  mediaType: "movie" | "tv";
  tmdbId: number;
  mediaTitle: string;
  season: number | null;
  episode: number | null;
  memberCount: number;
}

export interface PublicSession {
  id: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  mediaTitle: string;
  posterPath: string | null;
  season: number | null;
  episode: number | null;
  memberCount: number;
  isPlaying: boolean;
}

/** GET /api/party/sessions — public list of active rooms */
export async function getPublicSessions(): Promise<PublicSession[]> {
  try {
    const res = await apiFetch(`${API_BASE}/party/sessions`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json() as Promise<PublicSession[]>;
  } catch {
    return [];
  }
}

/**
 * Fetch public room info from GET /api/party/:roomId/info.
 * Returns null if the room doesn't exist or has ended.
 */
export async function getPartyRoomInfo(roomId: string): Promise<PartyRoomInfo | null> {
  try {
    const res = await apiFetch(`${API_BASE}/party/${roomId.toUpperCase()}/info`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<PartyRoomInfo>;
  } catch {
    return null;
  }
}
