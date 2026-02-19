import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/features/auth/utils/auth-errors';
import { referralService } from '@/features/referrals/services/referralService';
import { supabase } from '@/lib/integrations/supabase/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { triggerHaptic } from '@/shared/utils/haptic';
import {
  emailSchema,
  fullNameSchema,
  loginPasswordSchema,
  phoneSchema,
  strongPasswordSchema
} from '@/shared/utils/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Eye, EyeOff, Fingerprint, Loader2, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

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
  const [rememberMe, setRememberMe] = useState(() => {
    // Load remember me preference from localStorage
    return localStorage.getItem('sihuni_remember_me') === 'true';
  });
  const [merchantCodeError, setMerchantCodeError] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{ name: string; role: string } | null>(null);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [errorAnnouncement, setErrorAnnouncement] = useState('');
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Check biometric support
  useEffect(() => {
    const checkBiometric = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setSupportsBiometric(available && rememberMe && !!localStorage.getItem('sihuni_last_email'));
        } catch {
          setSupportsBiometric(false);
        }
      }
    };
    checkBiometric();
  }, [rememberMe]);

  // React to URL mode changes
  useEffect(() => {
    if (initialMode && !isTenantSignup) {
      setActiveTab(initialMode);
    }
  }, [initialMode, isTenantSignup]);

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
      
      const info = await referralService.validateReferralCode(initialReferralCode);
      if (info) {
        setReferrerInfo(info);
      }
    };

    validateReferral();
  }, [initialReferralCode]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { 
      email: localStorage.getItem('sihuni_last_email') || '', 
      password: '' 
    },
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

  // Announce errors for screen readers
  const announceError = (message: string) => {
    setErrorAnnouncement(message);
    setTimeout(() => setErrorAnnouncement(''), 1000);
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      const errorMessage = getAuthErrorMessage(error);
      announceError(errorMessage);
      triggerHaptic('error');
      toast({
        variant: 'destructive',
        title: 'Login gagal',
        description: errorMessage,
      });
      return;
    }

    // Save remember me preference
    localStorage.setItem('sihuni_remember_me', rememberMe.toString());
    if (rememberMe) {
      localStorage.setItem('sihuni_last_email', data.email);
    } else {
      localStorage.removeItem('sihuni_last_email');
    }

    triggerHaptic('success');
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
      const errorMessage = getAuthErrorMessage(error);
      announceError(errorMessage);
      triggerHaptic('error');
      toast({
        variant: 'destructive',
        title: 'Pendaftaran gagal',
        description: errorMessage,
      });
      return;
    }

    triggerHaptic('success');
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

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem('sihuni_last_email');
    if (!savedEmail) {
      toast({
        variant: 'destructive',
        title: 'Biometrik tidak tersedia',
        description: 'Silakan login dengan email dan password terlebih dahulu.',
      });
      return;
    }

    // For now, just pre-fill the email and focus on password
    loginForm.setValue('email', savedEmail);
    const passwordInput = document.getElementById('login-password');
    if (passwordInput) {
      passwordInput.focus();
    }
    
    triggerHaptic('light');
    toast({
      title: 'Email terisi otomatis',
      description: 'Silakan masukkan password Anda.',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      {/* Skip links for accessibility */}
      <nav className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
        <a 
          href="#login-form" 
          className="bg-background px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Langsung ke form login
        </a>
      </nav>

      {/* Live region for error announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {errorAnnouncement}
      </div>

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
              <form 
                id="login-form" 
                onSubmit={loginForm.handleSubmit(handleLogin)} 
                className="space-y-4"
              >
                {/* Biometric login option for returning users */}
                {supportsBiometric && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBiometricLogin}
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Login Cepat
                  </Button>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    enterKeyHint="next"
                    placeholder="anda@contoh.com"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-describedby={loginForm.formState.errors.email ? 'login-email-error' : undefined}
                    aria-invalid={!!loginForm.formState.errors.email}
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p id="login-email-error" className="text-sm text-destructive" role="alert">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      inputMode="text"
                      enterKeyHint="done"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      aria-describedby={loginForm.formState.errors.password ? 'login-password-error' : undefined}
                      aria-invalid={!!loginForm.formState.errors.password}
                      {...loginForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p id="login-password-error" className="text-sm text-destructive" role="alert">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    aria-label="Ingat saya"
                  />
                  <Label 
                    htmlFor="remember-me" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Ingat saya
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    'Masuk'
                  )}
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
              <form 
                id="signup-form"
                onSubmit={signupForm.handleSubmit(handleSignup)} 
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nama Lengkap</Label>
                  <Input
                    id="signup-name"
                    placeholder="John Doe"
                    autoComplete="name"
                    enterKeyHint="next"
                    disabled={isLoading}
                    aria-describedby={signupForm.formState.errors.fullName ? 'signup-name-error' : undefined}
                    aria-invalid={!!signupForm.formState.errors.fullName}
                    {...signupForm.register('fullName')}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p id="signup-name-error" className="text-sm text-destructive" role="alert">
                      {signupForm.formState.errors.fullName.message}
                    </p>
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
                    inputMode="tel"
                    enterKeyHint="next"
                    placeholder="08123456789"
                    autoComplete="tel"
                    disabled={isLoading}
                    aria-describedby="signup-phone-hint"
                    {...signupForm.register('phone')}
                  />
                  {signupForm.formState.errors.phone && (
                    <p className="text-sm text-destructive" role="alert">
                      {signupForm.formState.errors.phone.message}
                    </p>
                  )}
                  <p id="signup-phone-hint" className="text-xs text-muted-foreground">
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
                      enterKeyHint="next"
                      disabled={isLoading || !!initialMerchantCode}
                      aria-describedby="merchant-code-hint"
                      {...signupForm.register('merchantCode')}
                      onChange={(e) => {
                        signupForm.setValue('merchantCode', e.target.value.toUpperCase());
                        setMerchantCodeError(null);
                      }}
                    />
                    {merchantCodeError && (
                      <p className="text-sm text-destructive" role="alert">{merchantCodeError}</p>
                    )}
                    <p id="merchant-code-hint" className="text-xs text-muted-foreground">
                      Kode unik dari pemilik properti Anda (6 karakter)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    inputMode="email"
                    enterKeyHint="next"
                    placeholder="anda@contoh.com"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-describedby={signupForm.formState.errors.email ? 'signup-email-error' : undefined}
                    aria-invalid={!!signupForm.formState.errors.email}
                    {...signupForm.register('email')}
                  />
                  {signupForm.formState.errors.email && (
                    <p id="signup-email-error" className="text-sm text-destructive" role="alert">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      inputMode="text"
                      enterKeyHint="next"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-describedby="password-requirements signup-password-error"
                      aria-invalid={!!signupForm.formState.errors.password}
                      {...signupForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p id="signup-password-error" className="text-sm text-destructive" role="alert">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                  <div id="password-requirements">
                    <PasswordStrengthMeter password={passwordValue || ''} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Konfirmasi Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    inputMode="text"
                    enterKeyHint="done"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isLoading}
                    aria-describedby={signupForm.formState.errors.confirmPassword ? 'signup-confirm-error' : undefined}
                    aria-invalid={!!signupForm.formState.errors.confirmPassword}
                    {...signupForm.register('confirmPassword')}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p id="signup-confirm-error" className="text-sm text-destructive" role="alert">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    isTenantSignup ? 'Daftar sebagai Tenant' : 'Daftar'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
