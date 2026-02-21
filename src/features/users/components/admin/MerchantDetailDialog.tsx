
import { MerchantAnalyticsTab } from '@/features/analytics/components/MerchantAnalyticsTab';
import { MerchantActivityTab } from '@/features/audit-logs/components/MerchantActivityTab';
import { MerchantPropertiesTab } from '@/features/properties/components/MerchantPropertiesTab';
import { MerchantDetailsTab } from '@/features/users/components/admin/MerchantDetailsTab';
import { MerchantDocumentsTab } from '@/features/users/components/admin/MerchantDocumentsTab';
import { Merchant } from '@/features/users/types/admin-merchant';
import { MerchantVerificationHistory } from '@/features/verification/components/MerchantVerificationHistory';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  History,
  Home,
  Image,
  XCircle,
} from 'lucide-react';

interface MerchantDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: Merchant | null;
  onSuspend: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading: boolean;
}

export function MerchantDetailDialog({
  open,
  onOpenChange,
  merchant,
  onSuspend,
  onApprove,
  onReject,
  actionLoading
}: MerchantDetailDialogProps) {
  if (!merchant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {merchant.business_name}
          </DialogTitle>
          <DialogDescription>
            Merchant details and verification status
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-3 w-3" />
              History
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <MerchantDetailsTab merchant={merchant} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <MerchantDocumentsTab merchantId={merchant.id} />
          </TabsContent>

          <TabsContent value="properties" className="mt-4">
            <MerchantPropertiesTab merchantId={merchant.id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <MerchantAnalyticsTab merchantId={merchant.id} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <MerchantVerificationHistory merchantId={merchant.id} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <MerchantActivityTab merchantId={merchant.id} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center border-t pt-4 mt-4">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onSuspend}
            disabled={actionLoading}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {merchant.verification_status === 'suspended' ? 'Reactivate' : 'Suspend'}
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            {merchant.verification_status !== 'verified' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={onReject}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-success hover:bg-success/90 text-white flex-1 sm:flex-none"
                  onClick={onApprove}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
