import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { differenceInDays, format } from "date-fns";
import { 
  Home, AlertTriangle, TrendingDown, DollarSign, 
  RefreshCw, Eye, ListPlus, BarChart
} from "lucide-react";
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
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vacant Units</p>
                <p className="text-2xl font-bold">{totalVacant}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">30+ Days Vacant</p>
                <p className="text-2xl font-bold">{longVacancies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lost Revenue</p>
                <p className="text-2xl font-bold">Rp {(totalLostRevenue / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <ListPlus className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listed</p>
                <p className="text-2xl font-bold">{listedCount}/{totalVacant}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listing Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listing Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={listingRate} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {listedCount} of {totalVacant} vacant units are actively listed ({listingRate.toFixed(0)}%)
          </p>
        </CardContent>
      </Card>

      {/* Vacant Units List */}
      <Card>
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
                    className={`p-4 rounded-lg border ${
                      isCriticalVacancy ? "border-destructive bg-destructive/5" :
                      isLongVacancy ? "border-warning bg-warning/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
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
                          <Badge variant="outline" className="gap-1">
                            <Eye className="h-3 w-3" /> Listed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Listed</Badge>
                        )}
                        {isCriticalVacancy && (
                          <Badge variant="destructive">Critical</Badge>
                        )}
                        {isLongVacancy && !isCriticalVacancy && (
                          <Badge variant="outline" className="border-warning text-warning">
                            Long Vacancy
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Days Vacant</p>
                        <p className={`font-semibold ${isLongVacancy ? "text-warning" : ""}`}>
                          {daysVacant} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Rent</p>
                        <p className="font-semibold">
                          Rp {(unit.rent_amount || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lost Revenue</p>
                        <p className="font-semibold text-destructive">
                          Rp {lostRevenue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vacant Since</p>
                        <p className="font-semibold">
                          {unit.vacant_since 
                            ? format(new Date(unit.vacant_since), "MMM dd") 
                            : "Unknown"}
                        </p>
                      </div>
                    </div>

                    {/* Suggestions for long vacancies */}
                    {isLongVacancy && (
                      <div className="p-3 rounded bg-muted/50 mb-4">
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
                            onClick={() => {
                              setSelectedUnit(unit);
                              setRelistDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Update Listing
                          </Button>
                          {listing && (
                            <Badge variant="secondary" className="gap-1">
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
