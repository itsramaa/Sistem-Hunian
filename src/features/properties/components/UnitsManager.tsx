import { useSubscriptionLimits } from '@/features/subscriptions/hooks/useSubscriptionLimits';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Edit, Home, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useUnits } from '../hooks/useUnits';
import { Unit } from '../types';

interface UnitsManagerProps {
  propertyId: string;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitsChanged: () => void;
}

const unitSchema = z.object({
  unit_number: z.string().min(1, 'Unit number is required').max(50),
  unit_type: z.string().min(1, 'Unit type is required'),
  floor: z.coerce.number().optional(),
  size_sqm: z.coerce.number().positive('Size must be positive').optional(),
  rent_amount: z.coerce.number().positive('Rent amount must be positive'),
  deposit_amount: z.coerce.number().min(0).optional(),
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved']),
  description: z.string().max(500).optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

const unitTypes = [
  { value: 'standard', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'studio', label: 'Studio' },
  { value: 'suite', label: 'Suite' },
  { value: 'penthouse', label: 'Penthouse' },
];

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-info/10 text-info border-info/30',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  reserved: 'bg-primary/10 text-primary border-primary/30',
};

export function UnitsManager({ propertyId, propertyName, open, onOpenChange, onUnitsChanged }: UnitsManagerProps) {
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const { toast } = useToast();
  const { data: limits } = useSubscriptionLimits();
  
  const { 
    units, 
    isLoading: loading, 
    createUnit, 
    updateUnit, 
    deleteUnit,
    isCreating,
    isUpdating,
    isDeleting 
  } = useUnits(propertyId);

  const actionLoading = isCreating || isUpdating || isDeleting;

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      unit_number: '',
      unit_type: 'standard',
      floor: undefined,
      size_sqm: undefined,
      rent_amount: 0,
      deposit_amount: undefined,
      status: 'available',
      description: '',
    },
  });

  const handleSubmit = async (data: UnitFormData) => {
    try {
      if (editingUnit) {
        await updateUnit({
          id: editingUnit.id,
          payload: {
            unit_number: data.unit_number,
            unit_type: data.unit_type,
            floor: data.floor || null,
            size_sqm: data.size_sqm || null,
            rent_amount: data.rent_amount,
            deposit_amount: data.deposit_amount || null,
            status: data.status,
            description: data.description || null,
          }
        });
      } else {
        await createUnit({
          property_id: propertyId,
          unit_number: data.unit_number,
          unit_type: data.unit_type,
          floor: data.floor || null,
          size_sqm: data.size_sqm || null,
          rent_amount: data.rent_amount,
          deposit_amount: data.deposit_amount || null,
          status: data.status,
          description: data.description || null,
        });
      }

      setShowUnitDialog(false);
      setEditingUnit(null);
      form.reset();
      onUnitsChanged();
    } catch (error) {
      // Error is already handled in the hook
      console.error('Error submitting unit form:', error);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    form.reset({
      unit_number: unit.unit_number,
      unit_type: unit.unit_type || 'standard',
      floor: unit.floor || undefined,
      size_sqm: unit.size_sqm || undefined,
      rent_amount: unit.rent_amount,
      deposit_amount: unit.deposit_amount || undefined,
      status: unit.status,
      description: unit.description || '',
    });
    setShowUnitDialog(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`Are you sure you want to delete unit "${unit.unit_number}"?`)) return;

    try {
      await deleteUnit(unit.id);
      onUnitsChanged();
    } catch (error) {
      // Error is already handled in the hook
      console.error('Error deleting unit:', error);
    }
  };

  const handleDialogClose = () => {
    setShowUnitDialog(false);
    setEditingUnit(null);
    form.reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Units - {propertyName}
          </DialogTitle>
          <DialogDescription>
            Manage units for this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Subscription Limit Warning */}
          {limits && !limits.canAddUnit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unit Limit Reached</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  You've reached your {limits.tierName} plan limit of {limits.maxUnits} units.
                </span>
                <Button variant="outline" size="sm" asChild className="ml-4">
                  <Link to="/merchant/settings?tab=verification">
                    Upgrade
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {limits && limits.canAddUnit && limits.isNearUnitLimit && (
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Approaching Unit Limit</AlertTitle>
              <AlertDescription className="text-warning/90">
                You're using {limits.currentUnits} of {limits.maxUnits} units on your {limits.tierName} plan.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {units.length} unit{units.length !== 1 ? 's' : ''} total
              {limits && ` (${limits.maxUnits - limits.currentUnits} remaining)`}
            </p>
            <Button 
              onClick={() => {
                if (limits && !limits.canAddUnit) {
                  toast({
                    variant: 'destructive',
                    title: 'Unit limit reached',
                    description: 'Please upgrade your subscription to add more units.',
                  });
                  return;
                }
                setShowUnitDialog(true);
              }} 
              size="sm"
              disabled={limits && !limits.canAddUnit}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : units.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Home className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">No units yet. Add your first unit.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {units.map((unit) => (
                <Card key={unit.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Unit {unit.unit_number}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {unit.unit_type} {unit.floor ? `• Floor ${unit.floor}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[unit.status || 'available']}>
                        {unit.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Rent</p>
                        <p className="font-medium">{formatCurrency(unit.rent_amount)}/mo</p>
                      </div>
                      {unit.size_sqm && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Size</p>
                          <p className="font-medium">{unit.size_sqm} m²</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(unit)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(unit)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Unit Dialog */}
        <Dialog open={showUnitDialog} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
              <DialogDescription>
                {editingUnit ? 'Update unit details' : 'Add a new unit to this property'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit_number">Unit Number</Label>
                  <Input
                    id="unit_number"
                    placeholder="e.g., A101"
                    {...form.register('unit_number')}
                  />
                  {form.formState.errors.unit_number && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.unit_number.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="unit_type">Type</Label>
                  <Select 
                    value={form.watch('unit_type')} 
                    onValueChange={(value) => form.setValue('unit_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    type="number"
                    placeholder="e.g., 1"
                    {...form.register('floor')}
                  />
                </div>
                <div>
                  <Label htmlFor="size_sqm">Size (m²)</Label>
                  <Input
                    id="size_sqm"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 25"
                    {...form.register('size_sqm')}
                  />
                </div>
                <div>
                  <Label htmlFor="rent_amount">Rent (IDR/month)</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    placeholder="e.g., 1500000"
                    {...form.register('rent_amount')}
                  />
                  {form.formState.errors.rent_amount && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.rent_amount.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="deposit_amount">Deposit (IDR)</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    placeholder="e.g., 3000000"
                    {...form.register('deposit_amount')}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={form.watch('status')} 
                    onValueChange={(value) => form.setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Unit description..."
                    {...form.register('description')}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : editingUnit ? 'Update' : 'Add Unit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
