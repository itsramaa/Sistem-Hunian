import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignaturePad } from '@/components/signature/SignaturePad';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Calendar, 
  Home, 
  Loader2, 
  Download, 
  DollarSign, 
  PenLine, 
  CheckCircle, 
  Search,
  Users,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Contract {
  id: string;
  tenant_user_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number | null;
  status: string | null;
  signature_status: string | null;
  tenant_signature_url: string | null;
  merchant_signature_url: string | null;
  tenant_signed_at: string | null;
  merchant_signed_at: string | null;
  terms: string | null;
  contract_document_url: string | null;
  unit: {
    unit_number: string;
    property: {
      name: string;
      address: string;
      city: string;
    } | null;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function MerchantContracts() {
  const { merchant, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['merchant-contracts', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          unit:units (
            unit_number,
            property:properties (
              name,
              address,
              city
            )
          )
        `)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!merchant?.id,
  });

  // Fetch tenant profiles
  const tenantIds = contracts?.map(c => c.tenant_user_id) || [];
  const { data: tenantProfiles } = useQuery({
    queryKey: ['tenant-profiles', tenantIds],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', tenantIds);
      if (error) throw error;
      return data;
    },
    enabled: tenantIds.length > 0,
  });

  const profileMap = new Map(tenantProfiles?.map(p => [p.user_id, p]) || []);

  const signContractMutation = useMutation({
    mutationFn: async ({ contractId, signatureUrl }: { contractId: string; signatureUrl: string }) => {
      // Upload signature
      const base64Data = signatureUrl.replace(/^data:image\/png;base64,/, '');
      const fileName = `signatures/${user?.id}/${contractId}_merchant_${Date.now()}.png`;
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      // Get current contract to check tenant signature
      const { data: contract } = await supabase
        .from('contracts')
        .select('tenant_signature_url')
        .eq('id', contractId)
        .single();

      const newStatus = contract?.tenant_signature_url ? 'fully_signed' : 'merchant_signed';

      // Update contract
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          merchant_signature_url: publicUrl,
          merchant_signed_at: new Date().toISOString(),
          signature_status: newStatus,
        })
        .eq('id', contractId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
      setSignDialogOpen(false);
      setSelectedContract(null);
      setSignatureDataUrl(null);
      toast.success('Contract signed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to sign contract: ${error.message}`);
    },
  });

  const handleSaveSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    toast.success('Signature captured');
  };

  const handleSignContract = () => {
    if (!signatureDataUrl || !selectedContract) {
      toast.error('Please draw your signature first');
      return;
    }
    signContractMutation.mutate({
      contractId: selectedContract.id,
      signatureUrl: signatureDataUrl,
    });
  };

  const getSignatureStatusBadge = (contract: Contract) => {
    if (contract.signature_status === 'fully_signed') {
      return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" /> Fully Signed</Badge>;
    }
    if (contract.merchant_signature_url && !contract.tenant_signature_url) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> You Signed</Badge>;
    }
    if (contract.tenant_signature_url && !contract.merchant_signature_url) {
      return <Badge variant="outline" className="gap-1 text-warning border-warning"><PenLine className="h-3 w-3" /> Awaiting Your Signature</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><PenLine className="h-3 w-3" /> Pending</Badge>;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const filteredContracts = contracts?.filter(contract => {
    const tenant = profileMap.get(contract.tenant_user_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      tenant?.full_name?.toLowerCase().includes(searchLower) ||
      tenant?.email?.toLowerCase().includes(searchLower) ||
      contract.unit?.unit_number?.toLowerCase().includes(searchLower) ||
      contract.unit?.property?.name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const activeContracts = filteredContracts.filter(c => c.status === 'active');
  const pendingSignature = filteredContracts.filter(c => 
    c.status === 'active' && 
    c.tenant_signature_url && 
    !c.merchant_signature_url
  );
  const pastContracts = filteredContracts.filter(c => c.status !== 'active');

  return (
    <MerchantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Contracts</h1>
            <p className="text-muted-foreground">Manage rental agreements with your tenants</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Contracts</p>
                  <p className="text-2xl font-bold">{contracts?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeContracts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <PenLine className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Awaiting Signature</p>
                  <p className="text-2xl font-bold">{pendingSignature.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Past Contracts</p>
                  <p className="text-2xl font-bold">{pastContracts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tenant name, property, or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Awaiting Signature ({pendingSignature.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({pastContracts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeContracts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Active Contracts</h3>
                  <p className="text-muted-foreground">Create contracts when you assign tenants to units.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    tenantProfile={profileMap.get(contract.tenant_user_id)}
                    getStatusBadge={getStatusBadge}
                    getSignatureStatusBadge={getSignatureStatusBadge}
                    onSign={() => {
                      setSelectedContract(contract);
                      setSignDialogOpen(true);
                    }}
                    onView={() => {
                      setSelectedContract(contract);
                      setViewDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {pendingSignature.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No contracts awaiting your signature.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingSignature.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    tenantProfile={profileMap.get(contract.tenant_user_id)}
                    getStatusBadge={getStatusBadge}
                    getSignatureStatusBadge={getSignatureStatusBadge}
                    onSign={() => {
                      setSelectedContract(contract);
                      setSignDialogOpen(true);
                    }}
                    onView={() => {
                      setSelectedContract(contract);
                      setViewDialogOpen(true);
                    }}
                    highlight
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {pastContracts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Past Contracts</h3>
                  <p className="text-muted-foreground">Expired or terminated contracts will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    tenantProfile={profileMap.get(contract.tenant_user_id)}
                    getStatusBadge={getStatusBadge}
                    getSignatureStatusBadge={getSignatureStatusBadge}
                    onSign={() => {}}
                    onView={() => {
                      setSelectedContract(contract);
                      setViewDialogOpen(true);
                    }}
                    isPast
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Sign Dialog */}
        <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Sign Contract</DialogTitle>
              <DialogDescription>
                Draw your signature below to sign this rental agreement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedContract && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">
                    {selectedContract.unit?.property?.name} - Unit {selectedContract.unit?.unit_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tenant: {profileMap.get(selectedContract.tenant_user_id)?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedContract.start_date), 'MMM dd, yyyy')} - {format(new Date(selectedContract.end_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}

              <SignaturePad onSave={handleSaveSignature} width={400} height={150} />

              {signatureDataUrl && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Signature captured successfully
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSignContract}
                  disabled={!signatureDataUrl || signContractMutation.isPending}
                >
                  {signContractMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenLine className="h-4 w-4 mr-2" />
                      Sign Contract
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contract Details</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">
                      {selectedContract.unit?.property?.name} - Unit {selectedContract.unit?.unit_number}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedContract.unit?.property?.address}, {selectedContract.unit?.property?.city}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Tenant</p>
                    <p className="font-medium">{profileMap.get(selectedContract.tenant_user_id)?.full_name || 'Unknown'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(selectedContract.start_date), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{format(new Date(selectedContract.end_date), 'MMMM dd, yyyy')}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Monthly Rent</p>
                    <p className="font-medium">{formatCurrency(selectedContract.rent_amount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="font-medium">{formatCurrency(selectedContract.deposit_amount || 0)}</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Signatures</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tenant Signature</p>
                      {selectedContract.tenant_signature_url ? (
                        <div className="border rounded-lg p-3 bg-white">
                          <img 
                            src={selectedContract.tenant_signature_url} 
                            alt="Tenant signature"
                            className="max-h-16 object-contain"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Signed: {selectedContract.tenant_signed_at && format(new Date(selectedContract.tenant_signed_at), 'MMM dd, yyyy h:mm a')}
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-3 bg-muted/30 text-center">
                          <p className="text-sm text-muted-foreground">Not signed yet</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Merchant Signature (You)</p>
                      {selectedContract.merchant_signature_url ? (
                        <div className="border rounded-lg p-3 bg-white">
                          <img 
                            src={selectedContract.merchant_signature_url} 
                            alt="Merchant signature"
                            className="max-h-16 object-contain"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Signed: {selectedContract.merchant_signed_at && format(new Date(selectedContract.merchant_signed_at), 'MMM dd, yyyy h:mm a')}
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-3 bg-muted/30 text-center">
                          <p className="text-sm text-muted-foreground">Not signed yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedContract.terms && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedContract.terms}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MerchantLayout>
  );
}

function ContractCard({ 
  contract, 
  tenantProfile, 
  getStatusBadge, 
  getSignatureStatusBadge,
  onSign,
  onView,
  highlight = false,
  isPast = false,
}: { 
  contract: Contract;
  tenantProfile?: { full_name: string | null; email: string } | null;
  getStatusBadge: (status: string | null) => JSX.Element;
  getSignatureStatusBadge: (contract: Contract) => JSX.Element;
  onSign: () => void;
  onView: () => void;
  highlight?: boolean;
  isPast?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-warning/50 bg-warning/5' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${highlight ? 'bg-warning/10' : 'bg-muted'}`}>
              <Home className={`h-5 w-5 ${highlight ? 'text-warning' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">
                {contract.unit?.property?.name} - Unit {contract.unit?.unit_number}
              </p>
              <p className="text-sm text-muted-foreground">
                {tenantProfile?.full_name || tenantProfile?.email || 'Unknown Tenant'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(contract.start_date), 'MMM yyyy')} - {format(new Date(contract.end_date), 'MMM yyyy')}
                <span className="mx-1">•</span>
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(contract.rent_amount)}/mo
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(contract.status)}
              {getSignatureStatusBadge(contract)}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={onView}>
                <Eye className="h-4 w-4" />
              </Button>
              {!isPast && !contract.merchant_signature_url && contract.tenant_signature_url && (
                <Button size="sm" onClick={onSign}>
                  <PenLine className="h-4 w-4 mr-1" />
                  Sign
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
