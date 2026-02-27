import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Copy, FileText } from 'lucide-react';
import { COLLECTIONS_TEMPLATES, fillTemplate } from '../../constants/messageTemplates';
import { toast } from 'sonner';
import type { CollectionsCase } from '../../services/collectionsCaseService';

interface Props {
  caseData: CollectionsCase;
  merchantName?: string;
}

export function CollectionsTemplateSelector({ caseData, merchantName = 'Pengelola' }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(COLLECTIONS_TEMPLATES[0].id);

  const selected = COLLECTIONS_TEMPLATES.find(t => t.id === selectedId) || COLLECTIONS_TEMPLATES[0];

  const filled = fillTemplate(selected, {
    tenantName: caseData.tenantName || '-',
    amount: caseData.totalDue.toLocaleString('id-ID'),
    invoiceNumber: caseData.invoiceNumber || '-',
    dueDate: '-',
    daysOverdue: String(caseData.daysOverdue),
    unitNumber: caseData.unitNumber || '-',
    merchantName,
  });

  const handleCopy = () => {
    const text = filled.subject ? `${filled.subject}\n\n${filled.body}` : filled.body;
    navigator.clipboard.writeText(text);
    toast.success('Template disalin ke clipboard');
  };

  const typeColor: Record<string, string> = { sms: 'bg-blue-100 text-blue-800', whatsapp: 'bg-green-100 text-green-800', letter: 'bg-amber-100 text-amber-800', legal: 'bg-red-100 text-red-800' };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><FileText className="h-3.5 w-3.5 mr-1" />Template</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Template Pesan Penagihan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Pilih Template</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLLECTIONS_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">{t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={typeColor[filled.type] || ''}>{filled.type.toUpperCase()}</Badge>
            {filled.subject && <span className="text-sm font-medium">{filled.subject}</span>}
          </div>
          <Textarea value={filled.body} readOnly rows={12} className="font-mono text-xs" />
          <Button onClick={handleCopy} className="w-full">
            <Copy className="h-4 w-4 mr-2" />Salin ke Clipboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
