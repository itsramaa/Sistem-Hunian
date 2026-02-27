import { useState, useRef } from 'react';
import { Camera, CreditCard, Zap, Wrench, Receipt, Lightbulb, ShieldCheck, Megaphone, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Drawer } from 'vaul';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import { toast } from 'sonner';

const QUICK_CATEGORIES = [
  { value: 'utilities', label: 'Utilitas', icon: Zap },
  { value: 'maintenance', label: 'Perawatan', icon: Wrench },
  { value: 'admin', label: 'Admin', icon: Receipt },
  { value: 'tax', label: 'Pajak', icon: ShieldCheck },
  { value: 'marketing', label: 'Marketing', icon: Megaphone },
  { value: 'payroll', label: 'Gaji', icon: Users },
  { value: 'insurance', label: 'Asuransi', icon: Lightbulb },
  { value: 'other', label: 'Lainnya', icon: CreditCard },
];

interface QuickExpenseSheetProps {
  trigger?: React.ReactNode;
}

export function QuickExpenseSheet({ trigger }: QuickExpenseSheetProps) {
  const { user } = useAuth();
  const { createExpense } = useExpenses();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('utilities');
  const [uploading, setUploading] = useState(false);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);

  const handleCapture = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user?.id}/expense-receipts/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('verification-documents')
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      setReceiptPath(path);
      toast.success('Foto struk tersimpan');
    } catch {
      toast.error('Gagal upload foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Masukkan jumlah');
      return;
    }
    createExpense.mutate({
      category,
      amount: Number(amount),
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: receiptPath || undefined,
      autoApprove: Number(amount) < 500_000,
    }, {
      onSuccess: () => {
        setOpen(false);
        setAmount('');
        setCategory('utilities');
        setReceiptPath(null);
      },
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        {trigger || <Button size="sm"><CreditCard className="h-4 w-4 mr-1" /> Log Pengeluaran</Button>}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mt-3" />
          <div className="p-4 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
            <Drawer.Title className="text-lg font-semibold">Log Pengeluaran Cepat</Drawer.Title>

            {/* Camera */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-5 w-5 mr-2" />
                {receiptPath ? '✓ Foto Tersimpan' : 'Foto Struk'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleCapture(file);
                }}
              />
            </div>

            {/* Amount */}
            <div>
              <Input
                type="number"
                placeholder="Jumlah (Rp)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-2xl font-bold h-14 text-center"
                inputMode="numeric"
              />
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <cat.icon className="h-5 w-5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubmit}
              disabled={createExpense.isPending || !amount}
            >
              {createExpense.isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
