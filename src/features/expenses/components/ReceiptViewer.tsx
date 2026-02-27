import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import type { Expense } from '../services/expenseService';

interface ReceiptViewerProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptViewer({ expense, open, onOpenChange }: ReceiptViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const ocrData = (expense as any).ocrData as Record<string, unknown> | null;

  useEffect(() => {
    if (expense.receiptUrl && open) {
      const { data } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(expense.receiptUrl);
      // For private buckets, use createSignedUrl instead
      supabase.storage
        .from('verification-documents')
        .createSignedUrl(expense.receiptUrl, 300)
        .then(({ data: signed }) => {
          if (signed?.signedUrl) setImageUrl(signed.signedUrl);
        });
    }
  }, [expense.receiptUrl, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bukti Pengeluaran</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Receipt Image */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Gambar Struk</h4>
            {imageUrl ? (
              <img src={imageUrl} alt="Receipt" className="w-full rounded-lg border object-contain max-h-96" />
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                Memuat gambar...
              </div>
            )}
          </div>

          {/* OCR Data */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Data Ekstraksi OCR
            </h4>
            {ocrData ? (
              <div className="space-y-2 text-sm">
                {ocrData.confidence && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge variant={(ocrData.confidence as number) >= 80 ? 'default' : 'secondary'}>
                      {ocrData.confidence as number}%
                    </Badge>
                  </div>
                )}
                {ocrData.vendor_name && (
                  <div><span className="text-muted-foreground">Vendor:</span> {ocrData.vendor_name as string}</div>
                )}
                {ocrData.receipt_date && (
                  <div><span className="text-muted-foreground">Tanggal:</span> {ocrData.receipt_date as string}</div>
                )}
                {ocrData.total_amount && (
                  <div><span className="text-muted-foreground">Total:</span> Rp {(ocrData.total_amount as number).toLocaleString('id-ID')}</div>
                )}
                {ocrData.payment_method && (
                  <div><span className="text-muted-foreground">Metode:</span> {ocrData.payment_method as string}</div>
                )}
                {ocrData.suggested_category && (
                  <div><span className="text-muted-foreground">Kategori:</span> <Badge variant="outline">{ocrData.suggested_category as string}</Badge></div>
                )}
                {Array.isArray(ocrData.line_items) && ocrData.line_items.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Item:</span>
                    {(ocrData.line_items as any[]).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs bg-muted/50 rounded px-2 py-1">
                        <span>{item.description}</span>
                        <span>Rp {item.total?.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada data OCR tersedia</p>
            )}

            {/* Manual expense data */}
            <div className="border-t pt-3 mt-3 space-y-1 text-sm">
              <h4 className="font-medium">Data Tersimpan</h4>
              <div><span className="text-muted-foreground">Jumlah:</span> Rp {expense.amount.toLocaleString('id-ID')}</div>
              <div><span className="text-muted-foreground">Kategori:</span> {expense.category}</div>
              <div><span className="text-muted-foreground">Tanggal:</span> {new Date(expense.expenseDate).toLocaleDateString('id-ID')}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge>{expense.approvalStatus}</Badge></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
