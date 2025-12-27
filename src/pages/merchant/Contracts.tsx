import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MerchantLayout } from '@/components/layouts/MerchantLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignaturePad } from '@/components/signature/SignaturePad';
import { ContractDocumentUpload } from '@/components/merchant/ContractDocumentUpload';
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
  Eye,
  Edit,
  AlertTriangle,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContractCardSkeleton, StatsCardSkeleton } from '@/components/ui/skeletons';

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

interface Property {
  id: string;
  name: string;
  units: { id: string; unit_number: string; status: string; rent_amount: number }[];
}

const contractSchema = z.object({
  unit_id: z.string().min(1, 'Please select a unit'),
  tenant_user_id: z.string().min(1, 'Please select a tenant'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  rent_amount: z.coerce.number().positive('Rent must be positive'),
  deposit_amount: z.coerce.number().min(0, 'Deposit cannot be negative'),
  billing_day: z.coerce.number().min(1).max(28).optional(),
  terms: z.string().max(10000, 'Terms cannot exceed 10,000 characters').optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
}).refine((data) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(data.start_date);
  return start >= today;
}, {
  message: 'Start date cannot be in the past',
  path: ['start_date'],
});

type ContractFormData = z.infer<typeof contractSchema>;

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editTermsDialogOpen, setEditTermsDialogOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  const contractForm = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      unit_id: '',
      tenant_user_id: '',
      start_date: '',
      end_date: '',
      rent_amount: 0,
      deposit_amount: 0,
      billing_day: undefined,
      terms: '',
    },
  });
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

  // Fetch properties with units for create dialog
  const { data: properties = [] } = useQuery({
    queryKey: ['properties-with-units', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, units(id, unit_number, status, rent_amount)')
        .eq('merchant_id', merchant.id);
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!merchant?.id,
  });

  const availableUnits = properties.flatMap(p => 
    (p.units || [])
      .filter(u => u.status === 'available')
      .map(u => ({ ...u, propertyName: p.name }))
  );

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

  // Fetch merchant's tenants
  const { data: merchantTenants = [] } = useQuery({
    queryKey: ['merchant-tenants', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase
        .from('tenants')
        .select('user_id, profiles(user_id, full_name, email)')
        .eq('linked_merchant_id', merchant.id);
      if (error) throw error;
      return data?.map((t: any) => ({
        user_id: t.user_id,
        full_name: t.profiles?.full_name || 'Unknown',
        email: t.profiles?.email || '',
      })) || [];
    },
    enabled: !!merchant?.id,
  });

  const handleCreateContract = async (data: ContractFormData) => {
    if (!merchant) return;
    setCreateLoading(true);
    try {
      // Check for existing active contract on unit
      const { data: existingUnitContract, error: unitCheckError } = await supabase
        .from('contracts')
        .select('id')
        .eq('unit_id', data.unit_id)
        .in('status', ['active', 'draft', 'pending_signature'])
        .limit(1);

      if (unitCheckError) throw unitCheckError;
      if (existingUnitContract && existingUnitContract.length > 0) {
        toast.error('This unit already has an active or pending contract');
        return;
      }

      // Check for existing active contract for tenant with this merchant
      const { data: existingTenantContract, error: tenantCheckError } = await supabase
        .from('contracts')
        .select('id')
        .eq('tenant_user_id', data.tenant_user_id)
        .eq('merchant_id', merchant.id)
        .in('status', ['active', 'draft', 'pending_signature'])
        .limit(1);

      if (tenantCheckError) throw tenantCheckError;
      if (existingTenantContract && existingTenantContract.length > 0) {
        toast.error('This tenant already has an active or pending contract with you');
        return;
      }

      const { error } = await supabase
        .from('contracts')
        .insert({
          merchant_id: merchant.id,
          unit_id: data.unit_id,
          tenant_user_id: data.tenant_user_id,
          start_date: data.start_date,
          end_date: data.end_date,
          rent_amount: data.rent_amount,
          deposit_amount: data.deposit_amount,
          billing_day: data.billing_day || null,
          terms: data.terms || null,
          status: 'draft',
        });
      if (error) throw error;
      toast.success('Contract created successfully');
      setShowCreateDialog(false);
      contractForm.reset();
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create contract');
    } finally {
      setCreateLoading(false);
    }
  };

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

  const updateTermsMutation = useMutation({
    mutationFn: async ({ contractId, terms }: { contractId: string; terms: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ terms })
        .eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
      setEditTermsDialogOpen(false);
      setSelectedContract(null);
      toast.success('Contract terms updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update terms: ${error.message}`);
    },
  });

  const markNoticeMutation = useMutation({
    mutationFn: async ({ contractId, status }: { contractId: string; status: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status })
        .eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
      toast.success('Contract marked as notice period');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
      setDeleteDialogOpen(false);
      setContractToDelete(null);
      toast.success('Contract deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contract: ${error.message}`);
    },
  });

  // Contract can be deleted only if neither party has signed
  const canDeleteContract = (contract: Contract) => {
    return !contract.tenant_signature_url && !contract.merchant_signature_url;
  };

  const handleDeleteContract = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleMarkNotice = (contract: Contract) => {
    markNoticeMutation.mutate({
      contractId: contract.id,
      status: 'notice',
    });
  };

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

  const handleEditTerms = (contract: Contract) => {
    // Lock terms after tenant signature
    if (contract.tenant_signature_url) {
      toast.error('Terms cannot be edited after tenant has signed');
      return;
    }
    setSelectedContract(contract);
    setEditingTerms(contract.terms || '');
    setEditTermsDialogOpen(true);
  };

  const handleSaveTerms = () => {
    if (!selectedContract) return;
    if (editingTerms.length > 10000) {
      toast.error('Terms cannot exceed 10,000 characters');
      return;
    }
    updateTermsMutation.mutate({
      contractId: selectedContract.id,
      terms: editingTerms,
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
      case 'notice':
        return <Badge variant="outline" className="text-warning border-warning gap-1"><Clock className="h-3 w-3" /> Notice Period</Badge>;
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
    const matchesSearch = (
      tenant?.full_name?.toLowerCase().includes(searchLower) ||
      tenant?.email?.toLowerCase().includes(searchLower) ||
      contract.unit?.unit_number?.toLowerCase().includes(searchLower) ||
      contract.unit?.property?.name?.toLowerCase().includes(searchLower)
    );
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const activeContracts = filteredContracts.filter(c => c.status === 'active');
  const draftContracts = filteredContracts.filter(c => 
    c.status === 'draft' || 
    (!c.tenant_signature_url && !c.merchant_signature_url && c.status !== 'terminated' && c.status !== 'expired')
  );
  const pendingSignature = filteredContracts.filter(c => 
    c.status === 'active' && 
    c.tenant_signature_url && 
    !c.merchant_signature_url
  );
  const pastContracts = filteredContracts.filter(c => 
    c.status === 'terminated' || c.status === 'expired' || c.status === 'completed'
  );

  return (
    <MerchantLayout
      title="Contracts"
      description="Manage rental agreements with your tenants"
      actions={
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Contract</DialogTitle>
              <DialogDescription>Create a new rental contract for a tenant</DialogDescription>
            </DialogHeader>
            <form onSubmit={contractForm.handleSubmit(handleCreateContract)} className="space-y-4">
              <div>
                <Label>Select Unit</Label>
                <Select value={contractForm.watch('unit_id')} onValueChange={(v) => contractForm.setValue('unit_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a unit" /></SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.propertyName} - Unit {unit.unit_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pilih Tenant</Label>
                <Select value={contractForm.watch('tenant_user_id')} onValueChange={(v) => contractForm.setValue('tenant_user_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih tenant" /></SelectTrigger>
                  <SelectContent>
                    {merchantTenants.map((tenant: any) => (
                      <SelectItem key={tenant.user_id} value={tenant.user_id}>
                        {tenant.full_name} ({tenant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" {...contractForm.register('start_date')} /></div>
                <div><Label>End Date</Label><Input type="date" {...contractForm.register('end_date')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Monthly Rent (IDR)</Label><Input type="number" {...contractForm.register('rent_amount')} /></div>
                <div><Label>Deposit (IDR)</Label><Input type="number" {...contractForm.register('deposit_amount')} /></div>
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea placeholder="Contract terms..." {...contractForm.register('terms')} rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Contract'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">

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

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tenant name, property, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="notice">Notice Period</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="draft">Draft ({draftContracts.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeContracts.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Awaiting Signature ({pendingSignature.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({pastContracts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : draftContracts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Draft Contracts</h3>
                  <p className="text-muted-foreground">Draft contracts that haven't been signed will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {draftContracts.map((contract) => (
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
                    canDelete={canDeleteContract(contract)}
                    onDelete={() => handleDeleteContract(contract)}
                    isDeleting={deleteContractMutation.isPending && contractToDelete?.id === contract.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

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
                    onMarkNotice={() => handleMarkNotice(contract)}
                    isMarkingNotice={markNoticeMutation.isPending}
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

                {/* Contract Document Upload */}
                <div className="border rounded-lg p-4">
                  <ContractDocumentUpload
                    contractId={selectedContract.id}
                    currentDocumentUrl={selectedContract.contract_document_url}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['merchant-contracts'] });
                    }}
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Terms & Conditions</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleEditTerms(selectedContract);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Terms
                    </Button>
                  </div>
                  {selectedContract.terms ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedContract.terms}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No terms specified. Click "Edit Terms" to add.</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Terms Dialog */}
        <Dialog open={editTermsDialogOpen} onOpenChange={setEditTermsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contract Terms</DialogTitle>
              <DialogDescription>
                Update the terms and conditions for this rental agreement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedContract && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium">
                    {selectedContract.unit?.property?.name} - Unit {selectedContract.unit?.unit_number}
                  </p>
                  <p className="text-muted-foreground">
                    Tenant: {profileMap.get(selectedContract.tenant_user_id)?.full_name || 'Unknown'}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={editingTerms}
                  onChange={(e) => setEditingTerms(e.target.value)}
                  placeholder="Enter the terms and conditions for this rental agreement..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTermsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTerms}
                disabled={updateTermsMutation.isPending}
              >
                {updateTermsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Terms'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Contract AlertDialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contract?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the contract for{' '}
                <strong>{contractToDelete?.unit?.property?.name} - Unit {contractToDelete?.unit?.unit_number}</strong>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => contractToDelete && deleteContractMutation.mutate(contractToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteContractMutation.isPending}
              >
                {deleteContractMutation.isPending ? 'Deleting...' : 'Delete Contract'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
  onMarkNotice,
  onDelete,
  canDelete = false,
  highlight = false,
  isPast = false,
  isMarkingNotice = false,
  isDeleting = false,
}: { 
  contract: Contract;
  tenantProfile?: { full_name: string | null; email: string } | null;
  getStatusBadge: (status: string | null) => JSX.Element;
  getSignatureStatusBadge: (contract: Contract) => JSX.Element;
  onSign: () => void;
  onView: () => void;
  onMarkNotice?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
  highlight?: boolean;
  isPast?: boolean;
  isMarkingNotice?: boolean;
  isDeleting?: boolean;
}) {
  const canMarkNotice = contract.status === 'active' && !isPast;
  
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
              {canMarkNotice && onMarkNotice && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onMarkNotice}
                  disabled={isMarkingNotice}
                  className="text-warning border-warning hover:bg-warning/10"
                >
                  {isMarkingNotice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mark Notice
                    </>
                  )}
                </Button>
              )}
              {canDelete && onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
