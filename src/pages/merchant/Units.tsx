import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MerchantLayout } from "@/components/layouts/MerchantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Building2, 
  Home,
  Edit,
  Trash2,
  Filter,
  DollarSign,
  Layers,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { UnitPhotoUpload } from "@/components/merchant/UnitPhotoUpload";
import { SubscriptionLimitWarning } from "@/components/merchant/SubscriptionLimitWarning";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  unit_type: string | null;
  floor: number | null;
  size_sqm: number | null;
  rent_amount: number;
  deposit_amount: number | null;
  status: string | null;
  description: string | null;
  amenities: string[] | null;
  photos?: string[];
  property?: {
    name: string;
    address: string;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
}

// Dynamic unit types based on property type
const getUnitTypesForProperty = (propertyType: string | undefined): { value: string; label: string }[] => {
  switch (propertyType) {
    case 'kost':
      return [
        { value: 'kamar_standard', label: 'Kamar Standard' },
        { value: 'kamar_vip', label: 'Kamar VIP' },
        { value: 'kamar_deluxe', label: 'Kamar Deluxe' },
        { value: 'kamar_ac', label: 'Kamar AC' },
        { value: 'kamar_non_ac', label: 'Kamar Non-AC' },
      ];
    case 'apartment':
      return [
        { value: 'studio', label: 'Studio' },
        { value: '1br', label: '1 Bedroom' },
        { value: '2br', label: '2 Bedroom' },
        { value: '3br', label: '3 Bedroom' },
        { value: 'penthouse', label: 'Penthouse' },
      ];
    case 'house':
      return [
        { value: 'full_house', label: 'Full House' },
      ];
    case 'kontrakan':
      return [
        { value: 'petak', label: 'Petak' },
        { value: 'full_bangunan', label: 'Full Bangunan' },
      ];
    case 'ruko':
      return [
        { value: 'lantai_1', label: 'Lantai 1' },
        { value: 'lantai_2', label: 'Lantai 2' },
        { value: 'lantai_3', label: 'Lantai 3' },
        { value: 'full_building', label: 'Full Building' },
      ];
    default:
      return [
        { value: 'studio', label: 'Studio' },
        { value: 'room', label: 'Room' },
        { value: 'apartment', label: 'Apartment' },
        { value: 'house', label: 'House' },
        { value: 'office', label: 'Office' },
        { value: 'retail', label: 'Retail' },
      ];
  }
};

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  occupied: 'bg-primary/10 text-primary border-primary/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  reserved: 'bg-info/10 text-info border-info/20',
};

const MAX_REASONABLE_SIZE = 10000; // 10,000 sqm

