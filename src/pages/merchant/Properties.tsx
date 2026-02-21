import { useAuth } from '@/features/auth/hooks/useAuth';
import { PropertyCard } from '@/features/properties/components/PropertyCard';
import { PropertyFilters } from '@/features/properties/components/PropertyFilters';
import { PropertyFormData, PropertyFormDialog } from '@/features/properties/components/PropertyFormDialog';
import { PropertyTable } from '@/features/properties/components/PropertyTable';
import { UnitsManager } from '@/features/properties/components/UnitsManager';
import { useMerchantProperties } from '@/features/properties/hooks/useMerchantProperties';
import { CreatePropertyPayload, Property, UpdatePropertyPayload } from '@/features/properties/types';
import { SubscriptionLimitWarning } from '@/features/subscriptions/components/SubscriptionLimitWarning';
import { useSubscriptionLimits } from '@/features/subscriptions/hooks/useSubscriptionLimits';
import { ImageGalleryUpload } from '@/shared/components/FileUpload';
import { MerchantLayout } from '@/shared/components/layouts/MerchantLayout';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Progress } from '@/shared/components/ui/progress';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 9;

export default function MerchantProperties() {
  const { merchant } = useAuth();
  const { 
    properties, 
    loading, 
    error, 
    createProperty, 
    updateProperty, 
    deleteProperty,
    checkCanDelete,
    isCreating,
    isUpdating,
    refetch
  } = useMerchantProperties(merchant?.id || '');
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // Keep specifically for which item is deleting
  const [unitsProperty, setUnitsProperty] = useState<Property | null>(null);
  const [imagesProperty, setImagesProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const { toast } = useToast();
  const { data: limits } = useSubscriptionLimits();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter]);

  const handleSubmit = async (data: PropertyFormData) => {
    if (!merchant) return;
    
    try {
      if (editingProperty) {
        const payload: UpdatePropertyPayload = {
          name: data.name,
          property_type: data.property_type,
          address: data.address,
          city: data.city,
          province: data.province,
          postal_code: data.postal_code || null,
          description: data.description || null,
          amenities: data.amenities,
          images: data.images,
        };
        await updateProperty({ id: editingProperty.id, payload });
        toast({ title: 'Property Updated', description: 'Property has been updated successfully' });
      } else {
        const payload: CreatePropertyPayload = {
          name: data.name,
          property_type: data.property_type,
          address: data.address,
          city: data.city,
          province: data.province,
          postal_code: data.postal_code || null,
          description: data.description || null,
          amenities: data.amenities || [],
          images: data.images || [],
        };
        await createProperty(payload);
        toast({ title: 'Property Created', description: 'New property has been added successfully' });
      }

      setShowAddDialog(false);
      setEditingProperty(null);
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to save property',
      });
    }
  };

  const handleOpenImages = (property: Property) => {
    setImagesProperty(property);
    setPropertyImages(property.images || []);
  };

  const handleSaveImages = async () => {
    if (!imagesProperty) return;
    
    try {
      await updateProperty({ 
        id: imagesProperty.id, 
        payload: { images: propertyImages } 
      });
      
      toast({ title: 'Images saved', description: 'Property images updated successfully' });
      setImagesProperty(null);
    } catch (error) {
      const err = error as Error;
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to save images',
      });
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setShowAddDialog(true);
  };

  const handleDelete = async (property: Property) => {
    setDeleteLoading(property.id);
    try {
      // Check if can delete
      const check = await checkCanDelete(property.id);
      if (!check.canDelete) {
        toast({
          variant: 'destructive',
          title: 'Cannot Delete Property',
          description: check.reason,
        });
        return;
      }

      // Confirm deletion
      if (!confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
        return;
      }

      await deleteProperty(property.id);
      toast({ title: 'Property Deleted', description: 'Property has been deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        variant: 'destructive',
        title: 'Error Deleting Property',
        description: (error as Error).message || 'Failed to delete property',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowAddDialog(false);
      setEditingProperty(null);
    } else {
      setShowAddDialog(true);
    }
  };

  const filteredProperties = useMemo(() => properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      property.city.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesType = typeFilter === 'all' || property.property_type === typeFilter;
    return matchesSearch && matchesType;
  }), [properties, debouncedSearch, typeFilter]);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = useMemo(() => filteredProperties.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  ), [filteredProperties, page]);

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
        
        <PropertyFormDialog
          open={showAddDialog}
          onOpenChange={handleDialogClose}
          property={editingProperty}
          onSubmit={handleSubmit}
          isLoading={isCreating || isUpdating}
        />

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
        <PropertyFilters
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{(error as Error).message}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
        ) : (
          <>
            {viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onManageUnits={setUnitsProperty}
                      onManagePhotos={handleOpenImages}
                      isDeleting={deleteLoading === property.id}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, filteredProperties.length)} of {filteredProperties.length} properties
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <PropertyTable
                properties={paginatedProperties}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManageUnits={setUnitsProperty}
                onManagePhotos={handleOpenImages}
                deleteLoadingId={deleteLoading}
                page={page}
                totalPages={totalPages}
                totalProperties={filteredProperties.length}
                onPageChange={setPage}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            )}
          </>
        )}

        {/* Units Manager Dialog */}
        {unitsProperty && (
          <UnitsManager
            propertyId={unitsProperty.id}
            propertyName={unitsProperty.name}
            open={!!unitsProperty}
            onOpenChange={(open) => !open && setUnitsProperty(null)}
            onUnitsChanged={() => refetch()}
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