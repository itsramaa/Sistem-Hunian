import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, MapPin, Loader2, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";

const SERVICE_CATEGORIES = [
  "All",
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Painting",
  "AC Service",
  "Carpentry",
  "Gardening",
  "Pest Control",
  "Moving",
  "Other",
];

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

export default function TenantMarketplace() {
  useAnalytics(); // Track page views automatically
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch verified vendors
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["marketplace-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, business_name, description, service_categories, rating, total_jobs, city, province")
        .eq("verification_status", "verified")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Filter vendors
  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch =
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      vendor.service_categories?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

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
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredVendors?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No vendors found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors?.map((vendor) => (
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
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {vendor.rating?.toFixed(1) || "New"}
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
      )}
    </TenantLayout>
  );
}
