import { apiClient, TOKEN_KEY } from '@/shared/lib/axios';
import { AppRole, AuthState, AuthTokens, AuthUser, UserProfile } from '@/features/auth/types/auth';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  // signUp is not supported — users are provisioned by admin only
  signUp: (...args: unknown[]) => Promise<{ data: null; error: Error }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setProfile(null);
    setRole(null);
    setError(null);
  };

  // GET /api/v1/auth/me — shape: { id, nama, email, role }
  const refreshProfile = useCallback(async () => {
    setError(null);
    try {
      const { data } = await apiClient.get<UserProfile>('/auth/me');
      setUser({ id: data.id, email: data.email, nama: data.nama, role: data.role });
      setProfile(data);
      setRole(data.role ?? null);
    } catch (err) {
      clearAuth();
      setError(err instanceof Error ? err : new Error('Gagal memuat profil'));
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  // POST /api/v1/auth/login — response envelope unwrapped by axios interceptor
  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
        '/auth/login',
        { email, password }
      );
      localStorage.setItem(TOKEN_KEY, data.access_token);
      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login gagal') };
    }
  };

  const signOut = async () => {
    clearAuth();
  };

  // signUp is not supported — users are provisioned by admin only
  const signUp = async (..._args: unknown[]) => {
    return { data: null, error: new Error('Pendaftaran mandiri tidak diizinkan. Hubungi admin.') };
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, role, isLoading, error, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
