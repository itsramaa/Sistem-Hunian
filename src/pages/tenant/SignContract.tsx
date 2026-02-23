import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TenantLayout } from '@/shared/components/layouts/TenantLayout';
import { SignaturePad } from '@/features/signature/components/SignaturePad';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FileText, Calendar, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SignContract() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract-to-sign', contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const { data, error } = await supabase.from('contracts').select(`*, unit:units (unit_number, property:properties (name, address, city))`).eq('id', contractId).eq('tenant_user_id', user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!contractId && !!user?.id,
  });

  const signContractMutation = useMutation({
    mutationFn: async () => {
      if (!signatureDataUrl || !contractId) throw new Error('Missing signature or contract');
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
      const fileName = `signatures/${user?.id}/${contractId}_tenant_${Date.now()}.png`;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const { error: uploadError } = await supabase.storage.from('verification-documents').upload(fileName, blob, { contentType: 'image/png' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('verification-documents').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('contracts').update({ tenant_signature_url: publicUrl, tenant_signed_at: new Date().toISOString(), signature_status: contract?.merchant_signature_url ? 'fully_signed' : 'tenant_signed' }).eq('id', contractId);
      if (updateError) throw updateError;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contract-to-sign', contractId] }); queryClient.invalidateQueries({ queryKey: ['tenant-contracts'] }); toast.success('Contract signed successfully!'); navigate('/tenant/contracts'); },
    onError: (error: Error) => { toast.error(`Failed to sign contract: ${error.message}`); },
  });

  const handleSaveSignature = (dataUrl: string) => { setSignatureDataUrl(dataUrl); toast.success('Signature captured. Click "Sign Contract" to confirm.'); };
  const handleSignContract = () => {
    if (!agreedToTerms) { toast.error('Please agree to the terms and conditions'); return; }
    if (!signatureDataUrl) { toast.error('Please draw your signature first'); return; }
    signContractMutation.mutate();
  };

  if (isLoading) {
    return <TenantLayout title="Sign Contract"><div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></TenantLayout>;
  }

  if (!contract) {
    return (
      <TenantLayout title="Sign Contract">
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2">Contract Not Found</h3>
            <p className="text-muted-foreground">This contract doesn't exist or you don't have access to it.</p>
            <Button className="mt-4 rounded-xl" onClick={() => navigate('/tenant/contracts')}>Back to Contracts</Button>
          </CardContent>
        </Card>
      </TenantLayout>
    );
  }

  const alreadySigned = !!contract.tenant_signature_url;

  return (
    <TenantLayout title="Sign Contract" description="Review and sign your rental agreement">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Contract Details */}
        <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{contract.unit?.property?.name} - Unit {contract.unit?.unit_number}</CardTitle>
                  <CardDescription>{contract.unit?.property?.address}, {contract.unit?.property?.city}</CardDescription>
                </div>
              </div>
              {alreadySigned ? (
                <Badge className="bg-success text-success-foreground gap-1 rounded-full"><CheckCircle className="h-3 w-3" />Signed</Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full">Pending Signature</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'Start Date', value: format(new Date(contract.start_date), 'MMM dd, yyyy') },
                { icon: Calendar, label: 'End Date', value: format(new Date(contract.end_date), 'MMM dd, yyyy') },
                { icon: DollarSign, label: 'Monthly Rent', value: `Rp ${Number(contract.rent_amount).toLocaleString()}` },
                { icon: DollarSign, label: 'Deposit', value: `Rp ${Number(contract.deposit_amount || 0).toLocaleString()}` },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <item.icon className="h-4 w-4" /><span className="text-sm">{item.label}</span>
                  </div>
                  <p className="font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            {contract.terms && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Terms & Conditions</h4>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm max-h-60 overflow-y-auto">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.terms}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        {alreadySigned ? (
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" />Contract Signed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You signed this contract on {format(new Date(contract.tenant_signed_at!), 'MMMM d, yyyy h:mm a')}</p>
              <div className="border border-border/40 rounded-xl p-4 bg-white">
                <p className="text-sm text-muted-foreground mb-2">Your Signature:</p>
                <img src={contract.tenant_signature_url!} alt="Your signature" className="max-h-24 object-contain" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl bg-card/90 backdrop-blur-sm border border-border/40">
            <CardHeader>
              <CardTitle>Sign Contract</CardTitle>
              <CardDescription>Draw your signature below to sign this rental agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <SignaturePad onSave={handleSaveSignature} width={400} height={150} />
              </div>

              {signatureDataUrl && (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-sm text-success flex items-center gap-2"><CheckCircle className="h-4 w-4" />Signature captured successfully</p>
                </div>
              )}

              <Separator />

              <div className="flex items-start space-x-3">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I have read and agree to the terms and conditions of this rental agreement. I understand that by signing this contract electronically, I am entering into a legally binding agreement.
                </label>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/tenant/contracts')} className="rounded-xl">Cancel</Button>
                <Button onClick={handleSignContract} disabled={!agreedToTerms || !signatureDataUrl || signContractMutation.isPending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-md">
                  {signContractMutation.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing...</>) : 'Sign Contract'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TenantLayout>
  );
}
