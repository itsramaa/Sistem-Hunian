import React from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/features/profile/api/settingsApi";
import { SectionHeader } from "@/features/profile/components/SectionHeader";
import {
  useWhatsappCancelConnect,
  useWhatsappConnect,
  useWhatsappLogout,
  useWhatsappQR,
  useWhatsappStatus,
} from "@/features/whatsapp/hooks/useWhatsapp";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useToast } from "@/shared/hooks/use-toast";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Link,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function WhatsappCard() {
  const { toast } = useToast();
  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErr,
    refetch: refetchStatus,
  } = useWhatsappStatus();
  const isConnected = status?.connected ?? false;
  const isWaitingQR =
    status?.status === "waiting_qr_scan" || status?.has_qr === true;
  const {
    data: qrData,
    isLoading: qrLoading,
    isError: qrError,
    error: qrErr,
    refetch: refetchQR,
  } = useWhatsappQR(!statusLoading && isWaitingQR);
  const connectMutation = useWhatsappConnect();
  const cancelMutation = useWhatsappCancelConnect();
  const logoutMutation = useWhatsappLogout();

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync();
      toast({
        title: "Proses koneksi dimulai",
        description: "Scan QR code untuk menghubungkan WhatsApp.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memulai koneksi",
        description: getApiErrorMessage(err),
      });
    }
  };

  const handleCancelConnect = async () => {
    try {
      await cancelMutation.mutateAsync();
      toast({ title: "Koneksi dibatalkan" });
    } catch {
      /* empty */
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({ title: "WhatsApp berhasil diputus" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memutus koneksi",
        description: getApiErrorMessage(err),
      });
    }
  };

  const statusBadge = () => {
    if (statusLoading) return <Skeleton className="h-5 w-20 rounded-full" />;
    if (isConnected)
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full gap-1 text-xs">
          <CheckCircle2 className="h-3 w-3" /> Terhubung
        </Badge>
      );
    if (isWaitingQR)
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs">
          Menunggu Scan
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground rounded-full text-xs"
      >
        Tidak Terhubung
      </Badge>
    );
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<MessageCircle className="h-4 w-4 text-primary" />}
          title="WhatsApp"
          description="Hubungkan WA untuk kirim notifikasi ke penghuni"
          action={statusBadge()}
        />
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {statusError && (
          <div className="flex items-start gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{getApiErrorMessage(statusErr)}</span>
          </div>
        )}
        {statusLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}
        {!statusLoading && isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                WhatsApp terhubung dan siap mengirim notifikasi.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-lg cursor-pointer"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}{" "}
              Putus Koneksi
            </Button>
          </div>
        )}
        {!statusLoading && isWaitingQR && (
          <div className="space-y-3">
            {qrData?.instruction && (
              <p className="text-sm text-muted-foreground">
                {qrData.instruction}
              </p>
            )}
            {qrLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat QR code...
              </div>
            )}
            {qrError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {getApiErrorMessage(qrErr)}
              </div>
            )}
            {!qrLoading && !qrError && qrData?.qr && (
              <div className="flex flex-col items-start gap-2">
                <div className="rounded-xl border border-border p-3 bg-white w-fit">
                  <QRCodeSVG
                    value={qrData.qr}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  QR diperbarui otomatis setiap 30 detik.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8 text-xs cursor-pointer"
                  onClick={() => refetchQR()}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh QR
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-lg cursor-pointer"
              onClick={handleCancelConnect}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}{" "}
              Batal
            </Button>
          </div>
        )}
        {!statusLoading && !isConnected && !isWaitingQR && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              WhatsApp belum terhubung. Klik Hubungkan untuk mulai pairing via
              QR code.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-2 rounded-lg cursor-pointer"
                onClick={handleConnect}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}{" "}
                Hubungkan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-lg text-muted-foreground cursor-pointer"
                onClick={async () => {
                  const result = await refetchStatus();
                  const connected = result.data?.connected;
                  toast({
                    title: connected
                      ? "WhatsApp Terhubung"
                      : "WhatsApp Tidak Terhubung",
                    description: connected
                      ? "Status koneksi WhatsApp aktif."
                      : "WhatsApp belum terhubung. Klik Hubungkan untuk memulai.",
                  });
                }}
                disabled={connectMutation.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Cek Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WAConfigCard() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wa-config"],
    queryFn: () => settingsApi.getWaConfig(),
    staleTime: 0,
  });
  const [recipients, setRecipients] = React.useState<string[]>([]);
  const [newNumber, setNewNumber] = React.useState("");
  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const [notifPayment, setNotifPayment] = React.useState(true);
  const [notifDP, setNotifDP] = React.useState(true);
  const [notifMaintenance, setNotifMaintenance] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state dari server setiap kali data berubah
  React.useEffect(() => {
    if (!data) return;
    setRecipients(data.recipient_numbers ?? []);
    setNotifEnabled(data.notification_enabled ?? true);
    setNotifPayment(data.notif_payment ?? true);
    setNotifDP(data.notif_dp ?? true);
    setNotifMaintenance(data.notif_maintenance ?? true);
  }, [data]);

  const addNumber = () => {
    const num = newNumber.trim().replace(/\D/g, "");
    if (!num || recipients.includes(num)) return;
    setRecipients((prev) => [...prev, num]);
    setNewNumber("");
  };

  const removeNumber = (i: number) =>
    setRecipients((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    // Auto-add nomor yang sedang diketik jika belum diklik tombol "+"
    let finalRecipients = recipients;
    const pendingNum = newNumber.trim().replace(/\D/g, "");
    if (pendingNum && !recipients.includes(pendingNum)) {
      finalRecipients = [...recipients, pendingNum];
      setRecipients(finalRecipients);
      setNewNumber("");
    }
    setIsSaving(true);
    try {
      await settingsApi.saveWaConfig({
        recipient_numbers: finalRecipients,
        notification_enabled: notifEnabled,
        notif_payment: notifPayment,
        notif_dp: notifDP,
        notif_maintenance: notifMaintenance,
      });
      await refetch();
      toast({ title: "Konfigurasi WA berhasil disimpan" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: getApiErrorMessage(err),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<MessageCircle className="h-4 w-4 text-primary" />}
          title="Konfigurasi WhatsApp"
          description="Nomor penerima notifikasi dan status pengiriman"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Aktif</span>
              <Switch
                checked={notifEnabled}
                onCheckedChange={setNotifEnabled}
                aria-label="Aktifkan notifikasi WA"
              />
            </div>
          }
        />
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-3/4 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Nomor Penerima
              </Label>
              {recipients.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Belum ada nomor terdaftar.
                </p>
              )}
              {recipients.map((num, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50"
                >
                  <span className="flex-1 text-sm font-medium tabular-nums">
                    {num}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => removeNumber(i)}
                    aria-label="Hapus nomor"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="628xxxxxxxxxx"
                  value={newNumber}
                  inputMode="numeric"
                  onChange={(e) =>
                    setNewNumber(e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addNumber())
                  }
                  className="rounded-lg"
                  aria-label="Nomor WA baru"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNumber}
                  className="rounded-lg shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-lg cursor-pointer"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{" "}
              Simpan Konfigurasi
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function NotifPreferencesCard() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wa-config"],
    queryFn: () => settingsApi.getWaConfig(),
    staleTime: 0,
  });
  const [notifPayment, setNotifPayment] = React.useState(true);
  const [notifDP, setNotifDP] = React.useState(true);
  const [notifMaintenance, setNotifMaintenance] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    setNotifPayment(data.notif_payment ?? true);
    setNotifDP(data.notif_dp ?? true);
    setNotifMaintenance(data.notif_maintenance ?? true);
  }, [data]);

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      await settingsApi.saveWaConfig({
        recipient_numbers: data.recipient_numbers ?? [],
        notification_enabled: data.notification_enabled ?? true,
        notif_payment: notifPayment,
        notif_dp: notifDP,
        notif_maintenance: notifMaintenance,
      });
      await refetch();
      toast({ title: "Preferensi notifikasi berhasil disimpan" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: getApiErrorMessage(err),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<Bell className="h-4 w-4 text-primary" />}
          title="Notifikasi"
          description="Pilih jenis notifikasi WhatsApp yang ingin dikirim ke operator"
        />
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        <div className="flex items-center justify-between py-3 border-b border-border/40">
          <div>
            <p className="text-sm font-medium text-foreground">
              Notifikasi Pembayaran
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kirim notifikasi WA saat pembayaran jatuh tempo atau terlambat
            </p>
          </div>
          <Switch
            checked={notifPayment}
            onCheckedChange={setNotifPayment}
            aria-label="Notifikasi Pembayaran"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-border/40">
          <div>
            <p className="text-sm font-medium text-foreground">Notifikasi DP</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kirim notifikasi WA terkait konfirmasi DP yang hampir atau sudah
              kedaluwarsa
            </p>
          </div>
          <Switch
            checked={notifDP}
            onCheckedChange={setNotifDP}
            aria-label="Notifikasi DP"
          />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Notifikasi Maintenance
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kirim notifikasi WA saat ada laporan kerusakan baru masuk
            </p>
          </div>
          <Switch
            checked={notifMaintenance}
            onCheckedChange={setNotifMaintenance}
            aria-label="Notifikasi Maintenance"
          />
        </div>
        <div className="pt-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-lg cursor-pointer"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Simpan Preferensi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
