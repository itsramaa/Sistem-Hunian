import { supabase } from "@/lib/integrations/supabase/client";
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

interface EarlyTerminationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: EarlyTerminationRequest;
  onReviewed: () => void;
}

export function EarlyTerminationReviewDialog({ 
  open, 
  onOpenChange, 
  request, 
  onReviewed 
}: EarlyTerminationReviewDialogProps) {
  const [decision, setDecision] = useState<"approve" | "negotiate" | "deny">("approve");
  const [response, setResponse] = useState("");
  const [counterOfferAmount, setCounterOfferAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) return null;

  const handleSubmit = async () => {
    if (decision === "negotiate" && !counterOfferAmount) {
      toast.error("Please enter a counter offer amount");
      return;
    }
    if (decision === "deny" && !response) {
      toast.error("Please provide a reason for denial");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        merchant_response: response,
        updated_at: new Date().toISOString(),
      };

      if (decision === "approve") {
        updateData.status = "approved";
        updateData.approved_at = new Date().toISOString();

        // Update contract
        await supabase
          .from("contracts")
          .update({
            status: "terminated_early",
            actual_end_date: request.requested_date,
            termination_penalty: request.penalty_amount,
            churn_reason: request.reason,
          })
          .eq("id", request.contract_id);

        // Generate penalty invoice
        const invoiceNumber = `INV-TERM-${Date.now()}`;
        await supabase
          .from("invoices")
          .insert({
            contract_id: request.contract_id,
            merchant_id: request.contract?.merchant_id,
            tenant_user_id: request.tenant_user_id,
            invoice_number: invoiceNumber,
            amount: request.penalty_amount,
            total_amount: request.penalty_amount,
            description: "Early termination penalty",
            due_date: request.requested_date,
            status: "pending",
          });

      } else if (decision === "negotiate") {
        updateData.status = "negotiating";
        updateData.counter_offer_amount = counterOfferAmount;
      } else {
        updateData.status = "denied";
        updateData.denied_at = new Date().toISOString();
      }

      await supabase
        .from("early_termination_requests")
        .update(updateData)
        .eq("id", request.id);

      toast.success(
        decision === "approve" 
          ? "Request approved" 
          : decision === "negotiate" 
          ? "Counter offer sent" 
          : "Request denied"
      );
      onReviewed();
    } catch (error) {
      console.error("Error processing request:", error);
      const err = error as Error;
      toast.error(err.message || "Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Review Early Termination Request
          </DialogTitle>
          <DialogDescription>
            {request.contract?.unit?.property?.name} - Unit {request.contract?.unit?.unit_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Details */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested Date:</span>
              <span className="font-medium">{format(new Date(request.requested_date), "MMMM dd, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Penalty Amount:</span>
              <span className="font-medium text-destructive">
                Rp {Number(request.penalty_amount).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason:</span>
              <span className="font-medium">{request.reason || "Not specified"}</span>
            </div>
            {request.supporting_docs?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Supporting Docs:</span>
                <span className="font-medium ml-2">{request.supporting_docs.length} files</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Decision */}
          <div className="space-y-3">
            <Label>Your Decision</Label>
            <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="approve" id="approve" className="mt-1" />
                <div>
                  <Label htmlFor="approve" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Approve
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Accept the early termination with full penalty
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="negotiate" id="negotiate" className="mt-1" />
                <div>
                  <Label htmlFor="negotiate" className="cursor-pointer flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-warning" />
                    Negotiate
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Propose a different penalty amount
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="deny" id="deny" className="mt-1" />
                <div>
                  <Label htmlFor="deny" className="cursor-pointer flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Deny
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Reject the early termination request
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Counter Offer */}
          {decision === "negotiate" && (
            <div className="space-y-2">
              <Label>Counter Offer Amount (Rp)</Label>
              <Input
                type="number"
                value={counterOfferAmount || ""}
                onChange={(e) => setCounterOfferAmount(Number(e.target.value))}
                placeholder="Enter counter offer..."
              />
              <p className="text-xs text-muted-foreground">
                Original penalty: Rp {Number(request.penalty_amount).toLocaleString("id-ID")}
              </p>
            </div>
          )}

          {/* Response Message */}
          <div className="space-y-2">
            <Label>
              {decision === "deny" ? "Denial Reason *" : "Message to Tenant"}
            </Label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={
                decision === "approve" 
                  ? "Any message for the tenant..."
                  : decision === "negotiate"
                  ? "Explain your counter offer..."
                  : "Explain why the request is denied..."
              }
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              variant={decision === "deny" ? "destructive" : "default"}
              className="flex-1"
            >
              {isSubmitting ? "Processing..." : 
                decision === "approve" ? "Approve Request" :
                decision === "negotiate" ? "Send Counter Offer" :
                "Deny Request"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
