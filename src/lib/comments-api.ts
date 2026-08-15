import { API_BASE } from "@/lib/api";
import { clientApiHeaders } from "@/lib/client-fetch";
import type { CommentsResponse, Comment, PostCommentPayload } from "@/types/comments";

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

export async function getCommentsApi(
  type: "movie" | "tv",
  tmdbId: number,
  page = 1,
  token?: string | null
): Promise<CommentsResponse> {
  const res = await fetch(`${API_BASE}/comments/${type}/${tmdbId}?page=${page}`, {
    headers: clientApiHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    ),
    cache: "no-store",
  });
  return handleResponse<CommentsResponse>(res);
}

export async function postCommentApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number,
  payload: PostCommentPayload
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/comments/${type}/${tmdbId}`, {
    method: "POST",
    headers: clientApiHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    body: JSON.stringify(payload),
  });
  return handleResponse<Comment>(res);
}

export async function deleteCommentApi(token: string, commentId: number): Promise<void> {
  await fetch(`${API_BASE}/comments/${commentId}`, {
    method: "DELETE",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
}

export async function followThreadApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number
): Promise<{ is_following: boolean }> {
  const res = await fetch(`${API_BASE}/comments/${type}/${tmdbId}/follow`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
  return handleResponse<{ is_following: boolean }>(res);
}

export async function unfollowThreadApi(
  token: string,
  type: "movie" | "tv",
  tmdbId: number
): Promise<{ is_following: boolean }> {
  const res = await fetch(`${API_BASE}/comments/${type}/${tmdbId}/follow`, {
    method: "DELETE",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
  return handleResponse<{ is_following: boolean }>(res);
}
