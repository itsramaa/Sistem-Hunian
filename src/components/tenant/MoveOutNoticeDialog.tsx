import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays, differenceInDays, isAfter, isBefore } from "date-fns";
import { CalendarIcon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveOutNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: {
    id: string;
    end_date: string;
    rent_amount: number;
    deposit_amount: number;
    notice_period_days?: number;
    early_termination_penalty_rate?: number;
    isEarlyTermination?: boolean;
  };
  isEarlyTermination?: boolean;
  onSuccess?: () => void;
}

const MOVE_OUT_REASONS = [
  { value: "relocating", label: "Relocating for work" },
  { value: "buying_property", label: "Buying own property" },
  { value: "financial", label: "Financial reasons" },
  { value: "dissatisfaction", label: "Dissatisfaction with property" },
  { value: "other", label: "Other" },
];

export function MoveOutNoticeDialog({ open, onOpenChange, contract, isEarlyTermination: forceEarlyTermination, onSuccess }: MoveOutNoticeDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [moveOutDate, setMoveOutDate] = useState<Date | undefined>();
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isEarlyTermination, setIsEarlyTermination] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const noticePeriodDays = contract.notice_period_days || 30;
  const contractEndDate = new Date(contract.end_date);
  const minMoveOutDate = addDays(new Date(), noticePeriodDays);
  const earlyTerminationRate = contract.early_termination_penalty_rate || 2;

  // Calculate if selected date is early termination
  const isEarly = moveOutDate && isBefore(moveOutDate, contractEndDate);
  const daysEarly = moveOutDate && isEarly ? differenceInDays(contractEndDate, moveOutDate) : 0;
  const penaltyAmount = isEarly ? earlyTerminationRate * contract.rent_amount : 0;

  const handleSubmit = async () => {
    if (!moveOutDate || !user?.id) {
      toast.error("Please select a move-out date");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the terms");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create move-out notice
      const { data: notice, error: noticeError } = await supabase
        .from("move_out_notices")
        .insert({
          tenant_user_id: user.id,
          contract_id: contract.id,
          intended_move_out_date: format(moveOutDate, "yyyy-MM-dd"),
          is_early_termination: isEarly,
          reason,
          notes,
          status: "submitted",
        })
        .select()
        .single();

      if (noticeError) throw noticeError;

      // Update contract with move-out notice info
      await supabase
        .from("contracts")
        .update({
          move_out_notice_given: true,
          move_out_notice_date: new Date().toISOString(),
          expected_move_out_date: format(moveOutDate, "yyyy-MM-dd"),
        })
        .eq("id", contract.id);

      // Create timeline entries
      const timelineSteps = [
        { step: "notice_submitted", completed: true, completed_at: new Date().toISOString() },
        { step: "inspection_scheduled", completed: false },
        { step: "inspection_completed", completed: false },
        { step: "move_out_completed", completed: false },
        { step: "deposit_returned", completed: false },
      ];

      await supabase.from("move_out_timeline").insert(
        timelineSteps.map((s) => ({
          move_out_notice_id: notice.id,
          ...s,
        }))
      );

      // Create default move-out tasks
      const defaultTasks = [
        { task_name: "Schedule final inspection", description: "Coordinate with landlord for inspection", order_index: 1 },
        { task_name: "Deep clean the unit", description: "Ensure unit is thoroughly cleaned", order_index: 2 },
        { task_name: "Repair any damages", description: "Fix any damage you caused", order_index: 3 },
        { task_name: "Collect all keys", description: "Gather all keys to return", order_index: 4 },
        { task_name: "Final utility readings", description: "Take photos of meter readings", order_index: 5 },
        { task_name: "Provide forwarding address", description: "For deposit refund", order_index: 6 },
        { task_name: "Attend walk-through", description: "Be present during final inspection", order_index: 7 },
      ];

      await supabase.from("move_out_tasks").insert(
        defaultTasks.map((t) => ({
          move_out_notice_id: notice.id,
          ...t,
          due_date: format(addDays(moveOutDate, -7), "yyyy-MM-dd"),
        }))
      );

      // If early termination, create penalty request
      if (isEarly && penaltyAmount > 0) {
        await supabase.from("early_termination_requests").insert({
          tenant_user_id: user.id,
          contract_id: contract.id,
          requested_date: format(moveOutDate, "yyyy-MM-dd"),
          reason,
          penalty_amount: penaltyAmount,
          status: "pending_approval",
        });
      }

      toast.success("Move-out notice submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["tenant-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["move-out-notice"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting move-out notice:", error);
      toast.error(error.message || "Failed to submit move-out notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Give Move-Out Notice</DialogTitle>
          <DialogDescription>
            Submit your notice to vacate the property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contract Info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contract ends:</span>
              <span className="font-medium">{format(contractEndDate, "MMMM dd, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Notice required:</span>
              <span className="font-medium">{noticePeriodDays} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deposit held:</span>
              <span className="font-medium">Rp {contract.deposit_amount?.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Move-out Date Picker */}
          <div className="space-y-2">
            <Label>Intended Move-Out Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !moveOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {moveOutDate ? format(moveOutDate, "MMMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={moveOutDate}
                  onSelect={setMoveOutDate}
                  disabled={(date) => isBefore(date, minMoveOutDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Earliest available: {format(minMoveOutDate, "MMMM dd, yyyy")}
            </p>
          </div>

          {/* Early Termination Warning */}
          {isEarly && (
            <div className="p-4 rounded-lg border border-warning bg-warning/10 space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Early Termination</span>
              </div>
              <p className="text-sm">
                You're requesting to move out <strong>{daysEarly} days</strong> before your contract ends.
              </p>
              <div className="p-3 rounded bg-background">
                <div className="flex justify-between text-sm mb-1">
                  <span>Penalty Rate:</span>
                  <span>{earlyTerminationRate} month(s) rent</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Penalty Amount:</span>
                  <span className="text-destructive">Rp {penaltyAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This request requires merchant approval. The penalty will be deducted from your deposit or invoiced separately.
              </p>
            </div>
          )}

          {/* Normal Move-out Confirmation */}
          {moveOutDate && !isEarly && (
            <div className="p-4 rounded-lg border border-success bg-success/10">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Valid Notice Period</span>
              </div>
              <p className="text-sm mt-2">
                Your notice meets the required {noticePeriodDays}-day period.
              </p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Reason for Moving (Optional)</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {MOVE_OUT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          {/* Move-Out Checklist Preview */}
          <div className="p-4 rounded-lg border space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="font-medium">Move-Out Checklist Preview</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Schedule final inspection with landlord</li>
              <li>• Clean unit thoroughly</li>
              <li>• Repair any damages</li>
              <li>• Return all keys</li>
              <li>• Take final utility readings</li>
              <li>• Provide forwarding address for deposit</li>
            </ul>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
              I understand that this notice is binding and I agree to follow the move-out process
              {isEarly && " including the early termination penalty terms"}.
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!moveOutDate || !agreedToTerms || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Notice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
