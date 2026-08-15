export interface User {
  id: number;
  name: string;
  email: string;
  profile_picture: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfilePayload {
  name: string;
  profile_picture?: File | null;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
