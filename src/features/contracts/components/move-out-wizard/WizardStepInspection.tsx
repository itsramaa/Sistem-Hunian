import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Separator } from "@/shared/components/ui/separator";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, ArrowRight, CalendarIcon, Check, CheckCircle2, Clock, ClipboardCheck, Wallet, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { SignaturePad } from "@/features/signature/components/SignaturePad";
import { useMoveOutWizardData } from "./useMoveOutWizardData";

const TIME_SLOTS = [
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "11:00", label: "11:00" },
  { value: "13:00", label: "13:00" },
  { value: "14:00", label: "14:00" },
  { value: "15:00", label: "15:00" },
  { value: "16:00", label: "16:00" },
];

interface ChecklistItem {
  id: string;
  label: string;
  condition: "good" | "minor" | "major";
  notes: string;
  deduction: number;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: "walls", label: "Dinding & Langit-langit", condition: "good", notes: "", deduction: 0 },
  { id: "floors", label: "Lantai", condition: "good", notes: "", deduction: 0 },
  { id: "windows", label: "Jendela & Pintu", condition: "good", notes: "", deduction: 0 },
  { id: "electrical", label: "Listrik & Penerangan", condition: "good", notes: "", deduction: 0 },
  { id: "plumbing", label: "Pipa & Sanitasi", condition: "good", notes: "", deduction: 0 },
  { id: "appliances", label: "Peralatan", condition: "good", notes: "", deduction: 0 },
  { id: "cleanliness", label: "Kebersihan", condition: "good", notes: "", deduction: 0 },
  { id: "keys", label: "Kunci Dikembalikan", condition: "good", notes: "", deduction: 0 },
];

interface Props {
  data: ReturnType<typeof useMoveOutWizardData>;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStepInspection({ data, onNext, onBack }: Props) {
  const { notice, inspection, inspectionCompleted, refetchAll } = data;
  const { user } = useAuth();

  // Schedule state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Conduct inspection state
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [tenantPresent, setTenantPresent] = useState(true);
  const [inspectorSignature, setInspectorSignature] = useState("");
  const [tenantSignature, setTenantSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!notice) return null;

  const depositAmount = Number(notice.contract?.deposit_amount || 0);
  const totalDeductions = checklist.reduce((sum, item) => sum + item.deduction, 0);
  const refundAmount = Math.max(0, depositAmount - totalDeductions);
  const deductionsExceedDeposit = totalDeductions > depositAmount;
  const moveOutDate = new Date(notice.intended_move_out_date);

  const updateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setChecklist((prev) => prev.map((item) => item.id === itemId ? { ...item, ...updates, deduction: updates.deduction !== undefined && updates.deduction < 0 ? 0 : updates.deduction ?? item.deduction } : item));
  };

