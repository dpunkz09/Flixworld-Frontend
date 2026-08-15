import { API_BASE } from "@/lib/api";
import { clientApiHeaders } from "@/lib/client-fetch";
import type { NotificationsResponse } from "@/types/notifications";

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

export async function getNotificationsApi(
  token: string,
  page = 1
): Promise<NotificationsResponse> {
  const res = await fetch(`${API_BASE}/notifications?page=${page}`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  return handleResponse<NotificationsResponse>(res);
}

export async function getUnreadCountApi(token: string): Promise<{ unread_count: number }> {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  return handleResponse<{ unread_count: number }>(res);
}

export async function markNotificationReadApi(token: string, notificationId: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
}

export async function markAllNotificationsReadApi(token: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
}
