import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchStaff,
  inviteStaff,
  updateStaff,
  removeStaff,
  fetchPermissions,
  updatePermissions,
  type InviteStaffData,
  type UpdateStaffData,
} from '../services/staffService';

export function useStaffMembers(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['merchant-staff', merchantId],
    queryFn: () => fetchStaff(merchantId!),
    enabled: !!merchantId,
  });
}

export function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteStaffData) => inviteStaff(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['merchant-staff', vars.merchant_id] });
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateStaffData; merchantId: string }) =>
      updateStaff(id, updates),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['merchant-staff', vars.merchantId] });
    },
  });
}

export function useRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; merchantId: string }) => removeStaff(id),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['merchant-staff', vars.merchantId] });
    },
  });
}

export function useStaffPermissions(staffId: string | undefined) {
  return useQuery({
    queryKey: ['staff-permissions', staffId],
    queryFn: () => fetchPermissions(staffId!),
    enabled: !!staffId,
  });
}

export function useUpdateStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, permissions }: { staffId: string; permissions: { permission_key: string; is_granted: boolean }[] }) =>
      updatePermissions(staffId, permissions),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['staff-permissions', vars.staffId] });
    },
  });
}
