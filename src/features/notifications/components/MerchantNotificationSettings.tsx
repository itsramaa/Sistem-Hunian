import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/shared/lib/axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MessageCircle, Mail, Save, Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferences {
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  reminder_h7: boolean;
  reminder_h3: boolean;
  reminder_h1: boolean;
  reminder_due: boolean;
  reminder_overdue: boolean;
  whatsapp_number: string;
}

export function MerchantNotificationSettings() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsapp_enabled: false,
    email_enabled: true,
    reminder_h7: true,
    reminder_h3: true,
    reminder_h1: true,
    reminder_due: true,
    reminder_overdue: true,
    whatsapp_number: '',
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', merchant?.user_id],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/profiles', { params: { user_id: merchant?.user_id } });
        return r.data as { phone: string | null };
      } catch (err) {
        return null;
      }
    },
    enabled: !!merchant?.user_id,
  });

  useEffect(() => {
    if (profile?.phone) {
      setPreferences(prev => ({ ...prev, whatsapp_number: profile.phone || '' }));
    }
  }, [profile]);

  const isValidPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleSave = () => {
    if (preferences.whatsapp_enabled && !isValidPhoneNumber(preferences.whatsapp_number)) {
      toast.error('Harap masukkan nomor telepon yang valid untuk WhatsApp');
      return;
    }
    toast.success('Preferensi notifikasi disimpan');
  };

  return (
    <div className="space-y-6">
      {/* Channel Settings */}
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center" aria-hidden="true">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            Saluran Notifikasi
          </CardTitle>
          <CardDescription>
            Pilih cara mengirim pengingat pembayaran ke penyewa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Channel */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5" aria-hidden="true">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Notifikasi Email</p>
                <p className="text-sm text-muted-foreground">Kirim pengingat melalui email</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-success/10 text-success">
                <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                Aktif
              </Badge>
              <Switch checked={preferences.email_enabled} onCheckedChange={(checked) => setPreferences({ ...preferences, email_enabled: checked })} aria-label="Aktifkan Notifikasi Email" />
            </div>
          </div>

          {/* WhatsApp Channel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-success/20 to-success/5" aria-hidden="true">
                  <MessageCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Notifikasi WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Kirim pengingat melalui WhatsApp</p>
                </div>
              </div>
              <Switch checked={preferences.whatsapp_enabled} onCheckedChange={(checked) => setPreferences({ ...preferences, whatsapp_enabled: checked })} aria-label="Aktifkan Notifikasi WhatsApp" />
            </div>

            {preferences.whatsapp_enabled && (
              <div className="ml-4 p-4 rounded-xl border-dashed border border-border/50 bg-background/40 backdrop-blur-sm space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">Nomor WhatsApp Bisnis</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input id="whatsapp_number" placeholder="+62 812 3456 7890" value={preferences.whatsapp_number} onChange={(e) => setPreferences({ ...preferences, whatsapp_number: e.target.value })} className="pl-10 rounded-xl bg-background/60 border-border/50" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nomor ini akan digunakan untuk mengirim pesan WhatsApp ke penyewa
                  </p>
                </div>

                {preferences.whatsapp_number && !isValidPhoneNumber(preferences.whatsapp_number) && (
                  <div className="flex items-center gap-2 text-sm text-warning" role="alert">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Harap masukkan nomor telepon yang valid
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reminder Schedule */}
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <CardTitle>Jadwal Pengingat Pembayaran</CardTitle>
          <CardDescription>Konfigurasi kapan harus mengirim pengingat pembayaran otomatis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'reminder_h7', label: '7 hari sebelum jatuh tempo', description: 'Pengingat dini seminggu sebelum pembayaran jatuh tempo' },
            { key: 'reminder_h3', label: '3 hari sebelum jatuh tempo', description: 'Pengingat 3 hari sebelum pembayaran jatuh tempo' },
            { key: 'reminder_h1', label: '1 hari sebelum jatuh tempo', description: 'Pengingat terakhir sehari sebelum pembayaran jatuh tempo' },
            { key: 'reminder_due', label: 'Pada tanggal jatuh tempo', description: 'Pengingat tepat pada tanggal jatuh tempo' },
            { key: 'reminder_overdue', label: 'Terlambat (harian)', description: 'Pengingat harian untuk pembayaran yang terlambat' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch checked={preferences[item.key as keyof NotificationPreferences] as boolean} onCheckedChange={(checked) => setPreferences({ ...preferences, [item.key]: checked })} aria-label={`Aktifkan pengingat ${item.label}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Events */}
      <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
        <CardHeader>
          <CardTitle>Notifikasi Peristiwa</CardTitle>
          <CardDescription>Dapatkan notifikasi tentang peristiwa penting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Pembayaran Diterima', description: 'Saat penyewa melakukan pembayaran' },
            { label: 'Permintaan Perbaikan', description: 'Permintaan perbaikan baru dari penyewa' },
            { label: 'Kontrak Berakhir', description: 'Kontrak yang akan berakhir dalam 30 hari' },
            { label: 'Laporan Mingguan', description: 'Ringkasan mingguan properti Anda' },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked aria-label={`Aktifkan notifikasi ${item.label}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
          <Save className="h-4 w-4 mr-2" />
          Simpan Preferensi
        </Button>
      </div>
    </div>
  );
}