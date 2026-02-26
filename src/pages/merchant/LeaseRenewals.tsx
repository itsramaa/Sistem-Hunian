import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useRenewalAlerts } from '@/features/contracts/hooks/useLeaseRenewal';
import { RenewalAlertsList } from '@/features/contracts/components/renewal/RenewalAlertsList';

export default function MerchantLeaseRenewals() {
  const { data: alerts, isLoading } = useRenewalAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perpanjangan Sewa</h1>
        <p className="text-muted-foreground">Pantau kontrak yang akan berakhir dan kelola perpanjangan</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Kontrak Segera Berakhir (90 hari)</CardTitle></CardHeader>
        <CardContent>
          <RenewalAlertsList alerts={alerts} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
