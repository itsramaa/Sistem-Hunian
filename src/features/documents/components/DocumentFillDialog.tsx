import { useState, useMemo } from 'react';
import { FileDown, Copy, Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { fillTemplate, type DocumentTemplate } from '../services/documentTemplateService';

interface Props {
  template: DocumentTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoFillData?: Record<string, string>;
}

export function DocumentFillDialog({ template, open, onOpenChange, autoFillData }: Props) {
  const { toast } = useToast();
  const variables = template.variables || [];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of variables) {
      initial[v.name] = autoFillData?.[v.name] || '';
    }
    return initial;
  });

  const filledContent = useMemo(() => fillTemplate(template.content, values), [template.content, values]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(filledContent);
    toast({ title: 'Dokumen disalin ke clipboard' });
  };

  const handleDownloadText = () => {
    const blob = new Blob([filledContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle>Isi Template: {template.name}</DialogTitle>
          <DialogDescription>Isi variabel di bawah ini untuk menghasilkan dokumen</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="fill" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="rounded-xl">
            <TabsTrigger value="fill" className="rounded-lg">Isi Data</TabsTrigger>
            <TabsTrigger value="preview" className="rounded-lg gap-1">
              <Eye className="h-4 w-4" />Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fill" className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              {variables.map(v => (
                <div key={v.name} className="space-y-1">
                  <Label className="text-xs">{v.label}</Label>
                  <Input
                    value={values[v.name] || ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                    placeholder={v.label}
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto">
            <Card className="rounded-xl">
              <CardContent className="p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{filledContent}</pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Tutup</Button>
          <Button variant="outline" onClick={handleCopy} className="rounded-xl">
            <Copy className="h-4 w-4 mr-1" />Salin
          </Button>
          <Button onClick={handleDownloadText} className="rounded-xl">
            <FileDown className="h-4 w-4 mr-1" />Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
