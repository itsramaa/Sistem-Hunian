import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardianService } from '../api/guardianService';
import { PropertyGuardian } from '../types';
import { toast } from 'sonner';

export function useGuardians(merchantId?: string) {
  return useQuery({
    queryKey: ['guardians', merchantId],
    queryFn: () => guardianService.fetchGuardians(merchantId!),
    enabled: !!merchantId,
  });
}

export function useGuardiansByProperty(propertyId?: string) {
  return useQuery({
    queryKey: ['guardians', 'property', propertyId],
    queryFn: () => guardianService.fetchGuardiansByProperty(propertyId!),
    enabled: !!propertyId,
  });
}

export function useCreateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<PropertyGuardian, 'id' | 'created_at' | 'updated_at'>) =>
      guardianService.createGuardian(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Penjaga berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<PropertyGuardian> & { id: string }) =>
      guardianService.updateGuardian(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Penjaga berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGuardian() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guardianService.deleteGuardian(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Penjaga berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGuardianAssignments(guardianId?: string) {
  return useQuery({
    queryKey: ['guardian-assignments', guardianId],
    queryFn: () => guardianService.fetchAssignments(guardianId!),
    enabled: !!guardianId,
  });
}

export function useAssignGuardianToProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, propertyId, role }: { guardianId: string; propertyId: string; role?: string }) =>
      guardianService.assignToProperty(guardianId, propertyId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardian-assignments'] });
      qc.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Penjaga berhasil di-assign ke properti');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveGuardianAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => guardianService.removeAssignment(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardian-assignments'] });
      qc.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Assignment penjaga dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
