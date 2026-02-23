import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Separator } from "@/shared/components/ui/separator";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Camera, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { SignaturePad } from "@/features/signature/components/SignaturePad";
import { MoveOutNotice } from "@/features/contracts/types";

interface MoveOutInspectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice: MoveOutNotice | null;
  onCompleted: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  condition: "good" | "minor" | "major";
  notes: string;
  deduction: number;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: "walls", label: "Walls & Ceiling", condition: "good", notes: "", deduction: 0 },
  { id: "floors", label: "Flooring", condition: "good", notes: "", deduction: 0 },
  { id: "windows", label: "Windows & Doors", condition: "good", notes: "", deduction: 0 },
  { id: "electrical", label: "Electrical & Lighting", condition: "good", notes: "", deduction: 0 },
  { id: "plumbing", label: "Plumbing & Fixtures", condition: "good", notes: "", deduction: 0 },
  { id: "appliances", label: "Appliances", condition: "good", notes: "", deduction: 0 },
  { id: "cleanliness", label: "Cleanliness", condition: "good", notes: "", deduction: 0 },
  { id: "keys", label: "Keys Returned", condition: "good", notes: "", deduction: 0 },
];

export function MoveOutInspectionForm({ open, onOpenChange, notice, onCompleted }: MoveOutInspectionFormProps) {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [tenantPresent, setTenantPresent] = useState(true);
  const [inspectorSignature, setInspectorSignature] = useState<string>("");
  const [tenantSignature, setTenantSignature] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!notice) return null;

  const depositAmount = Number(notice.contract?.deposit_amount || 0);
  const totalDeductions = checklist.reduce((sum, item) => sum + item.deduction, 0);
  const refundAmount = Math.max(0, depositAmount - totalDeductions);
  const deductionsExceedDeposit = totalDeductions > depositAmount;

  const updateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.deduction !== undefined && updates.deduction < 0) {
            updated.deduction = 0;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = async () => {
    if (!inspectorSignature) {
      toast.error("Please provide your signature");
      return;
    }
    if (deductionsExceedDeposit) {
      toast.error("Total deductions cannot exceed the deposit amount");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: existingInspection } = await supabase
        .from("move_out_inspections")
        .select("id")
        .eq("move_out_notice_id", notice.id)
        .maybeSingle();

      const inspectionReport = {
        tenant_present: tenantPresent,
        checklist: checklist.map((item) => ({
          ...item,
          inspected_at: new Date().toISOString(),
        })),
        summary: {
          total_items: checklist.length,
          good_condition: checklist.filter((i) => i.condition === "good").length,
          minor_issues: checklist.filter((i) => i.condition === "minor").length,
          major_issues: checklist.filter((i) => i.condition === "major").length,
        },
      };

      const deductionDetails = checklist
        .filter((item) => item.deduction > 0)
        .map((item) => ({
          category: item.label,
          amount: item.deduction,
          notes: item.notes,
        }));

      const { error: inspectionError } = await supabase
        .from("move_out_inspections")
        .update({
          status: "completed",
          inspection_report: inspectionReport,
          total_deductions: totalDeductions,
          deposit_refund_amount: refundAmount,
          deduction_details: deductionDetails,
          inspector_signature: inspectorSignature,
          tenant_signature: tenantPresent ? tenantSignature : null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingInspection?.id);

      if (inspectionError) throw inspectionError;

      await supabase
        .from("move_out_timeline")
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString(),
          notes: `Deductions: Rp ${totalDeductions.toLocaleString("id-ID")}`
        })
        .eq("move_out_notice_id", notice.id)
        .eq("step", "inspection_completed");

      const { error: refundError } = await supabase
        .from("deposit_refunds")
        .insert({
          tenant_user_id: notice.tenant_user_id,
          contract_id: notice.contract_id,
          inspection_id: existingInspection?.id,
          original_deposit: depositAmount,
          deductions: totalDeductions,
          deduction_details: deductionDetails,
          refund_amount: refundAmount,
          status: "pending_processing",
          due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        });

      if (refundError) throw refundError;

      toast.success("Inspection completed successfully");
      onCompleted();
    } catch (error) {
      console.error("Error completing inspection:", error);
      const err = error as Error;
      toast.error(err.message || "Failed to complete inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Move-Out Inspection Report</DialogTitle>
          <DialogDescription>
            {notice.contract?.unit?.property?.name} - Unit {notice.contract?.unit?.unit_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tenant Present */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tenant-present"
              checked={tenantPresent}
              onCheckedChange={(checked) => setTenantPresent(checked as boolean)}
            />
            <Label htmlFor="tenant-present">Tenant present during inspection</Label>
          </div>

          <Separator />

          {/* Checklist */}
          <div className="space-y-4">
            <h3 className="font-semibold">Inspection Checklist</h3>
            
            {checklist.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{item.label}</Label>
                  <RadioGroup
                    value={item.condition}
                    onValueChange={(value) => 
                      updateChecklistItem(item.id, { condition: value as "good" | "minor" | "major" })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="good" id={`${item.id}-good`} />
                      <Label htmlFor={`${item.id}-good`} className="text-sm text-success cursor-pointer flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        Good
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="minor" id={`${item.id}-minor`} />
                      <Label htmlFor={`${item.id}-minor`} className="text-sm text-warning cursor-pointer flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        Minor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <RadioGroupItem value="major" id={`${item.id}-major`} />
                      <Label htmlFor={`${item.id}-major`} className="text-sm text-destructive cursor-pointer flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        Major
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {item.condition !== "good" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Notes</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => updateChecklistItem(item.id, { notes: e.target.value })}
                        placeholder="Describe the issue..."
                        className="rounded-xl bg-background/60 border-border/50"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Deduction (Rp)</Label>
                      <Input
                        type="number"
                        value={item.deduction || ""}
                        onChange={(e) => updateChecklistItem(item.id, { deduction: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="rounded-xl bg-background/60 border-border/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Deposit Calculation */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/40 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Deposit Calculation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Original Deposit</span>
                <span>Rp {depositAmount.toLocaleString("id-ID")}</span>
              </div>
              {checklist.filter((i) => i.deduction > 0).map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-destructive">
                  <span>- {item.label}</span>
                  <span>Rp {item.deduction.toLocaleString("id-ID")}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Refund Amount</span>
                <span className={deductionsExceedDeposit ? "text-destructive" : "text-success"}>
                  Rp {refundAmount.toLocaleString("id-ID")}
                </span>
              </div>
              {deductionsExceedDeposit && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Total deductions exceed deposit amount</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Signatures */}
          <div className="space-y-4">
            <h3 className="font-semibold">Signatures</h3>
            
            <div className="space-y-2">
              <Label>Inspector Signature *</Label>
              <div className="border border-border/40 rounded-xl p-2">
                <SignaturePad
                  onSave={setInspectorSignature}
                  width={400}
                  height={150}
                />
              </div>
              {inspectorSignature && (
                <p className="text-sm text-success flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Signature captured
                </p>
              )}
            </div>

            {tenantPresent && (
              <div className="space-y-2">
                <Label>Tenant Signature</Label>
                <div className="border border-border/40 rounded-xl p-2">
                  <SignaturePad
                    onSave={setTenantSignature}
                    width={400}
                    height={150}
                  />
                </div>
                {tenantSignature && (
                  <p className="text-sm text-success flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Signature captured
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!inspectorSignature || isSubmitting || deductionsExceedDeposit}
              className="flex-1 rounded-xl gradient-cta"
            >
              {isSubmitting ? "Submitting..." : "Complete Inspection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
