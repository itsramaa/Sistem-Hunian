import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePropertyDetail } from '@/features/properties/hooks/usePropertyDetail';
import { PropertyDetailSkeleton } from '@/features/properties/components/PropertyDetailSkeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Separator } from '@/shared/components/ui/separator';
import { Progress } from '@/shared/components/ui/progress';
import { ImageGalleryUpload } from '@/shared/components/FileUpload';
import { PhotoLightbox } from '@/shared/components/PhotoLightbox';
import { 
  ArrowLeft, Building2, ChevronRight, DoorOpen, Edit, Image as ImageIcon, Camera, LayoutGrid, List, MapPin, 
  Sparkles, TrendingUp, Users, DollarSign, Calendar, Hash, Clock, Wrench, FileText, AlertTriangle,
  Shield, UserCheck, MoreHorizontal, Plus, Home, BarChart3, Settings2, ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { ContentSkeleton } from '@/shared/components/ui/PageSkeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { TenantDetailsDialog } from '@/features/users/components/tenant/TenantDetailsDialog';
import { ActiveTenant } from '@/features/users/types/tenant';
import { CreateMaintenanceDialog } from '@/features/maintenance/components/CreateMaintenanceDialog';
import { useCreateMerchantMaintenanceRequest } from '@/features/maintenance/hooks/useMaintenance';
import { UnitFormDialog } from '@/features/properties/components/UnitFormDialog';
import { useUnits } from '@/features/properties/hooks/useUnits';
import { AddTenantDialog } from '@/features/users/components/tenant/AddTenantDialog';
import { FacilityTypePicker } from '@/features/inventory/components/FacilityTypePicker';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFacilityTypeNames } from '@/features/inventory/hooks/useFacilityTypeNames';
import { RulesSection } from '@/features/rules/components/RulesSection';

const LazyGuardians = lazy(() => import('@/pages/merchant/Guardians'));

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { PropertyFormDialog, PropertyFormData } from '@/features/properties/components/PropertyFormDialog';
import { propertyService } from '@/features/properties/services/propertyService';
import { toast } from 'sonner';
import { RenovationHistoryCard } from '@/features/properties/components/RenovationHistoryCard';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-muted',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-primary/10 text-primary border-primary/30',
  reserved: 'bg-warning/10 text-warning border-warning/30',
};

const typeLabels: Record<string, string> = { kost: 'Kost', kontrakan: 'Kontrakan / Ruko' };

