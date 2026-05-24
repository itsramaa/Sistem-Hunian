import { adminSecurityService } from '@/features/auth/services/adminSecurityService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { strongPasswordSchema } from '@/shared/utils/validations/auth';

const adminSchema = z.object({
  email: z.string().email('Mohon masukkan email yang valid'),
  password: strongPasswordSchema,
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  secretKey: z.string().min(1, 'Kunci rahasia diperlukan'),
});

type AdminFormData = z.infer<typeof adminSchema>;

export default function AdminSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const { signUp } = useAuth();

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      secretKey: '',
    },
  });

  const handleSubmit = async (data: AdminFormData) => {
    setIsLoading(true);
    try {
      // Validate secret key via edge function
      const isValidSecret = await adminSecurityService.validateAdminSecret(data.secretKey);
      
      if (!isValidSecret) {
        toast({
          variant: 'destructive',
          title: 'Kunci Rahasia Tidak Valid',
          description: 'Kunci rahasia yang Anda masukkan salah.',
        });
        setIsLoading(false);
        return;
      }

      // Sign up the admin user via Go backend
      const { data: authData, error: signUpError } = await signUp(data.email, data.password, {
        full_name: data.fullName,
        role: 'admin',
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          toast({
            variant: 'destructive',
            title: 'Pengguna Sudah Ada',
            description: 'Email ini sudah terdaftar. Silakan masuk dan hubungi dukungan untuk dijadikan admin.',
          });
          return;
        }
        throw signUpError;
      }

      if (!authData?.user) {
        throw new Error('Gagal membuat pengguna');
      }

      setIsComplete(true);
      toast({
        title: 'Akun Admin Dibuat!',
        description: 'Anda sekarang dapat masuk dengan kredensial admin Anda.',
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      const err = error as Error;
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: err.message || 'Gagal membuat akun admin',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Akun Admin Dibuat!</h2>
            <p className="text-muted-foreground mb-6">
              Akun admin Anda telah berhasil dibuat. Anda sekarang dapat masuk untuk mengakses dashboard admin.
            </p>
            <Link to="/auth">
              <Button className="w-full">
                Pergi ke Halaman Masuk
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Pengaturan Admin</CardTitle>
          <CardDescription>
            Buat akun admin untuk manajemen platform SiHuni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                placeholder="Pengguna Admin"
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sihuni.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Kunci Rahasia Admin</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Masukkan kunci rahasia admin"
                {...form.register('secretKey')}
              />
              {form.formState.errors.secretKey && (
                <p className="text-sm text-destructive">{form.formState.errors.secretKey.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Hubungi administrator sistem untuk kunci rahasia
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Akun Admin
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline h-4 w-4 mr-1" />
              Kembali ke Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
