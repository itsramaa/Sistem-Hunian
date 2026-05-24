import { ReferralDashboard } from '@/features/referrals/components/ReferralDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Gift, TrendingUp, Percent, Users, Share2 } from 'lucide-react';

export default function MerchantReferrals() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Share2} title="Program Referral" description="Dapatkan reward dengan mereferensikan merchant baru ke SiHuni" />

        {/* Merchant-specific benefits card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20" aria-hidden="true">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              Keuntungan Referral Merchant
            </CardTitle>
            <CardDescription>
              Hadiah eksklusif untuk mereferensikan pemilik properti ke platform kami
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Komisi 20%</p>
                  <p className="text-sm text-muted-foreground">
                    Dapatkan 20% dari biaya langganan referral Anda
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Durasi 6 Bulan</p>
                  <p className="text-sm text-muted-foreground">
                    Terima komisi selama 6 bulan berturut-turut
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Tanpa Batas</p>
                  <p className="text-sm text-muted-foreground">
                    Referensikan merchant sebanyak yang Anda inginkan
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs rounded-full bg-success/10 text-success border-success/20">
                Dibayar otomatis
              </Badge>
              <Badge variant="outline" className="text-xs rounded-full">
                Pantau secara real-time
              </Badge>
            </div>
          </CardContent>
        </Card>

        <ReferralDashboard userRole="merchant" />
    </div>
  );
}
