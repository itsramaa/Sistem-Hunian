import { AppRole, AuthState, MerchantProfile, UserProfile, VendorProfile } from '@/features/auth/types/auth';
import { supabase } from '@/lib/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string; role?: AppRole; business_name?: string; merchant_code?: string }) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchRole: (role: AppRole) => void;
  addRole: (role: AppRole, extra?: { business_name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    setIsProfileLoading(true);
    setError(null);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch ALL roles (multi-role support)
      const { data: rolesData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (roleError) {
        console.error('Error fetching roles:', roleError);
      } else if (rolesData && rolesData.length > 0) {
        const userRoles = rolesData.map(r => r.role as AppRole);
        setRoles(userRoles);
        
        // Primary role is the first one (or previously active)
        const primaryRole = userRoles[0];
        setRole(primaryRole);
        setActiveRole(prev => prev && userRoles.includes(prev) ? prev : primaryRole);
        
        // Fetch merchant data if user has merchant role
        if (userRoles.includes('merchant')) {
          const { data: merchantData } = await supabase
            .from('merchants')
            .select(`
              *,
              merchant_subscriptions(
                tier_id,
                status,
                subscription_tiers(name)
              )
            `)
            .eq('user_id', userId)
            .maybeSingle();
          if (merchantData) setMerchant(merchantData as unknown as MerchantProfile);
        }
        
        // Fetch vendor data if user has vendor role
        if (userRoles.includes('vendor')) {
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          if (vendorData) setVendor(vendorData as VendorProfile);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setIsProfileLoading(true);
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setRoles([]);
          setActiveRole(null);
          setMerchant(null);
          setVendor(null);
        }
        
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; phone?: string; role?: AppRole; business_name?: string; merchant_code?: string }
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: metadata?.full_name || '',
          phone: metadata?.phone || '',
          role: metadata?.role || 'merchant',
          business_name: metadata?.business_name || '',
          merchant_code: metadata?.merchant_code || '',
        },
      },
    });
    return { data, error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setRoles([]);
    setActiveRole(null);
    setMerchant(null);
    setVendor(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
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

    // Insert new role
    const { error: roleErr } = await supabase.from('user_roles').insert({ user_id: user.id, role: newRole });
    if (roleErr) throw roleErr;

    // Create corresponding profile
    if (newRole === 'merchant') {
      await supabase.from('merchants').insert({
        user_id: user.id,
        business_name: extra?.business_name || 'My Business',
      });
    } else if (newRole === 'vendor') {
      await supabase.from('vendors').insert({
        user_id: user.id,
        business_name: extra?.business_name || 'My Vendor',
        contact_email: profile?.email || user.email || '',
      });
    }

    await fetchUserData(user.id);
  };

  const contextIsLoading = isLoading || isProfileLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        roles,
        activeRole,
        merchant,
        vendor,
        isLoading: contextIsLoading,
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
