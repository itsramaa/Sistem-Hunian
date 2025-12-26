import { useState, useCallback, useRef, useEffect } from 'react';
import { Undo2, X, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  undoDuration?: number; // in seconds
}

export function useSoftDelete({
  onPermanentDelete,
  onRestore,
  undoDuration = 10,
}: SoftDeleteManagerProps) {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleSoftDelete = useCallback((id: string, type: string, name: string, data: any) => {
    // Set timeout for permanent deletion
    const timeoutId = setTimeout(async () => {
      try {
        await onPermanentDelete(id, type);
        setDeletedItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Permanent delete failed:', error);
      }
    }, undoDuration * 1000);

    const deletedItem: DeletedItem = {
      id,
      type,
      name,
      data,
      deletedAt: Date.now(),
      timeoutId,
    };

    setDeletedItems(prev => [...prev, deletedItem]);

    return true;
  }, [onPermanentDelete, undoDuration]);

  const handleUndo = useCallback(async (id: string) => {
    const item = deletedItems.find(i => i.id === id);
    if (!item) return;

    setRestoringId(id);
    
    try {
      // Clear the permanent delete timeout
      clearTimeout(item.timeoutId);
      
      // Restore the item
      await onRestore(item.data, item.type);
      
      // Remove from deleted items
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
      // Don't clear timeout - let it complete
      setDeletedItems(prev => prev.filter(i => i.id !== id));
    }
  }, [deletedItems]);

  // Cleanup timeouts on unmount
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
        "bg-card border shadow-lg rounded-lg p-4 min-w-[300px] max-w-[400px]",
        "animate-in slide-in-from-right-5 duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isRestoring ? (
            <CheckCircle className="h-5 w-5 text-success animate-pulse" />
          ) : (
            <Trash2 className="h-5 w-5 text-destructive" />
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
            className="gap-1"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDismiss(item.id)}
            disabled={isRestoring}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
