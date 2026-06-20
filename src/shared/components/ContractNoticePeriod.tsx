import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { apiClient } from '@/shared/lib/axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
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

  const { data: expiringContracts = [], isLoading } = useQuery({
    queryKey: ['expiring-contracts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      // TODO: Go endpoint not yet implemented — was: supabase.from('contracts').select(...)
      return [];
    },
    enabled: !!merchant?.id,
  });

  const tenantIds = expiringContracts.map(c => c.tenant_user_id);
  const { data: tenantProfiles = [] } = useQuery({
    queryKey: ['tenant-profiles-notice', tenantIds],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      // TODO: Go endpoint not yet implemented — was: supabase.from('profiles').select('user_id, full_name, email').in('user_id', tenantIds)
      return [];
    },
    enabled: tenantIds.length > 0,
  });

  const profileMap = new Map(tenantProfiles.map(p => [p.user_id, p]));

  const updateContractMutation = useMutation({
    mutationFn: async ({ contractId, churnReason }: { contractId: string; churnReason: string }) => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('contracts').update({ churn_reason: churnReason }).eq('id', contractId)
      await Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiring-contracts'] });
      setDialogOpen(false);
      setSelectedContract(null);
      setChurnReason('');
      toast.success('Notice period recorded');
    },
    onError: () => { toast.error('Failed to update contract'); },
  });

  const getDaysUntilExpiry = (endDate: string) => differenceInDays(new Date(endDate), new Date());

  const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft <= 7) return <Badge variant="destructive" className="gap-1 rounded-full"><AlertTriangle className="h-3 w-3" /> {daysLeft} days left</Badge>;
    if (daysLeft <= 30) return <Badge variant="outline" className="text-warning border-warning gap-1 rounded-full"><Clock className="h-3 w-3" /> {daysLeft} days left</Badge>;
    return <Badge variant="secondary" className="gap-1 rounded-full"><Calendar className="h-3 w-3" /> {daysLeft} days left</Badge>;
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const CHURN_REASONS = [
    { value: 'end_of_lease', label: 'End of Lease' },
    { value: 'relocation', label: 'Relocation' },
    { value: 'price_increase', label: 'Price Increase' },
    { value: 'service_issue', label: 'Service Issues' },
    { value: 'buying_property', label: 'Buying Own Property' },
    { value: 'other', label: 'Other' },
  ];

  if (isLoading) {
    return <Card className="rounded-2xl"><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></CardContent></Card>;
  }

  return (
    <>
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            Contracts Expiring Soon
          </CardTitle>
          <CardDescription>{expiringContracts.length} contracts expiring within 60 days</CardDescription>
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
                  <div key={contract.id} className={`p-4 rounded-xl border border-border/40 transition-all duration-200 hover:border-primary/20 ${daysLeft <= 7 ? 'border-destructive/50 bg-destructive/5' : daysLeft <= 30 ? 'border-warning/50 bg-warning/5' : 'bg-card/80 backdrop-blur-sm'}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contract.unit?.property?.name} - Unit {contract.unit?.unit_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{tenant?.full_name || 'Unknown Tenant'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Expires: {format(new Date(contract.end_date), 'dd MMM yyyy')} • {formatCurrency(contract.rent_amount)}/month</p>
                        {contract.churn_reason && (
                          <Badge variant="outline" className="mt-1 rounded-full">
                            Notice: {CHURN_REASONS.find(r => r.value === contract.churn_reason)?.label || contract.churn_reason}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getUrgencyBadge(daysLeft)}
                        {!contract.churn_reason && (
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => { setSelectedContract(contract); setDialogOpen(true); }}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Record Notice Period</DialogTitle>
            <DialogDescription>Select the reason why this tenant is leaving</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CHURN_REASONS.map((reason) => (
                <Button
                  key={reason.value}
                  variant={churnReason === reason.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChurnReason(reason.value)}
                  className={`justify-start rounded-xl ${churnReason === reason.value ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {reason.label}
                </Button>
              ))}
            </div>
            {churnReason === 'other' && (
              <Textarea placeholder="Please specify the reason..." value={churnReason} onChange={(e) => setChurnReason(e.target.value)} className="rounded-xl" />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={() => { if (selectedContract && churnReason) updateContractMutation.mutate({ contractId: selectedContract.id, churnReason }); }}
              disabled={!churnReason || updateContractMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"
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
