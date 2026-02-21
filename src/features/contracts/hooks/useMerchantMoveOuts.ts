import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/integrations/supabase/client";
import { MoveOutNotice, MoveOutInspection, EarlyTerminationRequest, TenantProfile } from "../types";

export const useMerchantMoveOuts = (merchantId: string | undefined) => {
  // Fetch move-out notices for merchant's contracts
  const { 
    data: moveOutNotices, 
    isLoading: isLoadingNotices,
    refetch: refetchNotices 
  } = useQuery({
    queryKey: ["merchant-move-outs", merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("move_out_notices")
        .select(`
          *,
          contract:contracts!inner (
            id,
            rent_amount,
            deposit_amount,
            merchant_id,
            tenant_user_id,
            unit:units (
              unit_number,
              property:properties (name, address)
            )
          )
        `)
        .eq("contract.merchant_id", merchantId)
        .order("intended_move_out_date", { ascending: true });
      
      if (error) throw error;
      return data as unknown as MoveOutNotice[];
    },
    enabled: !!merchantId,
  });

  // Fetch inspections
  const { 
    data: inspections, 
    isLoading: isLoadingInspections,
    refetch: refetchInspections
  } = useQuery({
    queryKey: ["merchant-inspections", merchantId],
    queryFn: async () => {
      const noticeIds = moveOutNotices?.map((n) => n.id) || [];
      if (noticeIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("move_out_inspections")
        .select("*")
        .in("move_out_notice_id", noticeIds);
      
      if (error) throw error;
      return data as unknown as MoveOutInspection[];
    },
    enabled: !!moveOutNotices?.length,
  });

  // Fetch early termination requests
  const { 
    data: earlyTermRequests, 
    isLoading: isLoadingEarlyTerms,
    refetch: refetchEarlyTerms
  } = useQuery({
    queryKey: ["merchant-early-terminations", merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("early_termination_requests")
        .select(`
          *,
          contract:contracts!inner (
            id,
            rent_amount,
            merchant_id,
            unit:units (
              unit_number,
              property:properties (name)
            )
          )
        `)
        .eq("contract.merchant_id", merchantId)
        .eq("status", "pending_approval");
      
      if (error) throw error;
      return data as unknown as EarlyTerminationRequest[];
    },
    enabled: !!merchantId,
  });

  // Fetch tenant profiles
  const { 
    data: tenantProfiles,
    isLoading: isLoadingProfiles,
    refetch: refetchProfiles
  } = useQuery({
    queryKey: ["tenant-profiles", moveOutNotices?.map(n => n.tenant_user_id)],
    queryFn: async () => {
      const tenantIds = moveOutNotices?.map((n) => n.tenant_user_id) || [];
      // Also include tenant IDs from early term requests if needed, but for now stick to move out notices as per original code
      
      if (tenantIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", tenantIds);
      
      if (error) throw error;
      
      return data?.reduce((acc, p) => {
        acc[p.user_id] = p as TenantProfile;
        return acc;
      }, {} as Record<string, TenantProfile>) || {};
    },
    enabled: !!moveOutNotices?.length,
  });

  const refetchAll = async () => {
    await Promise.all([
      refetchNotices(),
      refetchInspections(),
      refetchEarlyTerms(),
      refetchProfiles()
    ]);
  };

  return {
    moveOutNotices,
    inspections,
    earlyTermRequests,
    tenantProfiles,
    isLoading: isLoadingNotices || isLoadingInspections || isLoadingEarlyTerms || isLoadingProfiles,
    refetch: refetchAll,
  };
};
