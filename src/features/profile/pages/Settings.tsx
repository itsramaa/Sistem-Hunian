import { Settings as SettingsIcon, Bell, Moon, Globe, MessageCircle, Loader2, AlertTriangle, Smartphone, Battery, LogOut, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWhatsappStatus, useWhatsappQR, useWhatsappDisconnect } from '@/features/whatsapp/hooks/useWhatsapp';
import { useToast } from '@/shared/hooks/use-toast';
import { getApiErrorMessage } from '@/shared/utils/api-errors';
import { Skeleton } from '@/shared/components/ui/skeleton';

// ─── WhatsApp Card — operator only ───────────────────────────────────────────
function WhatsappCard() {
  const { toast } = useToast();
  const { data: status, isLoading: statusLoading, isError: statusError, error: statusErr, refetch: refetchStatus } = useWhatsappStatus();
  const isConnected = status?.connected ?? false;
  const { data: qrData, isLoading: qrLoading, isError: qrError, refetch: refetchQR } = useWhatsappQR(!isConnected && !statusLoading);
  const disconnectMutation = useWhatsappDisconnect();

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      toast({ title: 'WhatsApp berhasil diputus', description: 'Koneksi WhatsMeOn telah dinonaktifkan.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal memutus koneksi', description: getApiErrorMessage(err) });
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">WhatsApp (WhatsMeOn)</CardTitle>
          </div>
          {statusLoading ? (
            <Skeleton className="h-6 w-20 rounded-full" />
          ) : isConnected ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              Terhubung
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground rounded-full">
              Tidak Terhubung
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error fetch status */}
        {statusError && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{getApiErrorMessage(statusErr)}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {statusLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {/* Connected state */}
        {!statusLoading && isConnected && status && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              <span>Nomor: <span className="font-medium text-foreground">+{status.phone}</span></span>
            </div>
            {status.battery !== undefined && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Battery className="h-4 w-4" />
                <span>Baterai: <span className="font-medium text-foreground">{status.battery}%</span></span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-xl"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <LogOut className="h-4 w-4" />}
              Putus Koneksi
            </Button>
          </div>
        )}

        {/* Disconnected state — show QR */}
        {!statusLoading && !isConnected && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Scan QR code di bawah menggunakan WhatsApp di HP Anda untuk menghubungkan akun WhatsMeOn.
            </p>

            {qrLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat QR code...</span>
              </div>
            )}

            {qrError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Gagal memuat QR. <button className="underline" onClick={() => refetchQR()}>Coba lagi</button></span>
              </div>
            )}

            {!qrLoading && !qrError && qrData?.qr_code && (
              <div className="flex flex-col items-start gap-2">
                <div className="rounded-xl border p-2 bg-white w-fit">
                  <img
                    src={`data:image/png;base64,${qrData.qr_code}`}
                    alt="QR Code WhatsApp"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">QR diperbarui otomatis setiap 30 detik.</p>
                <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs" onClick={() => refetchQR()}>
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh QR
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { profile } = useAuth();
  const isOperator = profile?.role === 'operator';

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Konfigurasi preferensi akun</p>
      </div>

      {/* Appearance */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Tampilan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mode Gelap / Terang</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ubah tema tampilan aplikasi</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Notifikasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notifikasi sistem dikirim secara otomatis oleh background worker untuk alert DP, pembayaran jatuh tempo, dan pembayaran terlambat.
          </p>
        </CardContent>
      </Card>

      {/* WhatsApp — operator only */}
      {isOperator && <WhatsappCard />}

      {/* System info */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Sistem</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aplikasi</span>
            <span className="font-medium">SiHuni v1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">Neon PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-medium">Cloudflare R2</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
