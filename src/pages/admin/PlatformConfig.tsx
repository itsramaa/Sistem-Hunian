import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Percent, DollarSign, Wallet, CreditCard, Save, Loader2, Settings, AlertTriangle } from "lucide-react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { logConfigChange } from "@/lib/auditLog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type PlatformSetting = {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
};

type FeeFormData = {
  transactionFeePercent: number;
  escrowFeePercent: number;
  disbursementFeeFlat: number;
  marketplaceCommission: number;
  subscriptionRenewalGraceDays: number;
};

const defaultFees: FeeFormData = {
  transactionFeePercent: 2.5,
  escrowFeePercent: 1.0,
  disbursementFeeFlat: 5000,
  marketplaceCommission: 5.0,
  subscriptionRenewalGraceDays: 3,
};

const PlatformConfig = () => {
  const { isLoading: guardLoading, isAdmin } = useAdminGuard();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      if (error) throw new Error(`Failed to load settings: ${error.message}`);
      return data as PlatformSetting[];
    },
    enabled: isAdmin,
  });

  const feeSettings = settings?.find(s => s.setting_key === 'fees')?.setting_value || defaultFees;
  const [feeForm, setFeeForm] = useState<FeeFormData>(defaultFees);
  const [originalFeeForm, setOriginalFeeForm] = useState<FeeFormData>(defaultFees);

  useEffect(() => {
    const fees = settings?.find(s => s.setting_key === 'fees')?.setting_value;
    if (fees) {
      const formData: FeeFormData = {
        transactionFeePercent: fees.transactionFeePercent ?? defaultFees.transactionFeePercent,
        escrowFeePercent: fees.escrowFeePercent ?? defaultFees.escrowFeePercent,
        disbursementFeeFlat: fees.disbursementFeeFlat ?? defaultFees.disbursementFeeFlat,
        marketplaceCommission: fees.marketplaceCommission ?? defaultFees.marketplaceCommission,
        subscriptionRenewalGraceDays: fees.subscriptionRenewalGraceDays ?? defaultFees.subscriptionRenewalGraceDays,
      };
      setFeeForm(formData);
      setOriginalFeeForm(formData);
    }
  }, [settings]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(feeForm) !== JSON.stringify(originalFeeForm);
    setHasUnsavedChanges(hasChanges);
  }, [feeForm, originalFeeForm]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (isNaN(feeForm.transactionFeePercent) || feeForm.transactionFeePercent < 0) {
      errors.transactionFeePercent = 'Must be a valid number >= 0';
    } else if (feeForm.transactionFeePercent > 100) {
      errors.transactionFeePercent = 'Cannot exceed 100%';
    }

    if (isNaN(feeForm.escrowFeePercent) || feeForm.escrowFeePercent < 0) {
      errors.escrowFeePercent = 'Must be a valid number >= 0';
    } else if (feeForm.escrowFeePercent > 100) {
      errors.escrowFeePercent = 'Cannot exceed 100%';
    }

    if (isNaN(feeForm.marketplaceCommission) || feeForm.marketplaceCommission < 0) {
      errors.marketplaceCommission = 'Must be a valid number >= 0';
    } else if (feeForm.marketplaceCommission > 100) {
      errors.marketplaceCommission = 'Cannot exceed 100%';
    }

    if (isNaN(feeForm.disbursementFeeFlat) || feeForm.disbursementFeeFlat < 0) {
      errors.disbursementFeeFlat = 'Must be a valid number >= 0';
    }

    if (isNaN(feeForm.subscriptionRenewalGraceDays) || feeForm.subscriptionRenewalGraceDays < 0) {
      errors.subscriptionRenewalGraceDays = 'Must be a valid number >= 0';
    } else if (feeForm.subscriptionRenewalGraceDays > 30) {
      errors.subscriptionRenewalGraceDays = 'Cannot exceed 30 days';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const existing = settings?.find(s => s.setting_key === key);
      
      if (existing) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ setting_value: value })
          .eq('setting_key', key);
        if (error) throw new Error(`Failed to update settings: ${error.message}`);
      } else {
        const { error } = await supabase
          .from('platform_settings')
          .insert({ setting_key: key, setting_value: value, description: 'Platform fee configuration' });
        if (error) throw new Error(`Failed to create settings: ${error.message}`);
      }

      // Log the config change
      await logConfigChange(key, originalFeeForm, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      setOriginalFeeForm(feeForm);
      setHasUnsavedChanges(false);
      toast.success('Configuration saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleInputChange = (field: keyof FeeFormData, value: string) => {
    const numValue = parseFloat(value);
    setFeeForm(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue,
    }));
    // Clear validation error on change
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveFees = () => {
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

  const confirmSave = () => {
    saveMutation.mutate({ key: 'fees', value: feeForm });
    setShowConfirmDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (guardLoading || isLoading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Configuration</h1>
            <p className="text-muted-foreground">Configure platform fees and pricing structure</p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{(error as Error).message}</p>
            </CardContent>
          </Card>
        )}

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
                        value={feeForm.transactionFeePercent}
                        onChange={(e) => handleInputChange('transactionFeePercent', e.target.value)}
                        className={`pr-8 ${validationErrors.transactionFeePercent ? 'border-destructive' : ''}`}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {validationErrors.transactionFeePercent && (
                      <p className="text-xs text-destructive">{validationErrors.transactionFeePercent}</p>
                    )}
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
                        value={feeForm.marketplaceCommission}
                        onChange={(e) => handleInputChange('marketplaceCommission', e.target.value)}
                        className={`pr-8 ${validationErrors.marketplaceCommission ? 'border-destructive' : ''}`}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {validationErrors.marketplaceCommission && (
                      <p className="text-xs text-destructive">{validationErrors.marketplaceCommission}</p>
                    )}
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
                        value={feeForm.escrowFeePercent}
                        onChange={(e) => handleInputChange('escrowFeePercent', e.target.value)}
                        className={`pr-8 ${validationErrors.escrowFeePercent ? 'border-destructive' : ''}`}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {validationErrors.escrowFeePercent && (
                      <p className="text-xs text-destructive">{validationErrors.escrowFeePercent}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Fee for holding funds in escrow</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Disbursement Fee (Flat)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={feeForm.disbursementFeeFlat}
                        onChange={(e) => handleInputChange('disbursementFeeFlat', e.target.value)}
                        className={`pl-12 ${validationErrors.disbursementFeeFlat ? 'border-destructive' : ''}`}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    </div>
                    {validationErrors.disbursementFeeFlat && (
                      <p className="text-xs text-destructive">{validationErrors.disbursementFeeFlat}</p>
                    )}
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
                        value={feeForm.subscriptionRenewalGraceDays}
                        onChange={(e) => handleInputChange('subscriptionRenewalGraceDays', e.target.value)}
                        className={validationErrors.subscriptionRenewalGraceDays ? 'border-destructive' : ''}
                      />
                      {validationErrors.subscriptionRenewalGraceDays && (
                        <p className="text-xs text-destructive">{validationErrors.subscriptionRenewalGraceDays}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Days after subscription expires before downgrade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button onClick={handleSaveFees} disabled={saveMutation.isPending || !hasUnsavedChanges} size="lg">
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

        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Save Configuration"
          description="Are you sure you want to save these changes? This will affect all future transactions."
          confirmLabel="Save Changes"
          onConfirm={confirmSave}
          isLoading={saveMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
};

export default PlatformConfig;
