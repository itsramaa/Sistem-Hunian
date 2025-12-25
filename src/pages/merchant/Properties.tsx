import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Building2, 
  Home,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Grid,
  List,
  DoorOpen,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { UnitsManager } from '@/components/merchant/UnitsManager';
import { UnitPhotoUpload } from '@/components/merchant/UnitPhotoUpload';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ImageGalleryUpload } from '@/components/FileUpload';
import { SubscriptionLimitWarning } from '@/components/merchant/SubscriptionLimitWarning';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { LocationPicker } from '@/components/merchant/LocationPicker';
import { ProvincesCitiesSelect } from '@/components/merchant/ProvincesCitiesSelect';
import { CustomAmenities } from '@/components/merchant/CustomAmenities';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface Property {
  id: string;
  merchant_id: string;
  name: string;
  property_type: string;
  address: string;
  city: string;
  province: string;
  postal_code: string | null;
  description: string | null;
  amenities: string[];
  images: string[];
  total_units: number;
  occupied_units: number;
  status: string;
  created_at: string;
}

const propertySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  property_type: z.enum(['kost', 'apartment', 'house', 'kontrakan', 'ruko']),
  address: z.string().min(5, 'Address is required').max(255),
  city: z.string().min(2, 'City is required').max(100),
  province: z.string().min(2, 'Province is required').max(100),
  postal_code: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  amenities: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const propertyTypes = [
  { value: 'kost', label: 'Kost' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'kontrakan', label: 'Kontrakan' },
  { value: 'ruko', label: 'Ruko' },
];

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
};

