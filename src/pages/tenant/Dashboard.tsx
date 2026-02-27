import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTenantActiveContract } from '@/features/contracts/hooks/useTenantContract';
import { useTenantActiveMaintenanceRequests } from '@/features/maintenance/hooks/useMaintenance';
import { useTenantInvoices } from '@/features/payments/hooks/useTenantInvoices';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/utils';
import { format, isPast, parseISO } from 'date-fns';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  RefreshCw,
  Store,
  Wrench
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

// Banner slides data
const bannerSlides = [
  {
    id: 1,
    title: "Promo Akhir Tahun",
    subtitle: "Diskon 20% untuk layanan cleaning",
    bgColor: "bg-gradient-to-r from-primary to-primary/80",
  },
  {
    id: 2,
    title: "Bayar Tepat Waktu",
    subtitle: "Dapatkan reward poin setiap pembayaran",
    bgColor: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  },
];

// Quick action items for homepage - 4 column grid (excludes items in bottom nav)
const quickActions = [
  { path: "/tenant/maintenance", icon: Wrench, label: "Lapor", color: "bg-orange-500/10 text-orange-600" },
  { path: "/tenant/invoices", icon: FileText, label: "Tagihan", color: "bg-purple-500/10 text-purple-600" },
  { path: "/tenant/contracts", icon: ClipboardList, label: "Kontrak", color: "bg-blue-500/10 text-blue-600" },
  { path: "/tenant/marketplace", icon: Store, label: "Market", color: "bg-emerald-500/10 text-emerald-600" },
];

