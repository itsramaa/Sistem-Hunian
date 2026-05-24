import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { differenceInDays, format } from "date-fns";
import { Home, AlertTriangle, TrendingDown, DollarSign, RefreshCw, Eye, ListPlus, BarChart } from "lucide-react";
import { toast } from "sonner";
import { RelistUnitDialog } from "@/features/properties/components/RelistUnitDialog";

import { id } from "date-fns/locale";

export function VacancyDashboard() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [relistDialogOpen, setRelistDialogOpen] = useState(false);

  // Fetch vacant units
  const { data: vacantUnits, isLoading } = useQuery({
    queryKey: ["vacant-units", merchant?.id],
    queryFn: async () => {
      // TODO: Migrate to Go endpoint — GET /v1/units?status=vacant&merchant_id=:id
      const response = await apiClient.get('/v1/units', {
        params: { merchant_id: merchant?.id, status: 'vacant', sort: 'vacant_since:asc', include: 'property' },
      });
      return response.data.data as any[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch active listings
  const { data: activeListings } = useQuery({
    queryKey: ["active-listings", merchant?.id],
    queryFn: async () => {
      // TODO: Migrate to Go endpoint — GET /v1/unit-listings?status=active&merchant_id=:id
      const response = await apiClient.get('/v1/unit-listings', {
        params: { merchant_id: merchant?.id, status: 'active' },
      });
      return response.data.data as any[];
    },
    enabled: !!merchant?.id,
  });

  const getListingForUnit = (unitId: string) => {
    return activeListings?.find((l) => l.unit_id === unitId);
  };

  // Calculate stats
  const totalVacant = vacantUnits?.length || 0;
  const longVacancies = vacantUnits?.filter((u) => {
    const days = u.vacant_since ? differenceInDays(new Date(), new Date(u.vacant_since)) : 0;
    return days >= 30;
  }).length || 0;
  
  const totalLostRevenue = vacantUnits?.reduce((sum, unit) => {
    const days = unit.vacant_since ? differenceInDays(new Date(), new Date(unit.vacant_since)) : 0;
    const dailyRent = (unit.rent_amount || 0) / 30;
    return sum + (days * dailyRent);
  }, 0) || 0;

  const listedCount = vacantUnits?.filter((u) => u.is_listed).length || 0;
  const listingRate = totalVacant > 0 ? (listedCount / totalVacant) * 100 : 0;

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-2xl" role="status" aria-label="Memuat dashboard unit kosong" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Home, color: 'text-primary', bg: 'from-primary/20 to-primary/5', label: 'Unit Kosong', value: String(totalVacant) },
          { icon: AlertTriangle, color: 'text-warning', bg: 'from-warning/20 to-warning/5', label: 'Kosong > 30 Hari', value: String(longVacancies) },
          { icon: TrendingDown, color: 'text-destructive', bg: 'from-destructive/20 to-destructive/5', label: 'Potensi Pendapatan Hilang', value: `Rp ${(totalLostRevenue / 1000000).toFixed(1)}jt` },
          { icon: ListPlus, color: 'text-success', bg: 'from-success/20 to-success/5', label: 'Terdaftar', value: `${listedCount}/${totalVacant}` },
        ].map((item, i) => (
          <Card key={i} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${item.bg}`} aria-hidden="true">
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Listing Progress */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Cakupan Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={listingRate} className="h-3 rounded-full" aria-label={`Cakupan listing: ${listingRate.toFixed(0)}%`} />
          <p className="text-sm text-muted-foreground mt-2">
            {listedCount} dari {totalVacant} unit kosong telah terdaftar secara aktif ({listingRate.toFixed(0)}%)
          </p>
        </CardContent>
      </Card>

      {/* Vacant Units List */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Unit Kosong</CardTitle>
          <CardDescription>Kelola properti kosong Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {totalVacant === 0 ? (
            <div className="py-8 text-center" role="status">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-lg font-medium mb-2">Tidak Ada Unit Kosong</h3>
              <p className="text-muted-foreground">Semua unit Anda saat ini telah terisi!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vacantUnits?.map((unit) => {
                const daysVacant = unit.vacant_since 
                  ? differenceInDays(new Date(), new Date(unit.vacant_since)) 
                  : 0;
                const lostRevenue = (daysVacant * (unit.rent_amount || 0)) / 30;
                const listing = getListingForUnit(unit.id);
                const isLongVacancy = daysVacant >= 30;
                const isCriticalVacancy = daysVacant >= 60;

                return (
                  <div 
                    key={unit.id} 
                    className={`p-4 rounded-xl border border-border/40 transition-all duration-200 hover:border-primary/20 ${
                      isCriticalVacancy ? "border-destructive/50 bg-destructive/5" :
                      isLongVacancy ? "border-warning/50 bg-warning/5" : "bg-card/80 backdrop-blur-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-muted/50" aria-hidden="true">
                          <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {unit.property?.name} - Unit {unit.unit_number}
                          </p>
                        <p className="text-sm text-muted-foreground">
                            {unit.unit_type} • {unit.size_sqm}m²
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {unit.is_listed ? (
                          <Badge variant="outline" className="gap-1 rounded-full">
                            <Eye className="h-3 w-3" aria-hidden="true" /> Terdaftar
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full">Tidak Terdaftar</Badge>
                        )}
                        {isCriticalVacancy && (
                          <Badge variant="destructive" className="rounded-full">Kritis</Badge>
                        )}
                        {isLongVacancy && !isCriticalVacancy && (
                          <Badge variant="outline" className="border-warning text-warning rounded-full">
                            Kosong Lama
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Hari Kosong', value: `${daysVacant} hari`, cls: isLongVacancy ? "text-warning" : "" },
                        { label: 'Sewa Bulanan', value: `Rp ${(unit.rent_amount || 0).toLocaleString("id-ID")}`, cls: "" },
                        { label: 'Pendapatan Hilang', value: `Rp ${lostRevenue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, cls: "text-destructive" },
                        { label: 'Kosong Sejak', value: unit.vacant_since 
                          ? format(new Date(unit.vacant_since), "dd MMM", { locale: id }) 
                          : "Tidak Diketahui", cls: "" },
                      ].map((item, i) => (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className={`font-semibold ${item.cls}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Suggestions for long vacancies */}
                    {isLongVacancy && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/30 mb-4">
                        <p className="text-sm font-medium mb-1">💡 Saran:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {daysVacant >= 60 && <li>• Pertimbangkan pengurangan sewa yang signifikan</li>}
                          {daysVacant >= 30 && <li>• Tawarkan promosi gratis bulan pertama</li>}
                          <li>• Perbarui foto listing</li>
                          <li>• Tonjolkan fitur unik</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!unit.is_listed ? (
                        <Button 
                          size="sm"
                          className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md"
                          onClick={() => {
                            setSelectedUnit(unit);
                            setRelistDialogOpen(true);
                          }}
                        >
                          <ListPlus className="h-4 w-4 mr-1" aria-hidden="true" />
                          Daftarkan Unit
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-xl"
                            onClick={() => {
                              setSelectedUnit(unit);
                              setRelistDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
                            Perbarui Listing
                          </Button>
                          {listing && (
                            <Badge variant="secondary" className="gap-1 rounded-full">
                              <Eye className="h-3 w-3" aria-hidden="true" />
                              {listing.views || 0} dilihat
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relist Dialog */}
      <RelistUnitDialog
        open={relistDialogOpen}
        onOpenChange={setRelistDialogOpen}
        unit={selectedUnit}
        onListed={() => {
          queryClient.invalidateQueries({ queryKey: ["vacant-units"] });
          queryClient.invalidateQueries({ queryKey: ["active-listings"] });
          setRelistDialogOpen(false);
        }}
      />
    </div>
  );
}
