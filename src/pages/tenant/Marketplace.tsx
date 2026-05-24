import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Search, Star, MapPin, Store, RefreshCw, AlertTriangle, TrendingUp } from "lucide-react";
import { GridSkeleton } from "@/shared/components/ui/skeletons";
import { Link, Navigate } from "react-router-dom";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface Vendor {
  id: string;
  business_name: string;
  description: string | null;
  service_categories: string[] | null;
  rating: number | null;
  total_jobs: number | null;
  city: string | null;
  province: string | null;
}

// Pagination limit
const PAGE_SIZE = 12;

export default function TenantMarketplace() {
  useAnalytics();
  const { user, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [sortBy, setSortBy] = useState<"rating" | "jobs" | "name">("rating");
  const [page, setPage] = useState(1);

  // Fetch service categories from database
  const { data: serviceCategories } = useQuery({
    queryKey: ["vendor-service-categories"],
    queryFn: async () => {
      const { data } = await apiClient.get('/vendors/categories');
      return ["All", ...(data?.categories || []).sort()];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch tenant's property location
  const { data: tenantLocation } = useQuery({
    queryKey: ["tenant-location", user?.id],
    queryFn: async () => {
      const { data: contract } = await apiClient.get('/contracts/active');
      
      if (contract?.unit?.property) {
        const props = contract.unit.property as { city?: string; province?: string };
        return {
          city: props.city || null,
          province: props.province || null,
        };
      }
      return null;
    },
    enabled: !!user?.id,
  });

  // Fetch verified vendors with pagination support
  const { data: vendors, isLoading, error, refetch } = useQuery({
    queryKey: ["marketplace-vendors"],
    queryFn: async () => {
      const { data } = await apiClient.get('/vendors', { params: { verification_status: 'verified', order: 'rating:desc' } });
      return (data?.items || data || []) as Vendor[];
    },
  });

  // Get unique locations from vendors
  const availableLocations = useMemo(() => {
    if (!vendors) return [];
    const locations = new Set<string>();
    vendors.forEach((v) => {
      if (v.city) locations.add(v.city);
    });
    return Array.from(locations).sort();
  }, [vendors]);

  // Sanitize search input
  const sanitizedSearch = useMemo(() => {
    return searchQuery.trim().slice(0, 100).toLowerCase();
  }, [searchQuery]);

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    let result = vendors?.filter((vendor) => {
      const matchesSearch =
        !sanitizedSearch ||
        vendor.business_name.toLowerCase().includes(sanitizedSearch) ||
        vendor.description?.toLowerCase().includes(sanitizedSearch) ||
        vendor.service_categories?.some(cat => cat.toLowerCase().includes(sanitizedSearch));
      
      const matchesCategory =
        selectedCategory === "All" ||
        vendor.service_categories?.includes(selectedCategory);
      
      let matchesLocation = true;
      if (selectedLocation === "My Area" && tenantLocation?.city) {
        matchesLocation = vendor.city === tenantLocation.city;
      } else if (selectedLocation !== "All") {
        matchesLocation = vendor.city === selectedLocation;
      }
      
      return matchesSearch && matchesCategory && matchesLocation;
    }) || [];

    // Sort vendors
    result = [...result].sort((a, b) => {
      // First, prioritize vendors in tenant's city
      if (tenantLocation?.city) {
        const aInCity = a.city === tenantLocation.city ? 0 : 1;
        const bInCity = b.city === tenantLocation.city ? 0 : 1;
        if (aInCity !== bInCity) return aInCity - bInCity;
      }

      // Then apply selected sort
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "jobs":
          return (b.total_jobs || 0) - (a.total_jobs || 0);
        case "name":
          return a.business_name.localeCompare(b.business_name);
        default:
          return 0;
      }
    });

    return result;
  }, [vendors, sanitizedSearch, selectedCategory, selectedLocation, tenantLocation, sortBy]);

  // Paginated vendors
  const paginatedVendors = useMemo(() => {
    return filteredVendors.slice(0, page * PAGE_SIZE);
  }, [filteredVendors, page]);

  const hasMore = paginatedVendors.length < filteredVendors.length;

  const categories = serviceCategories || ["All"];

  // Role verification
  if (role && role !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }

  // Error state
  if (error) {
    return (
      <TenantLayout
        title="Vendor Marketplace"
        description="Browse and order services from verified vendors"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat data vendor. Silakan coba lagi.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout
      title="Vendor Marketplace"
      description="Browse and order services from verified vendors"
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors or services..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset pagination on search
            }}
            className="pl-9"
            maxLength={100}
          />
        </div>
        <Select 
          value={selectedCategory} 
          onValueChange={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={selectedLocation} 
          onValueChange={(val) => {
            setSelectedLocation(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <MapPin className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Locations</SelectItem>
            {tenantLocation?.city && (
              <SelectItem value="My Area">
                My Area ({tenantLocation.city})
              </SelectItem>
            )}
            {availableLocations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={sortBy} 
          onValueChange={(val: "rating" | "jobs" | "name") => setSortBy(val)}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <TrendingUp className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rating</SelectItem>
            <SelectItem value="jobs">Most Jobs</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!isLoading && filteredVendors.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {paginatedVendors.length} of {filteredVendors.length} vendors
        </p>
      )}

      {/* Vendors Grid */}
      {isLoading ? (
        <GridSkeleton count={6} />
      ) : filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No vendors found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedLocation("All");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedVendors.map((vendor) => (
              <Card key={vendor.id} className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{vendor.business_name}</CardTitle>
                      {vendor.city && (
                        <div className="mt-1 flex items-center text-xs text-muted-foreground">
                          <MapPin className="mr-1 h-3 w-3" />
                          {vendor.city}
                          {vendor.province && `, ${vendor.province}`}
                          {tenantLocation?.city === vendor.city && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Near you
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {vendor.rating ? vendor.rating.toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {vendor.description || "Professional service provider"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {vendor.service_categories?.slice(0, 3).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {(vendor.service_categories?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(vendor.service_categories?.length || 0) - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {vendor.total_jobs || 0} jobs completed
                    </span>
                    <Button asChild size="sm">
                      <Link to={`/tenant/marketplace/${vendor.id}`}>View Services</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => setPage(p => p + 1)}>
                Load More Vendors
              </Button>
            </div>
          )}
        </>
      )}
    </TenantLayout>
  );
}
