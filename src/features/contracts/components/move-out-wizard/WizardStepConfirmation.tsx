import { Button } from "@/shared/components/ui/button";
import { formatCurrency } from "@/shared/utils/currency";
import { ArrowLeft, Check, CheckCircle2, DoorOpen, FileText, List, Printer, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMoveOutWizardData } from "./useMoveOutWizardData";

interface Props {
  data: ReturnType<typeof useMoveOutWizardData>;
  onBack: () => void;
}

export function WizardStepConfirmation({ data, onBack }: Props) {
  const navigate = useNavigate();
  const { notice, tenantProfile, inspection, depositRefund } = data;

  if (!notice) return null;

  const unit = notice.contract?.unit;
  const property = unit?.property;

  const items = [
    {
      label: "Pemberitahuan Pindah Keluar",
      status: notice.status,
      done: notice.status !== "submitted",
      detail: `Status: ${notice.status}`,
    },
    {
      label: "Inspeksi Unit",
      status: inspection?.status || "belum ada",
      done: inspection?.status === "completed",
      detail: inspection?.status === "completed"
        ? `Potongan: ${formatCurrency(inspection.total_deductions || 0)}`
        : undefined,
    },
    {
      label: "Refund Deposit",
      status: depositRefund?.status || "belum ada",
      done: depositRefund?.status === "approved" || depositRefund?.status === "processing" || depositRefund?.status === "completed",
      detail: depositRefund ? `Refund: ${formatCurrency(depositRefund.refund_amount)}` : undefined,
    },
    {
      label: "Pengakhiran Kontrak",
      status: notice.contract?.status || "—",
      done: notice.contract?.status === "terminated" || notice.contract?.status === "terminated_early",
      detail: `Status kontrak: ${notice.contract?.status}`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Proses Pindah Keluar Selesai</h2>
          <p className="text-muted-foreground">
            {tenantProfile?.full_name} — {property?.name}, Unit {unit?.unit_number}
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
              <div className="flex items-center gap-3">
                {item.done ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
                </div>
              </div>
              <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${item.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => toast.info("Fitur pengiriman konfirmasi akan segera tersedia")}>
          <Send className="h-4 w-4" /> Kirim Konfirmasi
        </Button>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Cetak Checklist
        </Button>
        <Button className="rounded-xl gap-2" onClick={() => navigate("/merchant/move-outs")}>
          <List className="h-4 w-4" /> Kembali ke Daftar
        </Button>
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBack} className="rounded-xl gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
      </div>
    </div>
  );
}
