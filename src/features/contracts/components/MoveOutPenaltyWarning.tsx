import { AlertTriangle, Calendar, DollarSign, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/utils/currency";
import { differenceInDays, format } from "date-fns";
import { id } from "date-fns/locale";

interface MoveOutPenaltyWarningProps {
  contractEndDate: Date;
  intendedMoveOutDate: Date;
  monthlyRent: number;
  penaltyRate: number;
  noticePeriodDays: number;
}

export function MoveOutPenaltyWarning({
  contractEndDate, intendedMoveOutDate, monthlyRent, penaltyRate, noticePeriodDays,
}: MoveOutPenaltyWarningProps) {
  const isEarlyTermination = intendedMoveOutDate < contractEndDate;
  const daysBeforeContractEnd = differenceInDays(contractEndDate, intendedMoveOutDate);
  const remainingMonths = Math.ceil(daysBeforeContractEnd / 30);
  const penaltyAmount = isEarlyTermination ? monthlyRent * penaltyRate * remainingMonths : 0;
  const today = new Date();
  const daysUntilMoveOut = differenceInDays(intendedMoveOutDate, today);
  const isWithinNoticePeriod = daysUntilMoveOut >= noticePeriodDays;

  if (!isEarlyTermination && isWithinNoticePeriod) {
    return (
      <Alert className="border-success bg-success/10 rounded-2xl">
        <Info className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Tidak Ada Penalti</AlertTitle>
        <AlertDescription className="text-success/80">
          Anda memenuhi syarat untuk pindah tanpa penalti karena kontrak akan berakhir pada{" "}
          {format(contractEndDate, "d MMMM yyyy", { locale: id })}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-destructive/50 rounded-2xl bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Peringatan Penalti Move-Out
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEarlyTermination && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Terminasi Kontrak Lebih Awal</AlertTitle>
            <AlertDescription>
              Anda mengajukan pindah {daysBeforeContractEnd} hari sebelum kontrak berakhir.
              Ini akan dikenakan penalti sesuai ketentuan kontrak.
            </AlertDescription>
          </Alert>
        )}

        {!isWithinNoticePeriod && (
          <Alert variant="destructive" className="rounded-xl">
            <Calendar className="h-4 w-4" />
            <AlertTitle>Periode Pemberitahuan Tidak Terpenuhi</AlertTitle>
            <AlertDescription>
              Anda perlu memberitahukan minimal {noticePeriodDays} hari sebelum tanggal pindah.
              Saat ini hanya tersisa {daysUntilMoveOut} hari.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-muted/50 to-muted/30 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tanggal Akhir Kontrak</span>
            <span className="font-medium">{format(contractEndDate, "d MMMM yyyy", { locale: id })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tanggal Pindah Diajukan</span>
            <span className="font-medium">{format(intendedMoveOutDate, "d MMMM yyyy", { locale: id })}</span>
          </div>
          {isEarlyTermination && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sisa Bulan Kontrak</span>
                <Badge variant="secondary" className="rounded-full">{remainingMonths} bulan</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tarif Penalti</span>
                <Badge variant="secondary" className="rounded-full">{penaltyRate * 100}% per bulan</Badge>
              </div>
            </>
          )}
        </div>

        {penaltyAmount > 0 && (
          <div className="rounded-2xl bg-destructive/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-destructive" />
              <span className="font-medium">Estimasi Total Penalti</span>
            </div>
            <span className="text-xl font-bold text-destructive">
              {formatCurrency(penaltyAmount)}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          * Estimasi penalti dapat berubah berdasarkan hasil inspeksi unit dan ketentuan lainnya.
        </p>
      </CardContent>
    </Card>
  );
}
