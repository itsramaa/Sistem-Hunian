import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataQualityService } from '../services/dataQualityService';
import { toast } from 'sonner';

export function useDataQualityCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => dataQualityService.invokeDataQualityCheck(propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['data-quality-checks'] });
      toast.success('Validasi selesai');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useQualityChecks(merchantId: string | undefined) {
  return useQuery({
    queryKey: ['data-quality-checks', merchantId],
    queryFn: () => dataQualityService.fetchQualityChecks(merchantId!),
    enabled: !!merchantId,
  });
}

export function useLatestQualityCheck(entityId: string | undefined) {
  return useQuery({
    queryKey: ['data-quality-check-latest', entityId],
    queryFn: () => dataQualityService.fetchLatestCheck(entityId!),
    enabled: !!entityId,
  });
}

export function useOverrideValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, rule, reason }: { checkId: string; rule: string; reason: string }) =>
      dataQualityService.overrideValidation(checkId, rule, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['data-quality-checks'] });
      qc.invalidateQueries({ queryKey: ['data-quality-check-latest'] });
      toast.success('Override berhasil disimpan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkFinalValidated() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (checkId: string) => dataQualityService.markFinalValidated(checkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['data-quality-checks'] });
      qc.invalidateQueries({ queryKey: ['data-quality-check-latest'] });
      toast.success('Data ditandai sebagai final validated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDataVersions(entityType: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['data-versions', entityType, entityId],
    queryFn: () => dataQualityService.fetchDataVersions(entityType!, entityId!),
    enabled: !!entityType && !!entityId,
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => dataQualityService.restoreVersion(versionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['data-versions'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['units'] });
      toast.success('Data berhasil di-restore ke versi sebelumnya');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
