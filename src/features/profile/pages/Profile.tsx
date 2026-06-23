import { useAuth } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { apiClient } from "@/shared/lib/axios";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const roleLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  operator: { label: "Operator", variant: "default" },
  manager: { label: "Manajer", variant: "secondary" },
  viewer: { label: "Viewer", variant: "outline" },
};

const pwSchema = z
  .object({
    old_password: z.string().min(1, "Password lama wajib diisi"),
    new_password: z.string().min(6, "Minimal 6 karakter"),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm"],
  });

// ─── Row helper ───────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Phone
  const [phone, setPhone] = useState(profile?.nomor_telepon ?? "");
  const [savingPhone, setSavingPhone] = useState(false);

  // Email edit
  const [emailMode, setEmailMode] = useState(false);
  const [newEmail, setNewEmail] = useState(profile?.email ?? user?.email ?? "");
  const [emailPw, setEmailPw] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);

  const roleInfo = roleLabels[profile?.role ?? ""] ?? {
    label: profile?.role ?? "—",
    variant: "outline" as const,
  };

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

  const savePw = async () => {
    const result = pwSchema.safeParse(pw);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) errs[String(e.path[0])] = e.message;
      });
      setPwErrors(errs);
      return;
    }
    setSavingPw(true);
    try {
      await apiClient.post("/auth/change-password", {
        old_password: pw.old_password,
        new_password: pw.new_password,
      });
      setPw({ old_password: "", new_password: "", confirm: "" });
      setPwErrors({});
      toast({ title: "Password berhasil diubah" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal mengubah password",
        description: getApiErrorMessage(err),
      });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola informasi akun Anda
        </p>
      </div>

      {/* ── Identitas ──────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardContent className="pt-5 pb-2 px-5">
          {/* Avatar + nama */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {profile?.nama ?? user?.nama ?? "—"}
              </p>
              <Badge
                variant={roleInfo.variant}
                className="rounded-full mt-1 text-xs"
              >
                <Shield className="h-3 w-3 mr-1" />
                {roleInfo.label}
              </Badge>
            </div>
          </div>

          <Separator className="mb-1" />

          {/* Email */}
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
            {emailMode ? (
              <div className="space-y-2 mt-1">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@baru.com"
                  className="h-8 rounded-lg text-sm"
                />
                <Input
                  type="password"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  placeholder="Konfirmasi password saat ini"
                  className="h-8 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs rounded-lg"
                    onClick={saveEmail}
                    disabled={savingEmail || !newEmail || !emailPw}
                  >
                    {savingEmail ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs rounded-lg"
                    onClick={() => {
                      setEmailMode(false);
                      setEmailPw("");
                      setNewEmail(profile?.email ?? user?.email ?? "");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{profile?.email ?? user?.email ?? "—"}</span>
                <button
                  onClick={() => setEmailMode(true)}
                  className="text-xs text-primary hover:underline font-normal"
                >
                  Ubah
                </button>
              </div>
            )}
          </InfoRow>

          <Separator className="my-1" />

          {/* Nomor Telepon */}
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Nomor Telepon">
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="h-8 rounded-lg text-sm max-w-[200px]"
              />
              <Button
                size="sm"
                className="h-8 text-xs rounded-lg"
                onClick={savePhone}
                disabled={savingPhone}
              >
                {savingPhone ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </InfoRow>
        </CardContent>
      </Card>

      {/* ── Ubah Password ──────────────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardContent className="pt-5 pb-5 px-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Ubah Password</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="old_pw" className="text-xs">
              Password Saat Ini
            </Label>
            <Input
              id="old_pw"
              type="password"
              value={pw.old_password}
              onChange={(e) =>
                setPw((p) => ({ ...p, old_password: e.target.value }))
              }
              placeholder="••••••••"
              className="rounded-xl"
            />
            {pwErrors.old_password && (
              <p className="text-xs text-destructive">
                {pwErrors.old_password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new_pw" className="text-xs">
              Password Baru
            </Label>
            <div className="relative">
              <Input
                id="new_pw"
                type={showPw ? "text" : "password"}
                value={pw.new_password}
                onChange={(e) =>
                  setPw((p) => ({ ...p, new_password: e.target.value }))
                }
                placeholder="Minimal 6 karakter"
                className="pr-10 rounded-xl"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {pwErrors.new_password && (
              <p className="text-xs text-destructive">
                {pwErrors.new_password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_pw" className="text-xs">
              Konfirmasi Password Baru
            </Label>
            <Input
              id="confirm_pw"
              type="password"
              value={pw.confirm}
              onChange={(e) =>
                setPw((p) => ({ ...p, confirm: e.target.value }))
              }
              placeholder="Ulangi password baru"
              className="rounded-xl"
            />
            {pwErrors.confirm && (
              <p className="text-xs text-destructive">{pwErrors.confirm}</p>
            )}
          </div>

          <Button
            onClick={savePw}
            disabled={
              savingPw || !pw.old_password || !pw.new_password || !pw.confirm
            }
            className="w-full rounded-xl gap-2"
          >
            {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
