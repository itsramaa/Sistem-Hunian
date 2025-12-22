import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Calendar, Home, User, Clock, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface Contract {
  id: string;
  tenant_user_id: string;
  end_date: string;
  rent_amount: number;
  status: string;
  churn_reason: string | null;
  unit: {
    unit_number: string;
    property: {
      name: string;
    } | null;
  } | null;
}

export function ContractNoticePeriod() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [churnReason, setChurnReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch contracts expiring within 60 days
  const { data: expiringContracts = [], isLoading } = useQuery({
    queryKey: ['expiring-contracts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const today = new Date();
      const sixtyDaysLater = new Date();
      sixtyDaysLater.setDate(today.getDate() + 60);

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          unit:units (
            unit_number,
            property:properties (name)
          )
        `)
        .eq('merchant_id', merchant.id)
        .eq('status', 'active')
        .lte('end_date', sixtyDaysLater.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0])
        .order('end_date', { ascending: true });
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch tenant profiles
  const tenantIds = expiringContracts.map(c => c.tenant_user_id);
  const { data: tenantProfiles = [] } = useQuery({
    queryKey: ['tenant-profiles-notice', tenantIds],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', tenantIds);
      if (error) throw error;
      return data;
    },
    enabled: tenantIds.length > 0,
  });

  const profileMap = new Map(tenantProfiles.map(p => [p.user_id, p]));

  const updateContractMutation = useMutation({
    mutationFn: async ({ contractId, churnReason }: { contractId: string; churnReason: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ churn_reason: churnReason })
        .eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiring-contracts'] });
      setDialogOpen(false);
      setSelectedContract(null);
      setChurnReason('');
      toast.success('Notice period recorded');
    },
    onError: () => {
      toast.error('Failed to update contract');
    },
  });

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft <= 7) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {daysLeft} days left</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge variant="outline" className="text-warning border-warning gap-1"><Clock className="h-3 w-3" /> {daysLeft} days left</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" /> {daysLeft} days left</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const CHURN_REASONS = [
    { value: 'end_of_lease', label: 'End of Lease' },
    { value: 'relocation', label: 'Relocation' },
    { value: 'price_increase', label: 'Price Increase' },
    { value: 'service_issue', label: 'Service Issues' },
    { value: 'buying_property', label: 'Buying Own Property' },
    { value: 'other', label: 'Other' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Contracts Expiring Soon
          </CardTitle>
          <CardDescription>
            {expiringContracts.length} contracts expiring within 60 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiringContracts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Expiring Contracts</h3>
              <p className="text-muted-foreground">All contracts are valid for more than 60 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringContracts.map((contract) => {
                const tenant = profileMap.get(contract.tenant_user_id);
                const daysLeft = getDaysUntilExpiry(contract.end_date);

                return (
                  <div 
                    key={contract.id} 
                    className={`p-4 rounded-lg border ${daysLeft <= 7 ? 'border-destructive/50 bg-destructive/5' : daysLeft <= 30 ? 'border-warning/50 bg-warning/5' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{tenant?.full_name || 'Unknown Tenant'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(contract.end_date), 'dd MMM yyyy')} • {formatCurrency(contract.rent_amount)}/month
                        </p>
                        {contract.churn_reason && (
                          <Badge variant="outline" className="mt-1">
                            Notice: {CHURN_REASONS.find(r => r.value === contract.churn_reason)?.label || contract.churn_reason}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getUrgencyBadge(daysLeft)}
                        {!contract.churn_reason && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setDialogOpen(true);
                            }}
                          >
                            Record Notice
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Notice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Notice Period</DialogTitle>
            <DialogDescription>
              Select the reason why this tenant is leaving
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CHURN_REASONS.map((reason) => (
                <Button
                  key={reason.value}
                  variant={churnReason === reason.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChurnReason(reason.value)}
                  className="justify-start"
                >
                  {reason.label}
                </Button>
              ))}
            </div>
            {churnReason === 'other' && (
              <Textarea
                placeholder="Please specify the reason..."
                value={churnReason}
                onChange={(e) => setChurnReason(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedContract && churnReason) {
                  updateContractMutation.mutate({
                    contractId: selectedContract.id,
                    churnReason,
                  });
                }
              }}
              disabled={!churnReason || updateContractMutation.isPending}
            >
              {updateContractMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
