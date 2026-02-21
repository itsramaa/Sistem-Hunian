import { usePlatformSettings } from "@/features/platform-config/hooks/usePlatformSettings";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const feesSchema = z.object({
  transactionFeePercent: z.coerce.number().min(0, "Must be positive").max(100, "Cannot exceed 100%"),
  escrowFeePercent: z.coerce.number().min(0, "Must be positive").max(100, "Cannot exceed 100%"),
  disbursementFeeFlat: z.coerce.number().min(0, "Must be positive"),
  marketplaceCommission: z.coerce.number().min(0, "Must be positive").max(100, "Cannot exceed 100%"),
  subscriptionRenewalGraceDays: z.coerce.number().min(0, "Must be positive").max(30, "Cannot exceed 30 days"),
});

type FeeFormData = z.infer<typeof feesSchema>;

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
  
  const form = useForm<FeeFormData>({
    resolver: zodResolver(feesSchema),
    defaultValues: defaultFees,
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    const fees = settings?.find(s => s.setting_key === 'fees')?.setting_value;
    if (fees) {
      form.reset({
        transactionFeePercent: fees.transactionFeePercent ?? defaultFees.transactionFeePercent,
        escrowFeePercent: fees.escrowFeePercent ?? defaultFees.escrowFeePercent,
        disbursementFeeFlat: fees.disbursementFeeFlat ?? defaultFees.disbursementFeeFlat,
        marketplaceCommission: fees.marketplaceCommission ?? defaultFees.marketplaceCommission,
        subscriptionRenewalGraceDays: fees.subscriptionRenewalGraceDays ?? defaultFees.subscriptionRenewalGraceDays,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: FeeFormData) => {
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    updateSetting(
      { 
        key: 'fees', 
        value: form.getValues(),
        description: 'Platform fee configuration'
      }, 
      {
        onSuccess: () => {
          form.reset(form.getValues());
          setShowConfirmDialog(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {isDirty && (
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
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transactionFeePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Fee (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>Applied to all successful transactions</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="escrowFeePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escrow Fee (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>Additional fee for escrow services</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketplaceCommission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketplace Commission (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>Platform cut from sales</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disbursementFeeFlat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disbursement Fee (Flat)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1000" {...field} />
                      </FormControl>
                      <FormDescription>Fee per disbursement transaction</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscriptionRenewalGraceDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renewal Grace Period (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormDescription>Days before subscription expires</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!isDirty || isUpdating}
                  className="gap-2"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmSave}
        title="Save Fee Configuration"
        description="Are you sure you want to update platform fees? This will affect all future transactions."
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        variant="default"
      />
    </div>
  );
};
