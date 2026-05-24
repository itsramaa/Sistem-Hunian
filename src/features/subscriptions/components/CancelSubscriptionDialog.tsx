import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { Loader2, AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
}

const CANCELLATION_REASONS = [
  { value: "too_expensive", label: "Too expensive for my needs" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "switching_provider", label: "Switching to another provider" },
  { value: "business_closing", label: "Closing my business" },
  { value: "temporary_pause", label: "Temporary pause, may return" },
  { value: "other", label: "Other reason" },
];

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscriptionId,
}: CancelSubscriptionDialogProps) {
  const { merchant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [wouldReturn, setWouldReturn] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!merchant?.id) throw new Error("No merchant");

      // Submit cancellation via Go API
      await apiClient.put(`/subscriptions/${subscriptionId}/cancel`, {
        merchant_id: merchant.id,
        reason: selectedReason,
        feedback: feedback || null,
        would_return: wouldReturn,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
      toast({
        title: "Cancellation requested",
        description: "Your subscription will be cancelled at the end of the current billing period.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Cancellation error:", error);
      toast({
        title: "Cancellation failed",
        description: "Could not process your cancellation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStep(1);
    setSelectedReason("");
    setFeedback("");
    setWouldReturn(false);
    setConfirmCancel(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const canProceedStep1 = selectedReason !== "";
  const canProceedStep3 = confirmCancel;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            {step === 1 && "Help us understand why you're leaving"}
            {step === 2 && "Any additional feedback? (Optional)"}
            {step === 3 && "Confirm your cancellation"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s === step
                  ? "bg-primary"
                  : s < step
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Reason Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="flex-1 cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Additional Feedback */}
        {step === 2 && (
          <div className="space-y-4">
            <Textarea
              placeholder="Tell us more about your experience... (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="would-return"
                checked={wouldReturn}
                onCheckedChange={(checked) => setWouldReturn(checked === true)}
              />
              <Label htmlFor="would-return" className="text-sm cursor-pointer">
                I would consider returning if my concerns are addressed
              </Label>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription will be cancelled at the end of your current billing period.
                You will retain access until then.
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <p><strong>Reason:</strong> {CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label}</p>
              {feedback && <p><strong>Feedback:</strong> {feedback}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-cancel"
                checked={confirmCancel}
                onCheckedChange={(checked) => setConfirmCancel(checked === true)}
              />
              <Label htmlFor="confirm-cancel" className="text-sm cursor-pointer">
                I understand and want to proceed with cancellation
              </Label>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!canProceedStep3 || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
