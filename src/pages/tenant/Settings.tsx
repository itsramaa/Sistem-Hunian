import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Shield, Loader2, CreditCard, Calendar, Wallet, Banknote, Palette, Moon, Sun } from "lucide-react";
import { format } from "date-fns";

interface NotificationPreferences {
  payment_reminders: boolean;
  maintenance_updates: boolean;
  new_invoices: boolean;
  contract_updates: boolean;
}

const TenantSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    payment_reminders: true,
    maintenance_updates: true,
    new_invoices: true,
    contract_updates: true,
  });

  const [autoPaySettings, setAutoPaySettings] = useState({
    enabled: false,
    day: 1,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Initialize settings when data loads
  useEffect(() => {
    if (tenant) {
      const prefs = tenant.notification_preferences as unknown as NotificationPreferences | null;
      if (prefs) {
        setNotificationPrefs(prefs);
      }
      setAutoPaySettings({
        enabled: (tenant as { auto_pay_enabled?: boolean }).auto_pay_enabled || false,
        day: (tenant as { auto_pay_day?: number }).auto_pay_day || 1,
      });
    }
  }, [tenant]);

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    toast.success('Tema berhasil diubah');
  };

  const changePassword = useMutation({
    mutationFn: async () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Password tidak cocok');
      }
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password berhasil diubah');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateNotificationPrefs = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('tenants')
        .update({ 
          notification_preferences: JSON.parse(JSON.stringify(prefs))
        } as any)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Preferensi notifikasi disimpan');
    },
    onError: () => toast.error('Gagal menyimpan preferensi'),
  });

  const updateAutoPaySettings = useMutation({
    mutationFn: async (settings: { enabled: boolean; day: number }) => {
      if (!user?.id) throw new Error('User not found');
      
      const { error } = await supabase
        .from('tenants')
        .update({ 
          auto_pay_enabled: settings.enabled, 
          auto_pay_day: settings.day 
        } as any)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Pengaturan auto-pay disimpan');
    },
    onError: () => toast.error('Gagal menyimpan pengaturan auto-pay'),
  });

  if (tenantLoading) {
    return (
      <TenantLayout title="Pengaturan">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Pengaturan"
      description="Konfigurasi aplikasi dan preferensi"
    >
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tampilan</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pembayaran</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Keamanan</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Tema Aplikasi
              </CardTitle>
              <CardDescription>Pilih tema tampilan yang Anda sukai</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'light' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Terang</p>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Gelap</p>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'system' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-center gap-1 mb-2">
                    <Sun className="h-5 w-5" />
                    <Moon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">Sistem</p>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Pilih "Sistem" untuk mengikuti pengaturan tema perangkat Anda secara otomatis.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferensi Notifikasi
              </CardTitle>
              <CardDescription>Pilih notifikasi yang ingin Anda terima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'payment_reminders', label: 'Pengingat Pembayaran', description: 'Pengingat sebelum jatuh tempo sewa' },
                { key: 'maintenance_updates', label: 'Update Maintenance', description: 'Pembaruan tentang laporan perbaikan Anda' },
                { key: 'new_invoices', label: 'Tagihan Baru', description: 'Notifikasi ketika ada tagihan baru' },
                { key: 'contract_updates', label: 'Update Kontrak', description: 'Pembaruan penting tentang kontrak sewa' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notificationPrefs[item.key as keyof NotificationPreferences]}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...notificationPrefs, [item.key]: checked };
                      setNotificationPrefs(newPrefs);
                      updateNotificationPrefs.mutate(newPrefs);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Auto-Pay Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Pengaturan Auto-Pay
              </CardTitle>
              <CardDescription>Atur pembayaran otomatis untuk sewa Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Aktifkan Auto-Pay</p>
                  <p className="text-sm text-muted-foreground">
                    Bayar sewa secara otomatis setiap bulan
                  </p>
                </div>
                <Switch
                  checked={autoPaySettings.enabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...autoPaySettings, enabled: checked };
                    setAutoPaySettings(newSettings);
                    updateAutoPaySettings.mutate(newSettings);
                  }}
                />
              </div>

              {autoPaySettings.enabled && (
                <div className="space-y-2 p-4 rounded-lg border bg-muted/50">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tanggal Pembayaran
                  </Label>
                  <Select
                    value={autoPaySettings.day.toString()}
                    onValueChange={(value) => {
                      const newSettings = { ...autoPaySettings, day: parseInt(value) };
                      setAutoPaySettings(newSettings);
                      updateAutoPaySettings.mutate(newSettings);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Pilih tanggal" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Tanggal {day} setiap bulan
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pembayaran akan diproses otomatis pada tanggal ini setiap bulan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Payment Methods */}
          <SavedPaymentMethodsSection userId={user?.id} />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>Perbarui password untuk keamanan akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi password baru"
                  />
                </div>
              </div>
              <Button 
                onClick={() => changePassword.mutate()}
                disabled={changePassword.isPending || !passwordForm.newPassword}
              >
                {changePassword.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Ubah Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TenantLayout>
  );
};

// Saved Payment Methods Component
function SavedPaymentMethodsSection({ userId }: { userId?: string }) {
  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["saved-payment-methods", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xendit_transactions")
        .select("payment_method, payment_channel, created_at")
        .eq("user_id", userId)
        .eq("status", "paid")
        .not("payment_method", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const seen = new Set<string>();
      const unique = data?.filter(pm => {
        const key = `${pm.payment_method}-${pm.payment_channel}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) || [];
      
      return unique;
    },
    enabled: !!userId,
  });

  const formatMethodName = (method: string | null, channel: string | null) => {
    if (channel) {
      return channel.replace(/_/g, ' ').toUpperCase();
    }
    if (method) {
      return method.replace(/_/g, ' ').toUpperCase();
    }
    return 'Metode Tidak Diketahui';
  };

  const getMethodIcon = (method: string | null) => {
    switch (method?.toLowerCase()) {
      case 'virtual_account':
        return '🏦';
      case 'ewallet':
        return '📱';
      case 'qr_code':
        return '📷';
      case 'credit_card':
        return '💳';
      default:
        return '💰';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Metode Pembayaran
        </CardTitle>
        <CardDescription>Metode pembayaran yang pernah digunakan</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((pm, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMethodIcon(pm.payment_method)}</span>
                  <div>
                    <p className="font-medium">{formatMethodName(pm.payment_method, pm.payment_channel)}</p>
                    <p className="text-sm text-muted-foreground">
                      Terakhir: {format(new Date(pm.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Tersedia</Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              Metode ini dapat digunakan untuk pembayaran lebih cepat.
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Banknote className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 font-medium">Belum ada metode pembayaran</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Metode pembayaran akan muncul setelah pembayaran pertama berhasil.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TenantSettings;
