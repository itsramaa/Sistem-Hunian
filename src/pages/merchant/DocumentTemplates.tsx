import { useState } from 'react';
import { FileStack, Plus, Edit, Trash2, Copy, FileText, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { DocumentTemplateEditor } from '@/features/documents/components/DocumentTemplateEditor';
import { DocumentFillDialog } from '@/features/documents/components/DocumentFillDialog';
import { useDocumentTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useDuplicateTemplate } from '@/features/documents/hooks/useDocumentTemplates';
import { TEMPLATE_CATEGORIES, type DocumentTemplate } from '@/features/documents/services/documentTemplateService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { format } from 'date-fns';

const CATEGORY_ICONS: Record<string, string> = {
  lease_contract: '📄',
  house_rules: '📋',
  move_in_checklist: '✅',
  inspection_report: '🔍',
  eviction_notice: '⚠️',
  payment_reminder: '💰',
  other: '📝',
};

export default function DocumentTemplatesPage() {
  const { merchant } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [fillTemplate, setFillTemplate] = useState<DocumentTemplate | null>(null);

  const { data: templates, isLoading } = useDocumentTemplates(merchant?.id, categoryFilter === 'all' ? undefined : categoryFilter);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();
  const duplicateTemplateMutation = useDuplicateTemplate();

  const handleCreate = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleSave = (data: { name: string; description: string; category: string; content: string; variables: any[] }) => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, data }, { onSuccess: () => setEditorOpen(false) });
    } else {
      createTemplate.mutate({ ...data, merchant_id: merchant!.id }, { onSuccess: () => setEditorOpen(false) });
    }
  };

  // Group by category
  const grouped = (templates || []).reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  return (
    <MerchantLayout
      title="Template Dokumen"
      description="Kelola template kontrak, surat, dan dokumen operasional"
      actions={
        <Button onClick={handleCreate} className="rounded-xl">
          <Plus className="h-4 w-4 mr-1" />Buat Template
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {TEMPLATE_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat template...</div>
        ) : !templates || templates.length === 0 ? (
          <Card className="rounded-2xl border-border/40">
            <CardContent className="py-12 text-center">
              <FileStack className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Belum ada template</p>
              <Button onClick={handleCreate} variant="outline" className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" />Buat Template Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([category, items]) => {
            const catInfo = TEMPLATE_CATEGORIES.find(c => c.value === category);
            return (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                  <span>{CATEGORY_ICONS[category] || '📝'}</span>
                  {catInfo?.label || category}
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(template => (
                    <Card key={template.id} className="rounded-xl border-border/40 hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-sm truncate">{template.name}</p>
                              {template.is_system && <Badge variant="secondary" className="text-[10px] shrink-0">Standar</Badge>}
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{template.description}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              v{template.version} • {format(new Date(template.updated_at), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setFillTemplate(template)}>
                                <Eye className="h-4 w-4 mr-2" />Gunakan / Isi
                              </DropdownMenuItem>
                              {template.is_system ? (
                                <DropdownMenuItem onClick={() => duplicateTemplateMutation.mutate({ id: template.id, merchantId: merchant!.id })}>
                                  <Copy className="h-4 w-4 mr-2" />Duplikasi
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => handleEdit(template)}>
                                    <Edit className="h-4 w-4 mr-2" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteTemplateMutation.mutate(template.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Buat Template Baru'}</DialogTitle>
          </DialogHeader>
          <DocumentTemplateEditor
            template={editingTemplate}
            onSave={handleSave}
            onCancel={() => setEditorOpen(false)}
            saving={createTemplate.isPending || updateTemplate.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Fill Dialog */}
      {fillTemplate && (
        <DocumentFillDialog
          template={fillTemplate}
          open={!!fillTemplate}
          onOpenChange={(open) => { if (!open) setFillTemplate(null); }}
        />
      )}
    </MerchantLayout>
  );
}
