import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Edit, Trash2, Copy, Check, MoreHorizontal, Save } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { format } from 'date-fns';

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  terms: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for templates (would be stored in DB in production)
const templateStorage = new Map<string, ContractTemplate[]>();

export function useContractTemplates() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const templatesKey = `templates-${merchant?.id}`;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['contract-templates', merchant?.id],
    queryFn: async () => {
      // Load from localStorage as a simple persistence
      const stored = localStorage.getItem(templatesKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
      }
      return [] as ContractTemplate[];
    },
    enabled: !!merchant?.id,
  });

  const saveTemplate = useMutation({
    mutationFn: async (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const currentTemplates = [...templates];
      
      if (template.id) {
        // Update existing
        const index = currentTemplates.findIndex(t => t.id === template.id);
        if (index >= 0) {
          currentTemplates[index] = {
            ...currentTemplates[index],
            ...template,
            updatedAt: new Date(),
          };
        }
      } else {
        // Create new
        const newTemplate: ContractTemplate = {
          id: `template-${Date.now()}`,
          name: template.name,
          description: template.description,
          terms: template.terms,
          isDefault: template.isDefault || currentTemplates.length === 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // If this is set as default, unset others
        if (newTemplate.isDefault) {
          currentTemplates.forEach(t => t.isDefault = false);
        }
        
        currentTemplates.push(newTemplate);
      }

      localStorage.setItem(templatesKey, JSON.stringify(currentTemplates));
      return currentTemplates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Template saved' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to save template', description: error.message });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const filtered = templates.filter(t => t.id !== templateId);
      localStorage.setItem(templatesKey, JSON.stringify(filtered));
      return filtered;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Template deleted' });
    },
  });

  const setDefaultTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const updated = templates.map(t => ({
        ...t,
        isDefault: t.id === templateId,
        updatedAt: t.id === templateId ? new Date() : t.updatedAt,
      }));
      localStorage.setItem(templatesKey, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Default template updated' });
    },
  });

  return {
    templates,
    isLoading,
    saveTemplate,
    deleteTemplate,
    setDefaultTemplate,
    getDefaultTemplate: () => templates.find(t => t.isDefault),
  };
}

interface ContractTemplateManagerProps {
  onSelectTemplate?: (terms: string) => void;
  className?: string;
}

export function ContractTemplateManager({ onSelectTemplate, className }: ContractTemplateManagerProps) {
  const { templates, isLoading, saveTemplate, deleteTemplate, setDefaultTemplate } = useContractTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    terms: '',
    isDefault: false,
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', description: '', terms: '', isDefault: false });
    setDialogOpen(true);
  };

  const handleOpenEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      terms: template.terms,
      isDefault: template.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    saveTemplate.mutate({
      id: editingTemplate?.id,
      ...formData,
    }, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleUseTemplate = (template: ContractTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template.terms);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Templates
              </CardTitle>
              <CardDescription>Save and reuse contract terms</CardDescription>
            </div>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No templates yet</p>
              <Button onClick={handleOpenCreate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create your first template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{template.name}</p>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{template.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {format(template.updatedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {onSelectTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(template)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {!template.isDefault && (
                          <DropdownMenuItem onClick={() => setDefaultTemplate.mutate(template.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => deleteTemplate.mutate(template.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'New Contract Template'}
            </DialogTitle>
            <DialogDescription>
              Save frequently used contract terms for quick reuse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard 1-Year Lease"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Contract Terms *</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Enter the full contract terms and conditions..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.terms.length} / 10,000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || !formData.terms.trim() || saveTemplate.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveTemplate.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quick save button for contracts page
interface SaveAsTemplateButtonProps {
  terms: string;
  onSaved?: () => void;
}

export function SaveAsTemplateButton({ terms, onSaved }: SaveAsTemplateButtonProps) {
  const { saveTemplate } = useContractTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    saveTemplate.mutate({
      name,
      description,
      terms,
      isDefault: false,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setName('');
        setDescription('');
        onSaved?.();
      },
    });
  };

  if (!terms.trim()) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-1"
      >
        <Save className="h-4 w-4" />
        Save as Template
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>Save these terms for reuse in future contracts</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Kost Agreement"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Description</Label>
              <Input
                id="template-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || saveTemplate.isPending}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
