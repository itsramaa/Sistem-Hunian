import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthErrorMessage } from '@/features/auth/utils/auth-errors';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useToast } from '@/shared/hooks/use-toast';
import { triggerHaptic } from '@/shared/utils/haptic';
import { emailSchema, loginPasswordSchema } from '@/shared/utils/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Eye, EyeOff, Lock, Loader2, Mail, Home, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Floating orbs background ─────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="gradient-orb gradient-orb-1 -top-20 -left-20" />
      <div className="gradient-orb gradient-orb-2 -bottom-32 -right-20" />
      <div className="gradient-orb gradient-orb-3 top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

// ─── Desktop brand panel (≥1024px only) ──────────────────────────────────────
function BrandPanel() {
  const features = [
    { icon: Home, label: 'Multi-Properti', desc: 'Kelola semua kos dalam satu sistem' },
    { icon: KeyRound, label: 'Kontrol Penuh', desc: 'RBAC per role — operator, manajer, viewer' },
    { icon: Building2, label: '42 Kamar', desc: 'Dirancang untuk kos kawasan industri MM2100' },
  ];

  return (
    <div className="hidden lg:flex relative flex-col justify-center bg-gradient-to-br from-foreground via-primary to-secondary text-primary-foreground p-12 overflow-hidden">
      <FloatingOrbs />
      <div className="relative z-10 max-w-sm space-y-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 backdrop-blur-sm border border-accent/30 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">SiHuni</p>
            <p className="text-xs text-primary-foreground/60">Sistem Manajemen Kos</p>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight leading-snug">
            Kelola Properti<br />Lebih Teratur
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Platform manajemen kos multi-properti untuk pengelola profesional.
          </p>
        </div>
        <ul className="space-y-4">
          {features.map((f) => (
            <li key={f.label} className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-primary-foreground/60">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── AuthForm ─────────────────────────────────────────────────────────────────
// Breakpoints:
//   Mobile  <640px  : full-screen, stacked logo top-center, narrow card
//   Tablet  640-1023px: full-screen, horizontal logo top-left, wider card (max-w-md)
//   Desktop ≥1024px : half-screen (right half), no logo (brand panel handles it)
export function AuthForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('sihuni_remember_me') === 'true'
  );
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [errorAnnouncement, setErrorAnnouncement] = useState('');

  const { toast } = useToast();
  const { signIn } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('sihuni_last_email') || '',
      password: '',
    },
  });

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

  const announceError = (msg: string) => {
    setErrorAnnouncement(msg);
    setTimeout(() => setErrorAnnouncement(''), 1000);
  };

  const handleLogin = async (data: LoginFormData) => {
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + 900_000;
        setLockoutUntil(lockoutTime);
        setLockoutRemaining(900);
      }
      const msg = getAuthErrorMessage(error);
      announceError(msg);
      triggerHaptic('error');
      toast({ variant: 'destructive', title: 'Login gagal', description: msg });
      return;
    }

    setFailedAttempts(0);
    setLockoutUntil(null);
    localStorage.setItem('sihuni_remember_me', rememberMe.toString());
    if (rememberMe) {
      localStorage.setItem('sihuni_last_email', data.email);
    } else {
      localStorage.removeItem('sihuni_last_email');
    }
    triggerHaptic('success');
    toast({ title: 'Selamat datang!', description: 'Anda berhasil masuk.' });
  };

  const isLocked = !!lockoutUntil && Date.now() < lockoutUntil;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Skip link */}
      <nav className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50">
        <a href="#login-form" className="bg-background px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-ring">
          Langsung ke form login
        </a>
      </nav>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{errorAnnouncement}</div>

      {/* Left: brand panel (desktop only) */}
      <BrandPanel />

      {/* Right: form panel */}
      <div className="relative flex flex-col min-h-screen lg:min-h-0 bg-gradient-to-br from-background to-muted overflow-hidden">
        <FloatingOrbs />

        {/* ── Top bar: hidden on desktop (brand panel has logo) ─────────────── */}
        <header className="relative z-10 flex items-center justify-between px-5 pt-6 pb-2 lg:hidden">
          {/* Mobile: centered logo — use absolute */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center sm:hidden">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground mt-1">SiHuni</p>
          </div>

          {/* Tablet: horizontal logo left-aligned */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">SiHuni</p>
              <p className="text-xs text-muted-foreground leading-tight">Sistem Manajemen Kos</p>
            </div>
          </div>

          {/* Tablet: tagline right side */}
          <p className="hidden sm:block text-xs text-muted-foreground">
            Platform manajemen kos profesional
          </p>
        </header>

        {/* ── Form area ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-10 lg:px-8">
          {/*
            Mobile  : max-w-sm, mt-8 (room for logo above)
            Tablet  : max-w-md, mt-0 (header handles logo)
            Desktop : max-w-sm, mt-0 (no header)
          */}
          <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-sm mt-6 sm:mt-0">
            <div className="glass-card p-6 sm:p-8 lg:p-8 space-y-6">
              {/* Card header */}
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-foreground">Masuk</h2>
                <p className="text-sm text-muted-foreground">
                  Gunakan akun yang diberikan oleh pengelola.
                </p>
              </div>

              {/* Lockout alert */}
              {isLocked && (
                <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    Terlalu banyak percobaan. Coba lagi dalam{' '}
                    <strong>{Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}</strong>.
                  </span>
                </div>
              )}

              {/* Form */}
              <form id="login-form" onSubmit={form.handleSubmit(handleLogin)} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      enterKeyHint="next"
                      placeholder="anda@contoh.com"
                      autoComplete="email"
                      disabled={isLoading || isLocked}
                      className="pl-10 rounded-xl h-12 border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary text-base"
                      aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                      aria-invalid={!!form.formState.errors.email}
                      {...form.register('email')}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      enterKeyHint="done"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading || isLocked}
                      className="pl-10 pr-12 rounded-xl h-12 border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary text-base"
                      aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
                      aria-invalid={!!form.formState.errors.password}
                      {...form.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p id="password-error" className="text-sm text-destructive" role="alert">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center space-x-2.5 pt-1">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                    aria-label="Ingat saya di perangkat ini"
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer text-muted-foreground">
                    Ingat saya di perangkat ini
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl gradient-cta text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98] transition-all mt-2"
                  disabled={isLoading || isLocked}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Belum punya akun?{' '}
                <span className="text-foreground font-medium">
                  Hubungi pengelola properti Anda.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
