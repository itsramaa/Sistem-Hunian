import { useSubscriptionLimits } from '@/features/subscriptions/hooks/useSubscriptionLimits';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { AlertTriangle, Edit, Home, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { Unit, Property } from '../types';
import { UnitFormDialog } from './UnitFormDialog';
import { UnitFormData } from '../types/schema';

interface UnitsManagerProps {
  propertyId: string;
  propertyName: string;
  propertyType?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnitsChanged: () => void;
}

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-info/10 text-info border-info/30',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  reserved: 'bg-primary/10 text-primary border-primary/30',
};

export function UnitsManager({ propertyId, propertyName, propertyType, open, onOpenChange, onUnitsChanged }: UnitsManagerProps) {
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
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

  // Create a minimal property object for the wizard
  const currentProperty: Property[] = [{
    id: propertyId,
    name: propertyName,
    property_type: (propertyType || 'kost') as any,
  } as Property];

  const handleUnitSubmit = async (data: UnitFormData) => {
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
            photos: data.photos || [],
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
          photos: data.photos || [],
        });
      }

      setShowUnitDialog(false);
      setEditingUnit(null);
      onUnitsChanged();
    } catch (error) {
      console.error('Error submitting unit form:', error);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setShowUnitDialog(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus unit "${unit.unit_number}"?`)) return;

    try {
      await deleteUnit(unit.id);
      onUnitsChanged();
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const handleDialogClose = () => {
    setShowUnitDialog(false);
    setEditingUnit(null);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Units - {propertyName}
          </DialogTitle>
          <DialogDescription>
            Kelola unit untuk properti ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Subscription Limit Warning */}
          {limits && !limits.canAddUnit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Batas Unit Tercapai</AlertTitle>
              <AlertDescription>
                Anda telah mencapai batas {limits.maxUnits} unit pada paket {limits.tierName}.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {units.length} unit total
              {limits && ` (${limits.maxUnits - limits.currentUnits} tersisa)`}
            </p>
            <Button 
              onClick={() => {
                if (limits && !limits.canAddUnit) {
                  toast({
                    variant: 'destructive',
                    title: 'Batas unit tercapai',
                    description: 'Silakan upgrade langganan untuk menambah unit.',
                  });
                  return;
                }
                setShowUnitDialog(true);
              }} 
              size="sm"
              disabled={limits && !limits.canAddUnit}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Unit
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
                <p className="text-muted-foreground text-center">Belum ada unit. Tambahkan unit pertama Anda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {units.map((unit) => (
                <Card 
                  key={unit.id} 
                  className="hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/merchant/units`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Unit {unit.unit_number}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {unit.unit_type} {unit.floor ? `• Lantai ${unit.floor}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[unit.status || 'available']}>
                        {unit.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Sewa</p>
                        <p className="font-medium">{formatCurrency(unit.rent_amount)}/bln</p>
                      </div>
                      {unit.size_sqm && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Ukuran</p>
                          <p className="font-medium">{unit.size_sqm} m²</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Use the same UnitFormDialog wizard */}
        <UnitFormDialog
          open={showUnitDialog}
          onOpenChange={handleDialogClose}
          unit={editingUnit}
          properties={currentProperty}
          onSubmit={handleUnitSubmit}
          isLoading={actionLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
