import { useToast } from '@/shared/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentPlanService } from '../api/paymentPlanService';
import { CreatePaymentPlanPayload } from '../types';

export function usePaymentPlans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPaymentPlan = useMutation({
    mutationFn: (payload: CreatePaymentPlanPayload) => paymentPlanService.createPaymentPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast({
        title: 'Rencana Cicilan Dibuat',
        description: 'Penawaran cicilan telah dikirim ke penyewa.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Membuat Rencana Cicilan',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const acceptPaymentPlan = useMutation({
    mutationFn: ({ planId, invoiceId }: { planId: string; invoiceId: string }) => 
      paymentPlanService.acceptPaymentPlan(planId, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Rencana Cicilan Diterima',
        description: 'Anda sekarang dapat membayar sesuai jadwal cicilan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menerima Rencana',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const declinePaymentPlan = useMutation({
    mutationFn: (planId: string) => paymentPlanService.declinePaymentPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast({
        title: 'Rencana Cicilan Ditolak',
        description: 'Anda dapat membayar tagihan penuh.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Menolak Rencana',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createPaymentPlan: createPaymentPlan.mutateAsync,
    isCreating: createPaymentPlan.isPending,
    acceptPaymentPlan: acceptPaymentPlan.mutateAsync,
    isAccepting: acceptPaymentPlan.isPending,
    declinePaymentPlan: declinePaymentPlan.mutateAsync,
    isDeclining: declinePaymentPlan.isPending,
  };
}
