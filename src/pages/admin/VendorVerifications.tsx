import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  FileText, 
  Eye, 
  Loader2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Verification {
  id: string;
  vendor_id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  vendor?: {
    id: string;
    business_name: string;
    contact_email: string;
    user_id: string;
  };
}

export default function AdminVendorVerifications() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['admin-vendor-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_verifications')
        .select(`
          *,
          vendor:vendors (
            id,
            business_name,
            contact_email,
            user_id
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Verification[];
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      const updateData: Record<string, unknown> = {
        status,
        reviewed_at: new Date().toISOString(),
      };
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('vendor_verifications')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;

      // If approved, update vendor verification status
      if (status === 'verified') {
        const verification = verifications.find(v => v.id === id);
        if (verification) {
          // Check if vendor has at least 2 verified documents
          const vendorVerifications = verifications.filter(
            v => v.vendor_id === verification.vendor_id && 
            (v.status === 'verified' || (v.id === id && status === 'verified'))
          );
          
          if (vendorVerifications.length >= 2) {
            await supabase
              .from('vendors')
              .update({ verification_status: 'verified' })
              .eq('id', verification.vendor_id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-verifications'] });
      toast.success('Verification updated');
      setShowRejectDialog(false);
      setSelectedVerification(null);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleApprove = (verification: Verification) => {
    updateVerificationMutation.mutate({ id: verification.id, status: 'verified' });
  };

  const handleReject = () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    updateVerificationMutation.mutate({ 
      id: selectedVerification.id, 
      status: 'rejected',
      rejectionReason: rejectionReason.trim()
    });
  };

  const openRejectDialog = (verification: Verification) => {
    setSelectedVerification(verification);
    setShowRejectDialog(true);
  };

  const filteredVerifications = verifications.filter(v => 
    v.vendor?.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const verifiedCount = verifications.filter(v => v.status === 'verified').length;
  const rejectedCount = verifications.filter(v => v.status === 'rejected').length;

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      ktp: 'KTP (ID Card)',
      nib: 'NIB (Business Registration)',
      siup: 'SIUP (Trade License)',
      business_photo: 'Business Photo',
      portfolio: 'Portfolio',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const VerificationCard = ({ verification }: { verification: Verification }) => (
    <Card key={verification.id}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {verification.vendor?.business_name?.charAt(0) || 'V'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="font-medium">{verification.vendor?.business_name}</h4>
              <p className="text-sm text-muted-foreground">{verification.vendor?.contact_email}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getDocumentLabel(verification.document_type)}</Badge>
                {getStatusBadge(verification.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                Submitted {format(new Date(verification.created_at), 'MMM d, yyyy h:mm a')}
              </p>
              {verification.rejection_reason && (
                <p className="text-xs text-destructive mt-1">
                  Reason: {verification.rejection_reason}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(verification.document_url, '_blank')}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {verification.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  className="bg-success hover:bg-success/90"
                  onClick={() => handleApprove(verification)}
                  disabled={updateVerificationMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openRejectDialog(verification)}
                  disabled={updateVerificationMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Verifications</h1>
          <p className="text-muted-foreground">Review and manage vendor verification documents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold">{verifiedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by vendor name or document type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="verified" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({verifiedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({rejectedCount})
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredVerifications.filter(v => v.status === 'pending').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending verifications</p>
                </CardContent>
              </Card>
            ) : (
              filteredVerifications
                .filter(v => v.status === 'pending')
                .map(v => <VerificationCard key={v.id} verification={v} />)
            )}
          </TabsContent>

          <TabsContent value="verified" className="mt-6 space-y-4">
            {filteredVerifications.filter(v => v.status === 'verified').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No verified documents</p>
                </CardContent>
              </Card>
            ) : (
              filteredVerifications
                .filter(v => v.status === 'verified')
                .map(v => <VerificationCard key={v.id} verification={v} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6 space-y-4">
            {filteredVerifications.filter(v => v.status === 'rejected').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No rejected documents</p>
                </CardContent>
              </Card>
            ) : (
              filteredVerifications
                .filter(v => v.status === 'rejected')
                .map(v => <VerificationCard key={v.id} verification={v} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-4">
            {filteredVerifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No verifications found</p>
                </CardContent>
              </Card>
            ) : (
              filteredVerifications.map(v => <VerificationCard key={v.id} verification={v} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this document. This will be visible to the vendor.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || updateVerificationMutation.isPending}
            >
              {updateVerificationMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}