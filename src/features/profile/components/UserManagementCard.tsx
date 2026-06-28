import React, { useEffect, useState } from "react";
import { settingsApi } from "@/features/profile/api/settingsApi";
import { SectionHeader } from "@/features/profile/components/SectionHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useToast } from "@/shared/hooks/use-toast";
import { Info, Loader2, Pencil, Plus, Trash2, User, Users } from "lucide-react";

export function UserManagementCard() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editNama, setEditNama] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("viewer");
  const [editing, setEditing] = useState(false);

  // Deactivate confirm state
  const [deactivateTarget, setDeactivateTarget] = useState<any>(null);
  const [deactivating, setDeactivating] = useState(false);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await settingsApi.getUsers();
      setUsers(result);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await settingsApi.createUser({ name: nama, email, password, role });
      toast({ title: "Pengguna berhasil dibuat" });
      setShowForm(false);
      setNama("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal membuat pengguna",
        description: getApiErrorMessage(err),
      });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: any) => {
    setEditTarget(u);
    setEditNama(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    try {
      await settingsApi.updateUser(editTarget.id, {
        name: editNama,
        email: editEmail,
        role: editRole,
      });
      toast({ title: "Data pengguna berhasil diperbarui" });
      setEditTarget(null);
      fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui pengguna",
        description: getApiErrorMessage(err),
      });
    } finally {
      setEditing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await settingsApi.deleteUser(deactivateTarget.id);
      toast({ title: "Pengguna berhasil dinonaktifkan" });
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal menonaktifkan pengguna",
        description: getApiErrorMessage(err),
      });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <SectionHeader
            icon={<Users className="h-4 w-4 text-primary" />}
            title="Manajemen Pengguna"
            description="Kelola akun operator dan viewer"
            action={
              !showForm ? (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg cursor-pointer"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah
                </Button>
              ) : undefined
            }
          />
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {showForm && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">
                Pengguna Baru
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-nama" className="text-xs">
                    Nama
                  </Label>
                  <Input
                    id="new-nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama lengkap"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-role" className="text-xs">
                    Role
                  </Label>
                  {/* P10-1: Operator & Viewer tersedia */}
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="new-role" className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw" className="text-xs">
                  Password
                </Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-lg cursor-pointer"
                  disabled={creating}
                >
                  {creating && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  )}{" "}
                  Buat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-lg cursor-pointer"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" /> Belum ada pengguna
              terdaftar.
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize shrink-0"
                  >
                    {u.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${u.is_active !== false ? "border-green-500/50 text-green-600 bg-green-50 dark:bg-green-900/20" : "border-red-500/50 text-red-600 bg-red-50 dark:bg-red-900/20"}`}
                  >
                    {u.is_active !== false ? "Aktif" : "Nonaktif"}
                  </Badge>
                  {/* P10-2: Edit hanya untuk non-Operator */}
                  {u.role !== "operator" && u.is_active !== false && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 cursor-pointer"
                      onClick={() => openEdit(u)}
                      aria-label="Edit pengguna"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {/* P10-3: AlertDialog untuk nonaktifkan — hanya untuk non-Operator */}
                  {u.role !== "operator" && u.is_active !== false && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                      onClick={() => setDeactivateTarget(u)}
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

      {/* Edit dialog — hanya untuk non-Operator */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Pengguna</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nama" className="text-xs">
                Nama
              </Label>
              <Input
                id="edit-nama"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role" className="text-xs">
                Role
              </Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger id="edit-role" className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Perubahan role ke Operator tidak diizinkan melalui modul ini.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={editing}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={editing}
                className="gap-2 rounded-xl"
              >
                {editing && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog nonaktifkan akun */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => !v && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <strong>{deactivateTarget?.name}</strong> akan dinonaktifkan.
              Seluruh sesi aktif pengguna ini akan segera diinvalidasi dan
              pengguna akan otomatis dikeluarkan dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deactivating}
              onClick={() => setDeactivateTarget(null)}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={deactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivating && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Ya, Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
