import { Check, X, Receipt, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useExpenses } from '../hooks/useExpenses';
import { useState } from 'react';
import { ReceiptViewer } from './ReceiptViewer';
import type { Expense } from '../services/expenseService';

const CATEGORY_LABELS: Record<string, string> = {
  utilities: 'Utilitas', maintenance: 'Pemeliharaan', insurance: 'Asuransi',
  tax: 'Pajak', marketing: 'Pemasaran', admin: 'Administrasi',
  payroll: 'Gaji', other: 'Lainnya',
};

export function ExpenseApprovalList() {
  const { pendingApprovals, approveExpense, rejectExpense } = useExpenses();
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);

  const pending = pendingApprovals.data || [];

  if (pending.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Tidak ada pengeluaran yang menunggu approval</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {pending.map(expense => {
          const ocrConfidence = (expense as any).ocrData?.confidence;
          return (
            <Card key={expense.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        Rp {expense.amount.toLocaleString('id-ID')}
                      </span>
                      <Badge variant="outline">{CATEGORY_LABELS[expense.category] || expense.category}</Badge>
                      {ocrConfidence && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          OCR {ocrConfidence}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {expense.description || '-'} • {new Date(expense.expenseDate).toLocaleDateString('id-ID')}
                    </p>
                    {expense.notes && (
                      <p className="text-xs text-muted-foreground">{expense.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {expense.receiptUrl && (
                      <Button size="sm" variant="ghost" onClick={() => setViewingReceipt(expense)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => approveExpense.mutate(expense.id)}
                      disabled={approveExpense.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectExpense.mutate(expense.id)}
                      disabled={rejectExpense.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Tolak
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {viewingReceipt && (
        <ReceiptViewer
          expense={viewingReceipt}
          open={!!viewingReceipt}
          onOpenChange={() => setViewingReceipt(null)}
        />
      )}
    </>
  );
}
