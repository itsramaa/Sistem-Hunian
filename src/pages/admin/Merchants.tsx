import { MerchantAnalyticsTab } from '@/features/analytics/components/MerchantAnalyticsTab';
import { MerchantActivityTab } from '@/features/audit-logs/components/MerchantActivityTab';
import { DocumentLightbox } from '@/features/contracts/components/DocumentLightbox';
import { MerchantPropertiesTab } from '@/features/properties/components/MerchantPropertiesTab';
import { STATUS_COLORS, STATUS_ICONS } from '@/features/users/constants/merchant';
import { useMerchantActions } from '@/features/users/hooks/useMerchantActions';
import { useMerchants } from '@/features/users/hooks/useMerchants';
import { Merchant } from '@/features/users/types/admin-merchant';
import { BulkApprovalDialog } from '@/features/verification/components/BulkApprovalDialog';
import { MerchantVerificationHistory } from '@/features/verification/components/MerchantVerificationHistory';
import { RejectionReasonForm } from '@/features/verification/components/RejectionReasonForm';
import { useMerchantVerifications } from '@/features/verification/hooks/useMerchantVerifications';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar as CalendarComponent } from '@/shared/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { exportToCSV, exportToPDF } from '@/shared/utils/exportUtils';
import { format } from 'date-fns';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  History,
  Home,
  Image,
  Search,
  Users,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

export default function AdminMerchants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showApprovalNotesDialog, setShowApprovalNotesDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Bulk selection state
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<string[]>([]);
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false);
  
  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  // Hooks
  const { merchants, loading, error, activePaidCount, refetch } = useMerchants({
    status: statusFilter,
    tier: tierFilter,
    dateRange
  });
  
  const { verifyMerchant, suspendMerchant, bulkApprove, loading: actionLoading } = useMerchantActions(() => {
    refetch();
    setShowDetailDialog(false);
    setShowRejectionDialog(false);
    setShowApprovalNotesDialog(false);
    setShowBulkApprovalDialog(false);
    setSelectedMerchantIds([]);
    setApprovalNotes('');
  });

  const { verifications, loading: verificationsLoading, error: verificationsError } = useMerchantVerifications(selectedMerchant?.id || null);

  const handleViewMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setShowDetailDialog(true);
  };

  const handleVerify = async (status: 'verified' | 'rejected', rejectionData?: any) => {
    if (!selectedMerchant) return;
    await verifyMerchant(selectedMerchant, status, rejectionData, approvalNotes);
  };

  const handleSuspend = async () => {
    if (!selectedMerchant) return;
    await suspendMerchant(selectedMerchant);
  };

  const handleBulkApprove = async (notes: string) => {
    await bulkApprove(merchants, selectedMerchantIds, notes);
  };

  const filteredMerchants = merchants.filter(merchant => {
    const searchLower = searchQuery.toLowerCase();
    return (
      merchant.business_name.toLowerCase().includes(searchLower) ||
      merchant.profiles?.email?.toLowerCase().includes(searchLower) ||
      merchant.city?.toLowerCase().includes(searchLower)
    );
  });

  const pendingMerchantsCount = filteredMerchants.filter(m => m.verification_status === 'pending').length;

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

  const StatusIcon = ({ status }: { status: string }) => {
    const Icon = STATUS_ICONS[status] || Clock;
    return <Icon className="h-4 w-4" />;
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
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Gagal memuat data merchant</p>
                <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
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
                          <Badge variant="outline" className={STATUS_COLORS[merchant.verification_status]}>
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
                      <Badge variant="outline" className={STATUS_COLORS[selectedMerchant.verification_status]}>
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
                  {verificationsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 flex gap-3">
                          <div className="h-12 w-12 rounded bg-muted animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : verificationsError ? (
                    <div className="text-center py-8 text-destructive">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Gagal memuat dokumen</p>
                      <p className="text-xs text-muted-foreground mt-1">{(verificationsError as Error).message}</p>
                    </div>
                  ) : verifications.length === 0 ? (
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
                            <Badge variant="outline" className={STATUS_COLORS[doc.status]}>
                              {doc.status}
                            </Badge>
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

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between items-center border-t pt-4 mt-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {selectedMerchant?.verification_status === 'suspended' ? 'Reactivate' : 'Suspend'}
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                {selectedMerchant?.verification_status !== 'verified' && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowRejectionDialog(true)}
                      disabled={actionLoading}
                      className="flex-1 sm:flex-none"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="bg-success hover:bg-success/90 text-white flex-1 sm:flex-none"
                      onClick={() => setShowApprovalNotesDialog(true)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Verification</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection. This will be sent to the merchant.
              </DialogDescription>
            </DialogHeader>
            <RejectionReasonForm 
              onSubmit={(data) => handleVerify('rejected', data)}
              onCancel={() => setShowRejectionDialog(false)}
              isLoading={actionLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Approval Notes Dialog */}
        <Dialog open={showApprovalNotesDialog} onOpenChange={setShowApprovalNotesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Verification</DialogTitle>
              <DialogDescription>
                Add optional notes for this approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Internal Notes (Optional)</Label>
                <Textarea 
                  placeholder="Add notes about this approval..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalNotesDialog(false)}>Cancel</Button>
              <Button 
                className="bg-success hover:bg-success/90 text-white"
                onClick={() => handleVerify('verified')}
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Approval Dialog */}
        <BulkApprovalDialog
          open={showBulkApprovalDialog}
          onOpenChange={setShowBulkApprovalDialog}
          merchantCount={selectedMerchantIds.length}
          onConfirm={handleBulkApprove}
          isLoading={actionLoading}
        />

        {/* Document Lightbox */}
        {showLightbox && verifications.length > 0 && (
          <DocumentLightbox
            documents={verifications.map(v => ({ url: v.document_url, type: v.document_type }))}
            initialIndex={lightboxInitialIndex}
            onClose={() => setShowLightbox(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
