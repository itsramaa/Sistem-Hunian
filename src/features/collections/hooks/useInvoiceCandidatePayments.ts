import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CandidatePayment {
  id: string;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  proofPhotoUrl: string | null;
  confidence: number;
  confidenceLabel: string;
}

function computeConfidence(paymentAmount: number, invoiceAmount: number): { score: number; label: string } {
  if (invoiceAmount <= 0) return { score: 0.5, label: 'Tidak Cocok' };
  if (paymentAmount === invoiceAmount) return { score: 1.0, label: 'Exact Match' };
  const diff = Math.abs(paymentAmount - invoiceAmount) / invoiceAmount;
  if (diff < 0.05) return { score: 0.95, label: 'Hampir Cocok' };
  if (diff < 0.20) return { score: 0.80, label: 'Mendekati' };
  return { score: 0.50, label: 'Tidak Cocok' };
}

interface Params {
  tenantUserId: string;
  contractId: string;
  merchantId: string;
  invoiceAmount: number;
  enabled?: boolean;
}

export function useInvoiceCandidatePayments({ tenantUserId, contractId, merchantId, invoiceAmount, enabled = true }: Params) {
  return useQuery({
    queryKey: ['invoice-candidates', tenantUserId, contractId, merchantId],
    queryFn: async (): Promise<CandidatePayment[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, payment_method, reference, paid_at, created_at, proof_photo_url')
        .eq('merchant_id', merchantId)
        .eq('tenant_user_id', tenantUserId)
        .eq('contract_id', contractId)
        .in('reconciliation_status', ['unmatched', 'pending_review'])
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || [])
        .map(p => {
          const amt = Number(p.amount);
          const { score, label } = computeConfidence(amt, invoiceAmount);
          return {
            id: p.id,
            amount: amt,
            paymentMethod: p.payment_method || '-',
            reference: p.reference,
            paidAt: p.paid_at,
            createdAt: p.created_at,
            proofPhotoUrl: p.proof_photo_url,
            confidence: score,
            confidenceLabel: label,
          };
        })
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
    },
    enabled: enabled && !!merchantId && !!tenantUserId && !!contractId,
    staleTime: 30_000,
  });
}
