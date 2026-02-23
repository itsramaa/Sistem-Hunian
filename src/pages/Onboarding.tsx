import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Wrench, Loader2, ArrowLeft, Check, Clock } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
    description: 'Kelola properti, tenant, tagihan, dan laporan dalam satu platform',
    emoji: '🏠',
  },
  { 
    value: 'vendor', 
    label: 'Vendor Jasa', 
    icon: Wrench, 
    description: 'Terima order jasa dari pemilik properti dan kelola penghasilan',
    emoji: '🔧',
  },
];

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { number: 1, label: 'Pilih Role' },
    { number: 2, label: 'Info Bisnis' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8" role="navigation" aria-label="Langkah onboarding">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                currentStep > step.number
                  ? 'bg-primary text-primary-foreground'
                  : currentStep === step.number
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
              aria-current={currentStep === step.number ? 'step' : undefined}
              aria-label={`Langkah ${step.number} dari 2: ${step.label}`}
            >
              {currentStep > step.number ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                'text-sm font-medium hidden sm:inline',
                currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-8 sm:w-12 h-px mx-2 sm:mx-4',
                currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
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

  // Get user's full name for personalized greeting
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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Check if user already has a role in database
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
        description: 'Anda harus login terlebih dahulu',
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md w-[95vw] sm:w-full">
        {/* Progress Indicator */}
        <StepIndicator currentStep={currentStep} />

        <Card className="shadow-elevated animate-fade-in">
          <CardHeader className="text-center space-y-2 relative">
            {/* Back Button - relative positioning */}
            <div className="flex justify-start -mb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                aria-label="Kembali ke langkah sebelumnya"
              >
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Kembali
              </Button>
            </div>
            
            <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-display">
              {currentStep === 1 
                ? (fullName ? `Hai, ${fullName.split(' ')[0]}! 👋` : 'Pilih Jenis Akun')
                : 'Lengkapi Profil Anda'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 
                ? 'Pilih jenis akun yang sesuai dengan kebutuhan Anda'
                : 'Lengkapi informasi bisnis Anda'}
            </CardDescription>
            {/* Time estimate */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Memakan waktu kurang dari 30 detik</span>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep === 1 ? (
              /* Step 1: Role Selection */
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label id="role-selection-label">Saya adalah...</Label>
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
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-[1.02]',
                          selectedRole === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                        aria-label={`${option.label}: ${option.description}`}
                      >
                        <span className="text-3xl" aria-hidden="true">{option.emoji}</span>
                        <option.icon 
                          className={cn(
                            'h-6 w-6',
                            selectedRole === option.value ? 'text-primary' : 'text-muted-foreground'
                          )} 
                          aria-hidden="true"
                        />
                        <span className={cn(
                          'font-medium',
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
                  className="w-full" 
                  onClick={handleNextStep}
                >
                  Lanjutkan
                </Button>
              </div>
            ) : (
              /* Step 2: Business Information */
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business-name">
                    {selectedRole === 'merchant' ? 'Nama Properti / Perusahaan' : 'Nama Bisnis'}
                  </Label>
                  <Input
                    id="business-name"
                    placeholder={selectedRole === 'merchant' ? 'Contoh: Kost Melati, PT Graha Indah' : 'Contoh: Jasa Cleaning Service'}
                    maxLength={100}
                    disabled={isSubmitting}
                    autoComplete="organization"
                    aria-required="true"
                    {...form.register('businessName')}
                  />
                  {form.formState.errors.businessName && (
                    <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {selectedRole === 'merchant' 
                        ? 'Nama ini akan tampil di profil properti Anda'
                        : 'Nama ini akan tampil di profil bisnis Anda'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {businessNameValue.length}/100
                    </span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
          </CardContent>
        </Card>
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
