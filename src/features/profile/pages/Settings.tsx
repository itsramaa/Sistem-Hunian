// @refresh reset
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
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { useToast } from "@/shared/hooks/use-toast";
import { apiClient } from "@/shared/lib/axios";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Globe,
  Info,
  Link,
  Loader2,
  LogOut,
  MessageCircle,
  Moon,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";

// ─── Shared SectionHeader ────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── NotificationRow ─────────────────────────────────────────────────────────
function NotificationRow({
  label,
  description,
  defaultChecked = false,
  id,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
  id: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={setChecked}
        aria-label={label}
      />
    </div>
  );
}

// ─── UserManagementCard ──────────────────────────────────────────────────────
function UserManagementCard() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/users");
      setUsers(data?.data ?? data ?? []);
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal memuat pengguna", description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post("/users", { nama, email, password, role });
      toast({ title: "Pengguna berhasil dibuat" });
      setShowForm(false);
      setNama(""); setEmail(""); setPassword(""); setRole("operator");
      fetchUsers();
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal membuat pengguna", description: getApiErrorMessage(err) });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Nonaktifkan pengguna "${name}"?`)) return;
    try {
      await apiClient.delete(`/users/${id}`);
      toast({ title: "Pengguna berhasil dinonaktifkan" });
      fetchUsers();
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: getApiErrorMessage(err) });
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<Users className="h-4 w-4 text-primary" />}
          title="Manajemen Pengguna"
          description="Kelola akun operator, manajer, dan viewer"
          action={
            !showForm ? (
              <Button size="sm" className="h-8 gap-1.5 rounded-lg cursor-pointer" onClick={() => setShowForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Tambah
              </Button>
            ) : undefined
          }
        />
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">Pengguna Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-nama" className="text-xs">Nama</Label>
                <Input id="new-nama" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama lengkap" required className="rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-role" className="text-xs">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="new-role" className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email" className="text-xs">Email</Label>
              <Input id="new-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-xs">Password</Label>
              <Input id="new-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} className="rounded-lg" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="rounded-lg cursor-pointer" disabled={creating}>
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />} Buat
              </Button>
              <Button type="button" size="sm" variant="ghost" className="rounded-lg cursor-pointer" onClick={() => setShowForm(false)}>
                Batal
              </Button>
            </div>
          </form>
        )}

        {/* Users list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Belum ada pengguna terdaftar.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.nama}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize shrink-0">{u.role}</Badge>
                {u.is_active !== false && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                    onClick={() => handleDeactivate(u.id, u.nama)}
                    aria-label="Nonaktifkan pengguna"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

// ─── WhatsappCard ─────────────────────────────────────────────────────────────
function WhatsappCard() {
  const { toast } = useToast();
  const { data: status, isLoading: statusLoading, isError: statusError, error: statusErr, refetch: refetchStatus } = useWhatsappStatus();
  const isConnected = status?.connected ?? false;
  const isWaitingQR = status?.status === "waiting_qr_scan";
  const { data: qrData, isLoading: qrLoading, isError: qrError, error: qrErr, refetch: refetchQR } = useWhatsappQR(!statusLoading && isWaitingQR);
  const connectMutation = useWhatsappConnect();
  const cancelMutation = useWhatsappCancelConnect();
  const logoutMutation = useWhatsappLogout();

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync();
      toast({ title: "Proses koneksi dimulai", description: "Scan QR code untuk menghubungkan WhatsApp." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal memulai koneksi", description: getApiErrorMessage(err) });
    }
  };

  const handleCancelConnect = async () => {
    try { await cancelMutation.mutateAsync(); toast({ title: "Koneksi dibatalkan" }); } catch {}
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({ title: "WhatsApp berhasil diputus" });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal memutus koneksi", description: getApiErrorMessage(err) });
    }
  };

  const statusBadge = () => {
    if (statusLoading) return <Skeleton className="h-5 w-20 rounded-full" />;
    if (isConnected) return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full gap-1 text-xs"><CheckCircle2 className="h-3 w-3" /> Terhubung</Badge>;
    if (isWaitingQR) return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs">Menunggu Scan</Badge>;
    return <Badge variant="outline" className="text-muted-foreground rounded-full text-xs">Tidak Terhubung</Badge>;
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
              <p className="text-sm text-green-700 dark:text-green-300">WhatsApp terhubung dan siap mengirim notifikasi.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-lg cursor-pointer" onClick={handleLogout} disabled={logoutMutation.isPending}>
              {logoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Putus Koneksi
            </Button>
          </div>
        )}

        {!statusLoading && isWaitingQR && (
          <div className="space-y-3">
            {qrData?.instruction && <p className="text-sm text-muted-foreground">{qrData.instruction}</p>}
            {qrLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Memuat QR code...</div>}
            {qrError && <div className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{getApiErrorMessage(qrErr)}</div>}
            {!qrLoading && !qrError && qrData?.qr && (
              <div className="flex flex-col items-start gap-2">
                <div className="rounded-xl border border-border p-3 bg-white w-fit">
                  <QRCodeSVG value={qrData.qr} size={160} level="M" includeMargin={false} />
                </div>
                <p className="text-xs text-muted-foreground">QR diperbarui otomatis setiap 30 detik.</p>
                <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs cursor-pointer" onClick={() => refetchQR()}>
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh QR
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 rounded-lg cursor-pointer" onClick={handleCancelConnect} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Batal
            </Button>
          </div>
        )}

        {!statusLoading && !isConnected && !isWaitingQR && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">WhatsApp belum terhubung. Klik Hubungkan untuk mulai pairing via QR code.</p>
            <div className="flex gap-2">
              <Button size="sm" className="gap-2 rounded-lg cursor-pointer" onClick={handleConnect} disabled={connectMutation.isPending}>
                {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
                Hubungkan
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg text-muted-foreground cursor-pointer" onClick={() => refetchStatus()} disabled={connectMutation.isPending}>
                <RefreshCw className="h-3.5 w-3.5" /> Cek Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── WAConfigCard ─────────────────────────────────────────────────────────────
function WAConfigCard() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wa-config"],
    queryFn: () => apiClient.get("/settings/wa-config").then(r => r.data?.data ?? { recipient_numbers: [], notification_enabled: true }),
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
    setRecipients(prev => [...prev, num]);
    setNewNumber("");
  };

  const removeNumber = (i: number) => setRecipients(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put("/settings/wa-config", { recipient_numbers: recipients, notification_enabled: notifEnabled });
      await refetch();
      toast({ title: "Konfigurasi WA berhasil disimpan" });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: getApiErrorMessage(err) });
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
              <Label className="text-xs text-muted-foreground">Nomor Penerima</Label>
              {recipients.length === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada nomor terdaftar.</p>
              )}
              {recipients.map((num, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                  <span className="flex-1 text-sm font-medium tabular-nums">{num}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer" onClick={() => removeNumber(i)} aria-label="Hapus nomor">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="628xxxxxxxxxx"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addNumber())}
                  className="rounded-lg"
                  aria-label="Nomor WA baru"
                />
                <Button variant="outline" onClick={addNumber} className="rounded-lg shrink-0 cursor-pointer">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full rounded-lg cursor-pointer">
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
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Konfigurasi tampilan, notifikasi, dan preferensi akun</p>
      </div>

      {/* ── Tampilan ─────────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<Moon className="h-4 w-4 text-primary" />}
            title="Tampilan"
            description="Sesuaikan tema aplikasi sesuai preferensi Anda"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
            <div>
              <p className="text-sm font-medium text-foreground">Mode Gelap / Terang</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ubah tema tampilan aplikasi</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* ── Preferensi Notifikasi ──────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<Bell className="h-4 w-4 text-primary" />}
            title="Preferensi Notifikasi"
            description="Pilih jenis notifikasi yang ingin Anda terima"
          />
        </CardHeader>
        <CardContent className="pt-0 divide-y divide-border/50">
          <NotificationRow
            id="notif-payment-due"
            label="Pembayaran Jatuh Tempo"
            description="Pemberitahuan saat pembayaran mendekati tanggal jatuh tempo"
            defaultChecked={true}
          />
          <NotificationRow
            id="notif-payment-overdue"
            label="Pembayaran Terlambat"
            description="Pemberitahuan saat ada pembayaran yang melewati tanggal jatuh tempo"
            defaultChecked={true}
          />
          <NotificationRow
            id="notif-dp-expired"
            label="DP Confirmation Kedaluwarsa"
            description="Pemberitahuan saat konfirmasi DP sudah melewati batas waktu"
            defaultChecked={true}
          />
          <NotificationRow
            id="notif-dp-approaching"
            label="DP Confirmation Mendekati Batas"
            description="Pemberitahuan saat konfirmasi DP mendekati tanggal kedaluwarsa"
            defaultChecked={true}
          />
          <NotificationRow
            id="notif-room-status"
            label="Perubahan Status Kamar"
            description="Pemberitahuan saat ada perubahan status kamar"
            defaultChecked={false}
          />
        </CardContent>
      </Card>

      {/* ── WhatsApp — operator only ──────────────────────────────────────── */}
      {isOperator && <WhatsappCard />}

      {/* ── Manajemen Pengguna — operator only ───────────────────────────── */}
      {isOperator && <UserManagementCard />}

      {/* ── Konfigurasi WA — operator only ───────────────────────────────── */}
      {isOperator && <WAConfigCard />}

      {/* ── Informasi Aplikasi ────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<Globe className="h-4 w-4 text-primary" />}
            title="Informasi Aplikasi"
            description="Versi dan teknologi yang digunakan"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-0 divide-y divide-border/40">
            {[
              { label: "Versi", value: "1.0.0" },
              { label: "Platform", value: "Web App" },
              { label: "Framework", value: "React 18 + Vite" },
              { label: "Backend", value: "Go (Fiber)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
