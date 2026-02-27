import { Building2, ChevronDown, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePropertyContext } from '@/shared/stores/propertyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/shared/components/ui/sidebar';
import { Badge } from '@/shared/components/ui/badge';

interface PropertySwitcherProps {
  merchantId: string;
}

export function PropertySwitcher({ merchantId }: PropertySwitcherProps) {
  const { selectedPropertyId, setSelectedProperty } = usePropertyContext();

  const { data: properties } = useQuery({
    queryKey: ['merchant-properties-switcher', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, total_units, occupied_units')
        .eq('merchant_id', merchantId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId);
  const displayName = selectedProperty?.name || 'Semua Properti';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="size-4 text-primary" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {selectedPropertyId ? `${selectedProperty?.occupied_units || 0}/${selectedProperty?.total_units || 0} unit` : `${properties?.length || 0} properti`}
            </span>
          </div>
          <ChevronDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuItem
          onClick={() => setSelectedProperty(null)}
          className="gap-2 p-2"
        >
          <div className="flex size-6 items-center justify-center rounded-sm border">
            <Building2 className="size-4 shrink-0" />
          </div>
          <span className="flex-1">Semua Properti</span>
          {!selectedPropertyId && <Check className="size-4" />}
        </DropdownMenuItem>
        {properties?.map((property) => {
          const occupancy = property.total_units > 0
            ? Math.round((property.occupied_units / property.total_units) * 100)
            : 0;
          return (
            <DropdownMenuItem
              key={property.id}
              onClick={() => setSelectedProperty(property.id)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Building2 className="size-4 shrink-0" />
              </div>
              <span className="flex-1 truncate">{property.name}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {occupancy}%
              </Badge>
              {selectedPropertyId === property.id && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
