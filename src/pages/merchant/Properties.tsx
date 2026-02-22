import { useAuth } from '@/features/auth/hooks/useAuth';
import { DeletePropertyDialog } from '@/features/properties/components/DeletePropertyDialog';
import { PropertyCard } from '@/features/properties/components/PropertyCard';
import { PropertyFilters, SortOption } from '@/features/properties/components/PropertyFilters';
import { PropertyFormData, PropertyFormDialog } from '@/features/properties/components/PropertyFormDialog';
import { PropertiesPageSkeleton } from '@/features/properties/components/PropertySkeleton';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_ITEMS_PER_PAGE = 9;

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteDialogProperty, setDeleteDialogProperty] = useState<Property | null>(null);
  const [unitsProperty, setUnitsProperty] = useState<Property | null>(null);
  const [imagesProperty, setImagesProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const { toast } = useToast();
  const { data: limits } = useSubscriptionLimits();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, statusFilter, sortBy, itemsPerPage]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [typeFilter, statusFilter, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

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

  const handleDeleteClick = async (property: Property) => {
    setDeleteLoading(property.id);
    try {
      const check = await checkCanDelete(property.id);
      if (!check.canDelete) {
        toast({
          variant: 'destructive',
          title: 'Cannot Delete Property',
          description: check.reason,
        });
        return;
      }
      // Show delete dialog instead of native confirm
      setDeleteDialogProperty(property);
    } catch (error) {
      console.error('Error checking delete:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to check property',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogProperty) return;
    setDeleteLoading(deleteDialogProperty.id);
    try {
      await deleteProperty(deleteDialogProperty.id);
      toast({ title: 'Property Deleted', description: 'Property has been deleted successfully' });
      setDeleteDialogProperty(null);
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

  // Filter + Sort
  const filteredProperties = useMemo(() => {
    let result = properties.filter(property => {
      const matchesSearch = property.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        property.city.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = typeFilter === 'all' || property.property_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'occupancy-high': {
          const rateA = a.total_units > 0 ? a.occupied_units / a.total_units : 0;
          const rateB = b.total_units > 0 ? b.occupied_units / b.total_units : 0;
          return rateB - rateA;
        }
        case 'occupancy-low': {
          const rateA = a.total_units > 0 ? a.occupied_units / a.total_units : 0;
          const rateB = b.total_units > 0 ? b.occupied_units / b.total_units : 0;
          return rateA - rateB;
        }
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [properties, debouncedSearch, typeFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = useMemo(() => filteredProperties.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  ), [filteredProperties, page, itemsPerPage]);

  const totalUnits = properties.reduce((sum, p) => sum + p.total_units, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupied_units, 0);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Page numbers for grid pagination
  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (current > 3) pages.push('ellipsis');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('ellipsis');
    if (total > 1) pages.push(total);
    return pages;
  };

  const pageNumbers = getPageNumbers(page, totalPages);

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

        {/* Delete Dialog */}
        <DeletePropertyDialog
          open={!!deleteDialogProperty}
          onOpenChange={(open) => !open && setDeleteDialogProperty(null)}
          property={deleteDialogProperty}
          onConfirm={handleDeleteConfirm}
          isLoading={!!deleteLoading}
        />

        {loading ? (
          <PropertiesPageSkeleton />
        ) : (
          <>
            {/* Stats */}
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Properties</p>
                        <p className="text-3xl font-bold">{properties.length}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-3 rounded-lg bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Total properties you manage</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-info">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Units</p>
                        <p className="text-3xl font-bold">{totalUnits}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-success font-medium">{occupiedUnits}</span> occupied • <span className="text-muted-foreground">{totalUnits - occupiedUnits}</span> available
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-3 rounded-lg bg-info/10">
                            <Home className="h-6 w-6 text-info" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Total units across all properties</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
                <Card className={`border-l-4 ${occupancyRate >= 80 ? 'border-l-success' : occupancyRate >= 50 ? 'border-l-warning' : 'border-l-destructive'}`}>
                  <CardContent className="pt-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1 text-xs font-medium ${occupancyRate >= 80 ? 'text-success' : occupancyRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                              <TrendingUp className="h-3.5 w-3.5" />
                              {occupancyRate >= 80 ? 'Great' : occupancyRate >= 50 ? 'Average' : 'Low'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {occupancyRate >= 80 ? 'Excellent occupancy!' : occupancyRate >= 50 ? 'Room for improvement' : 'Consider adjusting pricing or marketing'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-3xl font-bold mb-2">{occupancyRate}%</p>
                      <Progress value={occupancyRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TooltipProvider>

            {/* Filters */}
            <PropertyFilters
              searchTerm={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onResetFilters={handleResetFilters}
              activeFilterCount={activeFilterCount}
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
            {filteredProperties.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                    <Building2 className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {properties.length === 0 ? 'Start Building Your Portfolio' : 'No properties match'}
                  </h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-md">
                    {properties.length === 0 
                      ? "Add your first property to start managing units, tracking occupancy, and growing your rental business."
                      : "Try adjusting your filters or search terms to find what you're looking for."}
                  </p>
                  {properties.length === 0 ? (
                    <div className="space-y-4">
                      <Button onClick={() => setShowAddDialog(true)} size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Property
                      </Button>
                      <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">1</span>
                          Add property
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">2</span>
                          Create units
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">3</span>
                          Invite tenants
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedProperties.map((property, index) => (
                        <div
                          key={property.id}
                          className="animate-in fade-in-0 slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                        >
                          <PropertyCard
                            property={property}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onManageUnits={setUnitsProperty}
                            onManagePhotos={handleOpenImages}
                            isDeleting={deleteLoading === property.id}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Enhanced Grid Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredProperties.length)} of {filteredProperties.length}
                          </span>
                          <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                            <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="18">18</SelectItem>
                              <SelectItem value="27">27</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1} className="h-8">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {pageNumbers.map((p, i) =>
                            p === 'ellipsis' ? (
                              <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
                            ) : (
                              <Button
                                key={p}
                                variant={p === page ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setPage(p)}
                              >
                                {p}
                              </Button>
                            )
                          )}
                          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="h-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <PropertyTable
                    properties={paginatedProperties}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onManageUnits={setUnitsProperty}
                    onManagePhotos={handleOpenImages}
                    deleteLoadingId={deleteLoading}
                    page={page}
                    totalPages={totalPages}
                    totalProperties={filteredProperties.length}
                    onPageChange={setPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
              </>
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
