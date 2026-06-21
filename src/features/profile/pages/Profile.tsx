import { useAuth } from '@/features/auth/hooks/useAuth';
import { apiClient } from '@/shared/lib/axios';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { User, Mail, Shield, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/shared/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  operator: { label: 'Operator', variant: 'default' },
  manager: { label: 'Manajer', variant: 'secondary' },
  viewer: { label: 'Viewer', variant: 'outline' },
};

const pwSchema = z.object({
  old_password: z.string().min(1, 'Password lama wajib diisi'),
  new_password: z.string().min(6, 'Minimal 6 karakter'),
  confirm: z.string(),
}).refine(d => d.new_password === d.confirm, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm'],
});
type PwForm = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const roleInfo = roleLabels[profile?.role ?? ''] ?? { label: profile?.role ?? '—', variant: 'outline' as const };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { old_password: '', new_password: '', confirm: '' },
  });

  const handleChangePw = async (data: PwForm) => {
    try {
      await apiClient.post('/auth/change-password', {
        old_password: data.old_password,
        new_password: data.new_password,
      });
      reset();
      toast({ title: 'Password berhasil diubah' });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Gagal mengubah password';
      toast({ variant: 'destructive', title: msg });
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Informasi akun Anda</p>
      </div>

      {/* User info card */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{profile?.nama ?? user?.nama ?? '—'}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{profile?.email ?? user?.email ?? '—'}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Role:</span>
            <Badge variant={roleInfo.variant} className="rounded-full">{roleInfo.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Ubah Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleChangePw)} className="space-y-4">
            {/* Old password */}
            <div className="space-y-2">
              <Label htmlFor="old_password">Password Lama</Label>
              <div className="relative">
                <Input
                  id="old_password"
                  type={showOld ? 'text' : 'password'}
                  placeholder="Password saat ini"
                  className="pr-10 rounded-xl"
                  {...register('old_password')}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowOld(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.old_password && <p className="text-sm text-destructive">{errors.old_password.message}</p>}
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="new_password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  className="pr-10 rounded-xl"
                  {...register('new_password')}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password Baru</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ulangi password baru"
                className="rounded-xl"
                {...register('confirm')}
              />
              {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="gap-2 rounded-xl min-h-[44px]">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
