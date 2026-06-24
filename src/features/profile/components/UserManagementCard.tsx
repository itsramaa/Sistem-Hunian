import React, { useEffect, useState } from "react";
import { settingsApi } from "@/features/profile/api/settingsApi";
import { SectionHeader } from "@/features/profile/components/SectionHeader";
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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getApiErrorMessage } from "@/shared/utils/api-errors";
import { useToast } from "@/shared/hooks/use-toast";
import { Info, Loader2, Plus, Trash2, User, Users } from "lucide-react";

export function UserManagementCard() {
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
      const result = await settingsApi.getUsers();
      setUsers(result);
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
      await settingsApi.createUser({ nama, email, password, role });
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
      await settingsApi.deleteUser(id);
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
        {showForm && (
          <form onSubmit={handleCreate} className="p-4 rounded-xl border border-border/60 bg-muted/30 space-y-3">
            <p className="text-sm font-semibold text-foreground">Pengguna Baru</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-nama" className="text-xs">Nama</Label>
                <Input id="new-nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" required className="rounded-lg" />
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
              <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-xs">Password</Label>
              <Input id="new-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} className="rounded-lg" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" className="rounded-lg cursor-pointer" disabled={creating}>
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />} Buat
              </Button>
              <Button type="button" size="sm" variant="ghost" className="rounded-lg cursor-pointer" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : users.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" /> Belum ada pengguna terdaftar.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
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
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer" onClick={() => handleDeactivate(u.id, u.nama)} aria-label="Nonaktifkan pengguna">
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
