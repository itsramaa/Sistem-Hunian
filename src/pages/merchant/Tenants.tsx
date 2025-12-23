import { useState, useEffect } from 'react';
import { Plus, Search, Users, Mail, Phone, Home, Send, Copy, Clock, CheckCircle, XCircle, FileText, Eye, Wallet } from 'lucide-react';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

interface TenantInvitation {
  id: string;
  merchant_id: string;
  unit_id: string;
  email: string;
  phone: string | null;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  unit?: {
    unit_number: string;
    property?: {
      name: string;
    };
  };
}

interface Contract {
  id: string;
  merchant_id: string;
  unit_id: string;
  tenant_user_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  status: string;
  terms: string | null;
  created_at: string;
  unit?: {
    unit_number: string;
    property?: {
      name: string;
    };
  };
  tenant_profile?: {
    full_name: string;
    email: string;
  };
}

interface Property {
  id: string;
  name: string;
  units: { id: string; unit_number: string; status: string }[];
}

const invitationSchema = z.object({
  unit_id: z.string().min(1, 'Please select a unit'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const contractSchema = z.object({
  unit_id: z.string().min(1, 'Please select a unit'),
  tenant_email: z.string().email('Tenant email is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  rent_amount: z.coerce.number().positive('Rent must be positive'),
  deposit_amount: z.coerce.number().min(0),
  billing_day: z.coerce.number().min(1).max(28).optional(),
  terms: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;
type ContractFormData = z.infer<typeof contractSchema>;

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  accepted: 'bg-success/10 text-success border-success/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  draft: 'bg-muted text-muted-foreground border-muted',
  active: 'bg-success/10 text-success border-success/30',
  terminated: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function MerchantTenants() {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const { toast } = useToast();
  const { merchant } = useAuth();

  const inviteForm = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      unit_id: '',
      email: '',
      phone: '',
    },
  });

  const contractForm = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      unit_id: '',
      tenant_email: '',
      start_date: '',
      end_date: '',
      rent_amount: 0,
      deposit_amount: 0,
      billing_day: undefined,
      terms: '',
    },
  });

  useEffect(() => {
    if (merchant) {
      fetchData();
    }
  }, [merchant]);

  const fetchData = async () => {
    if (!merchant) return;
    setLoading(true);
    try {
      // Fetch properties with units
      const { data: propsData } = await supabase
        .from('properties')
        .select('id, name, units(id, unit_number, status)')
        .eq('merchant_id', merchant.id);

      setProperties((propsData as Property[]) || []);

      // Fetch invitations
      const { data: invData } = await supabase
        .from('tenant_invitations')
        .select('*, units:unit_id(unit_number, properties:property_id(name))')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      // Transform invitations data
      const transformedInvitations = (invData || []).map((inv: any) => ({
        ...inv,
        unit: inv.units ? {
          unit_number: inv.units.unit_number,
          property: inv.units.properties ? { name: inv.units.properties.name } : undefined
        } : undefined
      }));
      setInvitations(transformedInvitations);

      // Fetch contracts
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*, units:unit_id(unit_number, properties:property_id(name))')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      // Transform contracts data
      const transformedContracts = (contractData || []).map((c: any) => ({
        ...c,
        unit: c.units ? {
          unit_number: c.units.unit_number,
          property: c.units.properties ? { name: c.units.properties.name } : undefined
        } : undefined
      }));
      setContracts(transformedContracts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (data: InvitationFormData) => {
    if (!merchant) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('tenant_invitations')
        .insert({
          merchant_id: merchant.id,
          unit_id: data.unit_id,
          email: data.email,
          phone: data.phone || null,
        });

      if (error) throw error;
      
      toast({ 
        title: 'Invitation Sent', 
        description: `Invitation sent to ${data.email}` 
      });
      setShowInviteDialog(false);
      inviteForm.reset();
      fetchData();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send invitation',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateContract = async (data: ContractFormData) => {
    if (!merchant) return;
    setActionLoading(true);
    try {
      // For now, we'll use a placeholder tenant_user_id
      // In production, this would be linked to an actual user
      const { error } = await supabase
        .from('contracts')
        .insert({
          merchant_id: merchant.id,
          unit_id: data.unit_id,
          tenant_user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          start_date: data.start_date,
          end_date: data.end_date,
          rent_amount: data.rent_amount,
          deposit_amount: data.deposit_amount,
          billing_day: data.billing_day || null,
          terms: data.terms || null,
          status: 'draft',
        });

      if (error) throw error;
      
      toast({ 
        title: 'Contract Created', 
        description: 'Contract draft has been created' 
      });
      setShowContractDialog(false);
      contractForm.reset();
      fetchData();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create contract',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link Copied', description: 'Invitation link copied to clipboard' });
  };

  const cancelInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tenant_invitations')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Invitation Cancelled' });
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to cancel invitation',
      });
    }
  };

  const availableUnits = properties.flatMap(p => 
    (p.units || [])
      .filter(u => u.status === 'available')
      .map(u => ({ ...u, propertyName: p.name }))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MerchantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Tenants</h1>
            <p className="text-muted-foreground">Manage tenant invitations and contracts</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
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
                <form onSubmit={inviteForm.handleSubmit(handleSendInvitation)} className="space-y-4 mt-4">
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
                      placeholder="+62..."
                      {...inviteForm.register('phone')}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
              <DialogTrigger asChild>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Contract</DialogTitle>
                  <DialogDescription>
                    Create a new rental contract for a tenant
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={contractForm.handleSubmit(handleCreateContract)} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="contract_unit_id">Select Unit</Label>
                    <Select 
                      value={contractForm.watch('unit_id')} 
                      onValueChange={(value) => contractForm.setValue('unit_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.propertyName} - Unit {unit.unit_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tenant_email">Tenant Email</Label>
                    <Input
                      id="tenant_email"
                      type="email"
                      placeholder="tenant@example.com"
                      {...contractForm.register('tenant_email')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        {...contractForm.register('start_date')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        {...contractForm.register('end_date')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rent_amount">Monthly Rent (IDR)</Label>
                      <Input
                        id="rent_amount"
                        type="number"
                        {...contractForm.register('rent_amount')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deposit_amount">Deposit (IDR)</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        {...contractForm.register('deposit_amount')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billing_day">Billing Day (1-28)</Label>
                    <Select 
                      value={contractForm.watch('billing_day')?.toString() || ''} 
                      onValueChange={(value) => contractForm.setValue('billing_day', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Use merchant default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Use merchant default</SelectItem>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Day {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to use your default billing day
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      placeholder="Contract terms..."
                      {...contractForm.register('terms')}
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowContractDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={actionLoading}>
                      {actionLoading ? 'Creating...' : 'Create Contract'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Invitations</p>
                  <p className="text-3xl font-bold">
                    {invitations.filter(i => i.status === 'pending').length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contracts</p>
                  <p className="text-3xl font-bold">
                    {contracts.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Units</p>
                  <p className="text-3xl font-bold">{availableUnits.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Home className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tenants</p>
                  <p className="text-3xl font-bold">
                    {contracts.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-info/10">
                  <Users className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invitations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invitations">
              Invitations ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="contracts">
              Contracts ({contracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Send className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Send your first invitation to a prospective tenant
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}>
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
                      {invitations.map((inv) => (
                        <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{inv.email}</span>
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
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {format(new Date(inv.expires_at), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyInvitationLink(inv.token)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {inv.status === 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => cancelInvitation(inv.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
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

          <TabsContent value="contracts" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : contracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first rental contract
                  </p>
                  <Button onClick={() => setShowContractDialog(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Contract
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(contract.start_date), 'MMM d, yyyy')} - {format(new Date(contract.end_date), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={statusColors[contract.status || 'draft']}>
                          {contract.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-medium">{formatCurrency(contract.rent_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">{formatCurrency(contract.deposit_amount)}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.location.href = `/merchant/contracts`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.location.href = `/merchant/payments?tenant=${contract.tenant_user_id}`}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Payments
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MerchantLayout>
  );
}
