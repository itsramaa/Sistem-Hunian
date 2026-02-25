import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Plus, Edit, Trash2, Shield, ChevronDown, ChevronUp, Loader2, Building2 } from 'lucide-react';
import { useRules, Rule } from '@/features/rules/hooks/useRules';

interface RulesSectionProps {
  propertyId: string;
  unitId?: string;
  merchantId: string;
}

export function RulesSection({ propertyId, unitId, merchantId }: RulesSectionProps) {
  const { rules, isLoading, createRule, updateRule, deleteRule } = useRules(propertyId, unitId);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOverridable, setIsOverridable] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setIsOverridable(false);
    setEffectiveFrom(new Date().toISOString().split('T')[0]);
    setEditingRule(null); setShowForm(false);
  };

  const handleEdit = (rule: Rule) => {
    setTitle(rule.title);
    setDescription(rule.description || '');
    setIsOverridable(rule.is_overridable);
    setEffectiveFrom(rule.effective_from);
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, title, description, is_overridable: isOverridable, effective_from: effectiveFrom }, { onSuccess: resetForm });
    } else {
      createRule.mutate({
        merchant_id: merchantId,
        property_id: propertyId,
        unit_id: unitId || null,
        title,
        description: description || null,
        is_overridable: isOverridable,
        effective_from: effectiveFrom,
      }, { onSuccess: resetForm });
    }
  };

  const isInherited = (rule: Rule) => unitId && !rule.unit_id;
  const inputCls = "rounded-xl bg-background/60 border-border/50";

  return (
    <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" /> Peraturan
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1 text-xs h-7"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
        >
          {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Tutup' : 'Tambah'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Inline form */}
        {showForm && (
          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-3">
            <div>
              <Label className="text-xs">Judul <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Jam Malam 22.00" className={inputCls} />
            </div>
            <div>
              <Label className="text-xs">Deskripsi</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detail peraturan..." className={inputCls} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Berlaku Sejak</Label>
                <Input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} className={inputCls} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={isOverridable} onCheckedChange={setIsOverridable} />
                <Label className="text-xs">Bisa Di-override Unit</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={resetForm}>Batal</Button>
              <Button
                size="sm"
                className="rounded-xl gradient-cta text-primary-foreground flex-1"
                onClick={handleSubmit}
                disabled={!title.trim() || createRule.isPending || updateRule.isPending}
              >
                {(createRule.isPending || updateRule.isPending) && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                {editingRule ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </div>
        )}

        {/* Rules list */}
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada peraturan.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-border/40 bg-card/60 p-3 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{rule.title}</span>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'} className="rounded-full text-[10px]">
                        {rule.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      {rule.is_overridable && (
                        <Badge variant="outline" className="rounded-full text-[10px]">Override</Badge>
                      )}
                      {isInherited(rule) && (
                        <Badge variant="secondary" className="rounded-full text-[10px] gap-1">
                          <Building2 className="h-2.5 w-2.5" /> Dari Properti
                        </Badge>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Berlaku: {rule.effective_from}{rule.effective_until ? ` — ${rule.effective_until}` : ''}
                    </p>
                  </div>
                  {!isInherited(rule) && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(rule)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteRule.mutate(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
