import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface OccupancyUnit {
  id: string;
  unit_number: string;
  unit_type: string | null;
  floor: number | null;
  status: string;
  rent_amount: number;
  property_id: string;
  property_name: string;
  tenant_name: string | null;
  tenant_user_id: string | null;
  contract_end_date: string | null;
  contract_status: string | null;
  maintenance_count: number;
}

export type OccupancyColumn = 'occupied' | 'available' | 'maintenance' | 'notice';

export function useOccupancyBoard() {
  const { merchant } = useAuth();

  return useQuery({
    queryKey: ['occupancy-board', merchant?.id],
    queryFn: async (): Promise<OccupancyUnit[]> => {
      if (!merchant?.id) return [];

      // Fetch units with property info
      const { data: units, error } = await supabase
        .from('units')
        .select(`
          id, unit_number, unit_type, floor, status, rent_amount, property_id,
          property:properties!inner(id, name, merchant_id)
        `)
        .eq('property.merchant_id', merchant.id)
        .order('unit_number');

      if (error) throw error;
      if (!units?.length) return [];

      const unitIds = units.map(u => u.id);

      // Fetch active/notice contracts with tenant info
      const { data: contracts } = await supabase
        .from('contracts')
        .select('unit_id, end_date, status, tenant_user_id, profiles:tenant_user_id(full_name)')
        .in('unit_id', unitIds)
        .in('status', ['active', 'notice']);

      // Fetch maintenance counts
      const { data: maintenanceCounts } = await (supabase as any)
        .from('maintenance_requests')
        .select('unit_id')
        .in('unit_id', unitIds)
        .in('status', ['pending', 'in_progress']);

      const mcMap: Record<string, number> = {};
      (maintenanceCounts ?? []).forEach((m: any) => {
        mcMap[m.unit_id] = (mcMap[m.unit_id] || 0) + 1;
      });

      const contractMap: Record<string, any> = {};
      (contracts ?? []).forEach((c: any) => {
        // Prefer notice status over active
        if (!contractMap[c.unit_id] || c.status === 'notice') {
          contractMap[c.unit_id] = c;
        }
      });

      return units.map((u: any) => {
        const c = contractMap[u.id];
        return {
          id: u.id,
          unit_number: u.unit_number,
          unit_type: u.unit_type,
          floor: u.floor,
          status: c?.status === 'notice' ? 'notice' : u.status,
          rent_amount: u.rent_amount,
          property_id: u.property_id,
          property_name: u.property?.name || '',
          tenant_name: c?.profiles?.full_name || null,
          tenant_user_id: c?.tenant_user_id || null,
          contract_end_date: c?.end_date || null,
          contract_status: c?.status || null,
          maintenance_count: mcMap[u.id] || 0,
        };
      });
    },
    enabled: !!merchant?.id,
  });
}
