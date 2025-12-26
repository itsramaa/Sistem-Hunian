import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronDown, Trash2, Eye, EyeOff, Tag, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  is_available: boolean;
  category: string;
}

interface BulkProductManagerProps {
  products: Product[];
  vendorId: string;
}

type BulkAction = 'enable' | 'disable' | 'delete';

export function BulkProductManager({ products, vendorId }: BulkProductManagerProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, is_available }: { ids: string[]; is_available: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_available })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });
      toast.success(
        `${variables.ids.length} products ${variables.is_available ? 'enabled' : 'disabled'}`
      );
      setSelectedIds(new Set());
    },
    onError: (error: Error) => {
      toast.error(`Failed to update products: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });
      toast.success(`${ids.length} products deleted`);
      setSelectedIds(new Set());
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete products: ${error.message}`);
    },
  });

  const handleBulkAction = (action: BulkAction) => {
    if (selectedIds.size === 0) {
      toast.error('No products selected');
      return;
    }
    setConfirmAction(action);
  };

  const executeAction = () => {
    const ids = Array.from(selectedIds);
    
    switch (confirmAction) {
      case 'enable':
        bulkUpdateMutation.mutate({ ids, is_available: true });
        break;
      case 'disable':
        bulkUpdateMutation.mutate({ ids, is_available: false });
        break;
      case 'delete':
        bulkDeleteMutation.mutate(ids);
        break;
    }
    setConfirmAction(null);
  };

  const isProcessing = bulkUpdateMutation.isPending || bulkDeleteMutation.isPending;
  const selectedCount = selectedIds.size;
  const isAllSelected = products.length > 0 && selectedIds.size === products.length;

  const getActionTitle = () => {
    switch (confirmAction) {
      case 'enable': return 'Enable Products';
      case 'disable': return 'Disable Products';
      case 'delete': return 'Delete Products';
      default: return '';
    }
  };

  const getActionDescription = () => {
    const count = selectedIds.size;
    switch (confirmAction) {
      case 'enable': 
        return `Are you sure you want to enable ${count} product(s)? They will be visible to customers.`;
      case 'disable': 
        return `Are you sure you want to disable ${count} product(s)? They will be hidden from customers.`;
      case 'delete': 
        return `Are you sure you want to delete ${count} product(s)? This action cannot be undone.`;
      default: return '';
    }
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all products"
          />
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0 ? (
              <span>
                <span className="font-medium text-foreground">{selectedCount}</span> of {products.length} selected
              </span>
            ) : (
              'Select products for bulk actions'
            )}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={selectedCount === 0 || isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <>
                  Bulk Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkAction('enable')}>
              <Eye className="h-4 w-4 mr-2" />
              Enable Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction('disable')}>
              <EyeOff className="h-4 w-4 mr-2" />
              Disable Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleBulkAction('delete')}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Product List with Checkboxes */}
      <div className="space-y-2 mt-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selectedIds.has(product.id)}
              onCheckedChange={() => toggleSelect(product.id)}
              aria-label={`Select ${product.name}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {product.category}
                </Badge>
              </div>
            </div>
            <Badge variant={product.is_available ? 'default' : 'secondary'}>
              {product.is_available ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getActionTitle()}</AlertDialogTitle>
            <AlertDialogDescription>{getActionDescription()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={confirmAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
