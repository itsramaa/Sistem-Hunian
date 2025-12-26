import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Loader2, Palette, Moon, Sun, RefreshCw, AlertTriangle, Shield } from "lucide-react";
import { Navigate } from "react-router-dom";

interface NotificationPreferences {
  payment_reminders: boolean;
  maintenance_updates: boolean;
  new_invoices: boolean;
  contract_updates: boolean;
  forum_replies: boolean;
  order_updates: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  payment_reminders: true,
  maintenance_updates: true,
  new_invoices: true,
  contract_updates: true,
  forum_replies: true,
  order_updates: true,
};

const TenantSettings = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  // Role verification
  if (role && role !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }

  const { data: tenant, isLoading: tenantLoading, error, refetch } = useQuery({
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

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Initialize settings when data loads
  useEffect(() => {
    if (tenant) {
      const prefs = tenant.notification_preferences as unknown as NotificationPreferences | null;
      if (prefs) {
        setNotificationPrefs({
          ...DEFAULT_NOTIFICATION_PREFS,
          ...prefs,
        });
      }
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

  if (tenantLoading) {
    return (
      <TenantLayout title="Pengaturan">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TenantLayout>
    );
  }

  if (error) {
    return (
      <TenantLayout title="Pengaturan">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat pengaturan. Silakan coba lagi.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  const notificationItems = [
    { key: 'payment_reminders', label: 'Pengingat Pembayaran', description: 'Pengingat sebelum jatuh tempo sewa' },
    { key: 'maintenance_updates', label: 'Update Maintenance', description: 'Pembaruan tentang laporan perbaikan Anda' },
    { key: 'new_invoices', label: 'Tagihan Baru', description: 'Notifikasi ketika ada tagihan baru' },
    { key: 'contract_updates', label: 'Update Kontrak', description: 'Pembaruan penting tentang kontrak sewa' },
    { key: 'forum_replies', label: 'Balasan Forum', description: 'Notifikasi ketika ada balasan di forum' },
    { key: 'order_updates', label: 'Update Pesanan', description: 'Pembaruan status pesanan vendor' },
  ];

  return (
    <TenantLayout 
      title="Pengaturan"
      description="Konfigurasi aplikasi dan preferensi"
    >
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tampilan</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifikasi</span>
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

          {/* Privacy Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privasi & Keamanan
              </CardTitle>
              <CardDescription>Informasi tentang data Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Data pribadi Anda seperti KTP dan informasi identitas disimpan dengan aman dan hanya digunakan untuk verifikasi. 
                  Anda dapat mengelola data profil di halaman <a href="/tenant/profile" className="text-primary underline">Profil</a>.
                </p>
              </div>
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
              {notificationItems.map((item) => (
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
      </Tabs>
    </TenantLayout>
  );
};

export default TenantSettings;
