import { useState, useEffect } from 'react';
import { Send, Search, Users, Mail, Clock, CheckCircle, XCircle, Home } from 'lucide-react';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { StatsCardSkeleton, TableRowSkeleton } from '@/components/ui/skeletons';

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

type InvitationFormData = z.infer<typeof invitationSchema>;

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  accepted: 'bg-success/10 text-success border-success/30',
  expired: 'bg-muted text-muted-foreground border-muted',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function MerchantTenants() {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [activeContractsCount, setActiveContractsCount] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

      // Fetch active contracts count
      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', 'active');

      setActiveContractsCount(count || 0);
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

  const resendInvitation = async (invitation: TenantInvitation) => {
    toast({ 
      title: 'Invitation Resent', 
      description: `Invitation resent to ${invitation.email}` 
    });
  };

  const availableUnits = properties.flatMap(p => 
    (p.units || [])
      .filter(u => u.status === 'available')
      .map(u => ({ ...u, propertyName: p.name }))
  );

  const filteredInvitations = invitations.filter(inv =>
    inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.unit?.property?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.unit?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MerchantLayout
      title="Tenants"
      description="Manage tenant invitations"
      actions={
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, property, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Invitations List */}
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
                  {filteredInvitations.map((inv) => (
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
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(inv.expires_at), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {inv.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => resendInvitation(inv)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => cancelInvitation(inv.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
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
      </div>
    </MerchantLayout>
  );
}