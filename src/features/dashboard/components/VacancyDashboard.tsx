import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { differenceInDays, format } from "date-fns";
import { Home, AlertTriangle, TrendingDown, DollarSign, RefreshCw, Eye, ListPlus, BarChart } from "lucide-react";
import { toast } from "sonner";
import { RelistUnitDialog } from "@/features/properties/components/RelistUnitDialog";

export function VacancyDashboard() {
  const { merchant } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [relistDialogOpen, setRelistDialogOpen] = useState(false);

  // Fetch vacant units
  const { data: vacantUnits, isLoading } = useQuery({
    queryKey: ["vacant-units", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select(`
          *,
          property:properties!inner (
            id,
            name,
            address,
            merchant_id
          )
        `)
        .eq("property.merchant_id", merchant?.id)
        .eq("status", "vacant")
        .order("vacant_since", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  // Fetch active listings
  const { data: activeListings } = useQuery({
    queryKey: ["active-listings", merchant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unit_listings")
        .select("*")
        .eq("merchant_id", merchant?.id)
        .eq("status", "active");
      if (error) throw error;
      return data;
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
    return <div className="animate-pulse h-48 bg-muted rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Home, color: 'text-primary', bg: 'from-primary/20 to-primary/5', label: 'Vacant Units', value: String(totalVacant) },
          { icon: AlertTriangle, color: 'text-warning', bg: 'from-warning/20 to-warning/5', label: '30+ Days Vacant', value: String(longVacancies) },
          { icon: TrendingDown, color: 'text-destructive', bg: 'from-destructive/20 to-destructive/5', label: 'Lost Revenue', value: `Rp ${(totalLostRevenue / 1000000).toFixed(1)}M` },
          { icon: ListPlus, color: 'text-success', bg: 'from-success/20 to-success/5', label: 'Listed', value: `${listedCount}/${totalVacant}` },
        ].map((item, i) => (
          <Card key={i} className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${item.bg}`}>
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
          <CardTitle className="text-base">Listing Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={listingRate} className="h-3 rounded-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {listedCount} of {totalVacant} vacant units are actively listed ({listingRate.toFixed(0)}%)
          </p>
        </CardContent>
      </Card>

      {/* Vacant Units List */}
      <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Vacant Units</CardTitle>
          <CardDescription>Manage your vacant properties</CardDescription>
        </CardHeader>
        <CardContent>
          {totalVacant === 0 ? (
            <div className="py-8 text-center">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Vacant Units</h3>
              <p className="text-muted-foreground">All your units are currently occupied!</p>
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
                        <div className="p-2 rounded-xl bg-muted/50">
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
                            <Eye className="h-3 w-3" /> Listed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="rounded-full">Not Listed</Badge>
                        )}
                        {isCriticalVacancy && (
                          <Badge variant="destructive" className="rounded-full">Critical</Badge>
                        )}
                        {isLongVacancy && !isCriticalVacancy && (
                          <Badge variant="outline" className="border-warning text-warning rounded-full">
                            Long Vacancy
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Days Vacant', value: `${daysVacant} days`, cls: isLongVacancy ? "text-warning" : "" },
                        { label: 'Monthly Rent', value: `Rp ${(unit.rent_amount || 0).toLocaleString("id-ID")}`, cls: "" },
                        { label: 'Lost Revenue', value: `Rp ${lostRevenue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`, cls: "text-destructive" },
                        { label: 'Vacant Since', value: unit.vacant_since 
                          ? format(new Date(unit.vacant_since), "MMM dd") 
                          : "Unknown", cls: "" },
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
                        <p className="text-sm font-medium mb-1">💡 Suggestions:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {daysVacant >= 60 && <li>• Consider a significant rent reduction</li>}
                          {daysVacant >= 30 && <li>• Offer first month free promotion</li>}
                          <li>• Update listing photos</li>
                          <li>• Highlight unique features</li>
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
                          <ListPlus className="h-4 w-4 mr-1" />
                          List Unit
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
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Update Listing
                          </Button>
                          {listing && (
                            <Badge variant="secondary" className="gap-1 rounded-full">
                              <Eye className="h-3 w-3" />
                              {listing.views || 0} views
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
