import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/components/ui/alert-dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, Plus, Trash2, Hammer } from 'lucide-react';
import { useRenovations, useCreateRenovation, useDeleteRenovation } from '../hooks/useRenovations';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'general', label: 'Umum' },
  { value: 'structural', label: 'Struktur' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Eksterior' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Kelistrikan' },
];

interface RenovationHistoryCardProps {
  propertyId: string;
  merchantId: string;
}

export function RenovationHistoryCard({ propertyId, merchantId }: RenovationHistoryCardProps) {
  const { data: renovations = [], isLoading } = useRenovations(propertyId);
  const createMutation = useCreateRenovation();
  const deleteMutation = useDeleteRenovation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ renovation_date: new Date().toISOString().split('T')[0], cost: 0, description: '', category: 'general' });

  const totalCost = renovations.reduce((sum, r) => sum + Number(r.cost), 0);

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ ...form, property_id: propertyId, merchant_id: merchantId });
      setOpen(false);
      setForm({ renovation_date: new Date().toISOString().split('T')[0], cost: 0, description: '', category: 'general' });
      toast.success('Renovasi ditambahkan');
    } catch { toast.error('Gagal menambahkan'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, propertyId });
      toast.success('Renovasi dihapus');
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2"><Hammer className="h-5 w-5 text-primary" />Riwayat Renovasi</CardTitle>
          <CardDescription>Total: {formatCurrency(totalCost)} • {renovations.length} entri</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader><DialogTitle>Tambah Renovasi</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Tanggal</Label><Input type="date" className="rounded-xl" value={form.renovation_date} onChange={e => setForm(f => ({ ...f, renovation_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-xs">Biaya (Rp)</Label><Input type="number" min={0} className="rounded-xl" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Kategori</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Deskripsi</Label><Textarea className="rounded-xl" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full rounded-xl gradient-cta">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
        ) : renovations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada data renovasi.</p>
        ) : (
          <div className="space-y-2">
            {renovations.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{formatCurrency(Number(r.cost))}</span>
                    <Badge variant="outline" className="text-xs rounded-full capitalize">{r.category}</Badge>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                  <p className="text-xs text-muted-foreground">{format(new Date(r.renovation_date), 'dd MMM yyyy')}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Renovasi?</AlertDialogTitle>
                      <AlertDialogDescription>Data renovasi ini akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(r.id)} className="rounded-xl bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
