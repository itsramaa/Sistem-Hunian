import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import { apiClient } from "@/shared/lib/axios";
import { Upload, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/shared/utils/currency";

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantId: string;
  onSubmit: (payload: CreatePaymentPayload) => void;
  loading: boolean;
}

export interface CreatePaymentPayload {
  contract_id: string;
  tenant_user_id: string;
  merchant_id: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  reference: string | null;
  due_date: string;
  status: string;
  proof_photo_url?: string | null;
}

const PAYMENT_TYPES = [
  { value: 'rent', label: 'Sewa (Rent)' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'utility', label: 'Utilitas' },
  { value: 'other', label: 'Lainnya' },
];

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Transfer Bank' },
  { value: 'cash', label: 'Tunai' },
  { value: 'card', label: 'Kartu' },
  { value: 'eft', label: 'EFT' },
  { value: 'other', label: 'Lainnya' },
];

export function CreatePaymentDialog({ open, onOpenChange, merchantId, onSubmit, loading }: CreatePaymentDialogProps) {
  const [contractId, setContractId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ['active-contracts-for-payment', merchantId],
    queryFn: async () => {
      try {
        const r = await apiClient.get('/contracts', { params: { merchant_id: merchantId, status: 'active' } });
        return r.data as Array<{ id: string; tenant_user_id: string; rent_amount: number; tenant_name: string; units?: { unit_number: string; properties?: { name: string } } }>;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!merchantId && open,
  });

  useEffect(() => {
    if (open) {
      setContractId(""); setAmount(""); setPaymentType(""); setPaymentMethod("");
      setReference(""); setDueDate(""); setProofFile(null); setProofPreview(null);
    }
  }, [open]);

  // Auto-fill amount when contract changes
  useEffect(() => {
    if (contractId && paymentType === 'rent') {
      const contract = contracts.find(c => c.id === contractId);
      if (contract) setAmount(String(contract.rent_amount));
    }
  }, [contractId, paymentType, contracts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const selectedContract = contracts.find(c => c.id === contractId);

  const handleSubmit = async () => {
    if (!contractId || !amount || !paymentType || !dueDate || !selectedContract) return;

    let proofPhotoUrl: string | null = null;
    if (proofFile) {
      setUploading(true);
      try {
        // TODO: implement file storage endpoint — was: supabase.storage.from('payment-proofs').upload(...)
        console.warn('File upload not yet implemented via Go endpoint');
      } catch (err) {
        console.error('Upload proof failed:', err);
      } finally {
        setUploading(false);
      }
    }

    const hasProof = !!proofPhotoUrl && !!paymentMethod;
    
    onSubmit({
      contract_id: contractId,
      tenant_user_id: selectedContract.tenant_user_id,
      merchant_id: merchantId,
      amount: Number(amount),
      payment_type: paymentType,
      payment_method: paymentMethod || null,
      reference: reference || null,
      due_date: dueDate,
      status: hasProof ? 'paid' : 'pending',
      proof_photo_url: proofPhotoUrl,
    });
  };

  const isSubmitting = loading || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pembayaran</DialogTitle>
          <DialogDescription>Buat pembayaran baru untuk kontrak aktif.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Contract */}
          <div className="grid gap-2">
            <Label>Kontrak</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                <SelectValue placeholder="Pilih kontrak" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.units?.unit_number} - {c.tenant_name} ({formatCurrency(c.rent_amount)}/bln)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Type */}
          <div className="grid gap-2">
            <Label>Tipe Pembayaran</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label>Jumlah (Rp)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000000"
              className="rounded-xl bg-background/60 border-border/50"
            />
          </div>

          {/* Due Date */}
          <div className="grid gap-2">
            <Label>Tanggal Jatuh Tempo</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl bg-background/60 border-border/50"
            />
          </div>

          {/* Payment Method */}
          <div className="grid gap-2">
            <Label>Metode Pembayaran (Opsional)</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="rounded-xl bg-background/60 border-border/50">
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="grid gap-2">
            <Label>Referensi (Opsional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="No. transaksi"
              className="rounded-xl bg-background/60 border-border/50"
            />
          </div>

          {/* Proof Upload */}
          <div className="grid gap-2">
            <Label>Bukti Pembayaran (Opsional)</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {proofPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border/50">
                <img src={proofPreview} alt="Bukti" className="w-full h-32 object-cover" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="rounded-xl h-20 border-dashed flex flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload foto bukti</span>
              </Button>
            )}
            {paymentMethod && proofPreview && (
              <p className="text-xs text-success">✓ Pembayaran akan otomatis ditandai sebagai "Lunas"</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
          <Button onClick={handleSubmit} disabled={!contractId || !amount || !paymentType || !dueDate || isSubmitting}
            className="gradient-cta text-primary-foreground rounded-xl">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Pembayaran"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
