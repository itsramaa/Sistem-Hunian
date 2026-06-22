import { Bell, Moon, Globe, MessageCircle, Loader2, AlertTriangle, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWhatsappStatus, useWhatsappQR, useWhatsappLogout } from '@/features/whatsapp/hooks/useWhatsapp';
import { useToast } from '@/shared/hooks/use-toast';
import { getApiErrorMessage } from '@/shared/utils/api-errors';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { QRCodeSVG } from 'qrcode.react';

// ─── WhatsApp Card — operator only ───────────────────────────────────────────
function WhatsappCard() {
  const { toast } = useToast();

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErr,
  } = useWhatsappStatus();

  const isConnected = status?.connected ?? false;
  const isWaitingQR = status?.status === 'waiting_qr_scan';

  const {
    data: qrData,
    isLoading: qrLoading,
    isError: qrError,
    error: qrErr,
    refetch: refetchQR,
  } = useWhatsappQR(!statusLoading && isWaitingQR);

  const logoutMutation = useWhatsappLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({ title: 'WhatsApp berhasil diputus', description: 'Scan QR code baru untuk menghubungkan kembali.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal memutus koneksi', description: getApiErrorMessage(err) });
    }
  };

  const statusBadge = () => {
    if (statusLoading) return <Skeleton className="h-6 w-24 rounded-full" />;
    if (isConnected) return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full gap-1">
        <CheckCircle2 className="h-3 w-3" /> Terhubung
      </Badge>
    );
    if (isWaitingQR) return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
        Menunggu Scan
      </Badge>
    );
    return (
      <Badge variant="outline" className="text-muted-foreground rounded-full">
        Tidak Terhubung
      </Badge>
    );
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">WhatsApp (WhatsMeOn)</CardTitle>
          </div>
          {statusBadge()}
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
        {!statusLoading && isConnected && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              WhatsApp terhubung dan siap mengirim notifikasi ke penghuni.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-xl"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <LogOut className="h-4 w-4" />}
              Putus Koneksi
            </Button>
          </div>
        )}

        {/* Waiting QR scan state */}
        {!statusLoading && isWaitingQR && (
          <div className="space-y-3">
            {qrData?.instruction && (
              <p className="text-sm text-muted-foreground">{qrData.instruction}</p>
            )}

            {qrLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat QR code...</span>
              </div>
            )}

            {qrError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{getApiErrorMessage(qrErr)}</span>
              </div>
            )}

            {!qrLoading && !qrError && qrData?.qr && (
              <div className="flex flex-col items-start gap-2">
                <div className="rounded-xl border p-3 bg-white w-fit">
                  <QRCodeSVG
                    value={qrData.qr}
                    size={160}
                    level="M"
                    includeMargin={false}
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

        {/* Disconnected — not yet waiting for QR */}
        {!statusLoading && !isConnected && !isWaitingQR && (
          <p className="text-sm text-muted-foreground">
            WhatsApp tidak terhubung. Restart server dengan <code className="text-xs bg-muted px-1 py-0.5 rounded">WA_ENABLED=true</code> untuk memulai pairing.
          </p>
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
