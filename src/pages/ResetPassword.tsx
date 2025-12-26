import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { emailSchema } from '@/lib/validations/auth';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const resetSchema = z.object({
  email: emailSchema,
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const handleReset = async (data: ResetFormData) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: getAuthErrorMessage(error),
      });
      return;
    }

    setSubmittedEmail(data.email);
    setEmailSent(true);
    toast({
      title: 'Email terkirim',
      description: 'Silakan cek email Anda untuk link reset password.',
    });
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  };

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
              Tidak menerima email? Cek folder spam atau coba lagi.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
                className="w-full"
              >
                Coba lagi
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
                  placeholder="anda@contoh.com"
                  className="pl-10"
                  autoComplete="email"
                  disabled={isLoading}
                  {...form.register('email')}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Link Reset
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
