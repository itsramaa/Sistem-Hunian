import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { WIDGET_REGISTRY, DEFAULT_WIDGET_ORDER } from '../constants/widgetRegistry';
import { ArrowUp, ArrowDown, RotateCcw, Settings2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetOrder: string[];
  hiddenWidgets: string[];
  onSave: (widgetOrder: string[], hiddenWidgets: string[]) => void;
  isSaving: boolean;
}

export function DashboardCustomizeDialog({ open, onOpenChange, widgetOrder, hiddenWidgets, onSave, isSaving }: Props) {
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setOrder([...widgetOrder]);
      setHidden(new Set(hiddenWidgets));
    }
  }, [open, widgetOrder, hiddenWidgets]);

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index >= order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrder(newOrder);
  };

  const toggleWidget = (id: string) => {
    const newHidden = new Set(hidden);
    if (newHidden.has(id)) {
      newHidden.delete(id);
    } else {
      newHidden.add(id);
    }
    setHidden(newHidden);
  };

  const resetToDefault = () => {
    setOrder([...DEFAULT_WIDGET_ORDER]);
    setHidden(new Set());
  };

  const handleSave = () => {
    onSave(order, Array.from(hidden));
  };

  const widgetMap = Object.fromEntries(WIDGET_REGISTRY.map(w => [w.id, w]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Kustomisasi Dashboard
          </DialogTitle>
          <DialogDescription>
            Atur urutan dan visibilitas widget dashboard Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {order.map((id, index) => {
            const widget = widgetMap[id];
            if (!widget) return null;
            const isHidden = hidden.has(id);

            return (
              <div
                key={id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isHidden ? 'bg-muted/50 border-border/30 opacity-60' : 'bg-card border-border/60'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(index)} disabled={index === 0}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(index)} disabled={index === order.length - 1}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{widget.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{widget.description}</div>
                </div>
                <Switch checked={!isHidden} onCheckedChange={() => toggleWidget(id)} />
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefault} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
