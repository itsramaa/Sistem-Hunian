import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Payment } from "../types";
import { supabase } from "@/lib/integrations/supabase/client";
import { ImageIcon, Upload, X } from "lucide-react";

interface MarkPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onConfirm: (data: { paymentId: string; method: string; reference: string; proofPhotoUrl?: string }) => void;
  loading: boolean;
}

const VALID_PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'eft', label: 'EFT' },
  { value: 'other', label: 'Other' },
];

export function MarkPaidDialog({
  open,
  onOpenChange,
  payment,
  onConfirm,
  loading,
}: MarkPaidDialogProps) {
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMethod("");
      setReference("");
      setProofFile(null);
      setProofPreview(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!payment || !method) return;

    let proofPhotoUrl: string | undefined;

    if (proofFile) {
      setUploading(true);
      try {
        const ext = proofFile.name.split('.').pop();
        const filePath = `${payment.merchant_id}/${payment.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, proofFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        proofPhotoUrl = urlData.publicUrl;
      } catch (err) {
        console.error('Failed to upload proof photo:', err);
      } finally {
        setUploading(false);
      }
    }

    onConfirm({ paymentId: payment.id, method, reference, proofPhotoUrl });
  };

  const isSubmitting = loading || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Mark Payment as Paid</DialogTitle>
          <DialogDescription>
            Record a manual payment for {payment?.payment_type} amount {payment?.amount}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="method" className="rounded-xl bg-background/60 border-border/50">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {VALID_PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Transaction ID"
              className="rounded-xl bg-background/60 border-border/50"
            />
          </div>
          <div className="grid gap-2">
            <Label>Bukti Pembayaran (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {proofPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border/50">
                <img src={proofPreview} alt="Bukti pembayaran" className="w-full h-40 object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-24 border-dashed flex flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload foto bukti</span>
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!method || isSubmitting} className="gradient-cta text-primary-foreground rounded-xl">
            {isSubmitting ? "Saving..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
