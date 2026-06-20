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
import { z } from 'zod';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  operator: { label: 'Operator', variant: 'default' },
  manager: { label: 'Manajer', variant: 'secondary' },
  viewer: { label: 'Viewer', variant: 'outline' },
};

const pwSchema = z.object({
  new_password: z.string().min(8, 'Minimal 8 karakter'),
  confirm: z.string(),
}).refine(d => d.new_password === d.confirm, { message: 'Password tidak cocok', path: ['confirm'] });

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [isChanging, setIsChanging] = useState(false);

  const roleInfo = roleLabels[profile?.role ?? ''] ?? { label: profile?.role ?? '—', variant: 'outline' as const };

  const handleChangePw = async () => {
    setPwErrors({});
    const result = pwSchema.safeParse(pw);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { if (e.path[0]) errs[String(e.path[0])] = e.message; });
      setPwErrors(errs);
      return;
    }
    setIsChanging(true);
    try {
      await apiClient.post('/auth/change-password', { new_password: pw.new_password });
      setPw({ new_password: '', confirm: '' });
      toast({ title: 'Password berhasil diubah' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal mengubah password' });
    } finally {
      setIsChanging(false);
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">Password Baru</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPw ? 'text' : 'password'}
                value={pw.new_password}
                onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))}
                placeholder="Minimal 8 karakter"
                className="pr-10 rounded-xl"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.new_password && <p className="text-sm text-destructive">{pwErrors.new_password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Konfirmasi Password</Label>
            <Input
              id="confirm"
              type="password"
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Ulangi password baru"
              className="rounded-xl"
            />
            {pwErrors.confirm && <p className="text-sm text-destructive">{pwErrors.confirm}</p>}
          </div>
          <Button
            onClick={handleChangePw}
            disabled={isChanging || !pw.new_password || !pw.confirm}
            className="gap-2 rounded-xl"
          >
            {isChanging && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
