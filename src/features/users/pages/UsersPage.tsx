import React, { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '../hooks/useUsers';
import { AppUser, CreateUserPayload, UpdateUserPayload } from '../types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Plus, Loader2, Users, Edit, UserX, UserCheck } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataCard } from '@/shared/components/DataCard';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const roleLabel: Record<string, string> = { manager: 'Manajer', viewer: 'Viewer' };
const roleClass: Record<string, string> = {
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const createSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['manager', 'viewer']),
});
type CreateForm = z.infer<typeof createSchema>;

const updateSchema = z.object({
  nama: z.string().min(2).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['manager', 'viewer']).optional(),
});
type UpdateForm = z.infer<typeof updateSchema>;

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AppUser | null>(null);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { nama: '', email: '', password: '', role: 'manager' },
  });
  const updateForm = useForm<UpdateForm>({ resolver: zodResolver(updateSchema) });

  const handleCreate = async (payload: CreateForm) => {
    try {
      await createMutation.mutateAsync(payload as CreateUserPayload);
      setCreateOpen(false);
      createForm.reset();
      toast({ title: 'Pengguna berhasil ditambahkan' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: err?.response?.data?.error?.message || 'Gagal menambahkan pengguna' });
    }
  };

  const handleUpdate = async (payload: UpdateForm) => {
    if (!editTarget) return;
    const clean: UpdateUserPayload = {};
    if (payload.nama) clean.nama = payload.nama;
    if (payload.email) clean.email = payload.email;
    if (payload.role) clean.role = payload.role;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload: clean });
      setEditTarget(null);
      toast({ title: 'Pengguna berhasil diupdate' });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal update pengguna' });
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateMutation.mutateAsync(deactivateTarget.id);
      setDeactivateTarget(null);
      toast({ title: `Akun ${deactivateTarget.nama} dinonaktifkan` });
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menonaktifkan akun' });
    }
  };

  const fmt = (d: string) => { try { return format(new Date(d), 'dd MMM yyyy', { locale: localeId }); } catch { return d; } };

  const openEdit = (user: AppUser) => {
    setEditTarget(user);
    updateForm.reset({ nama: user.nama, email: user.email, role: user.role });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kelola Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola akun Manajer dan Viewer</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2 rounded-xl min-h-[44px]">
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Memuat...</span>
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada pengguna" description="Tambah Manajer atau Viewer untuk memberikan akses." action={{ label: 'Tambah Pengguna', onClick: () => setCreateOpen(true), icon: Plus }} />
      ) : isMobile ? (
        <div className="space-y-3">
          {users.map(u => (
            <DataCard key={u.id}
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{u.nama}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleClass[u.role] ?? ''}`}>{roleLabel[u.role] ?? u.role}</span>
                    <Badge variant={u.is_active ? 'default' : 'secondary'} className="rounded-full">{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </div>
                </div>
              }
              fields={[{ label: 'Dibuat', value: fmt(u.created_at) }]}
              actions={
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs rounded-lg min-h-[44px]" onClick={() => openEdit(u)}>
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {u.is_active && (
                    <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs rounded-lg text-destructive min-h-[44px]" onClick={() => setDeactivateTarget(u)}>
                      <UserX className="h-3.5 w-3.5" /> Nonaktifkan
                    </Button>
                  )}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                <TableHead className="font-semibold text-xs uppercase">Nama</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Email</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Role</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Status</TableHead>
                <TableHead className="font-semibold text-xs uppercase">Dibuat</TableHead>
                <TableHead className="font-semibold text-xs uppercase text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="text-sm font-medium">{u.nama}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleClass[u.role] ?? ''}`}>{roleLabel[u.role] ?? u.role}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'} className="rounded-full">{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{fmt(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" onClick={() => openEdit(u)}>
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                      {u.is_active ? (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg text-destructive" onClick={() => setDeactivateTarget(u)}>
                          <UserX className="h-3.5 w-3.5" /> Nonaktifkan
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Nonaktif</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
              <div><DialogTitle>Tambah Pengguna</DialogTitle><p className="text-sm text-muted-foreground">Buat akun Manajer atau Viewer</p></div>
            </div>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Nama pengguna" {...createForm.register('nama')} />
              {createForm.formState.errors.nama && <p className="text-sm text-destructive">{createForm.formState.errors.nama.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@contoh.com" {...createForm.register('email')} />
              {createForm.formState.errors.email && <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password Awal</Label>
              <Input type="password" placeholder="Min. 6 karakter" {...createForm.register('password')} />
              {createForm.formState.errors.password && <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="manager" onValueChange={v => createForm.setValue('role', v as 'manager' | 'viewer')}>
                <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manajer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); createForm.reset(); }}>Batal</Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2 rounded-xl">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Tambah
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={v => !v && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <p className="text-sm text-muted-foreground">{editTarget?.email}</p>
          </DialogHeader>
          <form onSubmit={updateForm.handleSubmit(handleUpdate)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Nama pengguna" {...updateForm.register('nama')} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@contoh.com" {...updateForm.register('email')} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={updateForm.watch('role')} onValueChange={v => updateForm.setValue('role', v as 'manager' | 'viewer')}>
                <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manajer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Batal</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="gap-2 rounded-xl">
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={v => !v && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <strong>{deactivateTarget?.nama}</strong> ({deactivateTarget?.email}) akan dinonaktifkan. Pengguna tidak bisa login sampai diaktifkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={deactivateMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deactivateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