  // Schedule inspection
  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) { toast.error("Pilih tanggal dan waktu"); return; }
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = setMinutes(setHours(selectedDate, hours), minutes);

    setIsScheduling(true);
    try {
      const { error } = await supabase.from("move_out_inspections").insert({
        move_out_notice_id: notice.id,
        scheduled_date: scheduledDateTime.toISOString(),
        inspector_id: user?.id,
        status: "scheduled",
      });
      if (error) throw error;

      await supabase.from("move_out_timeline").update({ completed: true, completed_at: new Date().toISOString(), notes: `Dijadwalkan ${format(scheduledDateTime, "dd MMM yyyy HH:mm", { locale: idLocale })}` }).eq("move_out_notice_id", notice.id).eq("step", "inspection_scheduled");
      await supabase.from("move_out_notices").update({ status: "in_progress" }).eq("id", notice.id);

      toast.success("Inspeksi berhasil dijadwalkan");
      await refetchAll();
    } catch (error) {
      toast.error((error as Error).message || "Gagal menjadwalkan inspeksi");
    } finally {
      setIsScheduling(false);
    }
  };

  // Conduct inspection
  const handleCompleteInspection = async () => {
    if (!inspectorSignature) { toast.error("Berikan tanda tangan inspektur"); return; }
    if (deductionsExceedDeposit) { toast.error("Potongan melebihi deposit"); return; }

    setIsSubmitting(true);
    try {
      const inspectionReport = {
        tenant_present: tenantPresent,
        checklist: checklist.map((item) => ({ ...item, inspected_at: new Date().toISOString() })),
        summary: {
          total_items: checklist.length,
          good_condition: checklist.filter((i) => i.condition === "good").length,
          minor_issues: checklist.filter((i) => i.condition === "minor").length,
          major_issues: checklist.filter((i) => i.condition === "major").length,
        },
      };
      const deductionDetails = checklist.filter((item) => item.deduction > 0).map((item) => ({ category: item.label, amount: item.deduction, notes: item.notes }));

      await supabase.from("move_out_inspections").update({
        status: "completed",
        inspection_report: inspectionReport,
        total_deductions: totalDeductions,
        deposit_refund_amount: refundAmount,
        deduction_details: deductionDetails,
        inspector_signature: inspectorSignature,
        tenant_signature: tenantPresent ? tenantSignature : null,
        completed_at: new Date().toISOString(),
      }).eq("id", inspection!.id);

      await supabase.from("move_out_timeline").update({ completed: true, completed_at: new Date().toISOString(), notes: `Potongan: Rp ${totalDeductions.toLocaleString("id-ID")}` }).eq("move_out_notice_id", notice.id).eq("step", "inspection_completed");

      await supabase.from("deposit_refunds").insert({
        tenant_user_id: notice.tenant_user_id,
        contract_id: notice.contract_id,
        inspection_id: inspection!.id,
        original_deposit: depositAmount,
        deductions: totalDeductions,
        deduction_details: deductionDetails,
        refund_amount: refundAmount,
        status: "pending_processing",
        due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      });

      toast.success("Inspeksi selesai");
      await refetchAll();
    } catch (error) {
      toast.error((error as Error).message || "Gagal menyelesaikan inspeksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---

  // Completed inspection summary
  if (inspectionCompleted && inspection) {
    const report = inspection.inspection_report as Record<string, unknown> | null;
    const summary = report?.summary as { good_condition: number; minor_issues: number; major_issues: number } | undefined;
    return (
      <div className="space-y-6">
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Inspeksi Selesai
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{summary?.good_condition ?? 0}</p>
              <p className="text-xs text-muted-foreground">Baik</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-warning">{summary?.minor_issues ?? 0}</p>
              <p className="text-xs text-muted-foreground">Minor</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{summary?.major_issues ?? 0}</p>
              <p className="text-xs text-muted-foreground">Major</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/20 space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Potongan</span><span className="font-semibold text-destructive">Rp {(inspection.total_deductions || 0).toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Refund</span><span className="font-semibold text-primary">Rp {(inspection.deposit_refund_amount || 0).toLocaleString("id-ID")}</span></div>
          </div>
        </section>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="rounded-xl gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
          <Button onClick={onNext} className="rounded-xl gap-2">Lanjut ke Deposit <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  // Scheduled — show "Conduct Inspection" or the full form
  if (inspection && inspection.status === "scheduled") {
    if (!showInspectionForm) {
      return (
        <div className="space-y-6">
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> Inspeksi Terjadwal</h3>
            <div className="bg-muted/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tanggal</p>
              <p className="font-semibold">{inspection.scheduled_date ? format(new Date(inspection.scheduled_date), "dd MMM yyyy, HH:mm", { locale: idLocale }) : "—"}</p>
            </div>
            <Button onClick={() => setShowInspectionForm(true)} className="rounded-xl gap-2 w-full">
              <ClipboardCheck className="h-4 w-4" /> Mulai Inspeksi
            </Button>
          </section>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} className="rounded-xl gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
          </div>
        </div>
      );
    }

    // Full inspection form inline
    return (
      <div className="space-y-6">
        <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-6">
          <h3 className="font-semibold text-lg">Laporan Inspeksi</h3>
          <div className="flex items-center space-x-2">
            <Checkbox id="tenant-present" checked={tenantPresent} onCheckedChange={(c) => setTenantPresent(c as boolean)} />
            <Label htmlFor="tenant-present">Penyewa hadir saat inspeksi</Label>
          </div>
          <Separator />

          {/* Checklist */}
          <div className="space-y-4">
            <h4 className="font-medium">Checklist Inspeksi</h4>
            {checklist.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-border/40 bg-card/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="font-medium">{item.label}</Label>
                  <RadioGroup value={item.condition} onValueChange={(v) => updateChecklistItem(item.id, { condition: v as "good" | "minor" | "major" })} className="flex gap-3">
                    {[
                      { value: "good", label: "Baik", color: "text-primary" },
                      { value: "minor", label: "Minor", color: "text-warning" },
                      { value: "major", label: "Major", color: "text-destructive" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-1.5">
                        <RadioGroupItem value={opt.value} id={`${item.id}-${opt.value}`} />
                        <Label htmlFor={`${item.id}-${opt.value}`} className={`text-sm cursor-pointer ${opt.color}`}>{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                {item.condition !== "good" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Catatan</Label>
                      <Input value={item.notes} onChange={(e) => updateChecklistItem(item.id, { notes: e.target.value })} placeholder="Jelaskan masalah..." className="rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Potongan (Rp)</Label>
                      <Input type="number" value={item.deduction || ""} onChange={(e) => updateChecklistItem(item.id, { deduction: Number(e.target.value) || 0 })} placeholder="0" className="rounded-xl" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Deposit Calculation */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
            <h4 className="font-semibold flex items-center gap-2"><Wallet className="h-5 w-5" /> Kalkulasi Deposit</h4>
            <div className="flex justify-between"><span>Deposit Asli</span><span>Rp {depositAmount.toLocaleString("id-ID")}</span></div>
            {checklist.filter((i) => i.deduction > 0).map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-destructive"><span>— {item.label}</span><span>Rp {item.deduction.toLocaleString("id-ID")}</span></div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Refund</span>
              <span className={deductionsExceedDeposit ? "text-destructive" : "text-primary"}>Rp {refundAmount.toLocaleString("id-ID")}</span>
            </div>
            {deductionsExceedDeposit && (
              <div className="flex items-center gap-2 text-destructive text-sm"><AlertTriangle className="h-4 w-4" /> Potongan melebihi deposit</div>
            )}
          </div>

          <Separator />

          {/* Signatures */}
          <div className="space-y-4">
            <h4 className="font-semibold">Tanda Tangan</h4>
            <div className="space-y-2">
              <Label>Inspektur *</Label>
              <div className="border border-border/40 rounded-xl p-2"><SignaturePad onSave={setInspectorSignature} width={400} height={150} /></div>
              {inspectorSignature && <p className="text-sm text-primary flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Tanda tangan tercatat</p>}
            </div>
            {tenantPresent && (
              <div className="space-y-2">
                <Label>Penyewa</Label>
                <div className="border border-border/40 rounded-xl p-2"><SignaturePad onSave={setTenantSignature} width={400} height={150} /></div>
                {tenantSignature && <p className="text-sm text-primary flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Tanda tangan tercatat</p>}
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setShowInspectionForm(false)} className="rounded-xl gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
          <Button onClick={handleCompleteInspection} disabled={!inspectorSignature || isSubmitting || deductionsExceedDeposit} className="rounded-xl gap-2">
            {isSubmitting ? "Menyimpan..." : <><Check className="h-4 w-4" /> Selesaikan Inspeksi</>}
          </Button>
        </div>
      </div>
    );
  }

  // No inspection — show schedule form
  return (
    <div className="space-y-6">
      <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-6">
        <h3 className="font-semibold text-lg">Jadwalkan Inspeksi</h3>
        <div className="p-4 rounded-xl bg-muted/20 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tanggal pindah:</span><span className="font-medium">{format(moveOutDate, "dd MMM yyyy", { locale: idLocale })}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Rekomendasi inspeksi:</span><span className="font-medium">{format(addDays(moveOutDate, -7), "dd MMM yyyy", { locale: idLocale })}</span></div>
        </div>

        <div className="space-y-2">
          <Label>Tanggal Inspeksi</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left rounded-xl", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date() || date > moveOutDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Waktu Inspeksi</Label>
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="rounded-xl">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Pilih waktu" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (<SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-xl gap-2"><ArrowLeft className="h-4 w-4" /> Kembali</Button>
        <Button onClick={handleSchedule} disabled={!selectedDate || !selectedTime || isScheduling} className="rounded-xl gap-2">
          {isScheduling ? "Menjadwalkan..." : <><CalendarIcon className="h-4 w-4" /> Jadwalkan Inspeksi</>}
        </Button>
      </div>
    </div>
  );
}