export default function MerchantProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [unitsProperty, setUnitsProperty] = useState<Property | null>(null);
  const [imagesProperty, setImagesProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const { toast } = useToast();
  const { merchant } = useAuth();
  const { data: limits } = useSubscriptionLimits();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      property_type: 'kost',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      description: '',
      amenities: [],
    },
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [formImages, setFormImages] = useState<string[]>([]);

  useEffect(() => {
    if (merchant) {
      fetchProperties();
    }
  }, [merchant]);

  const fetchProperties = async () => {
    if (!merchant) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties((data as Property[]) || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load properties',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PropertyFormData) => {
    if (!merchant) return;
    
    setActionLoading(true);
    try {
      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update({
            name: data.name,
            property_type: data.property_type,
            address: data.address,
            city: data.city,
            province: data.province,
            postal_code: data.postal_code || null,
            description: data.description || null,
            amenities: selectedAmenities,
            images: formImages,
          })
          .eq('id', editingProperty.id);

        if (error) throw error;
        toast({ title: 'Property Updated', description: 'Property has been updated successfully' });
      } else {
        const { error } = await supabase
          .from('properties')
          .insert({
            merchant_id: merchant.id,
            name: data.name,
            property_type: data.property_type,
            address: data.address,
            city: data.city,
            province: data.province,
            postal_code: data.postal_code || null,
            description: data.description || null,
            images: formImages,
            amenities: selectedAmenities,
          });

        if (error) throw error;
        toast({ title: 'Property Created', description: 'New property has been added successfully' });
      }

      setShowAddDialog(false);
      setEditingProperty(null);
      setSelectedAmenities([]);
      setFormImages([]);
      form.reset();
      fetchProperties();
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save property',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenImages = (property: Property) => {
    setImagesProperty(property);
    setPropertyImages(property.images || []);
  };

  const handleSaveImages = async () => {
    if (!imagesProperty) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .update({ images: propertyImages })
        .eq('id', imagesProperty.id);

      if (error) throw error;
      
      toast({ title: 'Images saved', description: 'Property images updated successfully' });
      setImagesProperty(null);
      fetchProperties();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save images',
      });
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    form.reset({
      name: property.name,
      property_type: property.property_type as any,
      address: property.address,
      city: property.city,
      province: property.province,
      postal_code: property.postal_code || '',
      description: property.description || '',
      amenities: property.amenities || [],
    });
    setSelectedAmenities(property.amenities || []);
    setFormImages(property.images || []);
    setShowAddDialog(true);
  };

  const handleDelete = async (property: Property) => {
    if (!confirm(`Are you sure you want to delete "${property.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) throw error;
      toast({ title: 'Property Deleted', description: 'Property has been deleted successfully' });
      fetchProperties();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete property',
      });
    }
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingProperty(null);
    setSelectedAmenities([]);
    setFormImages([]);
    form.reset();
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalUnits = properties.reduce((sum, p) => sum + p.total_units, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupied_units, 0);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <MerchantLayout 
      title="Properties" 
      description="Manage your rental properties"
      actions={
        <Button 
          onClick={() => setShowAddDialog(true)}
          disabled={limits && !limits.canAddProperty}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Subscription limit warning */}
        <SubscriptionLimitWarning type="property" />
        
        <Dialog open={showAddDialog} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
                <DialogDescription>
                  {editingProperty ? 'Update property details' : 'Add a new rental property to your portfolio'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nama Properti</Label>
                    <Input
                      id="name"
                      placeholder="Contoh: Kost Harmoni"
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="property_type">Tipe Properti</Label>
                    <Select 
                      value={form.watch('property_type')} 
                      onValueChange={(value) => form.setValue('property_type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Province & City Dropdowns */}
                  <ProvincesCitiesSelect
                    provinceValue={form.watch('province')}
                    cityValue={form.watch('city')}
                    onProvinceChange={(value) => form.setValue('province', value)}
                    onCityChange={(value) => form.setValue('city', value)}
                    provinceError={form.formState.errors.province?.message}
                    cityError={form.formState.errors.city?.message}
                  />

                  {/* Address with Map */}
                  <div className="col-span-2">
                    <Label htmlFor="address">Alamat</Label>
                    <LocationPicker
                      value={form.watch('address')}
                      onChange={(address) => form.setValue('address', address)}
                      placeholder="Cari atau klik peta untuk lokasi..."
                      province={form.watch('province')}
                      city={form.watch('city')}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.address.message}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input
                      id="postal_code"
                      placeholder="Contoh: 12345"
                      {...form.register('postal_code')}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Deskripsi (Opsional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Deskripsikan properti Anda..."
                      {...form.register('description')}
                      rows={3}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Foto Properti</Label>
                    <UnitPhotoUpload
                      photos={formImages}
                      onPhotosChange={setFormImages}
                      maxPhotos={10}
                    />
                  </div>
                  <div className="col-span-2">
                    <CustomAmenities
                      selectedAmenities={selectedAmenities}
                      onAmenitiesChange={setSelectedAmenities}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Properties</p>
                  <p className="text-3xl font-bold">{properties.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="text-3xl font-bold">{totalUnits}</p>
                </div>
                <div className="p-3 rounded-lg bg-info/10">
                  <Home className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                  <p className="text-sm font-medium">{occupiedUnits}/{totalUnits}</p>
                </div>
                <p className="text-3xl font-bold mb-2">{occupancyRate}%</p>
                <Progress value={occupancyRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Properties */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No properties found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {properties.length === 0 
                  ? "You haven't added any properties yet. Start by adding your first property."
                  : "No properties match your search criteria."}
              </p>
              {properties.length === 0 && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-card-hover transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{property.name}</CardTitle>
                        <CardDescription className="capitalize">{property.property_type}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setUnitsProperty(property)}>
                          <DoorOpen className="h-4 w-4 mr-2" />
                          Manage Units
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenImages(property)}>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Manage Photos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(property)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(property)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.images && property.images.length > 0 && (
                    <div className="relative h-24 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={property.images[0]} 
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                      {property.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          +{property.images.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{property.city}, {property.province}</span>
                  </div>
                  {/* Amenity Badges */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {property.amenities.slice(0, 4).map((amenity) => {
                        // Format amenity: replace underscores with spaces and capitalize
                        const amenityLabel = amenity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <Badge key={amenity} variant="secondary" className="text-xs py-0">
                            {amenityLabel}
                          </Badge>
                        );
                      })}
                      {property.amenities.length > 4 && (
                        <Badge variant="outline" className="text-xs py-0">
                          +{property.amenities.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy</p>
                      <p className="font-medium">{property.occupied_units}/{property.total_units} units</p>
                    </div>
                    <Badge variant="outline" className={statusColors[property.status]}>
                      {property.status}
                    </Badge>
                  </div>
                  <Progress 
                    value={property.total_units > 0 ? (property.occupied_units / property.total_units) * 100 : 0} 
                    className="h-2" 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Property</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Units</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{property.property_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{property.city}, {property.province}</td>
                      <td className="py-3 px-4 text-sm">{property.occupied_units}/{property.total_units}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={statusColors[property.status]}>
                          {property.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(property)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(property)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Units Manager Dialog */}
        {unitsProperty && (
          <UnitsManager
            propertyId={unitsProperty.id}
            propertyName={unitsProperty.name}
            open={!!unitsProperty}
            onOpenChange={(open) => !open && setUnitsProperty(null)}
            onUnitsChanged={fetchProperties}
          />
        )}

        {/* Images Manager Dialog */}
        <Dialog open={!!imagesProperty} onOpenChange={(open) => !open && setImagesProperty(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Property Photos - {imagesProperty?.name}</DialogTitle>
              <DialogDescription>
                Upload and manage photos for this property. Photos help attract potential tenants.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ImageGalleryUpload
                bucket="property-images"
                folder={imagesProperty?.id || 'temp'}
                images={propertyImages}
                onImagesChange={setPropertyImages}
                maxImages={10}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImagesProperty(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveImages}>
                Save Photos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MerchantLayout>
  );
}
