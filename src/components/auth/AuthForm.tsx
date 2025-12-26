import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { 
  phoneSchema, 
  strongPasswordSchema, 
  loginPasswordSchema,
  fullNameSchema,
  emailSchema 
} from '@/lib/validations/auth';

const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

const signupSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  confirmPassword: z.string(),
  fullName: fullNameSchema,
  phone: phoneSchema,
  merchantCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export function AuthForm() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') as 'login' | 'signup' | null;
  const initialMerchantCode = searchParams.get('merchantCode') || searchParams.get('code') || '';
  const initialReferralCode = searchParams.get('ref') || sessionStorage.getItem('referral_code') || '';
  
  // If has merchantCode, user is a tenant signup
  const isTenantSignup = !!initialMerchantCode;
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(isTenantSignup ? 'signup' : (initialMode || 'login'));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [merchantCodeError, setMerchantCodeError] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{ name: string; role: string } | null>(null);
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Store referral code in session storage
  useEffect(() => {
    if (initialReferralCode) {
      sessionStorage.setItem('referral_code', initialReferralCode);
    }
  }, [initialReferralCode]);

  // Validate referral code and get referrer info
  useEffect(() => {
    const validateReferral = async () => {
      if (!initialReferralCode) return;
      
      try {
        const { data: referral } = await supabase
          .from('referrals')
          .select('referrer_user_id, referrer_role')
          .eq('referral_code', initialReferralCode.toUpperCase())
          .is('referee_user_id', null)
          .single();

        if (referral) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', referral.referrer_user_id)
            .single();

          setReferrerInfo({
            name: profile?.full_name || 'Pengguna SiHuni',
            role: referral.referrer_role,
          });
        }
      } catch {
        // Referral code not found or already used - silently handle
      }
    };

    validateReferral();
  }, [initialReferralCode]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      email: '', 
      password: '', 
      confirmPassword: '', 
      fullName: '',
      phone: '',
      merchantCode: initialMerchantCode.toUpperCase(),
    },
  });

  const passwordValue = signupForm.watch('password');

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login gagal',
        description: getAuthErrorMessage(error),
      });
      return;
    }

    toast({
      title: 'Selamat datang kembali!',
      description: 'Anda berhasil masuk.',
    });
  };

  const validateMerchantCode = async (code: string): Promise<string | null> => {
    if (!code) return null;
    
    // Normalize to uppercase
    const normalizedCode = code.toUpperCase().trim();
    
    // Validate format (6 chars alphanumeric)
    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setMerchantCodeError('Kode merchant harus 6 karakter alfanumerik');
      return null;
    }
    
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .eq('merchant_code', normalizedCode)
      .single();
    
    if (error || !data) {
      return null;
    }
    return data.id;
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setMerchantCodeError(null);

    // If has merchant code, validate it (tenant signup)
    let linkedMerchantId: string | null = null;
    if (isTenantSignup) {
      if (!data.merchantCode) {
        setMerchantCodeError('Kode merchant diperlukan untuk pendaftaran tenant');
        setIsLoading(false);
        return;
      }
      
      linkedMerchantId = await validateMerchantCode(data.merchantCode);
      if (!linkedMerchantId) {
        if (!merchantCodeError) {
          setMerchantCodeError('Kode merchant tidak valid. Silakan cek dengan pemilik properti Anda.');
        }
        setIsLoading(false);
        return;
      }
    }

    // For tenant signup (with merchantCode), assign role directly
    // For general signup (no merchantCode), redirect to onboarding
    const userRole = isTenantSignup ? 'tenant' : undefined;

    const { data: signUpData, error } = await signUp(data.email, data.password, {
      full_name: data.fullName,
      phone: data.phone || undefined,
      role: userRole,
      merchant_code: isTenantSignup ? data.merchantCode?.toUpperCase() : undefined,
    });

    // If tenant signup (with merchantCode), call auth-webhook to complete setup
    if (!error && signUpData?.user && isTenantSignup) {
      try {
        const { error: webhookError } = await supabase.functions.invoke('auth-webhook', {
          body: {
            user_id: signUpData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone || null,
            role: 'tenant',
            merchant_code: data.merchantCode?.toUpperCase(),
            referral_code: initialReferralCode?.toUpperCase() || undefined,
          },
        });
        if (webhookError) {
          // Log error for debugging but don't expose to user
        } else {
          sessionStorage.removeItem('referral_code');
        }
      } catch {
        // Auth webhook invocation error - silently handle
      }
      
      // Send notification to merchant
      if (linkedMerchantId) {
        try {
          const { data: merchantData } = await supabase
            .from('merchants')
            .select('user_id, business_name')
            .eq('id', linkedMerchantId)
            .single();
          
          if (merchantData) {
            const { data: merchantProfile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('user_id', merchantData.user_id)
              .single();
            
            if (merchantProfile?.email) {
              await supabase.functions.invoke('send-notification', {
                body: {
                  type: 'tenant_registration',
                  recipientEmail: merchantProfile.email,
                  recipientName: merchantProfile.full_name || merchantData.business_name,
                  data: {
                    tenantName: data.fullName,
                    tenantEmail: data.email,
                    tenantPhone: data.phone || null,
                    registeredAt: new Date().toLocaleString('id-ID', { 
                      dateStyle: 'full', 
                      timeStyle: 'short' 
                    }),
                    dashboardLink: `${window.location.origin}/merchant/tenants`,
                  },
                },
              });
            }
          }
        } catch {
          // Failed to send tenant registration notification - silently handle
        }
      }
    }
    
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Pendaftaran gagal',
        description: getAuthErrorMessage(error),
      });
      return;
    }

    toast({
      title: 'Akun berhasil dibuat!',
      description: isTenantSignup 
        ? 'Selamat datang di SiHuni. Anda telah terdaftar sebagai tenant.'
        : 'Silakan lengkapi profil Anda.',
    });

    // If NOT tenant signup (general signup), redirect to onboarding
    if (!isTenantSignup) {
      navigate('/onboarding', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Selamat Datang di SiHuni</CardTitle>
          <CardDescription>
            {isTenantSignup 
              ? 'Daftar sebagai tenant properti'
              : 'Platform Manajemen Properti Indonesia'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Referral Banner */}
          {referrerInfo && activeTab === 'signup' && (
            <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm text-center">
                <span className="font-medium text-primary">Diundang oleh {referrerInfo.name}</span>
                <br />
                <span className="text-muted-foreground">Anda akan mendapat bonus spesial!</span>
              </p>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="anda@contoh.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...loginForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-sm text-primary hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nama Lengkap</Label>
                  <Input
                    id="signup-name"
                    placeholder="John Doe"
                    autoComplete="name"
                    disabled={isLoading}
                    {...signupForm.register('fullName')}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="08123456789"
                    autoComplete="tel"
                    disabled={isLoading}
                    {...signupForm.register('phone')}
                  />
                  {signupForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.phone.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Opsional - untuk menerima notifikasi penting
                  </p>
                </div>

                {/* Merchant Code field - only show for tenant signup */}
                {isTenantSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-merchant-code">Kode Merchant *</Label>
                    <Input
                      id="signup-merchant-code"
                      placeholder="ABC123"
                      className="font-mono uppercase"
                      maxLength={6}
                      disabled={isLoading || !!initialMerchantCode}
                      {...signupForm.register('merchantCode')}
                      onChange={(e) => {
                        signupForm.setValue('merchantCode', e.target.value.toUpperCase());
                        setMerchantCodeError(null);
                      }}
                    />
                    {merchantCodeError && (
                      <p className="text-sm text-destructive">{merchantCodeError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Kode unik dari pemilik properti Anda (6 karakter)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="anda@contoh.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...signupForm.register('email')}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...signupForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                  <PasswordStrengthMeter password={passwordValue || ''} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Konfirmasi Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...signupForm.register('confirmPassword')}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isTenantSignup ? 'Daftar sebagai Tenant' : 'Daftar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
