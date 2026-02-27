import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { RefreshCw, TrendingUp, FileText, PenLine } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useRenewalAlerts, useMerchantAmendments, useSendOffer, useSignAmendment } from '@/features/contracts/hooks/useLeaseRenewal';
import { RenewalAlertsList } from '@/features/contracts/components/renewal/RenewalAlertsList';
import { RenewalOfferDialog } from '@/features/contracts/components/renewal/RenewalOfferDialog';
import { AmendmentSignatureDialog } from '@/features/contracts/components/renewal/AmendmentSignatureDialog';
import { NegotiationTimeline } from '@/features/contracts/components/renewal/NegotiationTimeline';
import type { RenewalAlert } from '@/features/contracts/services/renewalService';

export default function MerchantLeaseRenewals() {
  const { data: alerts, isLoading, refetch } = useRenewalAlerts();
  const { data: amendments } = useMerchantAmendments();
  const sendOffer = useSendOffer();
  const signAmendment = useSignAmendment();

  const [selectedAlert, setSelectedAlert] = useState<RenewalAlert | null>(null);
  const [signAmendmentId, setSignAmendmentId] = useState<string | null>(null);

  // Stats
  const within30 = alerts?.filter(a => differenceInDays(new Date(a.endDate), new Date()) <= 30).length || 0;
  const within60 = alerts?.filter(a => {
    const d = differenceInDays(new Date(a.endDate), new Date());
    return d > 30 && d <= 60;
  }).length || 0;
  const within90 = alerts?.filter(a => {
    const d = differenceInDays(new Date(a.endDate), new Date());
    return d > 60 && d <= 90;
  }).length || 0;

  const activeAmendments = amendments?.filter(a => !['signed', 'rejected', 'cancelled'].includes(a.status)) || [];
  const signedAmendments = amendments?.filter(a => a.status === 'signed') || [];

  const selectedSignAmendment = amendments?.find(a => a.id === signAmendmentId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Perpanjangan Sewa"
        description="Kelola perpanjangan kontrak, negosiasi, dan tanda tangan"
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Segarkan
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">≤ 30 Hari</p>
            <p className={`text-2xl font-bold ${within30 > 0 ? 'text-destructive' : ''}`}>{within30}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">31-60 Hari</p>
            <p className="text-2xl font-bold text-warning">{within60}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">61-90 Hari</p>
            <p className="text-2xl font-bold">{within90}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Perpanjangan Aktif</p>
            <p className="text-2xl font-bold text-primary">{activeAmendments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expiring">
        <TabsList>
          <TabsTrigger value="expiring" className="gap-1">
            <FileText className="h-4 w-4" /> Akan Berakhir
            {(alerts?.length || 0) > 0 && <Badge variant="secondary" className="ml-1 text-xs">{alerts?.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="amendments" className="gap-1">
            <PenLine className="h-4 w-4" /> Amandemen
            {activeAmendments.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{activeAmendments.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="mt-4">
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Kontrak Segera Berakhir (90 hari)</CardTitle>
            </CardHeader>
            <CardContent>
              <RenewalAlertsList
                alerts={alerts}
                loading={isLoading}
                onCreateOffer={setSelectedAlert}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amendments" className="mt-4">
          <div className="space-y-4">
            {amendments?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Belum ada amandemen perpanjangan</p>
            )}
            {amendments?.map(a => (
              <Card key={a.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">Amandemen {a.amendmentType}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: <Badge variant="secondary" className="text-xs">{a.negotiationStatus || a.status}</Badge>
                      </p>
                    </div>
                    {a.negotiationStatus === 'agreed' && a.status !== 'signed' && (
                      <Button size="sm" onClick={() => setSignAmendmentId(a.id)} className="gap-1">
                        <PenLine className="h-3 w-3" /> Tanda Tangan
                      </Button>
                    )}
                  </div>
                  {/* Show negotiation timeline */}
                  <NegotiationTimeline events={[
                    ...(a.merchantOffer ? [{
                      type: 'merchant_proposed' as const,
                      date: a.createdAt,
                      details: a.merchantOffer as any,
                    }] : []),
                    ...(a.tenantCounterOffer ? [{
                      type: 'tenant_countered' as const,
                      date: a.createdAt,
                      details: a.tenantCounterOffer as any,
                    }] : []),
                    ...(a.negotiationStatus === 'agreed' ? [{
                      type: 'agreed' as const,
                      date: a.createdAt,
                    }] : []),
                    ...(a.status === 'signed' ? [{
                      type: 'signed' as const,
                      date: a.signedAt || a.createdAt,
                    }] : []),
                  ]} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Offer Dialog */}
      {selectedAlert && (
        <RenewalOfferDialog
          open={!!selectedAlert}
          onOpenChange={open => { if (!open) setSelectedAlert(null); }}
          alert={selectedAlert}
          onSubmit={offer => {
            sendOffer.mutate({
              contractId: selectedAlert.contractId,
              merchantId: selectedAlert.merchantId,
              tenantUserId: '', // Will be resolved from contract
              offer,
              effectiveDate: offer.effectiveDate,
              currentRent: selectedAlert.rentAmount,
            }, { onSuccess: () => setSelectedAlert(null) });
          }}
          isSubmitting={sendOffer.isPending}
        />
      )}

      {/* Signature Dialog */}
      {signAmendmentId && selectedSignAmendment && (
        <AmendmentSignatureDialog
          open={!!signAmendmentId}
          onOpenChange={open => { if (!open) setSignAmendmentId(null); }}
          role="merchant"
          amendmentId={signAmendmentId}
          merchantSigned={!!selectedSignAmendment.merchantSignature}
          tenantSigned={!!selectedSignAmendment.tenantSignature}
          onSign={(id, data) => {
            signAmendment.mutate({ id, role: 'merchant', signatureData: data }, {
              onSuccess: () => setSignAmendmentId(null),
            });
          }}
        />
      )}
    </div>
  );
}
