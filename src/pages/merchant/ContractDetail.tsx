import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMerchantContracts } from '@/features/contracts/hooks/useMerchantContracts';
import { ContractStatusBadge } from '@/features/contracts/components/ContractStatusBadge';
import { SignatureStatusBadge } from '@/features/contracts/components/SignatureStatusBadge';
import { ContractDocumentUpload } from '@/features/contracts/components/ContractDocumentUpload';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Download, Edit, FileText, Home, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { supabase } from '@/lib/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function MerchantContractDetail() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const { contracts = [], isLoading } = useMerchantContracts(merchant?.id);

  const contract = useMemo(() => contracts.find(c => c.id === contractId), [contracts, contractId]);

  // Fetch tenant profile
  const { data: tenantProfile } = useQuery({
    queryKey: ['tenant-profile', contract?.tenant_user_id],
    queryFn: async () => {
      if (!contract?.tenant_user_id) return null;
      const { data } = await supabase.from('profiles').select('full_name, email, phone').eq('user_id', contract.tenant_user_id).single();
      return data;
    },
    enabled: !!contract?.tenant_user_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/merchant/contracts')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Contract not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/merchant/contracts')} className="gap-2 rounded-xl">
        <ArrowLeft className="h-4 w-4" /> Back to Contracts
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader icon={FileText} title="Contract Details" description={`${contract.unit?.property?.name || 'Property'} - Unit ${contract.unit?.unit_number}`} />
        <ContractStatusBadge status={contract.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property & Tenant Info */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="gradient-icon-box w-10 h-10"><Home className="h-5 w-5 text-primary" /></div>
                  <h3 className="font-semibold">Property</h3>
                </div>
                <div className="space-y-2 pl-[52px]">
                  <p className="font-medium">{contract.unit?.property?.name}</p>
                  <p className="text-sm text-muted-foreground">{contract.unit?.property?.address}, {contract.unit?.property?.city}</p>
                  <p className="text-sm text-muted-foreground">Unit {contract.unit?.unit_number}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="gradient-icon-box w-10 h-10"><User className="h-5 w-5 text-primary" /></div>
                  <h3 className="font-semibold">Tenant</h3>
                </div>
                <div className="space-y-2 pl-[52px]">
                  <p className="font-medium">{tenantProfile?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{tenantProfile?.email}</p>
                  {tenantProfile?.phone && <p className="text-sm text-muted-foreground">{tenantProfile.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Start Date', value: format(new Date(contract.start_date), 'MMM dd, yyyy'), icon: Calendar },
              { label: 'End Date', value: format(new Date(contract.end_date), 'MMM dd, yyyy'), icon: Calendar },
              { label: 'Monthly Rent', value: formatCurrency(contract.rent_amount), icon: FileText },
              { label: 'Deposit', value: formatCurrency(contract.deposit_amount || 0), icon: FileText },
              { label: 'Signatures', value: <SignatureStatusBadge contract={contract} />, icon: Edit },
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
                { label: 'Tenant Signature', url: contract.tenant_signature_url, date: contract.tenant_signed_at },
                { label: 'Merchant Signature', url: contract.merchant_signature_url, date: contract.merchant_signed_at },
              ].map((sig, i) => (
                <div key={i} className="rounded-xl border border-border/40 p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-2">{sig.label}</p>
                  {sig.url ? (
                    <>
                      <img src={sig.url} alt={sig.label} className="max-h-16 object-contain" />
                      <p className="text-xs text-muted-foreground mt-2">Signed: {sig.date && format(new Date(sig.date), 'MMM dd, yyyy h:mm a')}</p>
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
        <div className="space-y-6">
          {/* Document Upload */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6">
            <ContractDocumentUpload contractId={contract.id} currentDocumentUrl={contract.contract_document_url} onUploadComplete={() => {}} />
          </div>

          {/* Quick Actions */}
          <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-3">
            <h3 className="font-semibold text-lg mb-2">Actions</h3>
            {contract.contract_document_url && (
              <Button variant="outline" className="w-full rounded-xl gap-2" asChild>
                <a href={contract.contract_document_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" /> Download Contract
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}