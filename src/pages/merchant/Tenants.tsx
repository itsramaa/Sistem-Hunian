import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/integrations/supabase/client';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { StatsCardSkeleton, TableRowSkeleton } from '@/shared/components/ui/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { formatCurrency } from '@/shared/utils/currency';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';
import { AlertTriangle, Building, Calendar, CheckCircle, Clock, Copy, DollarSign, Eye, Home, Mail, Phone, RefreshCw, Search, Send, Trash2, Users, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ActiveTenant, TenantInvitation } from '@/features/users/types/tenant';

// Indonesian phone validation
const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;

const invitationSchema = z.object({
  unit_id: z.string().min(1, 'Please select a unit'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return phoneRegex.test(val.replace(/\s|-/g, ''));
  }, 'Invalid Indonesian phone number (e.g., +628123456789)'),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  accepted: 'bg-success/10 text-success border-success/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

const contractStatusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  draft: 'bg-muted text-muted-foreground border-muted',
  pending_signature: 'bg-warning/10 text-warning border-warning/30',
  notice: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  terminated: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function MerchantTenants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<ActiveTenant | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<ActiveTenant | null>(null);
  const [activeTab, setActiveTab] = useState('invitations');
  const { toast } = useToast();
  const { merchant } = useAuth();
  const queryClient = useQueryClient();

  const inviteForm = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      unit_id: '',
      email: '',
      phone: '',
    },
  });

  // Fetch properties with units using React Query
  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['merchant-properties-with-units', merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, units(id, unit_number, status)')
        .eq('merchant_id', merchant?.id);
      if (error) throw error;
      return (data as Property[]) || [];
    },
    enabled: !!merchant?.id,
  });

  // Fetch invitations using React Query
  const { data: invitations = [], isLoading: invitationsLoading, error: invitationsError, refetch: refetchInvitations } = useQuery({
    queryKey: ['tenant-invitations', merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_invitations')
        .select('*, units:unit_id(unit_number, properties:property_id(name))')
        .eq('merchant_id', merchant?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform invitations data
      return (data || []).map((inv: { units: { unit_number: string; properties: { name: string } | null } | null } & Record<string, any>) => ({
        ...inv,
        unit: inv.units ? {
          unit_number: inv.units.unit_number,
          property: inv.units.properties ? { name: inv.units.properties.name } : undefined
        } : undefined
      })) as TenantInvitation[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch active tenants (from contracts)
  const { data: activeTenants = [], isLoading: tenantsLoading, refetch: refetchTenants } = useQuery({
    queryKey: ['active-tenants', merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id, 
          status, 
          start_date, 
          end_date, 
          rent_amount,
          deposit_amount,
          tenant_user_id,
          unit:units(id, unit_number, property:properties(id, name))
        `)
        .eq('merchant_id', merchant?.id)
        .in('status', ['active', 'pending_signature', 'notice']);

      if (error) throw error;

      // Fetch profiles for all tenant_user_ids
      const tenantUserIds = (data || []).map(c => c.tenant_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', tenantUserIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return (data || []).map((contract: { tenant_user_id: string } & Record<string, any>) => ({
        ...contract,
        profile: profileMap.get(contract.tenant_user_id) || null
      })) as ActiveTenant[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch active contracts count
  const { data: activeContractsCount = 0 } = useQuery({
    queryKey: ['active-contracts-count', merchant?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant?.id)
        .eq('status', 'active');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!merchant?.id,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      if (!merchant) throw new Error('Merchant not found');

      // Check for existing pending invitation to same email
      const { data: existingEmail } = await supabase
        .from('tenant_invitations')
        .select('id')
        .eq('merchant_id', merchant.id)
        .eq('email', data.email.toLowerCase().trim())
        .eq('status', 'pending')
        .maybeSingle();

      if (existingEmail) {
        throw new Error('A pending invitation already exists for this email address');
      }

      // Check for existing pending invitation for this unit
      const { data: existingUnit } = await supabase
        .from('tenant_invitations')
        .select('id')
        .eq('unit_id', data.unit_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingUnit) {
        throw new Error('A pending invitation already exists for this unit');
      }

      const { error } = await supabase
        .from('tenant_invitations')
        .insert({
          merchant_id: merchant.id,
          unit_id: data.unit_id,
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.replace(/\s|-/g, '') || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ 
        title: 'Invitation Sent', 
        description: `Invitation sent to ${inviteForm.getValues('email')}` 
      });
      setShowInviteDialog(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send invitation',
      });
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenant_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invitation Cancelled' });
      queryClient.invalidateQueries({ queryKey: ['tenant-invitations'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to cancel',
        description: error.message || 'Could not cancel the invitation. Please try again.',
      });
    },
  });

  // Terminate contract mutation (delete tenant)
  const terminateContractMutation = useMutation({
    mutationFn: async (contract: ActiveTenant) => {
      // Update contract status to terminated
      const { error: contractError } = await supabase
        .from('contracts')
        .update({ 
          status: 'terminated',
          actual_end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', contract.id);

      if (contractError) throw contractError;

      // Update unit status back to available
      if (contract.unit?.id) {
        const { error: unitError } = await supabase
          .from('units')
          .update({ status: 'available' })
          .eq('id', contract.unit.id);

        if (unitError) throw unitError;
      }

      // Update tenant's current_unit_id to null
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ current_unit_id: null })
        .eq('user_id', contract.tenant_user_id);

      if (tenantError) throw tenantError;
    },
    onSuccess: () => {
      toast({ 
        title: 'Contract Terminated', 
        description: 'The tenant has been removed from this unit.' 
      });
      setShowDeleteDialog(false);
      setTenantToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['active-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['active-contracts-count'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-properties-with-units'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to terminate contract',
        description: error.message || 'Could not remove the tenant. Please try again.',
      });
    },
  });

  const resendInvitation = async (invitation: TenantInvitation) => {
    // TODO: Implement actual email resend via edge function
    toast({ 
      title: 'Invitation Resent', 
      description: `Invitation resent to ${invitation.email}` 
    });
  };

  const copyInvitationLink = (invitation: TenantInvitation) => {
    // Use environment-based URL
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({ 
      title: 'Copied!', 
      description: 'Invitation link copied to clipboard' 
    });
  };

  const handleViewDetail = (tenant: ActiveTenant) => {
    setSelectedTenant(tenant);
    setShowDetailDialog(true);
  };

  const handleDeleteTenant = (tenant: ActiveTenant) => {
    setTenantToDelete(tenant);
    setShowDeleteDialog(true);
  };

  // Memoize available units calculation
  const availableUnits = useMemo(() => 
    properties.flatMap(p => 
      (p.units || [])
        .filter(u => u.status === 'available')
        .map(u => ({ ...u, propertyName: p.name }))
    ), [properties]
  );

  // Memoize filtered invitations
  const filteredInvitations = useMemo(() => 
    invitations.filter(inv => {
      const matchesSearch = inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.unit?.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.unit?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [invitations, searchQuery, statusFilter]
  );

  // Memoize filtered active tenants
  const filteredActiveTenants = useMemo(() => 
    activeTenants.filter(tenant => {
      const matchesSearch = 
        tenant.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.unit?.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.unit?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }), [activeTenants, searchQuery]
  );

  const loading = propertiesLoading || invitationsLoading || tenantsLoading;
  const hasError = propertiesError || invitationsError;

  // Calculate time remaining for pending invitations
  const getExpiryStatus = (expiresAt: string) => {
    const daysRemaining = differenceInDays(new Date(expiresAt), new Date());
    if (daysRemaining <= 0) return { text: 'Expired', urgent: true };
    if (daysRemaining <= 2) return { text: `${daysRemaining}d left`, urgent: true };
    return { text: format(new Date(expiresAt), 'MMM d, yyyy'), urgent: false };
  };

  if (hasError) {
    return (
      <MerchantLayout title="Tenants" description="Manage tenant invitations and active tenants">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load data</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              There was an error loading tenant data. Please try again.
            </p>
            <Button onClick={() => { refetchInvitations(); refetchTenants(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout
      title="Tenants"
      description="Manage tenant invitations and active tenants"
      actions={
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button disabled={availableUnits.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Tenant</DialogTitle>
              <DialogDescription>
                Send an invitation link to a prospective tenant
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={inviteForm.handleSubmit((data) => sendInvitationMutation.mutate(data))} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="unit_id">Select Unit</Label>
                <Select 
                  value={inviteForm.watch('unit_id')} 
                  onValueChange={(value) => inviteForm.setValue('unit_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.propertyName} - Unit {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inviteForm.formState.errors.unit_id && (
                  <p className="text-sm text-destructive mt-1">{inviteForm.formState.errors.unit_id.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tenant@example.com"
                  {...inviteForm.register('email')}
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">{inviteForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="+62812345678"
                  {...inviteForm.register('phone')}
                />
                {inviteForm.formState.errors.phone && (
                  <p className="text-sm text-destructive mt-1">{inviteForm.formState.errors.phone.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Indonesian format: +62, 62, or 08 prefix
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendInvitationMutation.isPending}>
                  {sendInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Invitations</p>
                    <p className="text-2xl font-bold">
                      {invitations.filter(i => i.status === 'pending').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tenants</p>
                    <p className="text-2xl font-bold">{activeContractsCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Units</p>
                    <p className="text-2xl font-bold">{availableUnits.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invitations</p>
                    <p className="text-2xl font-bold">{invitations.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-info/10">
                    <Users className="h-5 w-5 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="invitations">
              Invitations
              {invitations.filter(i => i.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {invitations.filter(i => i.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Tenants
              {activeTenants.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeTenants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, property, or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === 'invitations' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="mt-4">
            {loading ? (
              <Card>
                <CardContent className="p-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={5} />
                  ))}
                </CardContent>
              </Card>
            ) : filteredInvitations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Send className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Send your first invitation to a prospective tenant
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)} disabled={availableUnits.length === 0}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unit</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expires</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvitations.map((inv) => {
                        const expiryStatus = getExpiryStatus(inv.expires_at);
                        return (
                          <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{inv.email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {inv.unit?.property?.name} - Unit {inv.unit?.unit_number}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={statusColors[inv.status || 'pending']}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm ${expiryStatus.urgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                {expiryStatus.text}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {inv.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      title="Copy invitation link"
                                      onClick={() => copyInvitationLink(inv)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      title="Resend invitation"
                                      onClick={() => resendInvitation(inv)}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      title="Cancel invitation"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => cancelInvitationMutation.mutate(inv.id)}
                                      disabled={cancelInvitationMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Tenants Tab */}
          <TabsContent value="active" className="mt-4">
            {loading ? (
              <Card>
                <CardContent className="p-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={5} />
                  ))}
                </CardContent>
              </Card>
            ) : filteredActiveTenants.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active tenants</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Send invitations to get tenants for your properties
                  </p>
                  <Button onClick={() => setActiveTab('invitations')}>
                    View Invitations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tenant</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unit</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rent</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActiveTenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {tenant.profile?.full_name || 'Unknown'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {tenant.profile?.email || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {tenant.unit?.property?.name} - Unit {tenant.unit?.unit_number}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={contractStatusColors[tenant.status || 'active']}>
                              {tenant.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatCurrency(tenant.rent_amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="View details"
                                onClick={() => handleViewDetail(tenant)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Remove tenant"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteTenant(tenant)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tenant Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              View detailed information about this tenant
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTenant.profile?.full_name || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTenant.profile?.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTenant.profile?.phone || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Unit Info */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Unit Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTenant.unit?.property?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>Unit {selectedTenant.unit?.unit_number}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contract Info */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Contract Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Contract Period</span>
                    </div>
                    <span className="text-sm">
                      {format(new Date(selectedTenant.start_date), 'MMM d, yyyy')} - {format(new Date(selectedTenant.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Monthly Rent</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(selectedTenant.rent_amount)}</span>
                  </div>
                  {selectedTenant.deposit_amount && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Deposit</span>
                      </div>
                      <span className="text-sm">{formatCurrency(selectedTenant.deposit_amount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant="outline" className={contractStatusColors[selectedTenant.status]}>
                      {selectedTenant.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{tenantToDelete?.profile?.full_name || 'this tenant'}</strong> from <strong>Unit {tenantToDelete?.unit?.unit_number}</strong>?
              <br /><br />
              This will:
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Terminate the current contract</li>
                <li>Mark the unit as available</li>
                <li>Remove the tenant's access to this unit</li>
              </ul>
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => tenantToDelete && terminateContractMutation.mutate(tenantToDelete)}
              disabled={terminateContractMutation.isPending}
            >
              {terminateContractMutation.isPending ? 'Removing...' : 'Remove Tenant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MerchantLayout>
  );
}
