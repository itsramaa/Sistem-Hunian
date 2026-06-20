// SRS roles: operator (pemilik kos), manager (maintenance access), viewer (read-only), admin (system)
export type AppRole = 'admin' | 'operator' | 'manager' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  nama?: string;
  role?: AppRole;
}

export interface AuthTokens {
  access_token: string;
  expires_in?: number;
}

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: AppRole;
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
