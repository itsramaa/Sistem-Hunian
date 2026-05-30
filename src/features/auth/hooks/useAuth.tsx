import { apiClient } from '@/lib/axios';
import {
  AppRole,
  AuthState,
  AuthTokens,
  AuthUser,
  MerchantProfile,
  UserProfile,
  VendorProfile,
} from '@/features/auth/types/auth';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: {
      full_name?: string;
      phone?: string;
      role?: AppRole;
      business_name?: string;
      merchant_code?: string;
    }
  ) => Promise<{ data: { user: AuthUser | null } | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (role: AppRole) => void;
  addRole: (role: AppRole, extra?: { business_name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem('sihuni_access_token', tokens.access_token);
  localStorage.setItem('sihuni_refresh_token', tokens.refresh_token);
}

function clearTokens() {
  localStorage.removeItem('sihuni_access_token');
  localStorage.removeItem('sihuni_refresh_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshProfile = useCallback(async () => {
    setIsProfileLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{
        user?: AuthUser;
        profile?: UserProfile;
        roles?: AppRole[];
        merchant?: MerchantProfile;
        vendor?: VendorProfile;
        // MeLocal flat shape
        id?: string;
        email?: string;
        role?: AppRole;
        full_name?: string;
        phone_number?: string;
      }>('/auth/me');

      // Support both nested { user, profile, roles } and flat { id, email, role } shapes
      const resolvedUser: AuthUser = data.user ?? {
        id: data.id!,
        email: data.email!,
        role: data.role ?? null,
      };
      const resolvedProfile: UserProfile | null = data.profile ?? (
        data.full_name || data.phone_number
          ? { full_name: data.full_name, phone: data.phone_number } as unknown as UserProfile
          : null
      );
      const userRoles: AppRole[] = data.roles ?? (resolvedUser.role ? [resolvedUser.role] : []);

      setUser(resolvedUser);
      setProfile(resolvedProfile);
      setRoles(userRoles);

      const primaryRole = userRoles[0] ?? null;
      setRole(primaryRole);
      setActiveRole((prev) => (prev && userRoles.includes(prev) ? prev : primaryRole));

      setMerchant(data.merchant ?? null);
      setVendor(data.vendor ?? null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'));
      // If 401, tokens are already cleared by the axios interceptor
      setUser(null);
      setProfile(null);
      setRole(null);
      setRoles([]);
      setActiveRole(null);
      setMerchant(null);
      setVendor(null);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // On mount: restore session from localStorage if token exists
  useEffect(() => {
    const token = localStorage.getItem('sihuni_access_token');
    if (token) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
        '/auth/login',
        { email, password }
      );

      storeTokens(data);
      setUser(data.user);

      const userRole = data.user.role ?? null;
      if (userRole) {
        setRole(userRole);
        setRoles([userRole]);
        setActiveRole(userRole);
      }

      // Fetch full profile after login
      await refreshProfile();

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: {
      full_name?: string;
      phone?: string;
      role?: AppRole;
      business_name?: string;
      merchant_code?: string;
    }
  ) => {
    try {
      const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
        '/auth/register',
        {
          email,
          password,
          full_name: metadata?.full_name,
          phone: metadata?.phone,
          role: metadata?.role,
          business_name: metadata?.business_name,
          merchant_code: metadata?.merchant_code,
        }
      );

      storeTokens(data);
      setUser(data.user);

      const userRole = data.user.role ?? null;
      if (userRole) {
        setRole(userRole);
        setRoles([userRole]);
        setActiveRole(userRole);
      }

      return { data: { user: data.user }, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Registration failed');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    clearTokens();
    setUser(null);
    setProfile(null);
    setRole(null);
    setRoles([]);
    setActiveRole(null);
    setMerchant(null);
    setVendor(null);
    setError(null);
  };

  const switchRole = (newRole: AppRole) => {
    if (roles.includes(newRole)) {
      setActiveRole(newRole);
      setRole(newRole);
    }
  };

  const addRole = async (newRole: AppRole, extra?: { business_name?: string }) => {
    if (!user) throw new Error('Not authenticated');
    if (roles.includes(newRole)) throw new Error('Role already exists');

    // TODO: /users/roles endpoint not yet in BE — gracefully throw informative error
    throw new Error('Adding roles is not yet supported. Please contact support.');
  };

  const contextIsLoading = isLoading || isProfileLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        roles,
        activeRole,
        merchant,
        vendor,
        isLoading: contextIsLoading,
        isProfileLoading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        switchRole,
        addRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