function getOccupancyColor(rate: number): string {
  if (rate >= 80) return 'bg-success';
  if (rate >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function isNewProperty(createdAt: string): boolean {
  const created = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return created > sevenDaysAgo;
}

const ITEMS_PER_PAGE = 10;

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: property, isLoading, error } = usePropertyDetail(id);
  const queryClient = useQueryClient();
  const { merchant } = useAuth();
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editInitialStep, setEditInitialStep] = useState(0);
  
  // View modes
  const [unitViewMode, setUnitViewMode] = useState<'list' | 'gallery'>('list');
  const [tenantViewMode, setTenantViewMode] = useState<'list' | 'gallery'>('list');
  
  // Pagination
  const [unitPage, setUnitPage] = useState(1);
  const [tenantPage, setTenantPage] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  
  // Infinite scroll
  const [unitGalleryCount, setUnitGalleryCount] = useState(ITEMS_PER_PAGE);
  const [tenantGalleryCount, setTenantGalleryCount] = useState(ITEMS_PER_PAGE);
  const unitObserverRef = useRef<HTMLDivElement>(null);
  const tenantObserverRef = useRef<HTMLDivElement>(null);

  // Tenant dialog
  const [selectedTenantForDialog, setSelectedTenantForDialog] = useState<ActiveTenant | null>(null);
  const [showTenantDialog, setShowTenantDialog] = useState(false);

  // Maintenance dialog
  const [showCreateMaintenanceDialog, setShowCreateMaintenanceDialog] = useState(false);
  const createMaintenanceMutation = useCreateMerchantMaintenanceRequest();
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Add Unit dialog
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const { createUnit, isCreating: isCreatingUnit } = useUnits(id || '');

  // Add Tenant dialog
  const [showAddTenantDialog, setShowAddTenantDialog] = useState(false);

  // Fasilitas edit dialog
  const [showFacilitiesDialog, setShowFacilitiesDialog] = useState(false);
  const [editingAmenities, setEditingAmenities] = useState<string[]>([]);

  // Facility type names — must be before early returns (Rules of Hooks)
  const { data: facilityNameMap = {} } = useFacilityTypeNames(property?.amenities || []);

  // Tenant creation mutation
  const addTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('create-tenant', { body: data });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-contracts', id] });
      toast.success('Penyewa berhasil ditambahkan');
      setShowAddTenantDialog(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Fetch properties for AddTenantDialog (just this property with units)
  const { data: propertiesForTenant = [] } = useQuery({
    queryKey: ['property-with-units', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: prop } = await supabase.from('properties').select('id, name, property_type, description, images, amenities, total_units, occupied_units, status, created_at, updated_at, merchant_id, address_id').eq('id', id).single() as any;
      if (!prop) return [];
      const { data: units } = await supabase.from('units').select('id, unit_number, status, rent_amount, deposit_amount').eq('property_id', id);
      return [{ ...prop, units: units || [] }];
    },
    enabled: !!id,
  });

  // Read URL hash for initial tab
  const getInitialTab = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['overview', 'units', 'guardians', 'tenants', 'financial', 'maintenance', 'risk'];
    return validTabs.includes(hash) ? hash : 'overview';
  }, []);
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Handle ?edit=true&step=N to auto-open PropertyFormDialog
  useEffect(() => {
    if (property && searchParams.get('edit') === 'true') {
      const step = parseInt(searchParams.get('step') || '0', 10);
      setEditInitialStep(isNaN(step) ? 0 : step);
      setShowEditDialog(true);
      searchParams.delete('edit');
      searchParams.delete('step');
      setSearchParams(searchParams, { replace: true });
    }
  }, [property, searchParams, setSearchParams]);

  // Update hash when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', tab === 'overview' ? window.location.pathname : `${window.location.pathname}#${tab}`);
  };

  const statusLabels: Record<string, string> = {
    active: 'Aktif',
    inactive: 'Nonaktif',
    maintenance: 'Pemeliharaan',
    available: 'Tersedia',
    occupied: 'Terisi',
    reserved: 'Dipesan',
  };

  const typeLabels: Record<string, string> = {
    kost: 'Kost',
    kontrakan: 'Kontrakan / Ruko'
  };

  // Edit submit handler
  const editMutation = useMutation({
    mutationFn: (data: PropertyFormData) => propertyService.updateProperty(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-detail', id] });
      toast.success('Properti berhasil diperbarui');
      setShowEditDialog(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Save amenities mutation
  const saveAmenitiesMutation = useMutation({
    mutationFn: (amenities: string[]) => propertyService.updateProperty(id!, { amenities } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-detail', id] });
      toast.success('Fasilitas berhasil diperbarui');
      setShowFacilitiesDialog(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Fetch contracts for this property's units
  const { data: propertyContracts = [] } = useQuery({
    queryKey: ['property-contracts', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: units } = await supabase.from('units').select('id').eq('property_id', id);
      if (!units || units.length === 0) return [];
      const unitIds = units.map(u => u.id);
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, status, start_date, end_date, rent_amount, tenant_user_id, unit_id')
        .in('unit_id', unitIds)
        .order('created_at', { ascending: false });
      
      const tenantIds = [...new Set((contracts || []).map(c => c.tenant_user_id))];
      const profiles: Record<string, any> = {};
      if (tenantIds.length > 0) {
        const { data: profileData } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', tenantIds);
        (profileData || []).forEach(p => { profiles[p.user_id] = p; });
      }
      return (contracts || []).map(c => ({ ...c, tenant: profiles[c.tenant_user_id] }));
    },
    enabled: !!id,
  });

  // Fetch maintenance requests for this property's units
  const { data: propertyMaintenance = [] } = useQuery({
    queryKey: ['property-maintenance', id],
    queryFn: async () => {
      if (!id) return [];
      const { data: units } = await supabase.from('units').select('id, unit_number').eq('property_id', id);
      if (!units || units.length === 0) return [];
      const unitIds = units.map(u => u.id);
      const unitMap = Object.fromEntries(units.map(u => [u.id, u.unit_number]));
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id, title, status, priority, created_at, unit_id')
        .in('unit_id', unitIds)
        .order('created_at', { ascending: false });
      return (requests || []).map(r => ({ ...r, unit_number: unitMap[r.unit_id] }));
    },
    enabled: !!id,
  });

  // Infinite scroll observers
  useEffect(() => {
    const el = unitObserverRef.current;
    if (!el || unitViewMode !== 'gallery') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setUnitGalleryCount(prev => prev + ITEMS_PER_PAGE);
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [unitViewMode, unitGalleryCount]);

  useEffect(() => {
    const el = tenantObserverRef.current;
    if (!el || tenantViewMode !== 'gallery') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setTenantGalleryCount(prev => prev + ITEMS_PER_PAGE);
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tenantViewMode, tenantGalleryCount]);

  if (isLoading) return <PropertyDetailSkeleton />;

  if (error || !property) {
    return (
      <div className="text-center py-12" role="alert">
        <div className="gradient-icon-box w-20 h-20 mx-auto mb-4" aria-hidden="true"><Building2 className="h-10 w-10 text-muted-foreground" /></div>
        <h3 className="text-lg font-medium mb-2">Properti tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mb-4">Properti yang Anda cari tidak ada atau telah dihapus.</p>
        <Button asChild className="rounded-xl" aria-label="Kembali ke daftar properti"><Link to="/merchant/properties">Kembali</Link></Button>
      </div>
    );
  }

  const units = (property as any).units || [];
  const occupiedUnits = units.filter((u: any) => u.status === 'occupied').length;
  const totalUnits = units.length;
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  const revenuePotential = units.filter((u: any) => u.status === 'occupied').reduce((sum: number, u: any) => sum + (u.rent_amount || 0), 0);
  const avgRent = totalUnits > 0 ? units.reduce((sum: number, u: any) => sum + (u.rent_amount || 0), 0) / totalUnits : 0;
  const isNew = isNewProperty(property.created_at);
  const filteredUnits = unitFilter === 'all' ? units : units.filter((u: any) => u.status === unitFilter);
  const maintenanceUnits = units.filter((u: any) => u.status === 'maintenance').length;
  const activeContracts = propertyContracts.filter((c: any) => c.status === 'active');
  const pendingMaintenance = propertyMaintenance.filter((r: any) => r.status !== 'completed' && r.status !== 'cancelled');

  // Paginated data
  const unitTotalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE);
  const paginatedUnits = unitViewMode === 'list' ? filteredUnits.slice((unitPage - 1) * ITEMS_PER_PAGE, unitPage * ITEMS_PER_PAGE) : filteredUnits.slice(0, unitGalleryCount);
  
  const tenantTotalPages = Math.ceil(activeContracts.length / ITEMS_PER_PAGE);
  const paginatedTenants = tenantViewMode === 'list' ? activeContracts.slice((tenantPage - 1) * ITEMS_PER_PAGE, tenantPage * ITEMS_PER_PAGE) : activeContracts.slice(0, tenantGalleryCount);

  const maintenanceTotalPages = Math.ceil(propertyMaintenance.length / ITEMS_PER_PAGE);
  const paginatedMaintenance = propertyMaintenance.slice((maintenancePage - 1) * ITEMS_PER_PAGE, maintenancePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0 rounded-full bg-card/80 backdrop-blur-sm border border-border/40" 
          onClick={() => navigate('/merchant/properties')}
          aria-label="Kembali ke daftar properti"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-display font-bold tracking-tight">{property.name}</h1>
            <Badge variant="outline" className={`rounded-full px-3 ${statusColors[property.status]}`} role="status">
              {statusLabels[property.status] || property.status}
            </Badge>
            {isNew && <Badge className="bg-primary/20 text-primary border-primary/30 rounded-full flex items-center gap-1"><Sparkles className="h-3 w-3" aria-hidden="true" /> Baru</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="rounded-full">{typeLabels[property.property_type] || property.property_type}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />{property.city}, {property.province}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowPhotoDialog(true)} aria-label="Kelola foto properti">
            <Camera className="h-4 w-4" aria-hidden="true" /> Foto
          </Button>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setShowEditDialog(true)} aria-label="Edit informasi properti">
            <Edit className="h-4 w-4" aria-hidden="true" /> Edit Properti
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {property.images && property.images.length > 0 ? (
        <div className="relative" role="region" aria-label="Galeri foto properti">
          <Carousel className="w-full">
            <CarouselContent>
              {property.images.map((img: string, i: number) => (
                <CarouselItem key={i} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="h-64 rounded-2xl overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}>
                    <img src={img} alt={`${property.name} - Foto ke-${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {property.images.length > 1 && (
              <>
                <CarouselPrevious className="-left-3" aria-label="Foto sebelumnya" />
                <CarouselNext className="-right-3" aria-label="Foto selanjutnya" />
              </>
            )}
          </Carousel>
          <Badge variant="secondary" className="absolute top-3 right-3 rounded-full">
            <ImageIcon className="h-3 w-3 mr-1" aria-hidden="true" />{property.images.length} foto
          </Badge>
        </div>
      ) : (
        <div className="h-48 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center" role="img" aria-label="Belum ada foto untuk properti ini">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Belum ada foto</p>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={property.images || []}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt={property.name}
      />

      {/* KPI Strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5" role="region" aria-label="Statistik properti">
        {[
          { icon: DoorOpen, iconColor: 'text-primary', label: 'Unit', value: `${occupiedUnits}/${totalUnits}`, sub: 'terisi / total' },
          { icon: TrendingUp, iconColor: 'text-info', label: 'Hunian', value: `${Math.round(occupancyRate)}%`, bar: true },
          { icon: DollarSign, iconColor: 'text-success', label: 'Pendapatan', value: formatCurrency(revenuePotential), sub: 'dari unit terisi' },
          { icon: Wrench, iconColor: 'text-warning', label: 'Pemeliharaan', value: `${pendingMaintenance.length}`, sub: 'tiket aktif' },
          { icon: FileText, iconColor: 'text-accent-foreground', label: 'Kontrak', value: `${activeContracts.length}`, sub: 'kontrak aktif' },
        ].map((stat, i) => (
          <div key={i} className="glass-stat-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} aria-hidden="true" />{stat.label}
            </div>
            <p className="text-2xl font-bold font-display">{stat.value}</p>
            {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
            {stat.bar && (
              <div className="flex gap-1 mt-1" aria-hidden="true">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${j < Math.round(occupancyRate / 25) ? getOccupancyColor(occupancyRate) : 'bg-muted/60'}`} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Property Dialog */}
      <PropertyFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        property={property as any}
        onSubmit={async (data) => { await editMutation.mutateAsync(data); }}
        isLoading={editMutation.isPending}
        initialStep={editInitialStep}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="pill-tab-list w-full sm:w-auto flex-wrap" aria-label="Navigasi detail properti">
            <TabsTrigger value="overview" className="pill-tab-trigger">Ringkasan</TabsTrigger>
            <TabsTrigger value="units" className="pill-tab-trigger">Unit ({totalUnits})</TabsTrigger>
            <TabsTrigger value="guardians" className="pill-tab-trigger">
              <UserCheck className="h-3.5 w-3.5 mr-1" aria-hidden="true" />Staf
            </TabsTrigger>
            <TabsTrigger value="tenants" className="pill-tab-trigger">Penyewa ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="maintenance" className="pill-tab-trigger">
              Pemeliharaan
              {pendingMaintenance.length > 0 && <Badge variant="secondary" className="ml-1.5 rounded-full text-xs">{pendingMaintenance.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4 animate-fade-in">
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />Alamat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{property.address}</p>
                <p className="text-sm text-muted-foreground">{property.city}, {property.province} {property.postal_code}</p>
              </CardContent>
            </Card>
            {property.description && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Deskripsi</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{property.description}</p></CardContent>
              </Card>
            )}
            {/* Fasilitas Card - Editable */}
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Fasilitas</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1 text-xs h-7" onClick={() => { setEditingAmenities(property.amenities || []); setShowFacilitiesDialog(true); }}>
                    <Settings2 className="h-3.5 w-3.5" /> Edit Fasilitas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a: string) => (
                      <Badge
                        key={a}
                        variant="secondary"
                        className="rounded-full cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => navigate('/merchant/inventory')}
                      >
                        {facilityNameMap[a] || a.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        <ExternalLink className="h-2.5 w-2.5 ml-1 opacity-50" />
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada fasilitas ditambahkan.</p>
                )}
              </CardContent>
            </Card>

            {/* Peraturan Section */}
            {merchant?.id && <RulesSection propertyId={id!} merchantId={merchant.id} />}

          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4 mt-4 animate-fade-in">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter status unit">
                {['all', 'available', 'occupied', 'maintenance', 'reserved'].map(s => (
                  <Button 
                    key={s} 
                    variant={unitFilter === s ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => { setUnitFilter(s); setUnitPage(1); setUnitGalleryCount(ITEMS_PER_PAGE); }} 
                    className={`capitalize rounded-full ${unitFilter === s ? 'gradient-cta text-primary-foreground' : ''}`}
                    aria-label={`Filter unit ${statusLabels[s] || s}`}
                  >
                    {s === 'all' ? `Semua (${units.length})` : `${statusLabels[s] || s} (${units.filter((u: any) => u.status === s).length})`}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowAddUnitDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />Tambah Unit
                </Button>
                <div className="flex items-center bg-muted/60 rounded-lg p-0.5" role="group" aria-label="Mode tampilan unit">
                  <Button 
                    variant={unitViewMode === 'list' ? 'default' : 'ghost'} 
                    size="icon" 
                    className="h-7 w-7 rounded-md" 
                    onClick={() => setUnitViewMode('list')}
                    aria-label="Tampilan daftar"
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button 
                    variant={unitViewMode === 'gallery' ? 'default' : 'ghost'} 
                    size="icon" 
                    className="h-7 w-7 rounded-md" 
                    onClick={() => setUnitViewMode('gallery')}
                    aria-label="Tampilan galeri"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>

            {unitViewMode === 'list' ? (
              <>
                <div className="glass-table">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-muted/80 to-muted/40 border-b-0">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Unit</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Tipe</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Lantai</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Ukuran</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Sewa</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Deposit</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUnits.map((unit: any) => (
                        <TableRow key={unit.id} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => navigate(`/merchant/units/${unit.id}`)}>
                          <TableCell className="font-medium">{unit.unit_number}</TableCell>
                          <TableCell className="capitalize">{unit.unit_type || '—'}</TableCell>
                          <TableCell>{unit.floor ?? '—'}</TableCell>
                          <TableCell>{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</TableCell>
                          <TableCell>{formatCurrency(unit.rent_amount || 0)}</TableCell>
                          <TableCell>{unit.deposit_amount ? formatCurrency(unit.deposit_amount) : '—'}</TableCell>
                          <TableCell><Badge variant="outline" className={`rounded-full ${statusColors[unit.status] || ''}`}>{statusLabels[unit.status] || unit.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {paginatedUnits.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Tidak ada unit ditemukan.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
                {unitTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">Hal {unitPage} dari {unitTotalPages}</p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={unitPage <= 1} onClick={() => setUnitPage(p => p - 1)} aria-label="Halaman sebelumnya">Prev</Button>
                      <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={unitPage >= unitTotalPages} onClick={() => setUnitPage(p => p + 1)} aria-label="Halaman selanjutnya">Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedUnits.map((unit: any) => (
                    <Card key={unit.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => navigate(`/merchant/units/${unit.id}`)}>
                      {unit.photos && unit.photos.length > 0 ? (
                        <div className="h-32 overflow-hidden"><img src={unit.photos[0]} alt={`Unit ${unit.unit_number}`} className="w-full h-full object-cover" loading="lazy" /></div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10 flex items-center justify-center" aria-hidden="true"><Home className="h-8 w-8 text-muted-foreground/30" /></div>
                      )}
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">Unit {unit.unit_number}</p>
                          <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[unit.status] || ''}`}>{statusLabels[unit.status] || unit.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{unit.unit_type} {unit.floor ? `• Lt ${unit.floor}` : ''}</p>
                        <p className="font-semibold text-sm mt-1">{formatCurrency(unit.rent_amount || 0)}/bln</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {unitGalleryCount < filteredUnits.length && (
                  <div ref={unitObserverRef} className="h-10 flex items-center justify-center mt-4">
                    <p className="text-xs text-muted-foreground animate-pulse" role="status">Memuat lebih banyak...</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-4 mt-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{activeContracts.length} penyewa aktif</p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowAddTenantDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />Tambah Penyewa
                </Button>
                <div className="flex items-center bg-muted/60 rounded-lg p-0.5" role="group" aria-label="Mode tampilan penyewa">
                  <Button 
                    variant={tenantViewMode === 'list' ? 'default' : 'ghost'} 
                    size="icon" 
                    className="h-7 w-7 rounded-md" 
                    onClick={() => setTenantViewMode('list')}
                    aria-label="Tampilan daftar"
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button 
                    variant={tenantViewMode === 'gallery' ? 'default' : 'ghost'} 
                    size="icon" 
                    className="h-7 w-7 rounded-md" 
                    onClick={() => setTenantViewMode('gallery')}
                    aria-label="Tampilan galeri"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>

            {activeContracts.length > 0 ? (
              tenantViewMode === 'list' ? (
                <>
                  <div className="space-y-3">
                    {paginatedTenants.map((contract: any) => (
                      <Card key={contract.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer" onClick={() => {
                        const unit = units.find((u: any) => u.id === contract.unit_id);
                        setSelectedTenantForDialog({
                          id: contract.id, status: contract.status, start_date: contract.start_date, end_date: contract.end_date,
                          rent_amount: contract.rent_amount, deposit_amount: null, tenant_user_id: contract.tenant_user_id,
                          unit: unit ? { id: unit.id, unit_number: unit.unit_number, property: { id: property.id, name: property.name } } : null,
                          profile: { full_name: contract.tenant?.full_name || null, email: contract.tenant?.email || null, phone: null },
                        });
                        setShowTenantDialog(true);
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-sm" aria-hidden="true">
                                {(contract.tenant?.full_name || 'T')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{contract.tenant?.full_name || 'Tidak Diketahui'}</p>
                                <p className="text-xs text-muted-foreground">{contract.tenant?.email || '—'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className={`rounded-full text-xs ${statusColors[contract.status] || ''}`}>{statusLabels[contract.status] || contract.status}</Badge>
                              <p className="text-sm font-medium mt-1">{formatCurrency(contract.rent_amount)}/bln</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(contract.start_date), 'dd MMM yyyy')} – {format(new Date(contract.end_date), 'dd MMM yyyy')}
                            </div>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/merchant/contracts/${contract.id}`); }} aria-label={`Lihat kontrak penyewa ${contract.tenant?.full_name}`}>
                              Lihat Kontrak →
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {tenantTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">Hal {tenantPage} dari {tenantTotalPages}</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={tenantPage <= 1} onClick={() => setTenantPage(p => p - 1)} aria-label="Halaman sebelumnya">Prev</Button>
                        <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={tenantPage >= tenantTotalPages} onClick={() => setTenantPage(p => p + 1)} aria-label="Halaman selanjutnya">Next</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedTenants.map((contract: any) => (
                      <Card key={contract.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer" onClick={() => {
                        const unit = units.find((u: any) => u.id === contract.unit_id);
                        setSelectedTenantForDialog({
                          id: contract.id, status: contract.status, start_date: contract.start_date, end_date: contract.end_date,
                          rent_amount: contract.rent_amount, deposit_amount: null, tenant_user_id: contract.tenant_user_id,
                          unit: unit ? { id: unit.id, unit_number: unit.unit_number, property: { id: property.id, name: property.name } } : null,
                          profile: { full_name: contract.tenant?.full_name || null, email: contract.tenant?.email || null, phone: null },
                        });
                        setShowTenantDialog(true);
                      }}>
                        <CardContent className="p-4 text-center">
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-xl mx-auto mb-3" aria-hidden="true">
                            {(contract.tenant?.full_name || 'T')[0].toUpperCase()}
                          </div>
                          <p className="font-medium text-sm">{contract.tenant?.full_name || 'Tidak Diketahui'}</p>
                          <p className="text-xs text-muted-foreground mb-2">{contract.tenant?.email || '—'}</p>
                          <Badge variant="outline" className={`rounded-full text-xs ${statusColors[contract.status] || ''}`}>{statusLabels[contract.status] || contract.status}</Badge>
                          <p className="font-semibold text-sm mt-2">{formatCurrency(contract.rent_amount)}/bln</p>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary mt-1" onClick={(e) => { e.stopPropagation(); navigate(`/merchant/contracts/${contract.id}`); }} aria-label={`Lihat kontrak penyewa ${contract.tenant?.full_name}`}>
                            Lihat Kontrak →
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {tenantGalleryCount < activeContracts.length && (
                    <div ref={tenantObserverRef} className="h-10 flex items-center justify-center mt-4">
                      <p className="text-xs text-muted-foreground animate-pulse" role="status">Memuat lebih banyak...</p>
                    </div>
                  )}
                </>
              )
            ) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3" aria-hidden="true"><Users className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Belum ada penyewa aktif di properti ini.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-3 mt-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{propertyMaintenance.length} permintaan total</p>
              <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowCreateMaintenanceDialog(true)} aria-label="Tambah permintaan pemeliharaan baru">
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />Tambah Pemeliharaan
              </Button>
            </div>
            {paginatedMaintenance.length > 0 ? paginatedMaintenance.map((req: any) => (
              <Card key={req.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 transition-all cursor-pointer" onClick={() => navigate(`/merchant/maintenance/${req.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <div>
                        <span className="font-medium text-sm">{req.title}</span>
                        <p className="text-xs text-muted-foreground">Unit {req.unit_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-xs rounded-full">{req.priority}</Badge>
                      <Badge variant="outline" className="capitalize text-xs rounded-full">{req.status}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(req.created_at), 'dd MMM yyyy')}</p>
                </CardContent>
              </Card>
            )) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3" aria-hidden="true"><Wrench className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Tidak ada permintaan pemeliharaan.</p>
                </CardContent>
              </Card>
            )}
            {maintenanceTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">Hal {maintenancePage} dari {maintenanceTotalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={maintenancePage <= 1} onClick={() => setMaintenancePage(p => p - 1)} aria-label="Halaman sebelumnya">Prev</Button>
                  <Button variant="outline" size="sm" className="h-7 rounded-lg" disabled={maintenancePage >= maintenanceTotalPages} onClick={() => setMaintenancePage(p => p + 1)} aria-label="Halaman selanjutnya">Next</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Guardians Tab */}
          <TabsContent value="guardians" className="mt-4 animate-fade-in">
            <Suspense fallback={<ContentSkeleton />}>
              <LazyGuardians propertyId={id} />
            </Suspense>
          </TabsContent>

        </Tabs>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40" aria-labelledby="property-info-title">
            <CardHeader><CardTitle id="property-info-title" className="text-base">Info Properti</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate font-mono text-xs" aria-label={`ID Properti: ${property.id}`}>{property.id}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dibuat {format(new Date(property.created_at), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Update {format(new Date(property.updated_at), 'dd MMM yyyy')}</span>
              </div>
            </CardContent>
          </section>
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40" aria-labelledby="summary-title">
            <CardHeader><CardTitle id="summary-title" className="text-base">Ringkasan</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Unit</span><span className="font-medium">{totalUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Terisi</span><span className="font-medium text-success">{occupiedUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tersedia</span><span className="font-medium">{units.filter((u: any) => u.status === 'available').length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Perbaikan</span><span className="font-medium text-warning">{maintenanceUnits}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Pendapatan</span><span className="font-medium text-success">{formatCurrency(revenuePotential)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rata-rata Sewa</span><span className="font-medium">{formatCurrency(avgRent)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fasilitas</span><span className="font-medium">{property.amenities?.length || 0}</span></div>
            </CardContent>
          </section>
        </div>
      </div>

      {/* Tenant Details Dialog */}
      <TenantDetailsDialog
        tenant={selectedTenantForDialog}
        open={showTenantDialog}
        onOpenChange={setShowTenantDialog}
      />

      {/* Create Maintenance Dialog */}
      <CreateMaintenanceDialog
        open={showCreateMaintenanceDialog}
        onOpenChange={setShowCreateMaintenanceDialog}
        onSubmit={(payload) => {
          createMaintenanceMutation.mutate(payload, {
            onSuccess: () => {
              setShowCreateMaintenanceDialog(false);
              queryClient.invalidateQueries({ queryKey: ['property-maintenance', id] });
            },
          });
        }}
        loading={createMaintenanceMutation.isPending}
        preselectedPropertyId={id}
      />

      {/* Photo Management Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Foto Properti</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ImageGalleryUpload
              bucket="property-images"
              folder={property.id}
              images={property.images || []}
              onImagesChange={async (newImages) => {
                try {
                  await propertyService.updateProperty(property.id, { images: newImages } as any);
                  queryClient.invalidateQueries({ queryKey: ['property-detail', id] });
                  toast.success('Foto berhasil diperbarui');
                } catch (err) {
                  console.error('Failed to update photos:', err);
                  toast.error('Gagal memperbarui foto');
                }
              }}
              maxImages={10}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <UnitFormDialog
        open={showAddUnitDialog}
        onOpenChange={setShowAddUnitDialog}
        properties={propertiesForTenant as any[]}
        onSubmit={async (data) => {
          await createUnit({ ...data, property_id: id! } as any);
          queryClient.invalidateQueries({ queryKey: ['property-detail', id] });
          setShowAddUnitDialog(false);
        }}
        isLoading={isCreatingUnit}
        preselectedPropertyId={id}
      />

      {/* Add Tenant Dialog */}
      <AddTenantDialog
        open={showAddTenantDialog}
        onOpenChange={setShowAddTenantDialog}
        properties={propertiesForTenant as any[]}
        onSubmit={(data) => addTenantMutation.mutate(data)}
        isLoading={addTenantMutation.isPending}
        preselectedPropertyId={id}
      />

      {/* Edit Facilities Dialog */}
      <Dialog open={showFacilitiesDialog} onOpenChange={setShowFacilitiesDialog}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fasilitas Properti</DialogTitle>
          </DialogHeader>
           <div className="py-4">
            <FacilityTypePicker
              selectedTypeIds={editingAmenities}
              onSelectionChange={setEditingAmenities}
              scope="property"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowFacilitiesDialog(false)}>Batal</Button>
            <Button
              className="rounded-xl gradient-cta text-primary-foreground"
              disabled={saveAmenitiesMutation.isPending}
              onClick={() => saveAmenitiesMutation.mutate(editingAmenities)}
            >
              {saveAmenitiesMutation.isPending ? 'Menyimpan...' : 'Simpan Fasilitas'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
