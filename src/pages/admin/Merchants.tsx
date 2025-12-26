import { useState, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  FileText,
  Download,
  Calendar,
  Users,
  CreditCard,
  Image,
  History,
  Home,
  BarChart3,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { format } from 'date-fns';
import { MerchantVerificationHistory } from '@/components/admin/MerchantVerificationHistory';
import { MerchantPropertiesTab } from '@/components/admin/MerchantPropertiesTab';
import { DocumentLightbox } from '@/components/admin/DocumentLightbox';
import { RejectionReasonForm } from '@/components/admin/RejectionReasonForm';
import { BulkApprovalDialog } from '@/components/admin/BulkApprovalDialog';
import { MerchantAnalyticsTab } from '@/components/admin/MerchantAnalyticsTab';
import { MerchantActivityTab } from '@/components/admin/MerchantActivityTab';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { logExport } from '@/lib/auditLog';

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
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
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
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showApprovalNotesDialog, setShowApprovalNotesDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activePaidCount, setActivePaidCount] = useState(0);
  
  // Bulk selection state
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<string[]>([]);
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false);
  
  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchMerchants();
    fetchActivePaidCount();
  }, [statusFilter, tierFilter, dateRange]);

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
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
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

  const fetchActivePaidCount = async () => {
    try {
      const { count, error } = await supabase
        .from('merchant_subscriptions')
        .select('*, subscription_tiers!inner(name)', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('subscription_tiers.name', 'free');

      if (error) throw error;
      setActivePaidCount(count || 0);
    } catch (error) {
      console.error('Error fetching active paid count:', error);
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

  const handleVerifyMerchant = async (status: 'verified' | 'rejected', rejectionData?: {
    reason: string;
    reasonLabel: string;
    details: string;
    resubmissionInstructions: string;
  }) => {
    if (!selectedMerchant) return;

    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      const updateData: Record<string, unknown> = {
        verification_status: status,
      };

      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = adminId;
      } else if (status === 'rejected' && rejectionData) {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejected_by = adminId;
        updateData.rejection_details = rejectionData.details;
        updateData.resubmission_instructions = rejectionData.resubmissionInstructions;
      }

      const { error } = await supabase
        .from('merchants')
        .update(updateData)
        .eq('id', selectedMerchant.id);

      if (error) throw error;

      // Insert verification history
      await supabase.from('merchant_verification_history').insert({
        merchant_id: selectedMerchant.id,
        action: status === 'verified' ? 'approved' : 'rejected',
        performed_by: adminId,
        approval_notes: status === 'verified' ? approvalNotes : null,
        rejection_reason: rejectionData?.reasonLabel,
        rejection_details: rejectionData?.details,
        resubmission_instructions: rejectionData?.resubmissionInstructions,
        old_status: selectedMerchant.verification_status,
        new_status: status,
      });

      // Insert audit log
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: status === 'verified' ? 'verification_approved' : 'verification_rejected',
        entity_type: 'merchant',
        entity_id: selectedMerchant.id,
        old_data: { verification_status: selectedMerchant.verification_status },
        new_data: { verification_status: status, ...rejectionData },
        user_agent: navigator.userAgent,
      });

      // Create notification for merchant
      await supabase.from('notifications').insert({
        user_id: selectedMerchant.user_id,
        type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
        title: status === 'verified' ? 'Akun Terverifikasi!' : 'Verifikasi Ditolak',
        message: status === 'verified' 
          ? 'Selamat! Akun bisnis Anda telah terverifikasi. Semua fitur telah dibuka.'
          : `Pengajuan verifikasi Anda ditolak: ${rejectionData?.reasonLabel}. Silakan perbaiki dan ajukan kembali.`,
        link: '/merchant',
      });

      // Send email notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
            recipientEmail: selectedMerchant.profiles?.email,
            recipientName: selectedMerchant.profiles?.full_name || 'Merchant',
            data: {
              businessName: selectedMerchant.business_name,
              dashboardLink: `${window.location.origin}/merchant`,
              approvalNotes: status === 'verified' ? approvalNotes : null,
              rejectionReason: rejectionData?.reasonLabel,
              rejectionDetails: rejectionData?.details,
              resubmissionInstructions: rejectionData?.resubmissionInstructions,
            }
          }
        });
        console.log('Verification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't throw - email is not critical
      }

      toast({
        title: status === 'verified' ? 'Merchant Diverifikasi' : 'Merchant Ditolak',
        description: `${selectedMerchant.business_name} telah ${status === 'verified' ? 'diverifikasi' : 'ditolak'}`,
      });

      setShowRejectionDialog(false);
      setShowApprovalNotesDialog(false);
      setShowDetailDialog(false);
      setApprovalNotes('');
      fetchMerchants();
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengupdate status merchant',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendMerchant = async () => {
    if (!selectedMerchant) return;
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;
      
      const newStatus = selectedMerchant.verification_status === 'suspended' ? 'verified' : 'suspended';
      const { error } = await supabase
        .from('merchants')
        .update({ verification_status: newStatus })
        .eq('id', selectedMerchant.id);

      if (error) throw error;

      // Insert verification history
      await supabase.from('merchant_verification_history').insert({
        merchant_id: selectedMerchant.id,
        action: newStatus === 'suspended' ? 'suspended' : 'reactivated',
        performed_by: adminId,
        old_status: selectedMerchant.verification_status,
        new_status: newStatus,
      });

      // Insert audit log
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: newStatus === 'suspended' ? 'merchant_suspended' : 'merchant_reactivated',
        entity_type: 'merchant',
        entity_id: selectedMerchant.id,
        old_data: { verification_status: selectedMerchant.verification_status },
        new_data: { verification_status: newStatus },
        user_agent: navigator.userAgent,
      });

      toast({
        title: newStatus === 'suspended' ? 'Merchant Ditangguhkan' : 'Merchant Diaktifkan Kembali',
        description: `${selectedMerchant.business_name} telah ${newStatus === 'suspended' ? 'ditangguhkan' : 'diaktifkan kembali'}`,
      });

      setShowDetailDialog(false);
      fetchMerchants();
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal mengupdate status merchant',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApproval = async (notes: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id;

    for (const merchantId of selectedMerchantIds) {
      const merchant = merchants.find(m => m.id === merchantId);
      if (!merchant || merchant.verification_status !== 'pending') continue;

      await supabase
        .from('merchants')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', merchantId);

      await supabase.from('merchant_verification_history').insert({
        merchant_id: merchantId,
        action: 'approved',
        performed_by: adminId,
        approval_notes: notes,
        old_status: 'pending',
        new_status: 'verified',
      });

      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'verification_approved',
        entity_type: 'merchant',
        entity_id: merchantId,
        old_data: { verification_status: 'pending' },
        new_data: { verification_status: 'verified', approval_notes: notes },
        user_agent: navigator.userAgent,
      });

      await supabase.from('notifications').insert({
        user_id: merchant.user_id,
        type: 'verification_approved',
        title: 'Akun Terverifikasi!',
        message: 'Selamat! Akun bisnis Anda telah terverifikasi. Semua fitur telah dibuka.',
        link: '/merchant',
      });

      // Send email notification for bulk approval
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'verification_approved',
            recipientEmail: merchant.profiles?.email,
            recipientName: merchant.profiles?.full_name || 'Merchant',
            data: {
              businessName: merchant.business_name,
              dashboardLink: `${window.location.origin}/merchant`,
              approvalNotes: notes || null,
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send bulk approval email:', emailError);
      }
    }

    toast({
      title: 'Bulk Approval Selesai',
      description: `${selectedMerchantIds.length} merchant telah diverifikasi`,
    });

    setSelectedMerchantIds([]);
    fetchMerchants();
  };

  const toggleMerchantSelection = (merchantId: string) => {
    setSelectedMerchantIds(prev => 
      prev.includes(merchantId)
        ? prev.filter(id => id !== merchantId)
        : [...prev, merchantId]
    );
  };

  const toggleSelectAll = () => {
    const pendingMerchants = filteredMerchants.filter(m => m.verification_status === 'pending');
    if (selectedMerchantIds.length === pendingMerchants.length) {
      setSelectedMerchantIds([]);
    } else {
      setSelectedMerchantIds(pendingMerchants.map(m => m.id));
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

  const openLightbox = (index: number) => {
    setLightboxInitialIndex(index);
    setShowLightbox(true);
  };

  const pendingMerchantsCount = filteredMerchants.filter(m => m.verification_status === 'pending').length;

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

        {/* Stats Cards - 6 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{merchants.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activePaidCount}</p>
                  <p className="text-xs text-muted-foreground">Paid Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
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
                <SelectTrigger className="w-full lg:w-[160px]">
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
                <SelectTrigger className="w-full lg:w-[160px]">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full lg:w-auto justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                  {(dateRange.from || dateRange.to) && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Bar */}
        {selectedMerchantIds.length > 0 && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedMerchantIds.length === pendingMerchantsCount && pendingMerchantsCount > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedMerchantIds.length} merchant dipilih
                  </span>
                </div>
                <Button onClick={() => setShowBulkApprovalDialog(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Bulk Approve ({selectedMerchantIds.length})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                      <th className="text-left py-3 px-2 w-10">
                        <Checkbox 
                          checked={selectedMerchantIds.length === pendingMerchantsCount && pendingMerchantsCount > 0}
                          onCheckedChange={toggleSelectAll}
                          disabled={pendingMerchantsCount === 0}
                        />
                      </th>
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
                        <td className="py-3 px-2">
                          {merchant.verification_status === 'pending' && (
                            <Checkbox 
                              checked={selectedMerchantIds.includes(merchant.id)}
                              onCheckedChange={() => toggleMerchantSelection(merchant.id)}
                            />
                          )}
                        </td>
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

        {/* Merchant Detail Dialog - Enhanced with 6 tabs */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Docs
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-1">
                    <History className="h-3 w-3" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Activity
                  </TabsTrigger>
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
                      {verifications.map((doc, index) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors"
                          onClick={() => openLightbox(index)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-background border overflow-hidden">
                              <img 
                                src={doc.document_url} 
                                alt={doc.document_type}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusColors[doc.status]}>
                              {doc.status}
                            </Badge>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="properties" className="mt-4">
                  <MerchantPropertiesTab merchantId={selectedMerchant.id} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-4">
                  <MerchantAnalyticsTab merchantId={selectedMerchant.id} />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <MerchantVerificationHistory merchantId={selectedMerchant.id} />
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <MerchantActivityTab merchantId={selectedMerchant.id} />
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter className="mt-6 gap-2">
              {selectedMerchant?.verification_status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectionDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    Reject
                  </Button>
                  <Button onClick={() => setShowApprovalNotesDialog(true)} disabled={actionLoading}>
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

        {/* Approval Notes Dialog */}
        <Dialog open={showApprovalNotesDialog} onOpenChange={setShowApprovalNotesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                Approve Merchant
              </DialogTitle>
              <DialogDescription>
                Approve {selectedMerchant?.business_name} verification. Add optional notes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approval-notes">Catatan Approval (Opsional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Tambahkan catatan untuk approval ini..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalNotesDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleVerifyMerchant('verified')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Memproses...' : 'Confirm Approval'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog with Enhanced Form */}
        <RejectionReasonForm
          open={showRejectionDialog}
          onOpenChange={setShowRejectionDialog}
          merchantName={selectedMerchant?.business_name || ''}
          onConfirm={(data) => handleVerifyMerchant('rejected', data)}
          loading={actionLoading}
        />

        {/* Document Lightbox */}
        <DocumentLightbox
          open={showLightbox}
          onOpenChange={setShowLightbox}
          documents={verifications}
          initialIndex={lightboxInitialIndex}
        />

        {/* Bulk Approval Dialog */}
        <BulkApprovalDialog
          open={showBulkApprovalDialog}
          onOpenChange={setShowBulkApprovalDialog}
          selectedCount={selectedMerchantIds.length}
          onConfirm={handleBulkApproval}
        />
      </div>
    </AdminLayout>
  );
}
