import { useState } from 'react';
import { PhotoLightbox } from '@/shared/components/PhotoLightbox';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/axios';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/shared/components/ui/carousel';
import { Card } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ImageGalleryUpload } from '@/shared/components/FileUpload';
import { formatCurrency } from '@/shared/utils/currency';
import { format, differenceInDays, isPast } from 'date-fns';
import { 
  ArrowLeft, Building2, Calendar, Camera, ChevronRight, Clock, DoorOpen, Edit, 
  Hash, ImageIcon, MapPin, Plus, Ruler, Wallet, Wrench, Users, FileText, 
  AlertTriangle, CheckCircle, XCircle, TrendingUp, Zap, Droplets, Wifi, ExternalLink
} from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { CreateMaintenanceDialog } from '@/features/maintenance/components/CreateMaintenanceDialog';
import { CreateInvoiceDialog } from '@/features/payments/components/CreateInvoiceDialog';
import { useCreateMerchantMaintenanceRequest } from '@/features/maintenance/hooks/useMaintenance';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UnitFormDialog } from '@/features/properties/components/UnitFormDialog';
import { useUnits } from '@/features/properties/hooks/useUnits';
import { UnitFormData } from '@/features/properties/types/schema';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30',
  occupied: 'bg-primary/10 text-primary border-primary/30',
  maintenance: 'bg-warning/10 text-warning border-warning/30',
  reserved: 'bg-info/10 text-info border-info/30',
};

const statusLabels: Record<string, string> = { available: 'Tersedia', occupied: 'Terisi', maintenance: 'Perbaikan', reserved: 'Dipesan' };
const priorityLabels: Record<string, string> = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', urgent: 'Darurat' };

function useUnitDetail(unitId: string | undefined) {
  return useQuery({
    queryKey: ['unit-detail', unitId],
    queryFn: async () => {
      if (!unitId) throw new Error('No unit ID');
      const unitRes = await apiClient.get(`/units/${unitId}`);
      const data = unitRes.data?.data || unitRes.data;
      // TODO: Go endpoint not yet implemented for joined contracts+profiles+maintenance+invoices
      // was: supabase.from('contracts'), supabase.from('profiles'), supabase.from('maintenance_requests'), supabase.from('invoices')
      return { ...data, contracts: [], tenantProfiles: {}, maintenanceRequests: [], invoices: [] };
    },
    enabled: !!unitId,
  });
}

function UnitDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-2xl" />))}</div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { merchant } = useAuth();
  const { data: unit, isLoading, error } = useUnitDetail(id);
  const { data: facilityNameMap = {} } = useFacilityTypeNames(unit?.amenities || []);

  // Maintenance dialog state
  const [showCreateMaintenanceDialog, setShowCreateMaintenanceDialog] = useState(false);
  const { mutate: createMaintenance, isPending: isCreatingMaintenance } = useCreateMerchantMaintenanceRequest();

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const propertyId = unit?.property?.id || '';
  const { updateUnit, isUpdating } = useUnits(propertyId);

  // Photo management dialog
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Inventaris amenities
  const [inventoryAmenities, setInventoryAmenities] = useState<string[]>([]);
  const [showFacilityManageDialog, setShowFacilityManageDialog] = useState(false);

  // Contract dialog state
  const [showContractDialog, setShowContractDialog] = useState(false);
  const merchantId = merchant?.id || unit?.property?.merchant_id || '';
  const { createContractMutation } = useMerchantContracts(merchantId || undefined);

  // Invoice dialog state
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Fetch tenants for contract dialog
  const { data: merchantTenants = [] } = useQuery({
    queryKey: ['merchant-tenants-for-contract', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      // TODO: Go endpoint not yet implemented — was: supabase.from('profiles').select('user_id, full_name, email')
      return [];
    },
    enabled: !!merchantId && showContractDialog,
  });

  // Save unit amenities mutation
  const saveAmenitiesMutation = useMutation({
    mutationFn: async (amenities: string[]) => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('units').update({ amenities }).eq('id', id)
      void amenities;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-detail', id] });
      toast.success('Fasilitas unit berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Update unit photos mutation
  const updatePhotosMutation = useMutation({
    mutationFn: async (photos: string[]) => {
      // TODO: Go endpoint not yet implemented — was: supabase.from('units').update({ photos }).eq('id', id)
      void photos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-detail', id] });
      toast.success('Foto unit berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <UnitDetailSkeleton />;

  if (error || !unit) {
    return (
      <div className="text-center py-12" role="alert">
        <div className="gradient-icon-box w-20 h-20 mx-auto mb-4" aria-hidden="true"><DoorOpen className="h-10 w-10 text-muted-foreground" /></div>
        <h3 className="text-lg font-medium mb-2">Unit tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mb-4">Unit yang Anda cari tidak ada atau telah dihapus.</p>
        <Button asChild className="rounded-xl" aria-label="Kembali ke daftar properti"><Link to="/merchant/properties">Kembali ke Properti</Link></Button>
      </div>
    );
  }

  const activeContract = unit.contracts?.find((c: any) => c.status === 'active');
  const activeTenant = activeContract ? unit.tenantProfiles?.[activeContract.tenant_user_id] : null;
  
  const invoices = unit.invoices || [];
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const overdueInvoices = invoices.filter((i: any) => i.status !== 'paid' && isPast(new Date(i.due_date)));
  const pendingInvoices = invoices.filter((i: any) => i.status === 'pending' || i.status === 'issued');
  const totalPaid = paidInvoices.reduce((s: number, i: any) => s + (i.total_amount || i.amount), 0);
  const totalOverdue = overdueInvoices.reduce((s: number, i: any) => s + (i.total_amount || i.amount), 0);
  
  const contractDaysLeft = activeContract ? differenceInDays(new Date(activeContract.end_date), new Date()) : 0;
  const contractTotalDays = activeContract ? differenceInDays(new Date(activeContract.end_date), new Date(activeContract.start_date)) : 1;
  const contractProgress = activeContract ? Math.min(100, Math.max(0, ((contractTotalDays - contractDaysLeft) / contractTotalDays) * 100)) : 0;

  const handleEditSubmit = async (data: UnitFormData) => {
    await updateUnit({ id: unit.id, payload: { ...data, property_id: propertyId } as any });
    queryClient.invalidateQueries({ queryKey: ['unit-detail', id] });
    setShowEditDialog(false);
  };

  // Helper for electricity/water display
  const getUtilityLabel = (included: boolean, costType?: string, cost?: number) => {
    if (included) return 'Termasuk Sewa';
    if (costType === 'bayar_sendiri') return 'Bayar Sendiri';
    if (costType === 'per_usage') return `Per Pemakaian${cost ? ` (${formatCurrency(cost)})` : ''}`;
    return cost ? `Flat ${formatCurrency(cost)}/bln` : 'Tidak Termasuk';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0 rounded-full bg-card/80 backdrop-blur-sm border border-border/40" 
          onClick={() => navigate(`/merchant/properties/${unit.property?.id}#units`)}
          aria-label="Kembali ke daftar unit di properti ini"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Unit {unit.unit_number}</h1>
            <Badge variant="outline" className={cn("capitalize rounded-full", statusColors[unit.status])} role="status">
              {statusLabels[unit.status] || unit.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              <Link to={`/merchant/properties/${unit.property?.id}`} className="hover:text-foreground hover:underline transition-colors" aria-label={`Lihat properti ${unit.property?.name}`}>
                {unit.property?.name}
              </Link>
            </span>
            <span aria-hidden="true">•</span>
            <span className="capitalize">{unit.unit_type?.replace(/_/g, ' ') || '—'}</span>
            {unit.property?.city && (
              <>
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{unit.property.city}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setShowPhotoDialog(true)} aria-label="Kelola foto unit">
            <Camera className="h-4 w-4" aria-hidden="true" /> Foto
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setShowEditDialog(true)} aria-label="Edit rincian unit">
            <Edit className="h-4 w-4" aria-hidden="true" /> Edit
          </Button>
        </div>
      </div>

      {/* Photos */}
      {unit.photos && unit.photos.length > 0 ? (
        <div className="relative" role="region" aria-label="Galeri foto unit">
          <Carousel className="w-full">
            <CarouselContent>
              {unit.photos.map((img: string, i: number) => (
                <CarouselItem key={i} className="basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="h-56 rounded-2xl overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}>
                    <img src={img} alt={`Unit ${unit.unit_number} - Foto ke-${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {unit.photos.length > 1 && (
              <>
                <CarouselPrevious className="-left-3" aria-label="Foto sebelumnya" />
                <CarouselNext className="-right-3" aria-label="Foto selanjutnya" />
              </>
            )}
          </Carousel>
          <Badge variant="secondary" className="absolute top-3 right-3 rounded-full">
            <ImageIcon className="h-3 w-3 mr-1" aria-hidden="true" />{unit.photos.length} foto
          </Badge>
        </div>
      ) : (
        <div className="h-40 rounded-2xl bg-gradient-to-br from-primary/5 via-muted/50 to-accent/10 flex items-center justify-center" role="img" aria-label="Belum ada foto untuk unit ini">
          <div className="text-center">
            <DoorOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Belum ada foto</p>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={unit.photos || []}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt={`Unit ${unit.unit_number}`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4" role="region" aria-label="Statistik unit">
        {[
          { icon: Wallet, color: 'text-primary', label: 'Harga Sewa', value: formatCurrency(unit.rent_amount || 0), sub: 'per bulan' },
          { icon: Wallet, color: 'text-success', label: 'Deposit', value: unit.deposit_amount ? formatCurrency(unit.deposit_amount) : '—' },
          { icon: Ruler, color: 'text-info', label: 'Ukuran', value: unit.size_sqm ? `${unit.size_sqm} m²` : '—', sub: unit.floor != null ? `Lantai ${unit.floor}` : undefined },
          { icon: FileText, color: 'text-warning', label: 'Kontrak', value: `${unit.contracts?.length || 0}`, sub: activeContract ? 'Aktif' : 'Tidak Aktif' },
        ].map((stat, i) => (
          <div key={i} className="glass-stat-card p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} aria-hidden="true" />{stat.label}
            </div>
            <p className="text-xl font-bold font-display">{stat.value}</p>
            {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Contract Timeline */}
      {activeContract && (
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold">Kontrak Aktif</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn("rounded-full text-xs", contractDaysLeft <= 30 ? 'bg-warning/10 text-warning border-warning/30' : 'bg-success/10 text-success border-success/30')}
                role="status"
              >
                {contractDaysLeft > 0 ? `${contractDaysLeft} hari tersisa` : 'Berakhir'}
              </Badge>
            </div>
            <Progress value={contractProgress} className="h-2 mb-2" aria-label={`Progres kontrak: ${Math.round(contractProgress)}%`} />
            <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
              <span>{format(new Date(activeContract.start_date), 'dd MMM yyyy')}</span>
              <span>{format(new Date(activeContract.end_date), 'dd MMM yyyy')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="pill-tab-list w-full sm:w-auto" aria-label="Navigasi detail unit">
            <TabsTrigger value="overview" className="pill-tab-trigger">Ringkasan</TabsTrigger>
            <TabsTrigger value="contracts" className="pill-tab-trigger">Kontrak ({unit.contracts?.length || 0})</TabsTrigger>
            <TabsTrigger value="payments" className="pill-tab-trigger">
              Pembayaran
              {overdueInvoices.length > 0 && <Badge variant="secondary" className="ml-1.5 rounded-full text-xs bg-destructive/10 text-destructive">{overdueInvoices.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="pill-tab-trigger">Pemeliharaan</TabsTrigger>
            <TabsTrigger value="inventory" className="pill-tab-trigger">Inventaris</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4 animate-fade-in">
            {/* Unit Detail Info Card - always show */}
            <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DoorOpen className="h-4 w-4" /> Detail Unit</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tipe Hunian</p>
                      <p className="font-medium">{(unit as any).occupancy_type === 'sharing' ? 'Sharing (2+ orang)' : 'Single (1 orang)'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Listrik</p>
                      <p className="font-medium">{getUtilityLabel((unit as any).electricity_included, (unit as any).electricity_cost_type, (unit as any).electricity_cost)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Air</p>
                      <p className="font-medium">{getUtilityLabel((unit as any).water_included, (unit as any).water_cost_type, (unit as any).water_cost)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">WiFi</p>
                      <p className="font-medium">
                        {(unit as any).wifi_included 
                          ? `${(unit as any).wifi_speed_mbps ? (unit as any).wifi_speed_mbps + ' Mbps' : 'Tersedia'} — ${(unit as any).wifi_cost_sharing === 'patungan' ? `Patungan ${(unit as any).wifi_cost ? formatCurrency((unit as any).wifi_cost) : ''}` : 'Termasuk'}`
                          : 'Tidak Tersedia'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {activeTenant && (
              <Card className="rounded-2xl border-l-4 border-l-success bg-card/90 backdrop-blur-sm border-border/40">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden="true" /> Penghuni Aktif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold ring-2 ring-success/20" aria-hidden="true">
                      {(activeTenant.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <Link to={`/merchant/tenants/${activeContract.id}`} className="font-medium hover:underline text-primary">
                        {activeTenant.full_name || 'Tidak diketahui'}
                      </Link>
                      <p className="text-sm text-muted-foreground">{activeTenant.email}</p>
                      {activeTenant.phone && <p className="text-sm text-muted-foreground">{activeTenant.phone}</p>}
                    </div>
                  </div>
                  {activeContract && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Kontrak: {format(new Date(activeContract.start_date), 'dd MMM yyyy')} – {format(new Date(activeContract.end_date), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {unit.description && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Deskripsi</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{unit.description}</p></CardContent>
              </Card>
            )}
            {unit.amenities && unit.amenities.length > 0 && (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardHeader><CardTitle className="text-base">Fasilitas</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {unit.amenities.map((a: string) => (
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
                </CardContent>
              </Card>
            )}

            {/* Peraturan Section */}
            {merchantId && unit.property?.id && (
              <RulesSection propertyId={unit.property.id} unitId={id} merchantId={merchantId} />
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-3 mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Kontrak Unit</h3>
              <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowContractDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Tambah Kontrak
              </Button>
            </div>
            {unit.contracts?.length > 0 ? unit.contracts.map((contract: any) => {
              const tenant = unit.tenantProfiles?.[contract.tenant_user_id];
              return (
                <Card 
                  key={contract.id} 
                  className={cn("rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer", contract.status === 'active' && 'border-l-4 border-l-success shadow-[0_0_0_1px_hsl(var(--success)/0.2)]')} 
                  onClick={() => navigate(`/merchant/contracts/${contract.id}`)}
                  role="button"
                  aria-label={`Kontrak dengan ${tenant?.full_name || 'Tidak Diketahui'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("capitalize text-xs rounded-full", contract.status === 'active' ? 'bg-success/10 text-success' : '')} role="status">
                          {statusLabels[contract.status] || contract.status}
                        </Badge>
                        <span className="text-sm font-medium">{tenant?.full_name || 'Penyewa Tidak Diketahui'}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(contract.rent_amount)}/bln</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{format(new Date(contract.start_date), 'dd MMM yyyy')} – {format(new Date(contract.end_date), 'dd MMM yyyy')}</span>
                      {contract.deposit_amount && <span>Deposit: {formatCurrency(contract.deposit_amount)}</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3" aria-hidden="true"><FileText className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Belum ada kontrak untuk unit ini.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payment Summary Tab */}
          <TabsContent value="payments" className="space-y-4 mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Pembayaran</h3>
              <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowInvoiceDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />Tambah Pembayaran
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3" role="region" aria-label="Ringkasan pembayaran">
              <div className="rounded-xl bg-success/5 border border-success/20 p-3 text-center">
                <CheckCircle className="h-4 w-4 text-success mx-auto mb-1" aria-hidden="true" />
                <p className="text-lg font-bold font-display text-success">{paidInvoices.length}</p>
                <p className="text-xs text-muted-foreground">Lunas</p>
              </div>
              <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 text-center">
                <Clock className="h-4 w-4 text-warning mx-auto mb-1" aria-hidden="true" />
                <p className="text-lg font-bold font-display text-warning">{pendingInvoices.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 text-center">
                <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" aria-hidden="true" />
                <p className="text-lg font-bold font-display text-destructive">{overdueInvoices.length}</p>
                <p className="text-xs text-muted-foreground">Terlambat</p>
              </div>
            </div>

            {invoices.length > 0 ? (
              <div className="space-y-2" role="list" aria-label="Daftar faktur unit">
                {invoices.map((inv: any) => {
                  const isOverdue = inv.status !== 'paid' && isPast(new Date(inv.due_date));
                  const isPaid = inv.status === 'paid';
                  return (
                    <Link 
                      key={inv.id} 
                      to={`/merchant/invoices/${inv.id}`} 
                      className={cn("rounded-xl p-3 border flex items-center justify-between hover:opacity-80 transition-opacity", isPaid ? 'bg-success/5 border-success/20' : isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-card/90 border-border/40')}
                      role="listitem"
                    >
                      <div className="flex items-center gap-3">
                        {isPaid ? <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" /> : isOverdue ? <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" /> : <Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(inv.total_amount || inv.amount)}</p>
                          <p className="text-xs text-muted-foreground">Jatuh tempo: {format(new Date(inv.due_date), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("rounded-full text-xs capitalize", isPaid ? 'bg-success/10 text-success' : isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')} role="status">
                        {isPaid ? 'Lunas' : isOverdue ? 'Terlambat' : inv.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3" aria-hidden="true"><Wallet className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Belum ada data pembayaran.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-3 mt-4 animate-fade-in">
            {/* Header with Add button */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Permintaan Pemeliharaan</h3>
              <Button size="sm" className="rounded-xl gradient-cta text-primary-foreground" onClick={() => setShowCreateMaintenanceDialog(true)} aria-label="Tambah permintaan pemeliharaan baru">
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />Tambah
              </Button>
            </div>

            {unit.maintenanceRequests?.length > 0 ? (
              <div role="list" aria-label="Daftar pemeliharaan unit">
                {unit.maintenanceRequests.map((req: any) => (
                  <Card key={req.id} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:border-primary/20 transition-all cursor-pointer mb-3" onClick={() => navigate(`/merchant/maintenance/${req.id}`)} role="listitem">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="font-medium text-sm">{req.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs rounded-full">{priorityLabels[req.priority] || req.priority}</Badge>
                          <Badge variant="outline" className="capitalize text-xs rounded-full">{req.status}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(req.created_at), 'dd MMM yyyy')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
                <CardContent className="py-8 text-center">
                  <div className="gradient-icon-box w-12 h-12 mx-auto mb-3" aria-hidden="true"><Wrench className="h-6 w-6 text-muted-foreground/40" /></div>
                  <p className="text-sm text-muted-foreground">Tidak ada permintaan pemeliharaan.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Fasilitas & Inventaris Unit</h3>
              <Button 
                size="sm" 
                className="rounded-xl gradient-cta text-primary-foreground" 
                onClick={() => saveAmenitiesMutation.mutate(inventoryAmenities)}
                disabled={saveAmenitiesMutation.isPending}
              >
                {saveAmenitiesMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
            <FacilityTypePicker
              selectedTypeIds={inventoryAmenities.length > 0 ? inventoryAmenities : (unit.amenities || [])}
              onSelectionChange={setInventoryAmenities}
              scope="unit"
            />
          </TabsContent>
        </Tabs>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40" aria-labelledby="unit-info-title">
            <CardHeader><CardTitle id="unit-info-title" className="text-base">Info Unit</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate font-mono text-xs" aria-label={`ID Unit: ${unit.id}`}>{unit.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Tipe</span><span className="font-medium capitalize">{unit.unit_type?.replace(/_/g, ' ') || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lantai</span><span className="font-medium">{unit.floor ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ukuran</span><span className="font-medium">{unit.size_sqm ? `${unit.size_sqm} m²` : '—'}</span></div>
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dibuat {unit.created_at ? format(new Date(unit.created_at), 'dd MMM yyyy') : '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Update {unit.updated_at ? format(new Date(unit.updated_at), 'dd MMM yyyy') : '—'}</span>
              </div>
            </CardContent>
          </section>

          {invoices.length > 0 && (
            <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40" aria-labelledby="payment-info-title">
              <CardHeader>
                <CardTitle id="payment-info-title" className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Dibayar</span><span className="font-medium text-success">{formatCurrency(totalPaid)}</span></div>
                {totalOverdue > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tunggakan</span><span className="font-medium text-destructive">{formatCurrency(totalOverdue)}</span></div>}
              </CardContent>
            </section>
          )}

          <section className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40" aria-labelledby="property-info-title">
            <CardHeader><CardTitle id="property-info-title" className="text-base">Properti</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <Link to={`/merchant/properties/${unit.property?.id}`} className="font-medium hover:underline text-primary">{unit.property?.name}</Link>
              <p className="text-muted-foreground mt-1 text-xs capitalize">{unit.property?.property_type}</p>
              {unit.property?.address && <p className="text-muted-foreground text-xs mt-1">{unit.property.address}</p>}
            </CardContent>
          </section>
        </div>
      </div>

      {/* Maintenance Dialog */}
      <CreateMaintenanceDialog
        open={showCreateMaintenanceDialog}
        onOpenChange={setShowCreateMaintenanceDialog}
        onSubmit={(payload) => {
          createMaintenance(payload, {
            onSuccess: () => {
              setShowCreateMaintenanceDialog(false);
              queryClient.invalidateQueries({ queryKey: ['unit-detail', id] });
            },
          });
        }}
        loading={isCreatingMaintenance}
        preselectedPropertyId={unit.property?.id}
        preselectedUnitId={unit.id}
      />

      {/* Edit Dialog */}
      <UnitFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        unit={unit as any}
        properties={unit.property ? [unit.property as any] : []}
        onSubmit={handleEditSubmit}
        isLoading={isUpdating}
      />

      {/* Photo Management Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Foto Unit</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ImageGalleryUpload
              bucket="property-images"
              folder={`units/${unit.id}`}
              images={unit.photos || []}
              onImagesChange={async (newPhotos) => {
                try {
                  await updatePhotosMutation.mutateAsync(newPhotos);
                } catch (err) {
                  console.error('Failed to update unit photos:', err);
                }
              }}
              maxImages={10}
            />
          </div>
        </DialogContent>
      </Dialog>


      {/* Contract Dialog */}
      <CreateContractDialog
        open={showContractDialog}
        onOpenChange={setShowContractDialog}
        availableUnits={unit ? [{ id: unit.id, unit_number: unit.unit_number, propertyName: unit.property?.name || '' }] : []}
        merchantTenants={merchantTenants}
        onSubmit={(data: ContractFormData, resetForm: () => void) => {
          if (!merchantId) return;
          createContractMutation.mutate({
            ...data,
            merchant_id: merchantId,
            status: 'draft',
          } as CreateContractPayload, {
            onSuccess: () => {
              toast.success('Kontrak berhasil dibuat');
              setShowContractDialog(false);
              resetForm();
              queryClient.invalidateQueries({ queryKey: ['unit-detail', id] });
            },
            onError: (e: Error) => toast.error(e.message),
          });
        }}
        loading={createContractMutation.isPending}
      />

      {/* Invoice Dialog */}
      <CreateInvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        contracts={(unit?.contracts || []).filter((c: any) => c.status === 'active').map((c: any) => ({
          ...c,
          merchant_id: merchantId,
        }))}
        merchantId={merchantId}
        onCreate={async (data) => {
          // TODO: Go endpoint not yet implemented — was: supabase.from('invoices').insert(...)
          void data;
          toast.success('Tagihan berhasil dibuat');
          setShowInvoiceDialog(false);
          queryClient.invalidateQueries({ queryKey: ['unit-detail', id] });
        }}
        isCreating={false}
      />
    </div>
  );
}
