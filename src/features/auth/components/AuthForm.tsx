import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/features/auth/utils/auth-errors';
import { referralService } from '@/features/referrals/services/referralService';
import { supabase } from '@/lib/integrations/supabase/client';
import { apiClient } from '@/lib/axios';
import { Button } from '@/shared/components/ui/button';
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
import { Building2, Eye, EyeOff, Fingerprint, Lock, Loader2, Mail, Phone, Shield, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// Floating orbs background component
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="gradient-orb gradient-orb-1 -top-20 -left-20" />
      <div className="gradient-orb gradient-orb-2 -bottom-32 -right-20" />
      <div className="gradient-orb gradient-orb-3 top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

// Brand panel for split-screen layout
function BrandPanel() {
  return (
    <div className="hidden md:flex relative flex-col items-center justify-center bg-gradient-to-br from-foreground via-primary to-secondary text-primary-foreground p-12 overflow-hidden">
      <FloatingOrbs />
      <div className="relative z-10 max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-accent/20 backdrop-blur-sm border border-accent/30 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-accent" />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-display font-bold tracking-tight text-primary-foreground">
            Kelola Properti<br />Lebih Cerdas
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Platform manajemen properti terpercaya di Indonesia
          </p>
        </div>

        {/* Social proof stats */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { value: '500+', label: 'Properti' },
            { value: '1000+', label: 'Tenant' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-accent">{stat.value}</p>
              <p className="text-xs text-primary-foreground/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-5 border border-primary-foreground/10">
          <p className="text-sm text-primary-foreground/80 italic leading-relaxed">
            "SiHuni mengubah cara kami mengelola 50+ unit kost. Semua jadi lebih efisien dan transparan."
          </p>
          <p className="text-xs text-primary-foreground/50 mt-3">— Ibu Ratna, Pemilik Kost di Jakarta</p>
        </div>
      </div>
    </div>
  );
}

export function AuthForm() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') as 'login' | 'signup' | null;
  const initialMerchantCode = searchParams.get('merchantCode') || searchParams.get('code') || '';
  const initialReferralCode = searchParams.get('ref') || sessionStorage.getItem('referral_code') || '';
  
  const isTenantSignup = !!initialMerchantCode;
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(isTenantSignup ? 'signup' : (initialMode || 'login'));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('sihuni_remember_me') === 'true';
  });
  const [merchantCodeError, setMerchantCodeError] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<{ name: string; role: string } | null>(null);
  const [supportsBiometric, setSupportsBiometric] = useState(false);
  const [errorAnnouncement, setErrorAnnouncement] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
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
  const emailValue = signupForm.watch('email');

  // Email typo detection
  const emailSuggestion = useMemo(() => {
    if (!emailValue) return null;
    const typoMap: Record<string, string> = {
      '@gmial.com': '@gmail.com',
      '@gmal.com': '@gmail.com',
      '@gmaill.com': '@gmail.com',
      '@gamil.com': '@gmail.com',
      '@yaho.com': '@yahoo.com',
      '@yahooo.com': '@yahoo.com',
      '@yhaoo.com': '@yahoo.com',
      '@hotmal.com': '@hotmail.com',
      '@hotmial.com': '@hotmail.com',
      '@outlok.com': '@outlook.com',
    };
    const atIndex = emailValue.indexOf('@');
    if (atIndex === -1) return null;
    const domain = emailValue.substring(atIndex).toLowerCase();
    if (typoMap[domain]) {
      return emailValue.substring(0, atIndex) + typoMap[domain];
    }
    return null;
  }, [emailValue]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutRemaining(0);
        setFailedAttempts(0);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Announce errors for screen readers
  const announceError = (message: string) => {
    setErrorAnnouncement(message);
    setTimeout(() => setErrorAnnouncement(''), 1000);
  };

  const handleLogin = async (data: LoginFormData) => {
    // Rate limiting check
    if (lockoutUntil && Date.now() < lockoutUntil) {
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      // Lock out after 5 failed attempts for 15 minutes (SR-104)
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + 900000; // 15 minutes
        setLockoutUntil(lockoutTime);
        setLockoutRemaining(900);
      }

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

    setFailedAttempts(0);
    setLockoutUntil(null);

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
        const { error: webhookError } = await apiClient.post('/webhooks/auth', {
            user_id: signUpData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone || null,
            role: 'tenant',
            merchant_code: data.merchantCode?.toUpperCase(),
            referral_code: initialReferralCode?.toUpperCase() || undefined,
          }).then(() => ({ error: null })).catch((err: any) => ({ error: err }));
        if (!webhookError) {
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
              await apiClient.post('/notifications', {
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative">
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
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {errorAnnouncement}
      </div>

      {/* Left: Brand Panel (desktop only) */}
      <BrandPanel />

      {/* Right: Form Panel */}
      <div className="relative flex items-center justify-center px-4 py-8 overflow-hidden bg-gradient-to-br from-background to-muted">
        <FloatingOrbs />

        {/* Mobile brand header */}
        <div className="absolute top-6 left-0 right-0 flex flex-col items-center md:hidden z-10">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-sm font-display font-semibold text-foreground mt-2">SiHuni</p>
        </div>

        <div className="relative z-10 w-full max-w-md w-[95vw] sm:w-full mt-16 md:mt-0">
          <div className="glass-card p-6 sm:p-8 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="hidden md:flex mx-auto w-12 h-12 rounded-xl gradient-primary items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Selamat Datang
              </h2>
              <p className="text-sm text-muted-foreground">
                {isTenantSignup 
                  ? 'Daftar sebagai tenant properti'
                  : 'Platform Manajemen Properti Indonesia'}
              </p>
            </div>

            {/* Referral Banner */}
            {referrerInfo && activeTab === 'signup' && (
              <div className="mb-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-sm text-center">
                  <span className="font-medium text-primary">Diundang oleh {referrerInfo.name}</span>
                  <br />
                  <span className="text-muted-foreground">Anda akan mendapat bonus spesial!</span>
                </p>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              {/* Pill-style tabs */}
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 rounded-full p-1 h-auto">
                <TabsTrigger 
                  value="login" 
                  className="text-sm sm:text-base rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300 py-2.5"
                >
                  Masuk
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-sm sm:text-base rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300 py-2.5"
                >
                  Daftar
                </TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" key={`login-${activeTab}`} className="space-y-4 animate-fade-in">
                <form 
                  id="login-form" 
                  onSubmit={loginForm.handleSubmit(handleLogin)} 
                  className="space-y-4"
                >
                  {supportsBiometric && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={handleBiometricLogin}
                    >
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Login Cepat
                    </Button>
                  )}

                  {/* Email with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        enterKeyHint="next"
                        placeholder="anda@contoh.com"
                        autoComplete="email"
                        disabled={isLoading}
                        className="pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                        aria-describedby={loginForm.formState.errors.email ? 'login-email-error' : undefined}
                        aria-invalid={!!loginForm.formState.errors.email}
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p id="login-email-error" className="text-sm text-destructive" role="alert">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        inputMode="text"
                        enterKeyHint="done"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLoading}
                        className="pl-10 pr-12 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
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
                  
                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      aria-label="Ingat saya"
                    />
                    <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                      Ingat saya
                    </Label>
                  </div>

                  {/* Rate limit warning */}
                  {lockoutRemaining > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm" role="alert">
                      <Shield className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-destructive">
                        Terlalu banyak percobaan. Coba lagi dalam <strong>{lockoutRemaining} detik</strong>
                      </p>
                    </div>
                  )}

                  {/* Gradient CTA */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl gradient-cta text-primary-foreground hover:shadow-[0_4px_20px_rgba(139,111,71,0.4)] active:scale-[0.98] transition-all duration-200" 
                    disabled={isLoading || lockoutRemaining > 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      'Masuk'
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate('/reset-password')}
                      className="text-sm text-primary hover:underline"
                    >
                      Lupa password?
                    </button>
                    <p className="text-sm text-muted-foreground">
                      Belum punya akun?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="text-primary hover:underline font-medium"
                      >
                        Daftar sekarang
                      </button>
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup" key={`signup-${activeTab}`} className="space-y-4 animate-fade-in">
                <form 
                  id="signup-form"
                  onSubmit={signupForm.handleSubmit(handleSignup)} 
                  className="space-y-4"
                >
                  {/* Name with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        placeholder="Budi Santoso"
                        autoComplete="name"
                        enterKeyHint="next"
                        disabled={isLoading}
                        className="pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                        aria-required="true"
                        aria-describedby={signupForm.formState.errors.fullName ? 'signup-name-error' : undefined}
                        aria-invalid={!!signupForm.formState.errors.fullName}
                        {...signupForm.register('fullName')}
                      />
                    </div>
                    {signupForm.formState.errors.fullName && (
                      <p id="signup-name-error" className="text-sm text-destructive" role="alert">
                        {signupForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Email with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        inputMode="email"
                        enterKeyHint="next"
                        placeholder="anda@contoh.com"
                        autoComplete="email"
                        disabled={isLoading}
                        className="pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                        aria-required="true"
                        aria-describedby={signupForm.formState.errors.email ? 'signup-email-error' : emailSuggestion ? 'email-suggestion' : undefined}
                        aria-invalid={!!signupForm.formState.errors.email}
                        {...signupForm.register('email')}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p id="signup-email-error" className="text-sm text-destructive" role="alert">
                        {signupForm.formState.errors.email.message}
                      </p>
                    )}
                    {emailSuggestion && !signupForm.formState.errors.email && (
                      <p id="email-suggestion" className="text-sm text-warning">
                        Mungkin maksud Anda{' '}
                        <button
                          type="button"
                          className="font-medium underline hover:text-warning/80"
                          onClick={() => signupForm.setValue('email', emailSuggestion)}
                        >
                          {emailSuggestion}
                        </button>
                        ?
                      </p>
                    )}
                  </div>

                  {/* Phone with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Nomor Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        inputMode="tel"
                        enterKeyHint="next"
                        placeholder="08123456789"
                        autoComplete="tel-national"
                        disabled={isLoading}
                        className="pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                        aria-describedby="signup-phone-hint"
                        {...signupForm.register('phone')}
                      />
                    </div>
                    {signupForm.formState.errors.phone && (
                      <p className="text-sm text-destructive" role="alert">
                        {signupForm.formState.errors.phone.message}
                      </p>
                    )}
                    <p id="signup-phone-hint" className="text-xs text-muted-foreground">
                      Opsional - untuk menerima notifikasi penting
                    </p>
                  </div>

                  {/* Merchant Code - tenant signup only */}
                  {isTenantSignup && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-merchant-code">Kode Merchant *</Label>
                      <Input
                        id="signup-merchant-code"
                        placeholder="ABC123"
                        className="font-mono uppercase rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                        maxLength={6}
                        enterKeyHint="next"
                        disabled={isLoading || !!initialMerchantCode}
                        aria-required="true"
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

                  {/* Password with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        inputMode="text"
                        enterKeyHint="next"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="pl-10 pr-12 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
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

                  {/* Confirm Password with icon */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        inputMode="text"
                        enterKeyHint="done"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                        aria-describedby={signupForm.formState.errors.confirmPassword ? 'signup-confirm-error' : undefined}
                        aria-invalid={!!signupForm.formState.errors.confirmPassword}
                        {...signupForm.register('confirmPassword')}
                      />
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p id="signup-confirm-error" className="text-sm text-destructive" role="alert">
                        {signupForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Gradient CTA */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl gradient-cta text-primary-foreground hover:shadow-[0_4px_20px_rgba(139,111,71,0.4)] active:scale-[0.98] transition-all duration-200" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      isTenantSignup ? 'Daftar sebagai Tenant' : 'Mulai Sekarang'
                    )}
                  </Button>

                  {/* Trust element */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                    <Lock className="h-3 w-3" />
                    <span>Data Anda aman dan terenkripsi</span>
                  </div>

                  {/* Cross-link to login */}
                  <p className="text-sm text-muted-foreground text-center">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-primary hover:underline font-medium"
                    >
                      Masuk
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
