import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useBulkMoveOutData(noticeIds: string[]) {
  const queryClient = useQueryClient();

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['bulk-move-out-notices', noticeIds],
    queryFn: async () => {
      if (!noticeIds.length) return [];
      const { data, error } = await supabase
        .from('move_out_notices')
        .select(`
          id, contract_id, tenant_user_id, intended_move_out_date, reason,
          is_early_termination, status,
          contract:contracts!inner(
            id, rent_amount, deposit_amount, merchant_id, tenant_user_id, status,
            unit:units!inner(
              unit_number,
              property:properties!inner(name, address:street_address)
            )
          )
        `)
        .in('id', noticeIds);
      if (error) throw error;
      return data || [];
    },
    enabled: noticeIds.length > 0,
  });

  const contractIds = notices?.map(n => (n.contract as any)?.id).filter(Boolean) || [];
  const tenantUserIds = [...new Set(notices?.map(n => n.tenant_user_id) || [])];

  const { data: inspections, isLoading: inspectionsLoading } = useQuery({
    queryKey: ['bulk-move-out-inspections', noticeIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('move_out_inspections')
        .select('*')
        .in('move_out_notice_id', noticeIds);
      if (error) throw error;
      return data || [];
    },
    enabled: noticeIds.length > 0,
  });

  const { data: depositRefunds, isLoading: refundsLoading } = useQuery({
    queryKey: ['bulk-deposit-refunds', contractIds],
    queryFn: async () => {
      if (!contractIds.length) return [];
      const { data, error } = await supabase
        .from('deposit_refunds')
        .select('*')
        .in('contract_id', contractIds);
      if (error) throw error;
      return data || [];
    },
    enabled: contractIds.length > 0,
  });

  const { data: tenantProfiles } = useQuery({
    queryKey: ['bulk-tenant-profiles', tenantUserIds],
    queryFn: async () => {
      if (!tenantUserIds.length) return {};
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', tenantUserIds);
      if (error) throw error;
      const map: Record<string, { user_id: string; full_name: string | null; email: string }> = {};
      data?.forEach(p => { map[p.user_id] = p; });
      return map;
    },
    enabled: tenantUserIds.length > 0,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['bulk-move-out-notices'] });
    queryClient.invalidateQueries({ queryKey: ['bulk-move-out-inspections'] });
    queryClient.invalidateQueries({ queryKey: ['bulk-deposit-refunds'] });
    queryClient.invalidateQueries({ queryKey: ['merchant-move-outs'] });
  };

  const bulkAcknowledge = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('move_out_notices')
        .update({ status: 'acknowledged' })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Semua pemberitahuan berhasil dikonfirmasi');
      invalidateAll();
    },
    onError: () => toast.error('Gagal mengkonfirmasi pemberitahuan'),
  });

  const bulkScheduleInspection = useMutation({
    mutationFn: async ({ ids, scheduledDate }: { ids: string[]; scheduledDate: string }) => {
      const inserts = ids.map(noticeId => ({
        move_out_notice_id: noticeId,
        scheduled_date: scheduledDate,
        status: 'scheduled' as const,
      }));
      const { error } = await supabase
        .from('move_out_inspections')
        .insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inspeksi berhasil dijadwalkan');
      invalidateAll();
    },
    onError: () => toast.error('Gagal menjadwalkan inspeksi'),
  });

  const bulkApproveRefunds = useMutation({
    mutationFn: async (cIds: string[]) => {
      const { error } = await supabase
        .from('deposit_refunds')
        .update({ status: 'approved' })
        .in('contract_id', cIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Semua refund deposit berhasil disetujui');
      invalidateAll();
    },
    onError: () => toast.error('Gagal menyetujui refund'),
  });

  const bulkTerminateContracts = useMutation({
    mutationFn: async (cIds: string[]) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'terminated', actual_end_date: new Date().toISOString().split('T')[0] })
        .in('id', cIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Semua kontrak berhasil diakhiri');
      invalidateAll();
    },
    onError: () => toast.error('Gagal mengakhiri kontrak'),
  });

  return {
    notices: notices || [],
    inspections: inspections || [],
    depositRefunds: depositRefunds || [],
    tenantProfiles: tenantProfiles || {},
    isLoading: noticesLoading || inspectionsLoading || refundsLoading,
    bulkAcknowledge,
    bulkScheduleInspection,
    bulkApproveRefunds,
    bulkTerminateContracts,
  };
}
