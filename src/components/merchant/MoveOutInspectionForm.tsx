import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Camera, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { SignaturePad } from "@/components/signature/SignaturePad";

interface MoveOutInspectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice: any;
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

export function MoveOutInspectionForm({ 
  open, 
  onOpenChange, 
  notice, 
  onCompleted 
}: MoveOutInspectionFormProps) {
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

  const updateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleSubmit = async () => {
    if (!inspectorSignature) {
      toast.error("Please provide your signature");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get or create inspection record
      const { data: existingInspection } = await supabase
        .from("move_out_inspections")
        .select("id")
        .eq("move_out_notice_id", notice.id)
        .single();

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

      // Update inspection
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

      // Update timeline
      await supabase
        .from("move_out_timeline")
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString(),
          notes: `Deductions: Rp ${totalDeductions.toLocaleString("id-ID")}`
        })
        .eq("move_out_notice_id", notice.id)
        .eq("step", "inspection_completed");

      // Create deposit refund record
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
    } catch (error: any) {
      console.error("Error completing inspection:", error);
      toast.error(error.message || "Failed to complete inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div key={item.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{item.label}</Label>
                  <RadioGroup
                    value={item.condition}
                    onValueChange={(value) => 
                      updateChecklistItem(item.id, { condition: value as "good" | "minor" | "major" })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="good" id={`${item.id}-good`} />
                      <Label htmlFor={`${item.id}-good`} className="text-sm text-success cursor-pointer">
                        Good
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="minor" id={`${item.id}-minor`} />
                      <Label htmlFor={`${item.id}-minor`} className="text-sm text-warning cursor-pointer">
                        Minor
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="major" id={`${item.id}-major`} />
                      <Label htmlFor={`${item.id}-major`} className="text-sm text-destructive cursor-pointer">
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
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Deduction (Rp)</Label>
                      <Input
                        type="number"
                        value={item.deduction || ""}
                        onChange={(e) => updateChecklistItem(item.id, { deduction: Number(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Deposit Calculation */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
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
                <span className="text-success">Rp {refundAmount.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Signatures */}
          <div className="space-y-4">
            <h3 className="font-semibold">Signatures</h3>
            
            <div className="space-y-2">
              <Label>Inspector Signature *</Label>
              <div className="border rounded-lg p-2">
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
                <div className="border rounded-lg p-2">
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
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!inspectorSignature || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Complete Inspection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
