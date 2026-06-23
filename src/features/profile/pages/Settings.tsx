import { useAuth } from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  useWhatsappCancelConnect,
  useWhatsappConnect,
  useWhatsappLogout,
  useWhatsappQR,
  useWhatsappStatus,
} from "@/features/whatsapp/hooks/useWhatsapp";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { useToast } from "@/shared/hooks/use-toast";
import { apiClient } from "@/shared/lib/axios";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Globe,
  Link,
  Loader2,
  LogOut,
  MessageCircle,
  Moon,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";

// ─── Notification Toggle ─────────────────────────────────────────────────────
function NotificationToggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
      </label>
    </div>
  );
}

// ─── Create User Form ────────────────────────────────────────────────────────
function CreateUserForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [role, setRole] = useState("operator");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ email, password, nama, role });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 mb-4 p-3 rounded-xl border border-border/40 bg-muted/20"
    >
      <p className="text-sm font-semibold">Tambah Pengguna Baru</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Nama</Label>
          <Input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama lengkap"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          required
          minLength={6}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="rounded-xl"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Buat Pengguna
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="rounded-xl"
        >
          Batal
        </Button>
      </div>
    </form>
  );
}

// ─── User Management Card ────────────────────────────────────────────────────
function UserManagementCard() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/users");
      setUsers(data?.data ?? data ?? []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memuat pengguna",
        description: getApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (payload: any) => {
    await apiClient.post("/users", payload);
    toast({ title: "Pengguna berhasil dibuat" });
    setShowForm(false);
    fetchUsers();
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Nonaktifkan pengguna ini?")) return;
    try {
      await apiClient.delete(`/users/${id}`);
      toast({ title: "Pengguna berhasil dinonaktifkan" });
      fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: getApiErrorMessage(err),
      });
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Manajemen Pengguna</CardTitle>
          </div>
          {!showForm && (
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => setShowForm(true)}
            >
              Tambah
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <CreateUserForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada pengguna terdaftar.
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.nama}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs capitalize">
                    {u.role}
                  </Badge>
                </div>
                {u.is_active !== false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDeactivate(u.id)}
                  >
                    Nonaktifkan
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── WhatsApp Card — operator only ───────────────────────────────────────────
function WhatsappCard() {
  const { toast } = useToast();

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErr,
    refetch: refetchStatus,
  } = useWhatsappStatus();

  const isConnected = status?.connected ?? false;
  const isWaitingQR = status?.status === "waiting_qr_scan";

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
        description: "Scan QR code yang muncul untuk menghubungkan WhatsApp.",
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
      toast({ title: "Proses koneksi dibatalkan" });
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "WhatsApp berhasil diputus",
        description: "Scan QR code baru untuk menghubungkan kembali.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memutus koneksi",
        description: getApiErrorMessage(err),
      });
    }
  };

  const statusBadge = () => {
    if (statusLoading) return <Skeleton className="h-6 w-24 rounded-full" />;
    if (isConnected)
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full gap-1">
          <CheckCircle2 className="h-3 w-3" /> Terhubung
        </Badge>
      );
    if (isWaitingQR)
      return (
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
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Putus Koneksi
            </Button>
          </div>
        )}

        {/* Waiting QR scan state */}
        {!statusLoading && isWaitingQR && (
          <div className="space-y-3">
            {qrData?.instruction && (
              <p className="text-sm text-muted-foreground">
                {qrData.instruction}
              </p>
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
                <p className="text-xs text-muted-foreground">
                  QR diperbarui otomatis setiap 30 detik.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8 text-xs"
                  onClick={() => refetchQR()}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh QR
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Disconnected — belum ada proses koneksi */}
        {!statusLoading && !isConnected && !isWaitingQR && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              WhatsApp belum terhubung. Klik Hubungkan untuk memulai pairing via
              QR code.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-2 rounded-xl"
                onClick={handleConnect}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                Hubungkan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-xl text-muted-foreground"
                onClick={() => refetchStatus()}
                disabled={connectMutation.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Cek Status
              </Button>
            </div>
          </div>
        )}

        {/* Waiting QR — tombol Batal untuk stop proses koneksi */}
        {!statusLoading && isWaitingQR && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleCancelConnect}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Batal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── WA Config Card ───────────────────────────────────────────────────────────
function WAConfigCard() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wa-config"],
    queryFn: () =>
      apiClient.get("/settings/wa-config").then(
        (r) =>
          r.data?.data ?? {
            recipient_numbers: [],
            notification_enabled: true,
          },
      ),
  });
  const [recipients, setRecipients] = React.useState<string[]>([]);
  const [newNumber, setNewNumber] = React.useState("");
  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (data) {
      setRecipients(data.recipient_numbers ?? []);
      setNotifEnabled(data.notification_enabled ?? true);
    }
  }, [data]);

  const addNumber = () => {
    const num = newNumber.trim().replace(/\D/g, "");
    if (!num || recipients.includes(num)) return;
    setRecipients((prev) => [...prev, num]);
    setNewNumber("");
  };

  const removeNumber = (i: number) => {
    setRecipients((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put("/settings/wa-config", {
        recipient_numbers: recipients,
        notification_enabled: notifEnabled,
      });
      await refetch();
      toast({ title: "WA config berhasil disimpan" });
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Konfigurasi WhatsApp</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">
              Notifikasi WA
            </Label>
            <button
              onClick={() => setNotifEnabled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${notifEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifEnabled ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-sm">Nomor Penerima Notifikasi</Label>
              {recipients.map((num, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{num}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeNumber(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="628xxxxxxxxxx"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNumber()}
                  className="rounded-xl"
                />
                <Button
                  variant="outline"
                  onClick={addNumber}
                  className="rounded-xl shrink-0"
                >
                  Tambah
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-xl"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan Konfigurasi
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { profile } = useAuth();
  const isOperator = profile?.role === "operator";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Konfigurasi preferensi akun
        </p>
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Ubah tema tampilan aplikasi
              </p>
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
            Notifikasi sistem dikirim secara otomatis oleh background worker
            untuk alert DP, pembayaran jatuh tempo, dan pembayaran terlambat.
          </p>
        </CardContent>
      </Card>

      {/* WhatsApp — operator only */}
      {isOperator && <WhatsappCard />}

      {/* Notification Preferences — all roles */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Preferensi Notifikasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pilih jenis notifikasi yang ingin Anda terima melalui sistem.
          </p>

          <div className="space-y-3">
            <NotificationToggle
              label="Pembayaran Jatuh Tempo"
              description="Pemberitahuan saat pembayaran mendekati tanggal jatuh tempo"
              defaultChecked={true}
            />
            <NotificationToggle
              label="Pembayaran Terlambat"
              description="Pemberitahuan saat ada pembayaran yang sudah melewati tanggal jatuh tempo"
              defaultChecked={true}
            />
            <NotificationToggle
              label="DP Confirmation Expired"
              description="Pemberitahuan saat konfirmasi DP sudah kedaluwarsa"
              defaultChecked={true}
            />
            <NotificationToggle
              label="DP Confirmation Approaching Deadline"
              description="Pemberitahuan saat konfirmasi DP mendekati batas waktu"
              defaultChecked={true}
            />
            <NotificationToggle
              label="Room Status Changed"
              description="Pemberitahuan saat ada perubahan status kamar"
              defaultChecked={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Management — operator only */}
      {isOperator && <UserManagementCard />}

      {/* WA Config — operator only */}
      {isOperator && <WAConfigCard />}

      {/* System info */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Informasi Aplikasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versi</span>
            <span className="font-medium tabular-nums">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-medium">Web App</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span className="font-medium">React 18 + Vite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Backend</span>
            <span className="font-medium">Go (Fiber)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