export default function MerchantUnits() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const { data: subscriptionLimits } = useSubscriptionLimits();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    property_id: '',
    unit_number: '',
    unit_type: 'apartment',
    floor: '',
    size_sqm: '',
    rent_amount: '',
    deposit_amount: '',
    status: 'available',
    description: '',
    photos: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['merchant-properties', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, property_type')
        .eq('merchant_id', merchant.id)
        .order('name');
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch all units
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['merchant-all-units', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          property:properties(name, address)
        `)
        .in('property_id', properties.map(p => p.id))
        .order('unit_number');
      if (error) throw error;
      return data as Unit[];
    },
    enabled: !!merchant?.id && properties.length > 0,
  });

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.property_id) {
      errors.property_id = 'Please select a property';
    }
    if (!formData.unit_number.trim()) {
      errors.unit_number = 'Unit number is required';
    }
    
    const rentAmount = parseFloat(formData.rent_amount);
    if (!formData.rent_amount || isNaN(rentAmount)) {
      errors.rent_amount = 'Valid rent amount is required';
    } else if (rentAmount < 0) {
      errors.rent_amount = 'Rent amount cannot be negative';
    }

    const floor = formData.floor ? parseInt(formData.floor) : null;
    if (floor !== null && floor < 0) {
      errors.floor = 'Floor cannot be negative';
    }

    const size = formData.size_sqm ? parseFloat(formData.size_sqm) : null;
    if (size !== null && (size < 0 || size > MAX_REASONABLE_SIZE)) {
      errors.size_sqm = `Size must be between 0 and ${MAX_REASONABLE_SIZE} sqm`;
    }

    const deposit = formData.deposit_amount ? parseFloat(formData.deposit_amount) : null;
    if (deposit !== null && deposit < 0) {
      errors.deposit_amount = 'Deposit cannot be negative';
    }

    // Check for duplicate unit number within same property
    const existingUnit = units.find(u => 
      u.property_id === formData.property_id && 
      u.unit_number.toLowerCase() === formData.unit_number.toLowerCase().trim() &&
      u.id !== editingUnit?.id
    );
    if (existingUnit) {
      errors.unit_number = 'A unit with this number already exists in this property';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create/Update unit mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Please fix the form errors');
      }

      // Check subscription limits for new units
      if (!editingUnit && subscriptionLimits && !subscriptionLimits.canAddUnit) {
        throw new Error(`Unit limit reached (${subscriptionLimits.currentUnits}/${subscriptionLimits.maxUnits}). Please upgrade your subscription.`);
      }

      const unitData = {
        property_id: formData.property_id,
        unit_number: formData.unit_number.trim(),
        unit_type: formData.unit_type,
        floor: formData.floor ? parseInt(formData.floor) : null,
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        rent_amount: parseFloat(formData.rent_amount),
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        status: formData.status,
        description: formData.description?.trim() || null,
        photos: formData.photos,
      };

      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(unitData)
          .eq('id', editingUnit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('units')
          .insert(unitData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-all-units'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });
      toast.success(editingUnit ? 'Unit updated successfully' : 'Unit created successfully');
      handleDialogClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save unit');
    },
  });

  // Delete unit mutation
  const deleteMutation = useMutation({
    mutationFn: async (unitId: string) => {
      // Check for active contracts
      const { data: activeContracts, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('unit_id', unitId)
        .in('status', ['active', 'pending']);

      if (contractError) throw contractError;

      if (activeContracts && activeContracts.length > 0) {
        throw new Error('Cannot delete unit with active or pending contracts');
      }

      // Check for pending invitations
      const { data: pendingInvitations, error: inviteError } = await supabase
        .from('tenant_invitations')
        .select('id')
        .eq('unit_id', unitId)
        .eq('status', 'pending');

      if (inviteError) throw inviteError;

      if (pendingInvitations && pendingInvitations.length > 0) {
        throw new Error('Cannot delete unit with pending tenant invitations');
      }

      // Delete the unit
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-all-units'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-limits'] });
      toast.success('Unit deleted successfully');
      setDeleteLoading(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete unit');
      setDeleteLoading(null);
    },
  });

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
    setFormErrors({});
    setFormData({
      property_id: '',
      unit_number: '',
      unit_type: 'apartment',
      floor: '',
      size_sqm: '',
      rent_amount: '',
      deposit_amount: '',
      status: 'available',
      description: '',
      photos: [],
    });
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormErrors({});
    setFormData({
      property_id: unit.property_id,
      unit_number: unit.unit_number,
      unit_type: unit.unit_type || 'apartment',
      floor: unit.floor?.toString() || '',
      size_sqm: unit.size_sqm?.toString() || '',
      rent_amount: unit.rent_amount.toString(),
      deposit_amount: unit.deposit_amount?.toString() || '',
      status: unit.status || 'available',
      description: unit.description || '',
      photos: unit.photos || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (unitId: string) => {
    setDeleteLoading(unitId);
    deleteMutation.mutate(unitId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Memoize filtered units
  const filteredUnits = useMemo(() => units.filter(unit => {
    const matchesSearch = unit.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      unit.property?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || unit.property_id === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  }), [units, search, statusFilter, propertyFilter]);

  // Memoize statistics
  const stats = useMemo(() => ({
    totalUnits: units.length,
    occupiedUnits: units.filter(u => u.status === 'occupied').length,
    availableUnits: units.filter(u => u.status === 'available').length,
    totalMonthlyRent: units.filter(u => u.status === 'occupied').reduce((sum, u) => sum + u.rent_amount, 0),
  }), [units]);

  const canAddUnit = !subscriptionLimits || subscriptionLimits.canAddUnit;

  return (
    <MerchantLayout 
      description="View and manage all your rental units"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={properties.length === 0 || !canAddUnit}>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select 
                  value={formData.property_id} 
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                >
                  <SelectTrigger className={formErrors.property_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.property_id && (
                  <p className="text-sm text-destructive">{formErrors.property_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Number *</Label>
                  <Input
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    placeholder="e.g., A101"
                    className={formErrors.unit_number ? 'border-destructive' : ''}
                  />
                  {formErrors.unit_number && (
                    <p className="text-sm text-destructive">{formErrors.unit_number}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Unit Type</Label>
                  <Select 
                    value={formData.unit_type} 
                    onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getUnitTypesForProperty(properties.find(p => p.id === formData.property_id)?.property_type).map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="Floor number"
                    className={formErrors.floor ? 'border-destructive' : ''}
                  />
                  {formErrors.floor && (
                    <p className="text-sm text-destructive">{formErrors.floor}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Size (sqm)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={MAX_REASONABLE_SIZE}
                    value={formData.size_sqm}
                    onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                    placeholder="Size in sqm"
                    className={formErrors.size_sqm ? 'border-destructive' : ''}
                  />
                  {formErrors.size_sqm && (
                    <p className="text-sm text-destructive">{formErrors.size_sqm}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Rent *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    placeholder="Rent amount"
                    className={formErrors.rent_amount ? 'border-destructive' : ''}
                  />
                  {formErrors.rent_amount && (
                    <p className="text-sm text-destructive">{formErrors.rent_amount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Deposit Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    placeholder="Deposit amount"
                    className={formErrors.deposit_amount ? 'border-destructive' : ''}
                  />
                  {formErrors.deposit_amount && (
                    <p className="text-sm text-destructive">{formErrors.deposit_amount}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
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
                {formData.status === 'occupied' && !editingUnit && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Setting as occupied manually. Consider creating a contract instead.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Unit description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Photos</Label>
                <UnitPhotoUpload
                  photos={formData.photos}
                  onPhotosChange={(photos) => setFormData({ ...formData, photos })}
                  maxPhotos={10}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingUnit ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Subscription Warning */}
      {subscriptionLimits?.isNearUnitLimit && (
        <SubscriptionLimitWarning type="unit" />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{stats.totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Home className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{stats.availableUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Building2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold">{stats.occupiedUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalMonthlyRent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search units..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Units ({filteredUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading units...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No units found</p>
              {properties.length === 0 && (
                <p className="text-sm mt-2">Add a property first to create units</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.unit_number}</TableCell>
                      <TableCell>{unit.property?.name}</TableCell>
                      <TableCell className="capitalize">{unit.unit_type || '-'}</TableCell>
                      <TableCell>{unit.size_sqm ? `${unit.size_sqm} sqm` : '-'}</TableCell>
                      <TableCell>{formatCurrency(unit.rent_amount)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusColors[unit.status || 'available']}
                        >
                          {unit.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(unit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={deleteLoading === unit.id}
                              >
                                {deleteLoading === unit.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete unit "{unit.unit_number}"? This action cannot be undone.
                                  {unit.status === 'occupied' && (
                                    <span className="block mt-2 text-destructive font-medium">
                                      Warning: This unit appears to be occupied.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(unit.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MerchantLayout>
  );
}
