import { useState, useRef } from 'react';
import { Save, Eye, Code, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { TEMPLATE_CATEGORIES, getAvailableVariables, fillTemplate, type DocumentTemplate, type TemplateVariable } from '../services/documentTemplateService';

interface Props {
  template?: DocumentTemplate | null;
  onSave: (data: { name: string; description: string; category: string; content: string; variables: TemplateVariable[] }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function DocumentTemplateEditor({ template, onSave, onCancel, saving }: Props) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'lease_contract');
  const [content, setContent] = useState(template?.content || '');
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableVars = getAvailableVariables(category);

  const insertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + `{{${varName}}}` + content.substring(end);
    setContent(newContent);
    // Set cursor after inserted variable
    setTimeout(() => {
      textarea.focus();
      const newPos = start + varName.length + 4;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const sampleData: Record<string, string> = {
    owner_name: 'Budi Santoso',
    tenant_name: 'Andi Wijaya',
    tenant_id_number: '3201234567890001',
    tenant_phone: '081234567890',
    property_name: 'Kost Harmoni',
    property_address: 'Jl. Merdeka No. 10, Jakarta',
    unit_number: 'A-101',
    start_date: '1 Maret 2026',
    end_date: '1 Maret 2027',
    rent_amount: 'Rp 2.500.000',
    deposit_amount: 'Rp 2.500.000',
    billing_day: '1',
    house_rules: 'Sesuai peraturan yang berlaku',
    city: 'Jakarta',
    current_date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    curfew_time: '23:00',
    max_guest_nights: '3',
    late_fee: 'Rp 50.000/hari',
    guardian_name: 'Pak Joko',
    guardian_phone: '081987654321',
    billing_period: 'Maret 2026',
    amount_due: 'Rp 2.500.000',
    due_date: '1 Maret 2026',
    deadline_date: '5 Maret 2026',
    termination_reason: 'Berakhirnya masa kontrak',
    move_out_date: '31 Maret 2026',
    inspection_date: '1 Maret 2026',
    electricity_meter: '12345',
    water_meter: '6789',
  };

  const previewContent = fillTemplate(content, sampleData);

  const handleSave = () => {
    // Extract variables actually used in content
    const usedVars = availableVars.filter(v => content.includes(`{{${v.name}}}`));
    onSave({ name, description, category, content, variables: usedVars });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nama Template *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama template" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEMPLATE_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat" className="rounded-xl" />
      </div>

      {/* Variable picker */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Variabel tersedia (klik untuk menyisipkan)</Label>
        <div className="flex flex-wrap gap-1.5">
          {availableVars.map(v => (
            <Badge
              key={v.name}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
              onClick={() => insertVariable(v.name)}
            >
              <Plus className="h-3 w-3 mr-0.5" />{v.label}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(v) => setPreviewMode(v === 'preview')}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="edit" className="rounded-lg gap-1">
            <Code className="h-4 w-4" />Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-lg gap-1">
            <Eye className="h-4 w-4" />Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Isi template dokumen..."
            rows={20}
            className="font-mono text-sm rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-1">{content.length} karakter</p>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{previewContent}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="rounded-xl">Batal</Button>
        <Button onClick={handleSave} disabled={!name.trim() || !content.trim() || saving} className="rounded-xl">
          <Save className="h-4 w-4 mr-1" />{saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </div>
  );
}
