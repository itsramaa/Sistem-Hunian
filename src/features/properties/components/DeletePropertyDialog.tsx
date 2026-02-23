import { Property } from '@/features/properties/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { AlertTriangle, Building2, RefreshCw } from 'lucide-react';

interface DeletePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeletePropertyDialog({ open, onOpenChange, property, onConfirm, isLoading }: DeletePropertyDialogProps) {
  if (!property) return null;
  const hasOccupiedUnits = property.occupied_units > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-destructive/10 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            Delete Property
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Are you sure you want to delete this property? This action cannot be undone.</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/40">
                <div className="gradient-icon-box w-10 h-10 shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{property.name}</p>
                  <p className="text-xs capitalize">{property.property_type} • {property.total_units} units</p>
                </div>
              </div>
              {hasOccupiedUnits && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warning">Warning: Occupied Units</p>
                    <p className="text-xs text-muted-foreground">This property has {property.occupied_units} occupied unit(s).</p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className="rounded-xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground hover:opacity-90">
            {isLoading ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Deleting...</>) : 'Delete Property'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
