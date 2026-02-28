import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { supabase } from "@/lib/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/shared/utils/currency";
import { ArrowLeft, ArrowRight, Check, FileText, Wallet } from "lucide-react";
import { useMoveOutWizardData } from "./useMoveOutWizardData";

interface Props {
  data: ReturnType<typeof useMoveOutWizardData>;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStepDeposit({ data, onNext, onBack }: Props) {
  const { notice, depositRefund, outstandingInvoices, depositSettled, contractTerminated, step3Complete, refetchAll } = data;

  const [bankName, setBankName] = useState(depositRefund?.bank_name || "");
  const [bankAccount, setBankAccount] = useState(depositRefund?.bank_account_number || "");
  const [accountHolder, setAccountHolder] = useState(depositRefund?.account_holder_name || "");
  const [isApprovingDeposit, setIsApprovingDeposit] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  if (!notice) return null;

  const totalOutstanding = outstandingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || inv.amount || 0), 0) || 0;

  const handleApproveDeposit = async () => {
    if (!depositRefund) return;
    if (!bankName || !bankAccount || !accountHolder) { toast.error("Lengkapi data bank penyewa"); return; }

    setIsApprovingDeposit(true);
    try {
      const { error } = await supabase.from("deposit_refunds").update({
        status: "approved",
        bank_name: bankName,
        bank_account_number: bankAccount,
        account_holder_name: accountHolder,
      }).eq("id", depositRefund.id);
      if (error) throw error;

      await supabase.from("move_out_timeline").update({ completed: true, completed_at: new Date().toISOString() }).eq("move_out_notice_id", notice.id).eq("step", "deposit_settled");

      toast.success("Refund deposit disetujui");
      await refetchAll();
    } catch (error) {
      toast.error((error as Error).message || "Gagal menyetujui refund");
    } finally {
      setIsApprovingDeposit(false);
    }
  };

  const handleTerminateContract = async () => {
    if (!notice.contract) return;
    setIsTerminating(true);
    try {
      const { error } = await supabase.from("contracts").update({
        status: "terminated",
        actual_end_date: new Date().toISOString().split("T")[0],
      }).eq("id", notice.contract.id);
      if (error) throw error;

      await supabase.from("move_out_notices").update({ status: "completed" }).eq("id", notice.id);
      await supabase.from("move_out_timeline").update({ completed: true, completed_at: new Date().toISOString() }).eq("move_out_notice_id", notice.id).eq("step", "contract_terminated");

      toast.success("Kontrak berhasil diakhiri");
      await refetchAll();
    } catch (error) {
      toast.error((error as Error).message || "Gagal mengakhiri kontrak");
    } finally {
      setIsTerminating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Deposit Summary */}
      <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Penyelesaian Deposit</h3>
        {depositRefund ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-muted/20 space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit Asli</span><span className="font-medium">{formatCurrency(depositRefund.original_deposit)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Potongan</span><span className="font-medium text-destructive">— {formatCurrency(depositRefund.deductions || 0)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg"><span>Refund Bersih</span><span className="text-primary">{formatCurrency(depositRefund.refund_amount)}</span></div>
            </div>

            {!depositSettled && (
              <>
                <Separator />
                <h4 className="font-medium">Data Bank Penyewa</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Nama Bank</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA, Mandiri..." className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label>No. Rekening</Label>
                    <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="1234567890" className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label>Atas Nama</Label>
                    <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Nama pemilik" className="rounded-xl" />
                  </div>
                </div>
                <Button onClick={handleApproveDeposit} disabled={isApprovingDeposit} className="rounded-xl gap-2 w-full">
                  {isApprovingDeposit ? "Memproses..." : <><Check className="h-4 w-4" /> Setujui Refund Deposit</>}
                </Button>
              </>
            )}
            {depositSettled && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                <Check className="h-4 w-4" /> Refund deposit telah disetujui (Status: {depositRefund.status})
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Belum ada data refund deposit. Selesaikan inspeksi terlebih dahulu.</p>
        )}
      </section>

      {/* Outstanding Invoices */}
      {outstandingInvoices && outstandingInvoices.length > 0 && (
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-warning/30 p-6 space-y-3">
          <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-warning" /> Tagihan Tertunggak</h4>
          {outstandingInvoices.map((inv) => (
            <div key={inv.id} className="flex justify-between text-sm p-2 rounded-lg bg-muted/20">
              <span>{inv.invoice_number}</span>
              <span className="font-medium text-warning">{formatCurrency(inv.total_amount || inv.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold"><span>Total Tertunggak</span><span className="text-warning">{formatCurrency(totalOutstanding)}</span></div>
        </section>
      )}

      {/* Contract Termination */}
      <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Pengakhiran Kontrak</h3>
        {contractTerminated ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary text-sm font-medium">
            <Check className="h-4 w-4" /> Kontrak telah diakhiri
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Mengakhiri kontrak akan mengubah status unit menjadi tersedia.</p>
            <Button onClick={handleTerminateContract} disabled={isTerminating || !depositSettled} variant="destructive" className="rounded-xl gap-2 w-full">
              {isTerminating ? "Memproses..." : "Akhiri Kontrak"}
            </Button>
            {!depositSettled && <p className="text-xs text-muted-foreground">Setujui refund deposit terlebih dahulu sebelum mengakhiri kontrak.</p>}
          </>
        )}
      </section>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-xl gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
        {step3Complete && (
          <Button onClick={onNext} className="rounded-xl gap-2">Lanjut ke Konfirmasi <ArrowRight className="h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
