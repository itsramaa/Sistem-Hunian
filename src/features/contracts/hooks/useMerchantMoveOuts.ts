import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
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
      // TODO: implement Go endpoint — was: supabase.from('move_out_notices').select(...).eq('contract.merchant_id', merchantId)
      try {
        const r = await apiClient.get('/move-out-notices', { params: { merchant_id: merchantId } });
        return (r.data.data ?? []) as MoveOutNotice[];
      } catch (err) {
        throw err as Error;
      }
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
      
      // TODO: implement Go endpoint — was: supabase.from('move_out_inspections').select('*').in('move_out_notice_id', noticeIds)
      try {
        const r = await apiClient.get('/move-out-inspections', { params: { notice_ids: noticeIds.join(',') } });
        return (r.data.data ?? []) as MoveOutInspection[];
      } catch (err) {
        throw err as Error;
      }
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
      // TODO: implement Go endpoint — was: supabase.from('early_termination_requests').select(...).eq('contract.merchant_id', merchantId).eq('status', 'pending_approval')
      try {
        const r = await apiClient.get('/early-termination-requests', {
          params: { merchant_id: merchantId, status: 'pending_approval' },
        });
        return (r.data.data ?? []) as EarlyTerminationRequest[];
      } catch (err) {
        throw err as Error;
      }
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
      if (tenantIds.length === 0) return {};
      
      // TODO: implement Go endpoint — was: supabase.from('profiles').select('user_id, full_name, email').in('user_id', tenantIds)
      try {
        const r = await apiClient.get('/profiles', { params: { user_ids: tenantIds.join(',') } });
        const data: TenantProfile[] = r.data.data ?? [];
        return data.reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, TenantProfile>);
      } catch (err) {
        throw err as Error;
      }
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
