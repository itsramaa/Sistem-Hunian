import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useToast } from '@/shared/hooks/use-toast';
import { emailSchema } from '@/shared/utils/validations/auth';
import { triggerHaptic } from '@/shared/utils/haptic';

const resetSchema = z.object({
  email: emailSchema,
});

type ResetFormData = z.infer<typeof resetSchema>;

const RESEND_COOLDOWN = 60; // seconds

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const sendResetEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    
    try {
      await apiClient.post('/auth/reset-password', {
        email,
        redirect_to: `${window.location.origin}/update-password`,
      });
    } catch (err: unknown) {
      setIsLoading(false);
      triggerHaptic('error');
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengirim email reset password.';
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: message,
      });
      return false;
    }
    
    setIsLoading(false);

    triggerHaptic('success');
    setResendCountdown(RESEND_COOLDOWN);
    return true;
  }, [toast]);

  const handleReset = async (data: ResetFormData) => {
    const success = await sendResetEmail(data.email);
    
    if (success) {
      setSubmittedEmail(data.email);
      setEmailSent(true);
      toast({
        title: 'Email terkirim',
        description: 'Silakan cek email Anda untuk link reset password.',
      });
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || !submittedEmail) return;
    
    const success = await sendResetEmail(submittedEmail);
    
    if (success) {
      toast({
        title: 'Email terkirim ulang',
        description: 'Silakan cek email Anda untuk link reset password.',
      });
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const canResend = resendCountdown === 0;

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md shadow-elevated animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <CardTitle className="text-2xl font-display">Cek Email Anda</CardTitle>
            <CardDescription>
              Kami telah mengirim link reset password ke{' '}
              <span className="font-medium text-foreground">{maskEmail(submittedEmail)}</span>.
              Silakan cek inbox dan folder spam Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Tidak menerima email? Cek folder spam atau kirim ulang.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : canResend ? (
                  'Kirim Ulang Email'
                ) : (
                  `Kirim ulang dalam ${resendCountdown}s`
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display">Reset Password</CardTitle>
          <CardDescription>
            Masukkan alamat email Anda dan kami akan mengirimkan link untuk reset password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  enterKeyHint="done"
                  placeholder="anda@contoh.com"
                  className="pl-10"
                  autoComplete="email"
                  disabled={isLoading}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                'Kirim Link Reset'
              )}
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
