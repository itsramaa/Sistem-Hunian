import { useSubscriptions, useSubscriptionStats } from "@/features/subscriptions/hooks/useSubscriptions";
import { SubscriptionMerchant, SubscriptionStats } from "@/features/subscriptions/types/subscriptions";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CreditCard, Receipt, XCircle, Clock, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { AdminSubscriptionStats } from "@/features/subscriptions/components/admin/AdminSubscriptionStats";
import { AdminSubscriptionMerchantsTable } from "@/features/subscriptions/components/admin/AdminSubscriptionMerchantsTable";
import { AdminSubscriptionInvoicesTable } from "@/features/subscriptions/components/admin/AdminSubscriptionInvoicesTable";
import { AdminSubscriptionCancellationsTable } from "@/features/subscriptions/components/admin/AdminSubscriptionCancellationsTable";
import { AdminSubscriptionPendingChangesTable } from "@/features/subscriptions/components/admin/AdminSubscriptionPendingChangesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

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

  const filteredMerchants = merchants?.filter(merchant =>
    merchant.business_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleOpenUpdateDialog = (merchant: SubscriptionMerchant) => {
    setSelectedMerchant(merchant);
    const currentTierId = merchant.merchant_subscriptions?.[0]?.tier_id || '';
    setNewTier(currentTierId);
    setShowUpgradeDialog(true);
  };

  return (
    <AdminLayout
      title="Manajemen Langganan"
      description="Kelola langganan merchant dan tagihan"
    >
      <div className="space-y-6">
        <AdminSubscriptionStats stats={stats as SubscriptionStats | undefined} isLoading={statsLoading} />

        <Tabs defaultValue="merchants" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] lg:grid-cols-4">
            <TabsTrigger value="merchants" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Merchant</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Faktur</span>
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Batalkan</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Menunggu</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="merchants">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Langganan Merchant</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari merchant..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AdminSubscriptionMerchantsTable 
                  merchants={filteredMerchants} 
                  isLoading={isLoadingMerchants} 
                  onUpdatePlan={handleOpenUpdateDialog}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Faktur Langganan</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminSubscriptionInvoicesTable invoices={invoices} isLoading={isLoadingInvoices} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancellations">
            <Card>
              <CardHeader>
                <CardTitle>Umpan Balik Pembatalan</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminSubscriptionCancellationsTable cancellations={cancellations} isLoading={isLoadingCancellations} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Perubahan Langganan Menunggu</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminSubscriptionPendingChangesTable pendingChanges={pendingChanges} isLoading={isLoadingPending} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Perbarui Paket Langganan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Merchant</Label>
                <Input value={selectedMerchant?.business_name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Paket Baru</Label>
                <Select value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers?.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        {tier.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdateSubscription} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Perbarui Paket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
