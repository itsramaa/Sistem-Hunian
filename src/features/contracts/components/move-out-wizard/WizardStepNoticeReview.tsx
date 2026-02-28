import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { supabase } from "@/lib/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AlertTriangle, ArrowRight, Calendar, Check, User } from "lucide-react";
import { formatCurrency } from "@/shared/utils/currency";
import { useMoveOutWizardData } from "./useMoveOutWizardData";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Separator } from "@/shared/components/ui/separator";

interface Props {
  data: ReturnType<typeof useMoveOutWizardData>;
  onNext: () => void;
}

export function WizardStepNoticeReview({ data, onNext }: Props) {
  const { notice, tenantProfile, earlyTermRequest, noticeAcknowledged, refetchAll } = data;
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Early termination review state
  const [etDecision, setEtDecision] = useState<"approve" | "negotiate" | "deny">("approve");
  const [etResponse, setEtResponse] = useState("");
  const [etCounterOffer, setEtCounterOffer] = useState<number>(0);
  const [isSubmittingET, setIsSubmittingET] = useState(false);

  if (!notice) return null;

  const contract = notice.contract;
  const unit = contract?.unit;
  const property = unit?.property;
  const daysUntil = differenceInDays(new Date(notice.intended_move_out_date), new Date());
  const hasEarlyTermPending = earlyTermRequest && earlyTermRequest.status === "pending_approval";

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      const { error } = await supabase
        .from("move_out_notices")
        .update({ status: "acknowledged" })
        .eq("id", notice.id);
      if (error) throw error;

      await supabase
        .from("move_out_timeline")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("move_out_notice_id", notice.id)
        .eq("step", "notice_acknowledged");

      toast.success("Pemberitahuan berhasil dikonfirmasi");
      await refetchAll();
    } catch (error) {
      toast.error((error as Error).message || "Gagal mengkonfirmasi pemberitahuan");
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleEarlyTermSubmit = async () => {
    if (!earlyTermRequest) return;
    if (etDecision === "negotiate" && !etCounterOffer) { toast.error("Masukkan jumlah penawaran balik"); return; }
    if (etDecision === "deny" && !etResponse) { toast.error("Berikan alasan penolakan"); return; }

    setIsSubmittingET(true);
    try {
      const updateData: Record<string, unknown> = { merchant_response: etResponse, updated_at: new Date().toISOString() };
      if (etDecision === "approve") {
        updateData.status = "approved";
        updateData.approved_at = new Date().toISOString();
        await supabase.from("contracts").update({
          status: "terminated_early",
          actual_end_date: earlyTermRequest.requested_date,
          termination_penalty: earlyTermRequest.penalty_amount,
          churn_reason: earlyTermRequest.reason,
        }).eq("id", earlyTermRequest.contract_id);
      } else if (etDecision === "negotiate") {
        updateData.status = "negotiating";
        updateData.counter_offer_amount = etCounterOffer;
      } else {
        updateData.status = "denied";
        updateData.denied_at = new Date().toISOString();
      }
      await supabase.from("early_termination_requests").update(updateData).eq("id", earlyTermRequest.id);
      toast.success(etDecision === "approve" ? "Permintaan disetujui" : etDecision === "negotiate" ? "Penawaran balik dikirim" : "Permintaan ditolak");
      await refetchAll();
    } catch (error) {
      toast.error((error as Error).message || "Gagal memproses permintaan");
    } finally {
      setIsSubmittingET(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main */}
      <div className="lg:col-span-2 space-y-6">
        {/* Notice Info */}
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
          <h3 className="font-semibold text-lg">Informasi Pemberitahuan</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-muted/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tanggal Pindah</p>
              <p className="font-semibold">{format(new Date(notice.intended_move_out_date), "dd MMM yyyy", { locale: idLocale })}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hari Tersisa</p>
              <p className={`font-semibold ${daysUntil <= 7 ? "text-destructive" : ""}`}>{daysUntil} hari</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deposit</p>
              <p className="font-semibold">{formatCurrency(contract?.deposit_amount || 0)}</p>
            </div>
          </div>
          {notice.reason && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Alasan</p>
              <p className="text-sm">{notice.reason}</p>
            </div>
          )}
          {notice.is_early_termination && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">Terminasi Dini</span>
            </div>
          )}
        </section>

        {/* Early Termination Review (embedded) */}
        {hasEarlyTermPending && earlyTermRequest && (
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-warning/30 p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Permintaan Pemutusan Awal
            </h3>
            <div className="p-4 rounded-xl bg-muted/20 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tanggal Diajukan:</span><span className="font-medium">{format(new Date(earlyTermRequest.requested_date), "dd MMM yyyy", { locale: idLocale })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Penalti:</span><span className="font-medium text-destructive">{formatCurrency(earlyTermRequest.penalty_amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Alasan:</span><span className="font-medium">{earlyTermRequest.reason || "Tidak ditentukan"}</span></div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Keputusan Anda</Label>
              <RadioGroup value={etDecision} onValueChange={(v) => setEtDecision(v as "approve" | "negotiate" | "deny")}>
                {[
                  { value: "approve", label: "Setujui", desc: "Terima pemutusan awal dengan penalti penuh" },
                  { value: "negotiate", label: "Negosiasi", desc: "Ajukan jumlah penalti berbeda" },
                  { value: "deny", label: "Tolak", desc: "Tolak permintaan pemutusan awal" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-start space-x-2 p-3 rounded-xl border border-border/40 hover:bg-primary/5 cursor-pointer transition-colors">
                    <RadioGroupItem value={opt.value} id={`et-${opt.value}`} className="mt-1" />
                    <div>
                      <Label htmlFor={`et-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {etDecision === "negotiate" && (
              <div className="space-y-2">
                <Label>Jumlah Penawaran Balik (Rp)</Label>
                <Input type="number" value={etCounterOffer || ""} onChange={(e) => setEtCounterOffer(Number(e.target.value))} placeholder="Masukkan penawaran..." className="rounded-xl" />
              </div>
            )}
            <div className="space-y-2">
              <Label>{etDecision === "deny" ? "Alasan Penolakan *" : "Pesan untuk Penyewa"}</Label>
              <Textarea value={etResponse} onChange={(e) => setEtResponse(e.target.value)} placeholder="Tulis pesan..." rows={3} className="rounded-xl" />
            </div>
            <Button onClick={handleEarlyTermSubmit} disabled={isSubmittingET} variant={etDecision === "deny" ? "destructive" : "default"} className="rounded-xl w-full">
              {isSubmittingET ? "Memproses..." : etDecision === "approve" ? "Setujui Permintaan" : etDecision === "negotiate" ? "Kirim Penawaran Balik" : "Tolak Permintaan"}
            </Button>
          </section>
        )}

        {/* Acknowledge Action */}
        {!noticeAcknowledged && (
          <div className="flex justify-end">
            <Button onClick={handleAcknowledge} disabled={isAcknowledging} className="rounded-xl gap-2">
              {isAcknowledging ? "Memproses..." : <><Check className="h-4 w-4" /> Konfirmasi Pemberitahuan</>}
            </Button>
          </div>
        )}
        {noticeAcknowledged && (
          <div className="flex justify-end">
            <Button onClick={onNext} className="rounded-xl gap-2">
              Lanjut ke Inspeksi <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Penyewa</h3>
          <p className="font-medium">{tenantProfile?.full_name || "—"}</p>
          <p className="text-sm text-muted-foreground">{tenantProfile?.email}</p>
          {tenantProfile?.phone && <p className="text-sm text-muted-foreground">{tenantProfile.phone}</p>}
        </section>
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
          <h3 className="font-semibold">Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Pemberitahuan</span><span className="capitalize font-medium">{notice.status}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Kontrak</span><span className="capitalize font-medium">{contract?.status || "—"}</span></div>
          </div>
        </section>
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
          <h3 className="font-semibold">Info Cepat</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Diajukan {format(new Date(notice.created_at), "dd MMM yyyy", { locale: idLocale })}</span>
          </div>
        </section>
      </aside>
    </div>
  );
}
