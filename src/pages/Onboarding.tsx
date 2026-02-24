import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Wrench, Loader2, ArrowLeft, Check, Clock } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/integrations/supabase/client';
import { cn } from '@/shared/utils/utils';
import { businessNameSchema } from '@/shared/utils/validations/auth';
import { getAuthErrorMessage } from '@/features/auth/utils/auth-errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

type SelectableRole = 'merchant' | 'vendor';

const onboardingSchema = z.object({
  businessName: businessNameSchema,
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const roleOptions: { value: SelectableRole; label: string; icon: typeof Building2; description: string; emoji: string }[] = [
    { 
      value: 'merchant', 
      label: 'Pemilik Properti', 
      icon: Building2, 
      description: 'Kelola properti, penyewa, tagihan, dan laporan dalam satu platform',
      emoji: '🏠',
    },
    { 
      value: 'vendor', 
      label: 'Vendor Jasa', 
      icon: Wrench, 
      description: 'Terima pesanan jasa dari pemilik properti dan kelola penghasilan',
      emoji: '🔧',
    },
  ];

// Floating orbs background
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="gradient-orb gradient-orb-1 -top-20 -left-20" />
      <div className="gradient-orb gradient-orb-2 -bottom-32 -right-20" />
      <div className="gradient-orb gradient-orb-3 top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

// Modern step indicator with connected dots
function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8" role="navigation" aria-label="Langkah onboarding">
      {/* Step 1 dot */}
      <div
        className={cn(
          'w-3 h-3 rounded-full transition-all duration-300',
          currentStep >= 1
            ? 'bg-primary shadow-[0_0_8px_rgba(139,111,71,0.5)]'
            : 'bg-muted'
        )}
        aria-current={currentStep === 1 ? 'step' : undefined}
        aria-label="Langkah 1 dari 2: Pilih Role"
      />
      {/* Connector */}
      <div
        className={cn(
          'h-0.5 w-10 sm:w-16 rounded-full transition-all duration-500',
          currentStep > 1
            ? 'bg-primary'
            : 'bg-gradient-to-r from-primary to-muted'
        )}
        aria-hidden="true"
      />
      {/* Step 2 dot */}
      <div
        className={cn(
          'w-3 h-3 rounded-full transition-all duration-300',
          currentStep >= 2
            ? 'bg-primary shadow-[0_0_8px_rgba(139,111,71,0.5)]'
            : 'bg-muted'
        )}
        aria-current={currentStep === 2 ? 'step' : undefined}
        aria-label="Langkah 2 dari 2: Info Bisnis"
      />
    </div>
  );
}

