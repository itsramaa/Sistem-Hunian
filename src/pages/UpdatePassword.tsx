import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useToast } from '@/shared/hooks/use-toast';
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter';
import { strongPasswordSchema } from '@/shared/utils/validations/auth';

const updatePasswordSchema = z.object({
  password: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ['confirmPassword'],
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function UpdatePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = form.watch('password');

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const token = localStorage.getItem('sihuni_access_token');
      if (!token) {
        setIsSessionValid(false);
      } else {
        setIsSessionValid(true);
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    
    try {
      await apiClient.post('/auth/change-password', {
        password: data.password,
      });
    } catch (err: unknown) {
      setIsLoading(false);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal memperbarui password.';
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: message,
      });
      return;
    }
    
    setIsLoading(false);

    setSuccess(true);
    toast({
      title: 'Password berhasil diperbarui',
      description: 'Password Anda telah berhasil diperbarui.',
    });

    // Redirect to auth after 2 seconds
    setTimeout(() => {
      navigate('/auth');
    }, 2000);
  };

  // Show invalid/expired link message
  if (isSessionValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md shadow-elevated animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-display">Link Tidak Valid</CardTitle>
            <CardDescription>
              Link reset password sudah kadaluarsa atau tidak valid. Silakan request link baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/reset-password')} 
              className="w-full"
            >
              Request Link Baru
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state while checking session
  if (isSessionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md shadow-elevated animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <CardTitle className="text-2xl font-display">Password Berhasil Diperbarui!</CardTitle>
            <CardDescription>
              Password Anda telah berhasil diperbarui. Mengarahkan ke halaman login...
            </CardDescription>
          </CardHeader>
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
          <CardTitle className="text-2xl font-display">Buat Password Baru</CardTitle>
          <CardDescription>
            Masukkan password baru Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...form.register('password')}
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
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
              <PasswordStrengthMeter password={passwordValue || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Perbarui Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
