import { useState, useRef } from 'react';
import { Camera, Upload, FileText, Loader2, Sparkles, X, Image } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Progress } from '@/shared/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import { EXPENSE_CATEGORIES } from '../services/expenseService';
import { toast } from 'sonner';

const CATEGORY_LABELS: Record<string, string> = {
  utilities: 'Utilitas', maintenance: 'Pemeliharaan', insurance: 'Asuransi',
  tax: 'Pajak', marketing: 'Pemasaran', admin: 'Administrasi',
  payroll: 'Gaji', other: 'Lainnya',
};

const APPROVAL_THRESHOLD = 500_000;

interface ExpenseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OcrData {
  vendor_name?: string;
  receipt_date?: string;
  total_amount?: number;
  suggested_category?: string;
  payment_method?: string;
  confidence?: number;
  line_items?: Array<{ description: string; total: number }>;
}

export function ExpenseCreateDialog({ open, onOpenChange }: ExpenseCreateDialogProps) {
  const { user } = useAuth();
  const { createExpense } = useExpenses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'processing' | 'form'>('upload');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OcrData | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const [form, setForm] = useState({
    category: 'utilities',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const resetState = () => {
    setStep('upload');
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptPath(null);
    setOcrData(null);
    setForm({ category: 'utilities', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer', notes: '' });
  };

  const handleFileSelect = async (file: File) => {
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));

    // Upload to storage
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user?.id}/expense-receipts/${Date.now()}.${ext}`;

    setStep('processing');
    setOcrProcessing(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;
      setReceiptPath(path);

      // Call OCR
      const { data, error } = await supabase.functions.invoke('ocr-expense-receipt', {
        body: { document_path: path },
      });

      if (error) throw error;

      const extracted = data?.extracted_data as OcrData;
      setOcrData(extracted);

      // Auto-fill form
      if (extracted) {
        setForm(f => ({
          ...f,
          amount: extracted.total_amount ? String(extracted.total_amount) : f.amount,
          expenseDate: extracted.receipt_date || f.expenseDate,
          category: extracted.suggested_category && EXPENSE_CATEGORIES.includes(extracted.suggested_category as any)
            ? extracted.suggested_category
            : f.category,
          description: extracted.vendor_name || f.description,
          paymentMethod: extracted.payment_method || f.paymentMethod,
        }));
      }

      setStep('form');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Gagal memproses struk. Silakan isi manual.');
      setStep('form');
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) return;

    const amount = Number(form.amount);
    const autoApprove = amount < APPROVAL_THRESHOLD;

    createExpense.mutate({
      category: form.category,
      description: form.description,
      amount,
      expenseDate: form.expenseDate,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      receiptUrl: receiptPath || undefined,
      ocrData: ocrData ? (ocrData as Record<string, unknown>) : undefined,
      autoApprove,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetState();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Pengeluaran</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload struk untuk pengisian otomatis, atau langsung isi manual.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs">Foto / Galeri</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload PDF</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <Button variant="ghost" className="w-full" onClick={() => setStep('form')}>
              <FileText className="h-4 w-4 mr-2" /> Isi Manual
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memproses struk dengan OCR...</p>
            <Progress value={65} className="w-48" />
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            {receiptPreview && (
              <div className="relative">
                <img src={receiptPreview} alt="Receipt" className="w-full h-32 object-cover rounded-lg border" />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(null); setReceiptPath(null); }}
                >
                  <X className="h-3 w-3" />
                </Button>
                {ocrData?.confidence && (
                  <Badge
                    variant={ocrData.confidence >= 80 ? 'default' : 'secondary'}
                    className="absolute bottom-1 left-1"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    OCR {ocrData.confidence}%
                  </Badge>
                )}
              </div>
            )}

            {ocrData?.suggested_category && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                <Sparkles className="h-3 w-3" />
                Saran kategori: <Badge variant="outline">{CATEGORY_LABELS[ocrData.suggested_category] || ocrData.suggested_category}</Badge>
              </div>
            )}

            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                      {ocrData?.suggested_category === c && ' ✨'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              {Number(form.amount) >= APPROVAL_THRESHOLD && (
                <p className="text-xs text-warning mt-1">⚠ Jumlah ≥ Rp 500.000 memerlukan approval</p>
              )}
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input placeholder="Listrik bulan Februari..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Catatan</Label>
              <Input placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button onClick={handleSubmit} disabled={createExpense.isPending} className="w-full">
              {createExpense.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