// Brand panel for split-screen
function BrandPanel() {
  return (
    <div className="hidden md:flex relative flex-col items-center justify-center bg-gradient-to-br from-foreground via-primary to-secondary text-primary-foreground p-12 overflow-hidden">
      <FloatingOrbs />
      <div className="relative z-10 max-w-md text-center space-y-8">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-accent/20 backdrop-blur-sm border border-accent/30 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-accent" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-display font-bold tracking-tight text-primary-foreground">
            Satu Langkah Lagi
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Lengkapi profil untuk mulai mengelola properti Anda
          </p>
        </div>
        <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-5 border border-primary-foreground/10">
          <p className="text-sm text-primary-foreground/80 italic leading-relaxed">
            "Setup cepat, langsung bisa dipakai. Sangat memudahkan pengelolaan properti saya."
          </p>
          <p className="text-xs text-primary-foreground/50 mt-3">— Pak Ahmad, 30+ unit kost</p>
        </div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, isLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('merchant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const referralCode = searchParams.get('ref') || sessionStorage.getItem('referral_code') || '';

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { businessName: '' },
  });

  const businessNameValue = form.watch('businessName');

  const [fullName, setFullName] = useState('');
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) setFullName(data.full_name);
        });
    }
  }, [user]);

  // Redirect if already has role (but only after initial load)
  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'merchant') {
        navigate('/merchant', { replace: true });
      } else if (role === 'vendor') {
        navigate('/vendor', { replace: true });
      } else if (role === 'tenant') {
        navigate('/tenant', { replace: true });
      }
    } else if (!isLoading) {
      setHasCheckedRole(true);
    }
  }, [user, role, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const checkExistingRole = async () => {
      if (!user || role) return;
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      if (existingRole) {
        await refreshProfile();
      }
    };
    if (hasCheckedRole && user && !role) {
      checkExistingRole();
    }
  }, [hasCheckedRole, user, role, refreshProfile]);

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      navigate('/auth', { replace: true });
    }
  };

  const handleRoleSelect = (role: SelectableRole) => {
    setSelectedRole(role);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handleFormSubmit = (data: OnboardingFormData) => {
    setShowConfirmDialog(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    const data = form.getValues();
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Anda harus masuk terlebih dahulu',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (existingRole) {
        toast({
          title: 'Akun sudah terdaftar',
          description: 'Anda sudah memiliki akun. Mengarahkan ke dashboard...',
        });
        await refreshProfile();
        navigate(selectedRole === 'merchant' ? '/merchant' : '/vendor', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', user.id)
        .single();

      const { error: webhookError } = await supabase.functions.invoke('auth-webhook', {
        body: {
          user_id: user.id,
          email: profile?.email || user.email,
          full_name: profile?.full_name || '',
          phone: profile?.phone || null,
          role: selectedRole,
          business_name: data.businessName,
          referral_code: referralCode?.toUpperCase() || undefined,
        },
      });

      if (webhookError) {
        throw webhookError;
      }

      sessionStorage.removeItem('referral_code');
      await refreshProfile();

      toast({
        title: '🎉 Selamat datang!',
        description: `Akun ${selectedRole === 'merchant' ? 'Pemilik Properti' : 'Vendor'} Anda berhasil dibuat.`,
      });

      navigate(selectedRole === 'merchant' ? '/merchant' : '/vendor', { replace: true });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal membuat akun',
        description: getAuthErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !hasCheckedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative">
      {/* Left: Brand Panel (desktop) */}
      <BrandPanel />

      {/* Right: Form Panel */}
      <div className="relative flex items-center justify-center px-4 py-8 overflow-hidden bg-muted/30">
        <FloatingOrbs />

        {/* Mobile brand header */}
        <div className="absolute top-6 left-0 right-0 flex flex-col items-center md:hidden z-10">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-sm font-display font-semibold text-foreground mt-2">SiHuni</p>
        </div>

        <div className="relative z-10 w-full max-w-md w-[95vw] sm:w-full mt-16 md:mt-0">
          {/* Step indicator */}
          <StepIndicator currentStep={currentStep} />

          <div className="glass-card p-6 sm:p-8 animate-fade-in">
            {/* Header */}
            <div className="space-y-2 mb-6">
              {/* Back button */}
              <div className="flex justify-start -mt-1 -ml-2 mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="rounded-xl"
                  aria-label="Kembali ke langkah sebelumnya"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Kembali
                </Button>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {currentStep === 1 
                    ? (fullName ? `Hai, ${fullName.split(' ')[0]}! 👋` : 'Pilih Jenis Akun')
                    : 'Lengkapi Profil Anda'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 1 
                    ? 'Pilih jenis akun yang sesuai dengan kebutuhan Anda'
                    : 'Lengkapi informasi bisnis Anda'}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Memakan waktu kurang dari 30 detik</span>
                </div>
              </div>
            </div>

            {currentStep === 1 ? (
              /* Step 1: Role Selection */
              <div className="space-y-6" key="step-1">
                <div className="space-y-3">
                  <Label id="role-selection-label" className="text-sm font-medium">Saya adalah...</Label>
                  <div 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3" 
                    role="radiogroup" 
                    aria-labelledby="role-selection-label"
                  >
                    {roleOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selectedRole === option.value}
                        tabIndex={selectedRole === option.value ? 0 : -1}
                        onClick={() => handleRoleSelect(option.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            const nextIndex = (index + 1) % roleOptions.length;
                            handleRoleSelect(roleOptions[nextIndex].value);
                          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prevIndex = (index - 1 + roleOptions.length) % roleOptions.length;
                            handleRoleSelect(roleOptions[prevIndex].value);
                          }
                        }}
                        className={cn(
                          'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1',
                          selectedRole === option.value
                            ? 'border-primary bg-primary/10 shadow-[0_0_0_2px_hsl(var(--primary))]'
                            : 'border-border/60 hover:border-primary/50 bg-background/60'
                        )}
                        aria-label={`${option.label}: ${option.description}`}
                      >
                        <span className="text-4xl" aria-hidden="true">{option.emoji}</span>
                        <option.icon 
                          className={cn(
                            'h-6 w-6',
                            selectedRole === option.value ? 'text-primary' : 'text-muted-foreground'
                          )} 
                          aria-hidden="true"
                        />
                        <span className={cn(
                          'font-semibold',
                          selectedRole === option.value ? 'text-primary' : 'text-foreground'
                        )}>
                          {option.label}
                        </span>
                        <span className={cn(
                          'text-xs text-center leading-relaxed',
                          selectedRole === option.value ? 'text-primary/80' : 'text-muted-foreground'
                        )}>
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  type="button" 
                  className="w-full h-12 rounded-xl gradient-cta text-primary-foreground hover:shadow-[0_4px_20px_rgba(139,111,71,0.4)] active:scale-[0.98] transition-all duration-200" 
                  onClick={handleNextStep}
                >
                  Lanjutkan
                </Button>
              </div>
            ) : (
              /* Step 2: Business Information */
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 animate-fade-in" key="step-2">
                <div className="space-y-2">
                  <Label htmlFor="business-name">
                    {selectedRole === 'merchant' ? 'Nama Properti / Perusahaan' : 'Nama Bisnis'}
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-name"
                      placeholder={selectedRole === 'merchant' ? 'Contoh: Kost Melati, PT Graha Indah' : 'Contoh: Jasa Cleaning Service'}
                      maxLength={100}
                      disabled={isSubmitting}
                      autoComplete="organization"
                      className="pl-10 rounded-xl border-border/60 bg-background/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary"
                      aria-required="true"
                      {...form.register('businessName')}
                    />
                  </div>
                  {form.formState.errors.businessName && (
                    <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {selectedRole === 'merchant' 
                        ? 'Nama ini akan tampil di profil properti Anda'
                        : 'Nama ini akan tampil di profil bisnis Anda'}
                    </p>
                    <span className={cn(
                      'text-xs transition-colors',
                      businessNameValue.length > 80 ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {businessNameValue.length}/100
                    </span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl gradient-cta text-primary-foreground hover:shadow-[0_4px_20px_rgba(139,111,71,0.4)] active:scale-[0.98] transition-all duration-200" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat akun...
                    </>
                  ) : (
                    'Mulai Sekarang'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pendaftaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mendaftar sebagai <strong>{selectedRole === 'merchant' ? 'Pemilik Properti' : 'Vendor Jasa'}</strong> dengan nama bisnis <strong>"{form.getValues('businessName')}"</strong>.
              <br /><br />
              Jenis akun tidak dapat diubah setelah pendaftaran. Apakah Anda yakin?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row">
            <AlertDialogCancel disabled={isSubmitting} autoFocus>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Daftarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
