import { PropertyImportDialog } from '@/features/properties/components/PropertyImportDialog';
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

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Progress } from '@/shared/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useToast } from '@/shared/hooks/use-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Users,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_ITEMS_PER_PAGE = 9;

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch { return fallback; }
}

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
  const [sortBy, setSortBy] = useState<SortOption>(() => readLocalStorage('sihuni:propertySortBy', 'newest'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => readLocalStorage('sihuni:propertyViewMode', 'grid'));
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteDialogProperty, setDeleteDialogProperty] = useState<Property | null>(null);
  const [unitsProperty, setUnitsProperty] = useState<Property | null>(null);
  const [imagesProperty, setImagesProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState<boolean>(() => readLocalStorage('sihuni:propertyInsightsOpen', true));
  const [jumpToPage, setJumpToPage] = useState('');
  const { toast } = useToast();
  const { data: limits } = useSubscriptionLimits();

  // Persist viewMode & sortBy to localStorage
  useEffect(() => { localStorage.setItem('sihuni:propertyViewMode', JSON.stringify(viewMode)); }, [viewMode]);
  useEffect(() => { localStorage.setItem('sihuni:propertySortBy', JSON.stringify(sortBy)); }, [sortBy]);
  useEffect(() => { localStorage.setItem('sihuni:propertyInsightsOpen', JSON.stringify(insightsOpen)); }, [insightsOpen]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, statusFilter, sortBy, itemsPerPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [typeFilter, statusFilter, searchQuery]);

  const handleResetFilters = () => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); setSortBy('newest'); };

  const handleSubmit = async (data: PropertyFormData) => {
    if (!merchant) return;
    try {
      if (editingProperty) {
        const payload: UpdatePropertyPayload = {
          name: data.name, property_type: data.property_type, address: data.address,
          city: data.city, province: data.province, postal_code: data.postal_code || null,
          description: data.description || null, amenities: data.amenities, images: data.images,
          guardian_name: data.guardian_name || null, guardian_phone: data.guardian_phone || null,
          marketing_cost: data.marketing_cost || null, construction_year: data.construction_year || null,
          floor_count: data.floor_count || 1, building_condition: data.building_condition || null,
          land_ownership: data.land_ownership || null,
          latitude: data.latitude || null, longitude: data.longitude || null,
        };
        await updateProperty({ id: editingProperty.id, payload });
        toast({ title: 'Properti Diperbarui', description: 'Properti berhasil diperbarui' });
      } else {
        const payload: CreatePropertyPayload = {
          name: data.name, property_type: data.property_type, address: data.address,
          city: data.city, province: data.province, postal_code: data.postal_code || null,
          description: data.description || null, amenities: data.amenities || [], images: data.images || [],
          guardian_name: data.guardian_name || null, guardian_phone: data.guardian_phone || null,
          marketing_cost: data.marketing_cost || null, construction_year: data.construction_year || null,
          floor_count: data.floor_count || 1, building_condition: data.building_condition || null,
          land_ownership: data.land_ownership || null,
          latitude: data.latitude || null, longitude: data.longitude || null,
        };
        await createProperty(payload);
        toast({ title: 'Properti Dibuat', description: 'Properti baru telah berhasil ditambahkan' });
      }
      setShowAddDialog(false);
      setEditingProperty(null);
    } catch (error) {
      console.error('Error saving property:', error);
      toast({ variant: 'destructive', title: 'Kesalahan', description: (error as Error).message || 'Gagal menyimpan properti' });
    }
  };

  const handleOpenImages = (property: Property) => { setImagesProperty(property); setPropertyImages(property.images || []); };

  const handleSaveImages = async () => {
    if (!imagesProperty) return;
    try {
      await updateProperty({ id: imagesProperty.id, payload: { images: propertyImages } });
      toast({ title: 'Gambar disimpan', description: 'Gambar properti berhasil diperbarui' });
      setImagesProperty(null);
    } catch (error) {
      const err = error as Error;
      toast({ variant: 'destructive', title: 'Kesalahan', description: err.message || 'Gagal menyimpan gambar' });
    }
  };

  const handleEdit = (property: Property) => { setEditingProperty(property); setShowAddDialog(true); };

  const handleDuplicate = (property: Property) => {
    const duplicated = {
      ...property,
      id: '' as any,
      name: `${property.name} (Salinan)`,
      created_at: '' as any,
      updated_at: '' as any,
      total_units: 0 as any,
      occupied_units: 0 as any,
    } as Property;
    setEditingProperty(duplicated);
    setShowAddDialog(true);
  };

  const handleDeleteClick = async (property: Property) => {
    setDeleteLoading(property.id);
    try {
      const check = await checkCanDelete(property.id);
      if (!check.canDelete) { toast({ variant: 'destructive', title: 'Tidak Dapat Menghapus Properti', description: check.reason }); return; }
      setDeleteDialogProperty(property);
    } catch (error) {
      console.error('Error checking delete:', error);
      toast({ variant: 'destructive', title: 'Kesalahan', description: (error as Error).message || 'Gagal memeriksa properti' });
    } finally { setDeleteLoading(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogProperty) return;
    setDeleteLoading(deleteDialogProperty.id);
    try {
      await deleteProperty(deleteDialogProperty.id);
      toast({ title: 'Properti Dihapus', description: 'Properti telah berhasil dihapus' });
      setDeleteDialogProperty(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({ variant: 'destructive', title: 'Kesalahan Menghapus Properti', description: (error as Error).message || 'Gagal menghapus properti' });
    } finally { setDeleteLoading(null); }
  };

  const handleDialogClose = (open: boolean) => { if (!open) { setShowAddDialog(false); setEditingProperty(null); } else { setShowAddDialog(true); } };

  const handleJumpToPage = () => {
    const target = parseInt(jumpToPage, 10);
    if (target >= 1 && target <= totalPages) {
      setPage(target);
      setJumpToPage('');
    }
  };

  // Filter + Sort
  const filteredProperties = useMemo(() => {
    let result = properties.filter(property => {
      const matchesSearch = property.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || property.city.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesType = typeFilter === 'all' || property.property_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'occupancy-high': { const rA = a.total_units > 0 ? a.occupied_units / a.total_units : 0; const rB = b.total_units > 0 ? b.occupied_units / b.total_units : 0; return rB - rA; }
        case 'occupancy-low': { const rA = a.total_units > 0 ? a.occupied_units / a.total_units : 0; const rB = b.total_units > 0 ? b.occupied_units / b.total_units : 0; return rA - rB; }
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest': default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [properties, debouncedSearch, typeFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = useMemo(() => filteredProperties.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredProperties, page, itemsPerPage]);

  const totalUnits = properties.reduce((sum, p) => sum + p.total_units, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupied_units, 0);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Operational Insights
  const insights = useMemo(() => {
    if (properties.length === 0) return null;
    const withRates = properties.map(p => ({ ...p, rate: p.total_units > 0 ? (p.occupied_units / p.total_units) * 100 : 0 }));
    const best = [...withRates].sort((a, b) => b.rate - a.rate)[0];
    const worst = [...withRates].sort((a, b) => a.rate - b.rate)[0];
    const vacantProperties = withRates.filter(p => p.total_units > 0 && p.rate < 50);
    const totalVacant = properties.reduce((s, p) => s + (p.total_units - p.occupied_units), 0);
    return { best, worst, vacantProperties, totalVacant };
  }, [properties]);

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

  // Shared pagination UI for both grid and table
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Menampilkan {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredProperties.length)} dari {filteredProperties.length}</span>
          <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
            <SelectTrigger className="h-8 w-[70px] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1} className="h-8 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
          {pageNumbers.map((p, i) => p === 'ellipsis' ? <span key={`e${i}`} className="px-2 text-muted-foreground">…</span> : (
            <Button key={p} variant={p === page ? 'default' : 'ghost'} size="sm" className={`h-8 w-8 p-0 rounded-full ${p === page ? 'gradient-cta text-primary-foreground' : ''}`} onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="h-8 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
          {totalPages > 5 && (
            <div className="flex items-center gap-1 ml-2">
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                placeholder="Hal."
                className="h-8 w-16 rounded-lg text-xs"
                aria-label="Lompat ke halaman"
              />
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs px-2" onClick={handleJumpToPage}>Go</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader icon={Building2} title={`Properti (${properties.length})`} description="Kelola properti dan unit Anda">
        <Button variant="outline" onClick={() => setShowImportDialog(true)} className="rounded-xl gap-2">
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
        <Button onClick={() => setShowAddDialog(true)} disabled={limits && !limits.canAddProperty} className="gradient-cta text-primary-foreground hover:opacity-90 rounded-xl gap-2">
          <Plus className="h-4 w-4" />Tambah Properti
        </Button>
      </PageHeader>
      <div className="space-y-6">
        <SubscriptionLimitWarning />
        
        <PropertyFormDialog open={showAddDialog} onOpenChange={handleDialogClose} property={editingProperty} onSubmit={handleSubmit} isLoading={isCreating || isUpdating} />
        <DeletePropertyDialog open={!!deleteDialogProperty} onOpenChange={(open) => !open && setDeleteDialogProperty(null)} property={deleteDialogProperty} onConfirm={handleDeleteConfirm} isLoading={!!deleteLoading} />
        <PropertyImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} onSuccess={() => refetch()} />

        {loading ? (
          <PropertiesPageSkeleton />
        ) : (
          <>
            {/* KPI Summary Strip */}
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-stat-card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Properti</p>
                      <p className="text-3xl font-bold font-display">{properties.length}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="gradient-icon-box w-12 h-12"><Building2 className="h-6 w-6 text-primary" /></div>
                      </TooltipTrigger>
                      <TooltipContent>Total properti yang Anda kelola</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="glass-stat-card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Unit</p>
                      <p className="text-3xl font-bold font-display">{totalUnits}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-success font-medium">{occupiedUnits}</span> terisi • <span>{totalUnits - occupiedUnits}</span> kosong
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="gradient-icon-box w-12 h-12"><Home className="h-6 w-6 text-info" /></div>
                      </TooltipTrigger>
                      <TooltipContent>Total unit di semua properti</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="glass-stat-card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Hunian</p>
                      <div className={`flex items-center gap-1 text-xs font-medium ${occupancyRate >= 80 ? 'text-success' : occupancyRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                        <TrendingUp className="h-3.5 w-3.5" />
                        {occupancyRate >= 80 ? 'Baik' : occupancyRate >= 50 ? 'Sedang' : 'Rendah'}
                      </div>
                    </div>
                    <p className="text-3xl font-bold font-display mb-2">{occupancyRate}%</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          i < Math.round(occupancyRate / 25)
                            ? occupancyRate >= 80 ? 'bg-success' : occupancyRate >= 50 ? 'bg-warning' : 'bg-destructive'
                            : 'bg-muted/60'
                        }`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="glass-stat-card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Unit Kosong</p>
                      <p className="text-3xl font-bold font-display">{insights?.totalVacant || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">potensi pendapatan</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="gradient-icon-box w-12 h-12"><Users className="h-6 w-6 text-warning" /></div>
                      </TooltipTrigger>
                      <TooltipContent>Unit yang belum terisi</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </TooltipProvider>

            {/* Operational Insights Panel — Collapsible */}
            {insights && properties.length >= 2 && (
              <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Operational Insights</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                      {insightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">{insightsOpen ? 'Tutup' : 'Buka'} Operational Insights</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Best Performer */}
                    <div className="rounded-2xl bg-success/5 border border-success/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-success/15 flex items-center justify-center">
                          <ArrowUp className="h-4 w-4 text-success" />
                        </div>
                        <span className="text-xs font-semibold text-success uppercase tracking-wider">Terbaik</span>
                      </div>
                      <p className="font-semibold text-sm truncate">{insights.best.name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(insights.best.rate)}% hunian • {insights.best.occupied_units}/{insights.best.total_units} unit</p>
                    </div>

                    {/* Worst Performer */}
                    <div className="rounded-2xl bg-warning/5 border border-warning/20 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-warning/15 flex items-center justify-center">
                          <ArrowDown className="h-4 w-4 text-warning" />
                        </div>
                        <span className="text-xs font-semibold text-warning uppercase tracking-wider">Perlu Perhatian</span>
                      </div>
                      <p className="font-semibold text-sm truncate">{insights.worst.name}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(insights.worst.rate)}% hunian • {insights.worst.occupied_units}/{insights.worst.total_units} unit</p>
                    </div>

                    {/* Vacancy Alerts */}
                    {insights.vacantProperties.length > 0 && (
                      <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-7 w-7 rounded-lg bg-destructive/15 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </div>
                          <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Kekosongan Tinggi</span>
                        </div>
                        <p className="font-semibold text-sm">{insights.vacantProperties.length} properti</p>
                        <p className="text-xs text-muted-foreground">dibawah 50% tingkat hunian</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Filters */}
            <PropertyFilters
              searchTerm={searchQuery} onSearchChange={setSearchQuery} typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
              statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} sortBy={sortBy} onSortByChange={setSortBy}
              viewMode={viewMode} onViewModeChange={setViewMode} onResetFilters={handleResetFilters} activeFilterCount={activeFilterCount}
            />

            {/* Error State */}
            {error && (
              <Alert variant="destructive" className="mb-4 rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Kesalahan</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{(error as Error).message}</span>
                  <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Coba Lagi</Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Properties Content */}
            {filteredProperties.length === 0 ? (
              <div className="glass-stat-card">
                <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-primary/5 via-muted/30 to-accent/5 rounded-2xl">
                  <div className="gradient-icon-box w-24 h-24 mb-6"><Building2 className="h-12 w-12 text-muted-foreground/50" /></div>
                  {properties.length === 0 ? (
                    <>
                      <h3 className="text-lg font-medium mb-2">Mulai Bangun Portofolio Anda</h3>
                      <p className="text-muted-foreground text-center mb-6 max-w-md">
                        Tambahkan properti pertama Anda untuk mulai mengelola unit, melacak hunian, dan mengembangkan bisnis.
                      </p>
                      <div className="space-y-4">
                        <Button onClick={() => setShowAddDialog(true)} size="lg" className="gradient-cta text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Tambah Properti Pertama</Button>
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                          {['Tambah properti', 'Buat unit', 'Undang tenant'].map((step, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="gradient-icon-box w-6 h-6 text-[10px] font-bold text-primary">{i + 1}</span>{step}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">Tidak ada properti cocok dengan filter ini</h3>
                      <p className="text-muted-foreground text-center mb-4 max-w-md">
                        {activeFilterCount} filter aktif. Coba ubah atau hapus filter untuk melihat properti Anda.
                      </p>
                      <Button onClick={handleResetFilters} className="rounded-xl gap-2">
                        <RotateCcw className="h-4 w-4" />Reset Semua Filter
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedProperties.map((property, index) => (
                        <div key={property.id} className="animate-in fade-in-0 slide-in-from-bottom-4" style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}>
                          <PropertyCard property={property} onEdit={handleEdit} onDelete={handleDeleteClick} onManageUnits={setUnitsProperty} onManagePhotos={handleOpenImages} onDuplicate={handleDuplicate} isDeleting={deleteLoading === property.id} />
                        </div>
                      ))}
                    </div>
                    {renderPagination()}
                  </>
                ) : (
                  <>
                    <PropertyTable properties={paginatedProperties} onEdit={handleEdit} onDelete={handleDeleteClick} onManageUnits={setUnitsProperty} onManagePhotos={handleOpenImages} onDuplicate={handleDuplicate} deleteLoadingId={deleteLoading} page={page} totalPages={totalPages} totalProperties={filteredProperties.length} onPageChange={setPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} />
                    {renderPagination()}
                  </>
                )}
              </>
            )}
          </>
        )}

        {unitsProperty && (
          <UnitsManager propertyId={unitsProperty.id} propertyName={unitsProperty.name} open={!!unitsProperty} onOpenChange={(open) => !open && setUnitsProperty(null)} onUnitsChanged={() => refetch()} />
        )}

        <Dialog open={!!imagesProperty} onOpenChange={(open) => !open && setImagesProperty(null)}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>Foto Properti - {imagesProperty?.name}</DialogTitle>
              <DialogDescription>Upload dan kelola foto untuk properti ini.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ImageGalleryUpload bucket="property-images" folder={imagesProperty?.id || 'temp'} images={propertyImages} onImagesChange={setPropertyImages} maxImages={10} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImagesProperty(null)} className="rounded-xl">Batal</Button>
              <Button onClick={handleSaveImages} className="gradient-cta text-primary-foreground rounded-xl">Simpan Foto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
