import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download
} from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  address: string | null;
  city: string | null;
  province: string | null;
  verification_status: string;
  subscription_tier: string;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string | null;
    phone: string | null;
  };
}

interface Verification {
  id: string;
  merchant_id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  verified: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  suspended: 'bg-muted text-muted-foreground border-muted',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
  suspended: AlertTriangle,
};

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMerchants();
  }, [statusFilter, tierFilter]);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('merchants')
        .select(`
          *,
          profiles!merchants_user_id_fkey (
            email,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }
      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMerchants((data as unknown as Merchant[]) || []);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load merchants',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifications = async (merchantId: string) => {
    try {
      const { data, error } = await supabase
        .from('merchant_verifications')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerifications((data as Verification[]) || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  const handleViewMerchant = async (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    await fetchVerifications(merchant.id);
    setShowDetailDialog(true);
  };

  const handleVerifyMerchant = async (status: 'verified' | 'rejected') => {
    if (!selectedMerchant) return;
    
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejection',
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ 
          verification_status: status,
        })
        .eq('id', selectedMerchant.id);

      if (error) throw error;

      toast({
        title: status === 'verified' ? 'Merchant Verified' : 'Merchant Rejected',
        description: `${selectedMerchant.business_name} has been ${status}`,
      });

      setShowVerifyDialog(false);
      setShowDetailDialog(false);
      setRejectionReason('');
      fetchMerchants();
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update merchant status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendMerchant = async () => {
    if (!selectedMerchant) return;
    
    setActionLoading(true);
    try {
      const newStatus = selectedMerchant.verification_status === 'suspended' ? 'verified' : 'suspended';
      const { error } = await supabase
        .from('merchants')
        .update({ verification_status: newStatus })
        .eq('id', selectedMerchant.id);

      if (error) throw error;

      toast({
        title: newStatus === 'suspended' ? 'Merchant Suspended' : 'Merchant Reactivated',
        description: `${selectedMerchant.business_name} has been ${newStatus}`,
      });

      setShowDetailDialog(false);
      fetchMerchants();
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update merchant status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    const searchLower = searchQuery.toLowerCase();
    return (
      merchant.business_name.toLowerCase().includes(searchLower) ||
      merchant.profiles?.email?.toLowerCase().includes(searchLower) ||
      merchant.city?.toLowerCase().includes(searchLower)
    );
  });

  const StatusIcon = ({ status }: { status: string }) => {
    const Icon = statusIcons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const handleExportMerchants = () => {
    const data = filteredMerchants.map(m => ({
      'Business Name': m.business_name,
      'Business Type': m.business_type,
      'Email': m.profiles?.email || '',
      'Phone': m.profiles?.phone || '',
      'City': m.city || '',
      'Province': m.province || '',
      'Status': m.verification_status,
      'Tier': m.subscription_tier,
      'Joined': new Date(m.created_at).toLocaleDateString(),
    }));
    exportToCSV(data, 'merchants-export');
  };

  const handleExportPDF = () => {
    const data = filteredMerchants.map(m => ({
      'Business Name': m.business_name,
      'Email': m.profiles?.email || '',
      'City': m.city || '',
      'Status': m.verification_status,
      'Tier': m.subscription_tier,
    }));
    exportToPDF(data, 'Merchants Report', 'merchants-report');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Merchant Management</h1>
            <p className="text-muted-foreground">Review and manage merchant accounts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportMerchants}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{merchants.filter(m => m.verification_status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{merchants.filter(m => m.verification_status === 'verified').length}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{merchants.filter(m => m.verification_status === 'rejected').length}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{merchants.filter(m => m.verification_status === 'suspended').length}</p>
                  <p className="text-xs text-muted-foreground">Suspended</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business name, email, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Merchants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Merchants ({filteredMerchants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredMerchants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No merchants found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Business</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMerchants.map((merchant) => (
                      <tr key={merchant.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{merchant.business_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{merchant.business_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">{merchant.profiles?.email}</p>
                          <p className="text-xs text-muted-foreground">{merchant.profiles?.phone || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">{merchant.city || '-'}</p>
                          <p className="text-xs text-muted-foreground">{merchant.province || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={statusColors[merchant.verification_status]}>
                            <StatusIcon status={merchant.verification_status} />
                            <span className="ml-1 capitalize">{merchant.verification_status}</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="capitalize">
                            {merchant.subscription_tier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(merchant.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewMerchant(merchant)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merchant Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedMerchant?.business_name}
              </DialogTitle>
              <DialogDescription>
                Merchant details and verification status
              </DialogDescription>
            </DialogHeader>

            {selectedMerchant && (
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents ({verifications.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Business Name</Label>
                      <p className="font-medium">{selectedMerchant.business_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Business Type</Label>
                      <p className="font-medium capitalize">{selectedMerchant.business_type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedMerchant.profiles?.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedMerchant.profiles?.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="font-medium">{selectedMerchant.address || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">City</Label>
                      <p className="font-medium">{selectedMerchant.city || '-'}, {selectedMerchant.province || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge variant="outline" className={statusColors[selectedMerchant.verification_status]}>
                        <StatusIcon status={selectedMerchant.verification_status} />
                        <span className="ml-1 capitalize">{selectedMerchant.verification_status}</span>
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Subscription</Label>
                      <Badge variant="secondary" className="capitalize">
                        {selectedMerchant.subscription_tier}
                      </Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                  {verifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No documents uploaded yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verifications.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={statusColors[doc.status]}>
                            {doc.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter className="mt-6 gap-2">
              {selectedMerchant?.verification_status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowVerifyDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    Reject
                  </Button>
                  <Button onClick={() => handleVerifyMerchant('verified')} disabled={actionLoading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
              {selectedMerchant?.verification_status === 'verified' && (
                <Button variant="destructive" onClick={handleSuspendMerchant} disabled={actionLoading}>
                  Suspend Merchant
                </Button>
              )}
              {selectedMerchant?.verification_status === 'suspended' && (
                <Button onClick={handleSuspendMerchant} disabled={actionLoading}>
                  Reactivate Merchant
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Merchant</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this merchant application.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleVerifyMerchant('rejected')}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
