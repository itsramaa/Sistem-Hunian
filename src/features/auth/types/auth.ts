// SRS roles: operator (pemilik kos), viewer (read-only)
export type AppRole = 'operator' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: AppRole;
}

export interface AuthTokens {
  access_token: string;
  expires_in?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  phone_number?: string | null;
  token_version?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
  error: Error | null;
}
