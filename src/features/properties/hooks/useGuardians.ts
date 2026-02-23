import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardianService } from '../services/guardianService';
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
