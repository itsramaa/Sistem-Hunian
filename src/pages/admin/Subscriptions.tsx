import { useSubscriptions, useSubscriptionStats } from "@/features/subscriptions/hooks/useSubscriptions";
import { SubscriptionMerchant, SubscriptionInvoice, CancellationFeedback, PendingSubscriptionChange } from "@/features/subscriptions/types/subscriptions";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { format } from "date-fns";
import { ArrowUpCircle, Clock, CreditCard, Crown, Loader2, Receipt, Search, Star, XCircle, Zap } from "lucide-react";
import { useState } from "react";

const AdminSubscriptions = () => {
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<SubscriptionMerchant | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [newTier, setNewTier] = useState("");

  const {
    merchants,
    isLoadingMerchants,
    activeTiers: tiers,
    invoices,
    isLoadingInvoices,
    cancellations,
    isLoadingCancellations,
    pendingChanges,
    isLoadingPending,
    updateSubscription,
    isUpdating,
  } = useSubscriptions();

  const { data: stats, isLoading: statsLoading } = useSubscriptionStats();

  const handleUpdateSubscription = () => {
    if (!selectedMerchant || !newTier) return;
    
    const tier = tiers?.find(t => t.id === newTier);
    if (!tier) return;

    updateSubscription(
      { 
        merchantId: selectedMerchant.id, 
        tierId: newTier,
        tierName: tier.name 
      },
      {
        onSuccess: () => {
          setShowUpgradeDialog(false);
          setSelectedMerchant(null);
          setNewTier("");
        }
      }
    );
  };

  const getTierBadge = (tierName: string | null | undefined) => {
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

  const getMerchantTierName = (merchant: SubscriptionMerchant) => {
    if (merchant.merchant_subscriptions?.[0]?.subscription_tiers?.name) {
      return merchant.merchant_subscriptions[0].subscription_tiers.name;
    }
    return merchant.subscription_tier || 'free';
  };

  const filteredMerchants = merchants?.filter(merchant =>
    merchant.business_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">Manage merchant subscriptions and billing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Crown className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enterprise</p>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.enterprise || 0}</p>
                )}
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
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.pro || 0}</p>
                )}
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
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.basic || 0}</p>
                )}
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
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.free || 0}</p>
                )}
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
                {isLoadingMerchants ? (
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
                {isLoadingInvoices ? (
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
                      {invoices.map((invoice: SubscriptionInvoice) => (
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
                {isLoadingCancellations ? (
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
                      {cancellations.map((item: CancellationFeedback) => (
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
                {isLoadingPending ? (
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
                      {pendingChanges.map((change) => (
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
                          {tier.features && Array.isArray(tier.features) && tier.features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
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
                onClick={handleUpdateSubscription}
                disabled={isUpdating || !newTier}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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