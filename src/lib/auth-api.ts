import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from "@/types/auth";
import { API_BASE } from "@/lib/api";
import { clientApiHeaders } from "@/lib/client-fetch";

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

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: clientApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function googleAuthApi(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    headers: clientApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ credential }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: clientApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function logoutApi(token: string): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
  });
}

export async function getAuthUserApi(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/user`, {
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    cache: "no-store",
  });
  return handleResponse<User>(res);
}

export async function updateProfileApi(
  token: string,
  payload: UpdateProfilePayload
): Promise<{ message: string; user: User }> {
  const form = new FormData();
  form.append("name", payload.name);
  if (payload.profile_picture) form.append("profile_picture", payload.profile_picture);
  // Do NOT set Content-Type -- browser sets it with the correct boundary for multipart
  const res = await fetch(`${API_BASE}/user/update`, {
    method: "POST",
    headers: clientApiHeaders({ Authorization: `Bearer ${token}` }),
    body: form,
  });
  return handleResponse<{ message: string; user: User }>(res);
}
