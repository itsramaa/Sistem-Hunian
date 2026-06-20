import { useState, useCallback, useRef, useEffect } from 'react';
import { Undo2, X, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/utils';

interface DeletedItem {
  id: string;
  type: string;
  name: string;
  data: any;
  deletedAt: number;
  timeoutId: NodeJS.Timeout;
}

interface SoftDeleteManagerProps {
  onPermanentDelete: (id: string, type: string) => Promise<void>;
  onRestore: (data: any, type: string) => Promise<void>;
  undoDuration?: number;
}

export function useSoftDelete({
  onPermanentDelete,
  onRestore,
  undoDuration = 10,
}: SoftDeleteManagerProps) {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleSoftDelete = useCallback((id: string, type: string, name: string, data: any) => {
    const timeoutId = setTimeout(async () => {
      try {
        await onPermanentDelete(id, type);
        setDeletedItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Permanent delete failed:', error);
      }
    }, undoDuration * 1000);

    const deletedItem: DeletedItem = {
      id, type, name, data, deletedAt: Date.now(), timeoutId,
    };
    setDeletedItems(prev => [...prev, deletedItem]);
    return true;
  }, [onPermanentDelete, undoDuration]);

  const handleUndo = useCallback(async (id: string) => {
    const item = deletedItems.find(i => i.id === id);
    if (!item) return;
    setRestoringId(id);
    try {
      clearTimeout(item.timeoutId);
      await onRestore(item.data, item.type);
      setDeletedItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setRestoringId(null);
    }
  }, [deletedItems, onRestore]);

  const dismissItem = useCallback((id: string) => {
    const item = deletedItems.find(i => i.id === id);
    if (item) {
      setDeletedItems(prev => prev.filter(i => i.id !== id));
    }
  }, [deletedItems]);

  useEffect(() => {
    return () => {
      deletedItems.forEach(item => clearTimeout(item.timeoutId));
    };
  }, []);

  return {
    deletedItems,
    handleSoftDelete,
    handleUndo,
    dismissItem,
    restoringId,
  };
}

interface UndoToastProps {
  items: DeletedItem[];
  onUndo: (id: string) => void;
  onDismiss: (id: string) => void;
  restoringId: string | null;
  undoDuration: number;
}

export function UndoToastContainer({ items, onUndo, onDismiss, restoringId, undoDuration }: UndoToastProps) {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {items.map(item => (
        <UndoToast
          key={item.id}
          item={item}
          onUndo={onUndo}
          onDismiss={onDismiss}
          isRestoring={restoringId === item.id}
          duration={undoDuration}
        />
      ))}
    </div>
  );
}

function UndoToast({
  item,
  onUndo,
  onDismiss,
  isRestoring,
  duration,
}: {
  item: DeletedItem;
  onUndo: (id: string) => void;
  onDismiss: (id: string) => void;
  isRestoring: boolean;
  duration: number;
}) {
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(item.deletedAt);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / (duration * 1000)) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      className={cn(
        "bg-card/95 backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-2xl p-4 min-w-[300px] max-w-[400px]",
        "animate-in slide-in-from-right-5 duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isRestoring ? (
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-success animate-pulse" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {isRestoring ? 'Restoring...' : `${item.type} deleted`}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {item.name}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUndo(item.id)}
            disabled={isRestoring}
            className="gap-1 rounded-full"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDismiss(item.id)}
            disabled={isRestoring}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
