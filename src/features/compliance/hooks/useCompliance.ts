import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceService } from '../services/complianceService';
import { toast } from 'sonner';

export function useComplianceSummary(propertyId: string | undefined) {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['compliance-summary', propertyId, merchant?.id],
    queryFn: () => complianceService.fetchPropertyComplianceSummary(propertyId!, merchant!.id),
    enabled: !!propertyId && !!merchant?.id,
  });
}

export function useDisasterProfile(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['disaster-profile', propertyId],
    queryFn: () => complianceService.fetchDisasterProfile(propertyId!),
    enabled: !!propertyId,
  });
}

export function useUpsertDisasterProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: complianceService.upsertDisasterProfile,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['disaster-profile', v.property_id] });
      qc.invalidateQueries({ queryKey: ['compliance-summary', v.property_id] });
      toast.success('Profil risiko bencana diperbarui');
    },
    onError: () => toast.error('Gagal menyimpan profil risiko'),
  });
}

export function useInsurancePolicies(propertyId?: string) {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['insurance-policies', merchant?.id, propertyId],
    queryFn: () => complianceService.fetchInsurancePolicies(merchant!.id, propertyId),
    enabled: !!merchant?.id,
  });
}

export function useCreateInsurancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: complianceService.createInsurancePolicy,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-policies'] });
      qc.invalidateQueries({ queryKey: ['compliance-summary'] });
      toast.success('Polis asuransi ditambahkan');
    },
    onError: () => toast.error('Gagal menambahkan polis'),
  });
}

export function useComplianceDocs(propertyId?: string) {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['compliance-docs', merchant?.id, propertyId],
    queryFn: () => complianceService.fetchComplianceDocs(merchant!.id, propertyId),
    enabled: !!merchant?.id,
  });
}

export function useCreateComplianceDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: complianceService.createComplianceDoc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-docs'] });
      qc.invalidateQueries({ queryKey: ['compliance-summary'] });
      toast.success('Dokumen compliance ditambahkan');
    },
    onError: () => toast.error('Gagal menambahkan dokumen'),
  });
}

export function useSecurityIncidents(propertyId?: string) {
  const { merchant } = useAuth();
  return useQuery({
    queryKey: ['security-incidents', merchant?.id, propertyId],
    queryFn: () => complianceService.fetchSecurityIncidents(merchant!.id, propertyId),
    enabled: !!merchant?.id,
  });
}

export function useCreateSecurityIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: complianceService.createSecurityIncident,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security-incidents'] });
      qc.invalidateQueries({ queryKey: ['compliance-summary'] });
      toast.success('Insiden keamanan dicatat');
    },
    onError: () => toast.error('Gagal mencatat insiden'),
  });
}

export function useInsuranceClaims(merchantId?: string, policyId?: string) {
  return useQuery({
    queryKey: ['insurance-claims', merchantId, policyId],
    queryFn: () => complianceService.fetchClaims(merchantId!, policyId),
    enabled: !!merchantId,
  });
}

export function useCreateInsuranceClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: complianceService.createClaim,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-claims'] });
      qc.invalidateQueries({ queryKey: ['compliance-summary'] });
      toast.success('Klaim asuransi diajukan');
    },
    onError: () => toast.error('Gagal mengajukan klaim'),
  });
}
