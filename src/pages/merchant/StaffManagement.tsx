import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useStaffMembers,
  useInviteStaff,
  useRemoveStaff,
  useStaffPermissions,
  useUpdateStaffPermissions,
} from '@/features/staff/hooks/useStaffMembers';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  STAFF_ROLE_LABELS,
  type PermissionKey,
  type StaffRole,
} from '@/features/staff/constants/permissions';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import {
  ChevronDown,
  Loader2,
  Plus,
  Shield,
  UserMinus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';

export default function StaffManagement() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const { data: staff = [], isLoading } = useStaffMembers(merchant?.id);
  const inviteMutation = useInviteStaff();
  const removeMutation = useRemoveStaff();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [permStaffId, setPermStaffId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', displayName: '', phone: '', role: 'caretaker' as StaffRole });

  const handleInvite = async () => {
    if (!merchant?.id || !form.email || !form.displayName) return;
    try {
      // For now, use a placeholder user_id. In production, look up user by email
      await inviteMutation.mutateAsync({
        merchant_id: merchant.id,
        user_id: crypto.randomUUID(), // placeholder - should lookup by email
        staff_role: form.role,
        display_name: form.displayName,
        email: form.email,
        phone: form.phone || undefined,
      });
      toast({ title: 'Staff diundang', description: `${form.displayName} ditambahkan sebagai ${STAFF_ROLE_LABELS[form.role]}` });
      setInviteOpen(false);
      setForm({ email: '', displayName: '', phone: '', role: 'caretaker' });
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    }
  };

  const roleBadgeColor: Record<StaffRole, string> = {
    caretaker: 'bg-primary/10 text-primary',
    property_manager: 'bg-success/10 text-success',
    accountant: 'bg-warning/10 text-warning',
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Manajemen Staff" description="Kelola caretaker, property manager, dan akuntan.">
        <Button onClick={() => setInviteOpen(true)} className="gap-2 gradient-cta text-primary-foreground rounded-xl">
          <Plus className="h-4 w-4" /> Undang Staff
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : staff.length === 0 ? (
        <Card className="rounded-2xl border-border/40">
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada staff. Klik "Undang Staff" untuk menambahkan.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((s: any) => (
            <Card key={s.id} className={`rounded-2xl border-border/40 ${!s.is_active ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.display_name}</CardTitle>
                  <Badge variant="secondary" className={`${roleBadgeColor[s.staff_role as StaffRole] || ''} text-xs`}>
                    {STAFF_ROLE_LABELS[s.staff_role as StaffRole] || s.staff_role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{s.email}</p>
                {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{s.is_active ? '✅ Aktif' : '⛔ Nonaktif'}</span>
                  {(s.property_ids as string[])?.length > 0 && (
                    <span>• {(s.property_ids as string[]).length} properti</span>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => setPermStaffId(s.id)}>
                    <Shield className="h-3 w-3" /> Izin
                  </Button>
                  {s.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1 text-destructive"
                      onClick={() => {
                        removeMutation.mutate({ id: s.id, merchantId: merchant?.id || '' });
                        toast({ title: 'Staff dinonaktifkan' });
                      }}
                    >
                      <UserMinus className="h-3 w-3" /> Nonaktifkan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Undang Staff</DialogTitle>
            <DialogDescription>Tambahkan anggota tim ke properti Anda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Telepon (opsional)</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>Peran</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as StaffRole }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(STAFF_ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleInvite} disabled={inviteMutation.isPending} className="gradient-cta text-primary-foreground rounded-xl">
              {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Undang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      {permStaffId && (
        <PermissionsDialog staffId={permStaffId} onClose={() => setPermStaffId(null)} />
      )}
    </div>
  );
}

function PermissionsDialog({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const { data: perms = [], isLoading } = useStaffPermissions(staffId);
  const updateMutation = useUpdateStaffPermissions();
  const { toast } = useToast();

  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);

  if (!initialized && perms.length > 0) {
    const map: Record<string, boolean> = {};
    for (const p of perms) map[p.permission_key] = p.is_granted;
    setLocalPerms(map);
    setInitialized(true);
  }

  const toggle = (key: PermissionKey) => {
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    const arr = ALL_PERMISSION_KEYS.map(key => ({
      permission_key: key,
      is_granted: localPerms[key] ?? false,
    }));
    try {
      await updateMutation.mutateAsync({ staffId, permissions: arr });
      toast({ title: 'Izin disimpan' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Izin Staff</DialogTitle>
          <DialogDescription>Atur izin akses granular untuk staff ini.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4 py-4">
            {PERMISSION_GROUPS.map((group) => (
              <Collapsible key={group.label} defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-semibold py-1 hover:text-primary transition-colors">
                  <ChevronDown className="h-4 w-4" />
                  {group.label}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-2 pt-2">
                  {group.keys.map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm font-normal cursor-pointer" htmlFor={`perm-${key}`}>
                        {PERMISSION_LABELS[key]}
                      </Label>
                      <Switch
                        id={`perm-${key}`}
                        checked={localPerms[key] ?? false}
                        onCheckedChange={() => toggle(key)}
                      />
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Batal</Button>
          <Button onClick={save} disabled={updateMutation.isPending} className="gradient-cta text-primary-foreground rounded-xl">
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Izin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
