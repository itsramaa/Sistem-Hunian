import { usePlatformSettings } from "@/features/platform-config/hooks/usePlatformSettings";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

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

export const FeesConfig = () => {
  const { settings, updateSetting, isUpdating } = usePlatformSettings();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    updateSetting(
      { 
        key: 'fees', 
        value: feeForm,
        description: 'Platform fee configuration'
      }, 
      {
        onSuccess: () => {
          setOriginalFeeForm(feeForm);
          setHasUnsavedChanges(false);
          setShowConfirmDialog(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">You have unsaved changes. Don't forget to save before leaving.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Platform Fees</CardTitle>
          <CardDescription>Configure transaction fees and commissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionFee">Transaction Fee (%)</Label>
              <Input
                id="transactionFee"
                type="number"
                step="0.1"
                value={feeForm.transactionFeePercent}
                onChange={(e) => handleInputChange('transactionFeePercent', e.target.value)}
              />
              {validationErrors.transactionFeePercent && (
                <p className="text-sm text-destructive">{validationErrors.transactionFeePercent}</p>
              )}
              <p className="text-xs text-muted-foreground">Applied to all successful transactions</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escrowFee">Escrow Fee (%)</Label>
              <Input
                id="escrowFee"
                type="number"
                step="0.1"
                value={feeForm.escrowFeePercent}
                onChange={(e) => handleInputChange('escrowFeePercent', e.target.value)}
              />
              {validationErrors.escrowFeePercent && (
                <p className="text-sm text-destructive">{validationErrors.escrowFeePercent}</p>
              )}
              <p className="text-xs text-muted-foreground">Additional fee for escrow services</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketplaceCommission">Marketplace Commission (%)</Label>
              <Input
                id="marketplaceCommission"
                type="number"
                step="0.1"
                value={feeForm.marketplaceCommission}
                onChange={(e) => handleInputChange('marketplaceCommission', e.target.value)}
              />
              {validationErrors.marketplaceCommission && (
                <p className="text-sm text-destructive">{validationErrors.marketplaceCommission}</p>
              )}
              <p className="text-xs text-muted-foreground">Platform cut from sales</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disbursementFee">Disbursement Fee (Flat)</Label>
              <Input
                id="disbursementFee"
                type="number"
                step="1000"
                value={feeForm.disbursementFeeFlat}
                onChange={(e) => handleInputChange('disbursementFeeFlat', e.target.value)}
              />
              {validationErrors.disbursementFeeFlat && (
                <p className="text-sm text-destructive">{validationErrors.disbursementFeeFlat}</p>
              )}
              <p className="text-xs text-muted-foreground">Flat fee per withdrawal request</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Settings</CardTitle>
          <CardDescription>Configure subscription rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="gracePeriod">Renewal Grace Period (Days)</Label>
            <Input
              id="gracePeriod"
              type="number"
              min="0"
              max="30"
              value={feeForm.subscriptionRenewalGraceDays}
              onChange={(e) => handleInputChange('subscriptionRenewalGraceDays', e.target.value)}
            />
            {validationErrors.subscriptionRenewalGraceDays && (
              <p className="text-sm text-destructive">{validationErrors.subscriptionRenewalGraceDays}</p>
            )}
            <p className="text-xs text-muted-foreground">Days allowed after expiry before service interruption</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveFees} 
          disabled={!hasUnsavedChanges || isUpdating}
          className="gap-2"
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmSave}
        title="Save Changes"
        description="Are you sure you want to save these fee configuration changes? This will affect all future transactions."
        confirmText="Save Changes"
        cancelText="Cancel"
        variant="default"
      />
    </div>
  );
};
