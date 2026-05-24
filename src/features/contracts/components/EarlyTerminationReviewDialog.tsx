import { apiClient } from "@/lib/axios";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, MessageSquare, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EarlyTerminationRequest } from "../types/index";

import { id } from "date-fns/locale";

interface EarlyTerminationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EarlyTerminationRequest;
  onReviewed: () => void;
}

export function EarlyTerminationReviewDialog({ open, onOpenChange, request, onReviewed }: EarlyTerminationReviewDialogProps) {
  const [decision, setDecision] = useState<"approve" | "negotiate" | "deny">("approve");
  const [response, setResponse] = useState("");
  const [counterOfferAmount, setCounterOfferAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleSubmit = async () => {
    if (decision === "negotiate" && !counterOfferAmount) { toast.error("Harap masukkan jumlah penawaran balik"); return; }
    if (decision === "deny" && !response) { toast.error("Harap berikan alasan penolakan"); return; }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = { merchant_response: response, updated_at: new Date().toISOString() };

      if (decision === "approve") {
        updateData.status = "approved";
        updateData.approved_at = new Date().toISOString();
        await apiClient.put(`/contracts/${request.contract_id}`, { status: "terminated_early", actual_end_date: request.requested_date, termination_penalty: request.penalty_amount, churn_reason: request.reason });
        const invoiceNumber = `INV-TERM-${Date.now()}`;
        await apiClient.post('/invoices', { contract_id: request.contract_id, merchant_id: request.contract?.merchant_id, tenant_user_id: request.tenant_user_id, invoice_number: invoiceNumber, amount: request.penalty_amount, total_amount: request.penalty_amount, description: "Penalti pemutusan awal", due_date: request.requested_date, status: "pending" });
      } else if (decision === "negotiate") {
        updateData.status = "negotiating";
        updateData.counter_offer_amount = counterOfferAmount;
      } else {
        updateData.status = "denied";
        updateData.denied_at = new Date().toISOString();
      }

      await apiClient.put(`/early-termination-requests/${request.id}`, updateData);
      toast.success(decision === "approve" ? "Permintaan disetujui" : decision === "negotiate" ? "Penawaran balik dikirim" : "Permintaan ditolak");
      onReviewed();
    } catch (error) {
      console.error("Error processing request:", error);
      const err = error as Error;
      toast.error(err.message || "Gagal memproses permintaan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="gradient-icon-box" aria-hidden="true"><AlertTriangle className="h-5 w-5 text-warning" /></div>
            Tinjau Permintaan Pemutusan Awal
          </DialogTitle>
          <DialogDescription>{request.contract?.unit?.property?.name} - Unit {request.contract?.unit?.unit_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40 space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Tanggal Diajukan:</span><span className="font-medium">{format(new Date(request.requested_date), "dd MMMM yyyy", { locale: id })}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Penalti:</span><span className="font-medium text-destructive">Rp {Number(request.penalty_amount).toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Alasan:</span><span className="font-medium">{request.reason || "Tidak ditentukan"}</span></div>
            {request.supporting_docs?.length > 0 && (<div><span className="text-muted-foreground">Dokumen Pendukung:</span><span className="font-medium ml-2">{request.supporting_docs.length} file</span></div>)}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Keputusan Anda</Label>
            <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
              {[
                { value: "approve", icon: CheckCircle2, color: "text-success", label: "Setujui", desc: "Terima pemutusan awal dengan penalti penuh" },
                { value: "negotiate", icon: MessageSquare, color: "text-warning", label: "Negosiasi", desc: "Ajukan jumlah penalti yang berbeda" },
                { value: "deny", icon: XCircle, color: "text-destructive", label: "Tolak", desc: "Tolak permintaan pemutusan awal" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-start space-x-2 p-3 rounded-xl border border-border/40 hover:bg-primary/5 cursor-pointer transition-colors">
                  <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
                  <div>
                    <Label htmlFor={opt.value} className="cursor-pointer flex items-center gap-2">
                      <opt.icon className={`h-4 w-4 ${opt.color}`} aria-hidden="true" />{opt.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {decision === "negotiate" && (
            <div className="space-y-2">
              <Label htmlFor="counterOffer">Jumlah Penawaran Balik (Rp)</Label>
              <Input id="counterOffer" type="number" value={counterOfferAmount || ""} onChange={(e) => setCounterOfferAmount(Number(e.target.value))} placeholder="Masukkan penawaran balik..." className="rounded-xl bg-background/60 border-border/50" />
              <p className="text-xs text-muted-foreground">Penalti asli: Rp {Number(request.penalty_amount).toLocaleString("id-ID")}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="response">{decision === "deny" ? "Alasan Penolakan *" : "Pesan untuk Penyewa"}</Label>
            <Textarea id="response" value={response} onChange={(e) => setResponse(e.target.value)} placeholder={decision === "approve" ? "Pesan apa pun untuk penyewa..." : decision === "negotiate" ? "Jelaskan penawaran balik Anda..." : "Jelaskan mengapa permintaan ditolak..."} rows={3} className="rounded-xl bg-background/60 border-border/50" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">Batal</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} variant={decision === "deny" ? "destructive" : "default"} className={`flex-1 rounded-xl ${decision !== "deny" ? "gradient-cta" : ""}`}>
              {isSubmitting ? "Memproses..." : decision === "approve" ? "Setujui Permintaan" : decision === "negotiate" ? "Kirim Penawaran Balik" : "Tolak Permintaan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
