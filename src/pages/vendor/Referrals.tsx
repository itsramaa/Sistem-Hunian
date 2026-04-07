import { VendorLayout } from '@/shared/components/layouts/VendorLayout';
import { ReferralDashboard } from '@/features/referrals/components/ReferralDashboard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function VendorReferrals() {
  const { vendor } = useAuth();

  // Loading state
  if (!vendor) {
    return (
      <VendorLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px]" />
        </div>
      </VendorLayout>
    );
  }

  const isVerified = vendor.verification_status === 'verified';
  const isPending = vendor.verification_status === 'pending';

  // Show verification requirement if not verified
  if (!isVerified) {
    return (
      <VendorLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Referral Program</h1>
            <p className="text-muted-foreground">Earn rewards by referring other vendors</p>
          </div>

          <Alert variant={isPending ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {isPending ? "Verification Pending" : "Verification Required"}
            </AlertTitle>
            <AlertDescription>
              {isPending 
                ? "Your verification is being reviewed. You'll be able to participate in the referral program once approved."
                : "You need to complete verification before participating in the referral program. Please go to Settings → Verification to submit your documents."}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Referral Eligibility Requirements
              </CardTitle>
              <CardDescription>
                Complete these requirements to join the referral program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {isVerified ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : isPending ? (
                    <Clock className="h-5 w-5 text-warning" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">Account Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Submit and get your verification documents approved
                    </p>
                  </div>
                </div>
                <Badge variant={isVerified ? "default" : isPending ? "secondary" : "outline"}>
                  {isVerified ? "Completed" : isPending ? "Pending" : "Required"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Active Account</p>
                    <p className="text-sm text-muted-foreground">
                      Complete at least 5 orders to be eligible
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Good Standing</p>
                    <p className="text-sm text-muted-foreground">
                      Maintain a rating of 4.0 or above
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referral Rewards</CardTitle>
              <CardDescription>What you can earn through the referral program</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">Rp 50,000</p>
                  <p className="text-sm text-muted-foreground">Per verified vendor referral</p>
                </div>
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">5%</p>
                  <p className="text-sm text-muted-foreground">Of referee's first 3 months earnings</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">Unlimited</p>
                  <p className="text-sm text-muted-foreground">No cap on referral count</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Earn rewards by referring other vendors</p>
        </div>

        {/* Vendor-specific referral info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              You're Eligible!
            </CardTitle>
            <CardDescription>
              As a verified vendor, you can earn rewards by referring new vendors to join the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">Rp 50,000</p>
                <p className="text-sm text-muted-foreground">Per verified vendor referral</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">5%</p>
                <p className="text-sm text-muted-foreground">Of referee's first 3 months earnings</p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <p className="text-2xl font-bold text-warning">Unlimited</p>
                <p className="text-sm text-muted-foreground">No cap on referral count</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ReferralDashboard userRole="vendor" />
      </div>
    </VendorLayout>
  );
}