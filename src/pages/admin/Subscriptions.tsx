import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Search, Crown, Star, Loader2, ArrowUpCircle, Receipt, XCircle, Clock, Zap } from "lucide-react";
import { format } from "date-fns";

const AdminSubscriptions = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [newTier, setNewTier] = useState("");

  // Fetch merchants with their subscriptions
  const { data: merchants, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select(`
          *,
          merchant_subscriptions (
            id,
            status,
            tier_id,
            current_period_end,
            trial_ends_at,
            subscription_tiers (
              name,
              display_name
            )
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscription tiers
  const { data: tiers } = useQuery({
    queryKey: ['subscription-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscription invoices
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['admin-subscription-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select(`
          *,
          merchants (business_name),
          subscription_tiers (name, display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch cancellation feedback
  const { data: cancellations, isLoading: loadingCancellations } = useQuery({
    queryKey: ['admin-cancellation-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cancellation_feedback')
        .select(`
          *,
          merchants (business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending subscription changes
  const { data: pendingChanges, isLoading: loadingPending } = useQuery({
    queryKey: ['admin-pending-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_subscription_changes')
        .select(`
          *,
          merchants (business_name),
          current_tier:subscription_tiers!pending_subscription_changes_current_tier_id_fkey (name, display_name),
          pending_tier:subscription_tiers!pending_subscription_changes_pending_tier_id_fkey (name, display_name)
        `)
        .eq('status', 'pending')
        .order('effective_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ merchantId, tierId }: { merchantId: string; tierId: string }) => {
      // First check if merchant has a subscription record
      const { data: existingSub } = await supabase
        .from('merchant_subscriptions')
        .select('id')
        .eq('merchant_id', merchantId)
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error } = await supabase
          .from('merchant_subscriptions')
          .update({ 
            tier_id: tierId,
            updated_at: new Date().toISOString()
          })
          .eq('merchant_id', merchantId);
        if (error) throw error;
      } else {
        // Create new subscription
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        
        const { error } = await supabase
          .from('merchant_subscriptions')
          .insert({
            merchant_id: merchantId,
            tier_id: tierId,
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          });
        if (error) throw error;
      }

      // Also update the legacy field for compatibility
      const tier = tiers?.find(t => t.id === tierId);
      if (tier) {
        await supabase
          .from('merchants')
          .update({ subscription_tier: tier.name })
          .eq('id', merchantId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Subscription updated');
      setShowUpgradeDialog(false);
      setSelectedMerchant(null);
    },
    onError: () => toast.error('Failed to update subscription'),
  });

  const getTierBadge = (tierName: string | null) => {
    switch (tierName) {
      case 'enterprise':
        return <Badge className="bg-accent text-accent-foreground"><Crown className="h-3 w-3 mr-1" /> Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-primary text-primary-foreground"><Star className="h-3 w-3 mr-1" /> Pro</Badge>;
      case 'basic':
        return <Badge className="bg-info text-info-foreground"><Zap className="h-3 w-3 mr-1" /> Basic</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/10 text-success">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMerchantTierName = (merchant: any) => {
    if (merchant.merchant_subscriptions?.[0]?.subscription_tiers?.name) {
      return merchant.merchant_subscriptions[0].subscription_tiers.name;
    }
    return merchant.subscription_tier || 'free';
  };

  const filteredMerchants = merchants?.filter(merchant =>
    merchant.business_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const enterpriseCount = merchants?.filter(m => getMerchantTierName(m) === 'enterprise').length || 0;
  const proCount = merchants?.filter(m => getMerchantTierName(m) === 'pro').length || 0;
  const basicCount = merchants?.filter(m => getMerchantTierName(m) === 'basic').length || 0;
  const freeCount = merchants?.filter(m => !getMerchantTierName(m) || getMerchantTierName(m) === 'free').length || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCancellationReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      too_expensive: 'Too Expensive',
      not_using: 'Not Using',
      missing_features: 'Missing Features',
      switching_competitor: 'Switching to Competitor',
      business_closed: 'Business Closed',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">Manage merchant subscription plans</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{merchants?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Crown className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enterprise</p>
                <p className="text-2xl font-bold">{enterpriseCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pro</p>
                <p className="text-2xl font-bold">{proCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <Zap className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Basic</p>
                <p className="text-2xl font-bold">{basicCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free</p>
                <p className="text-2xl font-bold">{freeCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="merchants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="merchants" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Merchants
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="gap-2">
              <XCircle className="h-4 w-4" />
              Cancellations
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Changes
            </TabsTrigger>
          </TabsList>

          {/* Merchants Tab */}
          <TabsContent value="merchants">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Merchant Subscriptions</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search merchants..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredMerchants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Current Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMerchants.map((merchant) => {
                        const subscription = merchant.merchant_subscriptions?.[0];
                        return (
                          <TableRow key={merchant.id}>
                            <TableCell className="font-medium">{merchant.business_name}</TableCell>
                            <TableCell>
                              <p className="text-sm">{merchant.business_type || 'Individual'}</p>
                            </TableCell>
                            <TableCell>{getTierBadge(getMerchantTierName(merchant))}</TableCell>
                            <TableCell>
                              {subscription?.status === 'trial' ? (
                                <Badge className="bg-info/10 text-info">Trial</Badge>
                              ) : subscription?.status === 'suspended' ? (
                                <Badge variant="destructive">Suspended</Badge>
                              ) : subscription?.status === 'active' ? (
                                <Badge className="bg-success/10 text-success">Active</Badge>
                              ) : (
                                <Badge variant="secondary">-</Badge>
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(merchant.created_at), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedMerchant(merchant);
                                  const currentTierId = subscription?.tier_id || '';
                                  setNewTier(currentTierId);
                                  setShowUpgradeDialog(true);
                                }}
                              >
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                                Change Plan
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No merchants found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInvoices ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : invoices && invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.merchants?.business_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {getTierBadge(invoice.subscription_tiers?.name)}
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cancellations Tab */}
          <TabsContent value="cancellations">
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCancellations ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : cancellations && cancellations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead>Would Return?</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cancellations.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.merchants?.business_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getCancellationReasonLabel(item.reason)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.feedback || '-'}
                          </TableCell>
                          <TableCell>
                            {item.would_return === true ? (
                              <Badge className="bg-success/10 text-success">Yes</Badge>
                            ) : item.would_return === false ? (
                              <Badge variant="destructive">No</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(item.created_at), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No cancellation feedback found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Changes Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Subscription Changes</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingChanges && pendingChanges.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Change Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingChanges.map((change: any) => (
                        <TableRow key={change.id}>
                          <TableCell className="font-medium">
                            {change.merchants?.business_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={change.change_type === 'downgrade' ? 'destructive' : 'default'}>
                              {change.change_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getTierBadge(change.current_tier?.name)}
                          </TableCell>
                          <TableCell>
                            {getTierBadge(change.pending_tier?.name)}
                          </TableCell>
                          <TableCell>{format(new Date(change.effective_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {change.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending changes found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Subscription Plan</DialogTitle>
            </DialogHeader>
            {selectedMerchant && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Business</Label>
                  <p className="font-medium">{selectedMerchant.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Current Plan</Label>
                  <div className="mt-1">{getTierBadge(getMerchantTierName(selectedMerchant))}</div>
                </div>
                <div className="space-y-2">
                  <Label>New Plan</Label>
                  <Select value={newTier} onValueChange={setNewTier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers?.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.display_name} - {formatCurrency(tier.price_monthly)}/mo
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newTier && tiers && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Plan Features</h4>
                    {(() => {
                      const tier = tiers.find(t => t.id === newTier);
                      if (!tier) return null;
                      return (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Up to {tier.max_properties} properties</li>
                          <li>• Up to {tier.max_units} units</li>
                          <li>• Up to {tier.max_tenants} tenants</li>
                          {tier.features && typeof tier.features === 'object' && (
                            <>
                              {(tier.features as any).priority_support && <li>• Priority support</li>}
                              {(tier.features as any).advanced_analytics && <li>• Advanced analytics</li>}
                              {(tier.features as any).custom_branding && <li>• Custom branding</li>}
                            </>
                          )}
                        </ul>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateSubscription.mutate({ merchantId: selectedMerchant.id, tierId: newTier })}
                disabled={updateSubscription.isPending || !newTier}
              >
                {updateSubscription.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
