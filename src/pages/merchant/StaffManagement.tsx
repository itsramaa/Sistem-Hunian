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
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Building2,
  ChevronDown,
  Loader2,
  Plus,
  Shield,
  UserMinus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useProperties(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-properties-staff', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('merchant_id', merchantId!)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });
}

export default function StaffManagement() {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const { data: staff = [], isLoading } = useStaffMembers(merchant?.id);
  const { data: properties = [] } = useProperties(merchant?.id);
  const inviteMutation = useInviteStaff();
  const removeMutation = useRemoveStaff();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [permStaffId, setPermStaffId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', displayName: '', phone: '', role: 'caretaker' as StaffRole });
  const [allProperties, setAllProperties] = useState(true);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

  const handleInvite = async () => {
    if (!merchant?.id || !form.email || !form.displayName) return;
    try {
      await inviteMutation.mutateAsync({
        merchant_id: merchant.id,
        user_id: crypto.randomUUID(),
        staff_role: form.role,
        display_name: form.displayName,
        email: form.email,
        phone: form.phone || undefined,
        property_ids: allProperties ? [] : selectedPropertyIds,
      });
      toast({ title: 'Staff diundang', description: `${form.displayName} ditambahkan sebagai ${STAFF_ROLE_LABELS[form.role]}` });
      setInviteOpen(false);
      setForm({ email: '', displayName: '', phone: '', role: 'caretaker' });
      setAllProperties(true);
      setSelectedPropertyIds([]);
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    }
  };

  const togglePropertySelection = (id: string) => {
    setSelectedPropertyIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Build property name map for display
  const propertyNameMap = new Map(properties.map(p => [p.id, p.name]));

  const resolvePropertyNames = (ids: string[]): string[] => {
    return ids.map(id => propertyNameMap.get(id) || id).sort();
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
          {staff.map((s: any) => {
            const staffPropertyIds = (s.property_ids as string[]) || [];
            const propertyNames = resolvePropertyNames(staffPropertyIds);
            return (
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
                  </div>
                  {/* Property scope display */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {staffPropertyIds.length === 0 ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Semua Properti</Badge>
                    ) : (
                      propertyNames.map(name => (
                        <Badge key={name} variant="outline" className="text-[10px] px-1.5 py-0">{name}</Badge>
                      ))
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
            );
          })}
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
            {/* Property Selector */}
            <div className="grid gap-2">
              <Label>Akses Properti</Label>
              <div className="rounded-xl border border-border/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all-properties"
                    checked={allProperties}
                    onCheckedChange={(checked) => {
                      setAllProperties(!!checked);
                      if (checked) setSelectedPropertyIds([]);
                    }}
                  />
                  <Label htmlFor="all-properties" className="text-sm font-normal cursor-pointer">
                    Semua Properti
                  </Label>
                </div>
                {!allProperties && properties.map(p => (
                  <div key={p.id} className="flex items-center gap-2 pl-4">
                    <Checkbox
                      id={`prop-${p.id}`}
                      checked={selectedPropertyIds.includes(p.id)}
                      onCheckedChange={() => togglePropertySelection(p.id)}
                    />
                    <Label htmlFor={`prop-${p.id}`} className="text-sm font-normal cursor-pointer">
                      {p.name}
                    </Label>
                  </div>
                ))}
              </div>
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
        <PermissionsDialog
          staffId={permStaffId}
          staff={staff}
          properties={properties}
          onClose={() => setPermStaffId(null)}
        />
      )}
    </div>
  );
}

function PermissionsDialog({
  staffId,
  staff,
  properties,
  onClose,
}: {
  staffId: string;
  staff: any[];
  properties: { id: string; name: string }[];
  onClose: () => void;
}) {
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

  // Resolve property scope for this staff member
  const staffMember = staff.find((s: any) => s.id === staffId);
  const staffPropertyIds = (staffMember?.property_ids as string[]) || [];
  const propertyNameMap = new Map(properties.map(p => [p.id, p.name]));
  const scopeNames = staffPropertyIds.map(id => propertyNameMap.get(id) || id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Izin Staff</DialogTitle>
          <DialogDescription>Atur izin akses granular untuk staff ini.</DialogDescription>
        </DialogHeader>

        {/* Property scope info */}
        <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">Cakupan Properti: </span>
            {staffPropertyIds.length === 0 ? (
              <span className="text-muted-foreground">Semua Properti</span>
            ) : (
              <span className="text-muted-foreground">{scopeNames.join(', ')}</span>
            )}
          </div>
        </div>

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