export default function TenantDashboard() {
  const { user, profile, role, isLoading: authLoading } = useAuth();

  // Tenant role verification
  const isTenant = role === 'tenant';
  useAnalytics();
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  // Query active contract for current unit info
  const { 
    data: activeContract, 
    isLoading: contractLoading, 
    error: contractError 
  } = useTenantActiveContract(user?.id);

  // Fetch invoices instead of payments for accurate status
  const { 
    data: invoices = [], 
    isLoading: invoicesLoading, 
    error: invoicesError, 
    refetch: refetchInvoices 
  } = useTenantInvoices(user?.id, 5);

  const { 
    data: maintenanceRequests = [], 
    isLoading: maintenanceLoading, 
    error: maintenanceError, 
    refetch: refetchMaintenance 
  } = useTenantActiveMaintenanceRequests(user?.id, 5);

  // Memoized calculations
  const pendingInvoices = useMemo(() => invoices.filter(i => ['pending', 'sent'].includes(i.status)), [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter(i => i.status === 'overdue' || (isPast(parseISO(i.due_date)) && i.status !== 'paid')), [invoices]);
  const activeMaintenanceRequests = useMemo(() => maintenanceRequests.filter(r => ['pending', 'in_progress', 'assigned'].includes(r.status)), [maintenanceRequests]);

  const handleRefresh = useCallback(() => {
    refetchInvoices();
    refetchMaintenance();
  }, [refetchInvoices, refetchMaintenance]);

  const isLoading = contractLoading || invoicesLoading || maintenanceLoading;
  const hasError = contractError || invoicesError || maintenanceError;

  // Role verification - redirect if not tenant
  if (!authLoading && user && !isTenant) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <TenantLayout 
      title={`Halo, ${profile?.full_name || 'Tenant'}`}
      showBack={false}
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Gagal memuat data. Silakan coba lagi.</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Unit Info */}
        {activeContract?.unit && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {activeContract.unit.property?.name} - Unit {activeContract.unit.unit_number}
                  </p>
                  <p className="text-xs text-muted-foreground">{activeContract.unit.property?.address}</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">Aktif</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banner Carousel */}
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex">
            {bannerSlides.map((slide) => (
              <div key={slide.id} className="flex-[0_0_100%] min-w-0">
                <div className={cn(
                  "relative h-32 md:h-40 rounded-xl flex flex-col justify-center px-5 md:px-6",
                  slide.bgColor
                )}>
                  <h3 className="text-white font-bold text-lg md:text-xl">{slide.title}</h3>
                  <p className="text-white/90 text-sm md:text-base mt-1">{slide.subtitle}</p>
                  
                  {/* Bullet indicators inside */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {bannerSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          selectedIndex === index 
                            ? "bg-white w-4" 
                            : "bg-white/50 hover:bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - 4 Column Grid */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link 
              key={action.path} 
              to={action.path}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${action.color} transition-transform group-hover:scale-105`}>
                <action.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-[11px] md:text-xs font-medium text-muted-foreground text-center">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/tenant/maintenance">
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary h-full">
              <CardContent className="p-4">
                {maintenanceLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{activeMaintenanceRequests.length}</p>
                      <p className="text-xs text-muted-foreground">Laporan Aktif</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
          <Link to="/tenant/invoices">
            <Card className={cn(
              "hover:shadow-md transition-shadow border-l-4 h-full",
              overdueInvoices.length > 0 ? "border-l-destructive" : "border-l-warning"
            )}>
              <CardContent className="p-4">
                {invoicesLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{pendingInvoices.length + overdueInvoices.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {overdueInvoices.length > 0 ? (
                          <span className="text-destructive font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {overdueInvoices.length} Overdue
                          </span>
                        ) : 'Tagihan Pending'}
                      </p>
                    </div>
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      overdueInvoices.length > 0 ? "bg-destructive/10" : "bg-warning/10"
                    )}>
                      <DollarSign className={cn(
                        "h-5 w-5",
                        overdueInvoices.length > 0 ? "text-destructive" : "text-warning"
                      )} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Lease Renewal / Move-Out Reminder */}
        {activeContract?.end_date && (() => {
          const daysLeft = differenceInDays(new Date(activeContract.end_date), new Date());
          if (daysLeft > 60) return null;
          const isCritical = daysLeft <= 30;
          return (
            <Card className={`border-l-4 ${isCritical ? 'border-l-destructive bg-destructive/5' : 'border-l-warning bg-warning/5'}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className={`h-5 w-5 ${isCritical ? 'text-destructive' : 'text-warning'}`} />
                  <span className="font-semibold text-sm">
                    {isCritical ? '⚠️ Kontrak Segera Berakhir!' : 'Pengingat Kontrak'}
                  </span>
                  <Badge variant={isCritical ? 'destructive' : 'secondary'} className="text-[10px] rounded-full ml-auto">
                    {daysLeft <= 0 ? 'Sudah berakhir' : `${daysLeft} hari lagi`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Kontrak Anda berakhir pada <strong>{format(new Date(activeContract.end_date), 'dd MMMM yyyy')}</strong>.
                  {isCritical ? ' Segera hubungi pengelola untuk perpanjangan atau persiapan move-out.' : ' Pertimbangkan untuk memulai proses perpanjangan.'}
                </p>
                {isCritical && (
                  <div className="bg-background/80 rounded-lg p-3 space-y-1.5 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground text-sm">📋 Checklist Move-Out:</p>
                    <p>☐ Hubungi pengelola tentang perpanjangan/move-out</p>
                    <p>☐ Periksa kondisi unit dan dokumentasi</p>
                    <p>☐ Lunasi semua tagihan tertunggak</p>
                    <p>☐ Kembalikan kunci dan akses card</p>
                    <p>☐ Atur jadwal inspeksi akhir</p>
                  </div>
                )}
                <Link to="/tenant/contracts" className="text-xs text-primary font-medium hover:underline">
                  Lihat Detail Kontrak →
                </Link>
              </CardContent>
            </Card>
          );
        })()}

        {/* Overdue Alert */}
        {overdueInvoices.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Anda memiliki <strong>{overdueInvoices.length}</strong> tagihan yang sudah jatuh tempo. 
              <Link to="/tenant/invoices" className="underline ml-1 font-medium">
                Bayar sekarang
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Tagihan Terbaru</CardTitle>
            <Link to="/tenant/invoices" className="text-xs text-primary flex items-center gap-1 font-medium">
              Lihat Semua <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {invoicesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">Belum ada tagihan</p>
                <p className="text-xs text-muted-foreground mt-1">Tagihan akan muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.slice(0, 3).map((invoice) => {
                  const isOverdue = invoice.status === 'overdue' || isPast(parseISO(invoice.due_date));
                  return (
                    <Link 
                      key={invoice.id}
                      to="/tenant/invoices"
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors block",
                        isOverdue ? "bg-destructive/5 border border-destructive/20" : "bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center",
                          isOverdue ? "bg-destructive/10" : "bg-background"
                        )}>
                          {isOverdue ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            Jatuh Tempo: {format(parseISO(invoice.due_date), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          Rp {Number(invoice.total_amount).toLocaleString('id-ID')}
                        </p>
                        <Badge 
                          variant={isOverdue ? 'destructive' : 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {isOverdue ? 'Terlambat' : invoice.status === 'sent' ? 'Terkirim' : 'Menunggu'}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Laporan Maintenance</CardTitle>
            <Link to="/tenant/maintenance" className="text-xs text-primary flex items-center gap-1 font-medium">
              Buat Laporan <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {maintenanceLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : maintenanceRequests.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">Belum ada laporan</p>
                <Link to="/tenant/maintenance" className="text-xs text-primary hover:underline mt-1 block">
                  Buat laporan baru
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {maintenanceRequests.slice(0, 3).map((request) => (
                  <Link 
                    key={request.id} 
                    to={`/tenant/maintenance/${request.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{request.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {request.category}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      request.status === 'completed' ? 'default' : 'outline'
                    } className="text-[10px] px-1.5 py-0 shrink-0">
                      {request.status === 'completed' ? 'Selesai' : 'Pending'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
