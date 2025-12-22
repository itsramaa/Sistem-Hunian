import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Percent, DollarSign, Wallet, CreditCard, Save, Loader2, Settings } from "lucide-react";

type PlatformSetting = {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
};

const PlatformConfig = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      if (error) throw error;
      return data as PlatformSetting[];
    },
  });

  const defaultFees = {
    transactionFeePercent: 2.5,
    escrowFeePercent: 1.0,
    disbursementFeeFlat: 5000,
    marketplaceCommission: 5.0,
    subscriptionRenewalGraceDays: 3,
  };

  const feeSettings = settings?.find(s => s.setting_key === 'fees')?.setting_value || defaultFees;
  const [feeForm, setFeeForm] = useState(feeSettings);

  useEffect(() => {
    const fees = settings?.find(s => s.setting_key === 'fees')?.setting_value;
    if (fees) setFeeForm(fees);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      // Check if setting exists
      const existing = settings?.find(s => s.setting_key === key);
      
      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ setting_value: value })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert({ setting_key: key, setting_value: value, description: 'Platform fee configuration' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Configuration saved successfully');
    },
    onError: () => {
      toast.error('Failed to save configuration');
    },
  });

  const handleSaveFees = () => {
    saveMutation.mutate({ key: 'fees', value: feeForm });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Configuration</h1>
          <p className="text-muted-foreground">Configure platform fees and pricing structure</p>
        </div>

        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction Fees */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Transaction Fees
                  </CardTitle>
                  <CardDescription>Fees applied to payment transactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Transaction Fee (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={feeForm.transactionFeePercent || 0}
                        onChange={(e) => setFeeForm({ ...feeForm, transactionFeePercent: parseFloat(e.target.value) })}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Applied to all rent payments</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Marketplace Commission (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={feeForm.marketplaceCommission || 0}
                        onChange={(e) => setFeeForm({ ...feeForm, marketplaceCommission: parseFloat(e.target.value) })}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Applied to vendor marketplace orders</p>
                  </div>
                </CardContent>
              </Card>

              {/* Escrow & Disbursement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Escrow & Disbursement
                  </CardTitle>
                  <CardDescription>Fees for escrow and payouts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Escrow Service Fee (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={feeForm.escrowFeePercent || 0}
                        onChange={(e) => setFeeForm({ ...feeForm, escrowFeePercent: parseFloat(e.target.value) })}
                        className="pr-8"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Fee for holding funds in escrow</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Disbursement Fee (Flat)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={feeForm.disbursementFeeFlat || 0}
                        onChange={(e) => setFeeForm({ ...feeForm, disbursementFeeFlat: parseInt(e.target.value) })}
                        className="pl-12"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Flat fee per disbursement to merchant bank</p>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Settings */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Subscription Settings
                  </CardTitle>
                  <CardDescription>Configure subscription-related settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Renewal Grace Period (Days)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={feeForm.subscriptionRenewalGraceDays || 3}
                        onChange={(e) => setFeeForm({ ...feeForm, subscriptionRenewalGraceDays: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Days after subscription expires before downgrade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button onClick={handleSaveFees} disabled={saveMutation.isPending} size="lg">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Preview</CardTitle>
                <CardDescription>Example calculations based on current configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium">Rent Payment Example</h4>
                    <p className="text-sm text-muted-foreground">For a rent payment of {formatCurrency(5000000)}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Transaction Fee ({feeForm.transactionFeePercent}%)</span>
                        <span>{formatCurrency(5000000 * (feeForm.transactionFeePercent / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escrow Fee ({feeForm.escrowFeePercent}%)</span>
                        <span>{formatCurrency(5000000 * (feeForm.escrowFeePercent / 100))}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1 mt-2">
                        <span>Total Fees</span>
                        <span>{formatCurrency(5000000 * ((feeForm.transactionFeePercent + feeForm.escrowFeePercent) / 100))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium">Merchant Disbursement Example</h4>
                    <p className="text-sm text-muted-foreground">For a disbursement of {formatCurrency(5000000)}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Disbursement Fee (Flat)</span>
                        <span>{formatCurrency(feeForm.disbursementFeeFlat)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1 mt-2">
                        <span>Net Amount</span>
                        <span>{formatCurrency(5000000 - feeForm.disbursementFeeFlat)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium">Marketplace Order Example</h4>
                    <p className="text-sm text-muted-foreground">For an order of {formatCurrency(500000)}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Marketplace Commission ({feeForm.marketplaceCommission}%)</span>
                        <span>{formatCurrency(500000 * (feeForm.marketplaceCommission / 100))}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1 mt-2">
                        <span>Vendor Receives</span>
                        <span>{formatCurrency(500000 * (1 - feeForm.marketplaceCommission / 100))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default PlatformConfig;
