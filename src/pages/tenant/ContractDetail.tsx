import { useAuth } from '@/features/auth/hooks/useAuth';
import { ContractStatusBadge } from '@/features/contracts/components/ContractStatusBadge';
import { SignatureStatusBadge } from '@/features/contracts/components/SignatureStatusBadge';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { supabase } from '@/lib/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Download, FileText, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function TenantContractDetail() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['tenant-contract-detail', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, unit:units(unit_number, property:properties(name, address, city))')
        .eq('id', contractId!)
        .eq('tenant_user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!contractId && !!user?.id,
  });

  if (isLoading) {
    return (
      <TenantLayout title="Contract Details">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 rounded-2xl" />
      </TenantLayout>
    );
  }

  if (!contract) {
    return (
      <TenantLayout title="Contract Details">
        <Button variant="ghost" onClick={() => navigate('/tenant/contracts')} className="gap-2 mb-6"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Contract not found</h2>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout title="Contract Details">
      <Button variant="ghost" onClick={() => navigate('/tenant/contracts')} className="gap-2 rounded-xl mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Contracts
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{contract.unit?.property?.name}</h1>
          <p className="text-muted-foreground">Unit {contract.unit?.unit_number} — {contract.unit?.property?.address}, {contract.unit?.property?.city}</p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Start Date', value: format(new Date(contract.start_date), 'MMM dd, yyyy'), icon: Calendar },
              { label: 'End Date', value: format(new Date(contract.end_date), 'MMM dd, yyyy'), icon: Calendar },
              { label: 'Monthly Rent', value: formatCurrency(contract.rent_amount), icon: FileText },
              { label: 'Deposit', value: formatCurrency(contract.deposit_amount || 0), icon: FileText },
            { label: 'Signatures', value: <SignatureStatusBadge contract={contract as any} />, icon: FileText },
            ].map((item, i) => (
              <div key={i} className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                {typeof item.value === 'string' ? <p className="font-semibold">{item.value}</p> : item.value}
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="font-semibold text-lg">Signatures</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Your Signature', url: contract.tenant_signature_url, date: contract.tenant_signed_at },
                { label: 'Landlord Signature', url: contract.merchant_signature_url, date: contract.merchant_signed_at },
              ].map((sig, i) => (
                <div key={i} className="rounded-xl border border-border/40 p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-2">{sig.label}</p>
                  {sig.url ? (
                    <>
                      <img src={sig.url} alt={sig.label} className="max-h-16 object-contain" />
                      <p className="text-xs text-muted-foreground mt-2">Signed: {sig.date && format(new Date(sig.date), 'MMM dd, yyyy')}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not signed yet</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
            <h3 className="font-semibold text-lg mb-3">Terms & Conditions</h3>
            {contract.terms ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.terms}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No terms specified.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3 h-fit">
          <h3 className="font-semibold text-lg mb-2">Documents</h3>
          {contract.contract_document_url ? (
            <Button variant="outline" className="w-full rounded-xl gap-2" asChild>
              <a href={contract.contract_document_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" /> Download Contract
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground italic">No document uploaded.</p>
          )}
        </div>
      </div>
    </TenantLayout>
  );
}