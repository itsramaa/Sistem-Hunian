import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

const REJECTION_REASONS = [
  { value: 'document_unclear', label: 'Dokumen tidak jelas/buram' },
  { value: 'information_mismatch', label: 'Informasi tidak sesuai' },
  { value: 'expired_documents', label: 'Dokumen kedaluwarsa' },
  { value: 'invalid_property_deed', label: 'Sertifikat properti tidak valid' },
  { value: 'suspicious_activity', label: 'Aktivitas mencurigakan' },
  { value: 'incomplete_submission', label: 'Pengajuan tidak lengkap' },
  { value: 'duplicate_account', label: 'Akun duplikat' },
  { value: 'other', label: 'Lainnya (spesifikasikan)' },
];

interface RejectionFormData {
  reason: string;
  reasonLabel: string;
  details: string;
  resubmissionInstructions: string;
}

interface RejectionReasonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantName: string;
  onConfirm: (data: RejectionFormData) => void;
  loading?: boolean;
}

export function RejectionReasonForm({ 
  open, 
  onOpenChange, 
  merchantName, 
  onConfirm,
  loading = false 
}: RejectionReasonFormProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [resubmissionInstructions, setResubmissionInstructions] = useState('');

  const handleConfirm = () => {
    const reasonLabel = REJECTION_REASONS.find(r => r.value === reason)?.label || reason;
    onConfirm({
      reason,
      reasonLabel,
      details,
      resubmissionInstructions,
    });
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setResubmissionInstructions('');
    onOpenChange(false);
  };

  const isValid = reason.trim() !== '' && (reason !== 'other' || details.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Tolak Pengajuan Merchant
          </DialogTitle>
          <DialogDescription>
            Berikan alasan penolakan untuk <span className="font-medium">{merchantName}</span>. 
            Merchant akan menerima notifikasi dengan detail ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="rejection-reason">
                <SelectValue placeholder="Pilih alasan penolakan" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejection-details">
              Detail Tambahan {reason === 'other' && '*'}
            </Label>
            <Textarea
              id="rejection-details"
              placeholder="Jelaskan detail masalah yang ditemukan..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resubmission-instructions">Instruksi Pengajuan Ulang</Label>
            <Textarea
              id="resubmission-instructions"
              placeholder="Berikan panduan untuk memperbaiki pengajuan (opsional)..."
              value={resubmissionInstructions}
              onChange={(e) => setResubmissionInstructions(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Contoh: "Mohon unggah ulang KTP dengan resolusi minimal 300 DPI dan pastikan semua sudut terlihat jelas."
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!isValid || loading}
          >
            {loading ? 'Memproses...' : 'Konfirmasi Penolakan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
