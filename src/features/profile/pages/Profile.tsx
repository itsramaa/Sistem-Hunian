// @refresh reset
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { apiClient } from "@/shared/lib/axios";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ─── Role config ─────────────────────────────────────────────────────────────
const roleConfig: Record<string, { label: string; className: string }> = {
  operator: {
    label: "Operator",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  manager: {
    label: "Manajer",
    className:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  viewer: {
    label: "Viewer",
    className: "bg-muted text-muted-foreground border-border",
  },
};

// ─── Password schema ──────────────────────────────────────────────────────────
const pwSchema = z
  .object({
    old_password: z.string().min(1, "Password saat ini wajib diisi"),
    new_password: z.string().min(6, "Minimal 6 karakter"),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm"],
  });

type PwForm = z.infer<typeof pwSchema>;

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
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
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const roleInfo = roleConfig[profile?.role ?? ""] ?? {
    label: profile?.role ?? "—",
    className: "bg-muted text-muted-foreground",
  };

  // ── Phone ──────────────────────────────────────────────────────────────────
  const [phone, setPhone] = useState(profile?.nomor_telepon ?? "");
  const [savingPhone, setSavingPhone] = useState(false);

  // ── Email ──────────────────────────────────────────────────────────────────
  const [emailMode, setEmailMode] = useState(false);
  const [newEmail, setNewEmail] = useState(profile?.email ?? user?.email ?? "");
  const [emailPw, setEmailPw] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // ── Password (react-hook-form + zod) ───────────────────────────────────────
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { old_password: "", new_password: "", confirm: "" },
  });

  const savePhone = async () => {
    setSavingPhone(true);
    try {
      await apiClient.patch("/auth/me", { nomor_telepon: phone });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "Nomor telepon diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: getApiErrorMessage(err),
      });
    } finally {
      setSavingPhone(false);
    }
  };

  const saveEmail = async () => {
    if (!newEmail || !emailPw) return;
    setSavingEmail(true);
    try {
      await apiClient.patch("/auth/me", {
        email: newEmail,
        current_password: emailPw,
      });
      qc.invalidateQueries({ queryKey: ["me"] });
      setEmailMode(false);
      setEmailPw("");
      toast({ title: "Email diperbarui" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui email",
        description: getApiErrorMessage(err),
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const onSubmitPw = async (data: PwForm) => {
    try {
      await apiClient.post("/auth/change-password", {
        old_password: data.old_password,
        new_password: data.new_password,
      });
      form.reset();
      toast({ title: "Password berhasil diubah" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal mengubah password",
        description: getApiErrorMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola informasi dan keamanan akun Anda
        </p>
      </div>

      {/* ── Identity Card ────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<User className="h-4 w-4 text-primary" />}
            title="Identitas Akun"
            description="Nama, role, dan status akun Anda"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground truncate">
                {profile?.nama ?? user?.nama ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {profile?.email ?? user?.email ?? "—"}
              </p>
            </div>
            {/* Role badge */}
            <Badge
              className={`rounded-full text-xs border shrink-0 ${roleInfo.className}`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {roleInfo.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Contact Info ─────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<Phone className="h-4 w-4 text-primary" />}
            title="Informasi Kontak"
            description="Email dan nomor telepon yang terhubung ke akun"
          />
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </label>
              {!emailMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary hover:text-primary cursor-pointer"
                  onClick={() => setEmailMode(true)}
                >
                  <Pencil className="h-3 w-3" /> Ubah
                </Button>
              )}
            </div>

            {emailMode ? (
              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@baru.com"
                  className="rounded-lg"
                  aria-label="Email baru"
                />
                <Input
                  id="email-pw"
                  type="password"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  placeholder="Konfirmasi password saat ini"
                  className="rounded-lg"
                  aria-label="Password konfirmasi"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="rounded-lg cursor-pointer"
                    onClick={saveEmail}
                    disabled={savingEmail || !newEmail || !emailPw}
                  >
                    {savingEmail && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    )}
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg cursor-pointer"
                    onClick={() => {
                      setEmailMode(false);
                      setEmailPw("");
                      setNewEmail(profile?.email ?? user?.email ?? "");
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center h-9 px-3 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-sm text-foreground">
                  {profile?.email ?? user?.email ?? "—"}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Phone */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground flex items-center gap-2"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Nomor Telepon
            </label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="rounded-lg"
              />
              <Button
                className="shrink-0 rounded-lg cursor-pointer"
                onClick={savePhone}
                disabled={savingPhone}
              >
                {savingPhone ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Security ─────────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<KeyRound className="h-4 w-4 text-primary" />}
            title="Keamanan"
            description="Ubah password untuk menjaga keamanan akun"
          />
        </CardHeader>
        <CardContent className="pt-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitPw)}
              className="space-y-4"
            >
              {/* Old password */}
              <FormField
                control={form.control}
                name="old_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Password Saat Ini</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showOld ? "text" : "password"}
                          placeholder="••••••••"
                          className="pr-10 rounded-lg"
                          aria-label="Password saat ini"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowOld((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label={
                            showOld
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showOld ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New password */}
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Password Baru</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showNew ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          className="pr-10 rounded-lg"
                          aria-label="Password baru"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowNew((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label={
                            showNew
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showNew ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm */}
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Konfirmasi Password Baru
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Ulangi password baru"
                        className="rounded-lg"
                        aria-label="Konfirmasi password baru"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full rounded-lg cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Simpan Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
