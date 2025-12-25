import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AppRole } from '@/types/auth';

type SelectableRole = 'merchant' | 'vendor';

const roleOptions: { value: SelectableRole; label: string; icon: typeof Building2; description: string }[] = [
  { value: 'merchant', label: 'Merchant', icon: Building2, description: 'Kelola properti dan tenant' },
  { value: 'vendor', label: 'Vendor', icon: Wrench, description: 'Penyedia jasa/layanan' },
];

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role, isLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('merchant');
  const [businessName, setBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const referralCode = searchParams.get('ref') || sessionStorage.getItem('referral_code') || '';

  // Redirect if already has role
  useEffect(() => {
    if (!isLoading && user && role) {
      // User already has role, redirect to their dashboard
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'merchant') {
        navigate('/merchant', { replace: true });
      } else if (role === 'vendor') {
        navigate('/vendor', { replace: true });
      } else {
        navigate('/tenant', { replace: true });
      }
    }
  }, [user, role, isLoading, navigate]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Anda harus login terlebih dahulu',
      });
      return;
    }

    if (!businessName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Nama bisnis wajib diisi',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', user.id)
        .single();

      // Call auth-webhook to complete setup
      const { error: webhookError } = await supabase.functions.invoke('auth-webhook', {
        body: {
          user_id: user.id,
          email: profile?.email || user.email,
          full_name: profile?.full_name || '',
          phone: profile?.phone || null,
          role: selectedRole,
          business_name: businessName,
          referral_code: referralCode || undefined,
        },
      });

      if (webhookError) {
        throw webhookError;
      }

      // Clear referral code from session
      sessionStorage.removeItem('referral_code');

      // Refresh profile to get new role
      await refreshProfile();

      toast({
        title: 'Selamat datang!',
        description: `Akun ${selectedRole === 'merchant' ? 'Merchant' : 'Vendor'} Anda berhasil dibuat.`,
      });

      // Navigate to appropriate dashboard
      navigate(selectedRole === 'merchant' ? '/merchant' : '/vendor', { replace: true });

    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal membuat akun',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <CardTitle className="text-2xl font-display">Lengkapi Profil Anda</CardTitle>
          <CardDescription>
            Pilih jenis akun dan lengkapi informasi bisnis Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Saya adalah...</Label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedRole(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      selectedRole === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <option.icon className={cn(
                      'h-8 w-8',
                      selectedRole === option.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'font-medium',
                      selectedRole === option.value ? 'text-primary' : 'text-foreground'
                    )}>
                      {option.label}
                    </span>
                    <span className={cn(
                      'text-xs text-center',
                      selectedRole === option.value ? 'text-primary/80' : 'text-muted-foreground'
                    )}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business-name">
                {selectedRole === 'merchant' ? 'Nama Properti / Perusahaan' : 'Nama Bisnis'}
              </Label>
              <Input
                id="business-name"
                placeholder={selectedRole === 'merchant' ? 'Contoh: Kost Melati, PT Graha Indah' : 'Contoh: Jasa Cleaning Service'}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {selectedRole === 'merchant' 
                  ? 'Nama ini akan tampil di profil properti Anda'
                  : 'Nama ini akan tampil di profil bisnis Anda'}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mulai Sekarang
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
