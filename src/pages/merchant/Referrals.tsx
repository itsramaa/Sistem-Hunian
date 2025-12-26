import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, TrendingUp, Percent, Users } from 'lucide-react';

export default function MerchantReferrals() {
  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Earn rewards by referring new merchants to SiHuni</p>
        </div>

        {/* Merchant-specific benefits card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Merchant Referral Benefits
            </CardTitle>
            <CardDescription>
              Exclusive rewards for referring property owners to our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">20% Commission</p>
                  <p className="text-sm text-muted-foreground">
                    Earn 20% of your referral's subscription fee
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">6 Months Duration</p>
                  <p className="text-sm text-muted-foreground">
                    Receive commissions for 6 consecutive months
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">No Limit</p>
                  <p className="text-sm text-muted-foreground">
                    Refer as many merchants as you want
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Paid automatically
              </Badge>
              <Badge variant="outline" className="text-xs">
                Track in real-time
              </Badge>
            </div>
          </CardContent>
        </Card>

        <ReferralDashboard userRole="merchant" />
      </div>
    </MerchantLayout>
  );
}
