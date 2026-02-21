import { AdminMerchantFilters } from '@/features/users/components/admin/AdminMerchantFilters';
import { AdminMerchantsTable } from '@/features/users/components/admin/AdminMerchantsTable';
import { AdminMerchantStats } from '@/features/users/components/admin/AdminMerchantStats';
import { useMerchantActions } from '@/features/users/hooks/useMerchantActions';
import { useMerchants } from '@/features/users/hooks/useMerchants';
import { Merchant } from '@/features/users/types/admin-merchant';
import { BulkApprovalDialog } from '@/features/verification/components/BulkApprovalDialog';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { exportToCSV, exportToPDF } from '@/shared/utils/exportUtils';
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
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
  
  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const handleViewMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setShowDetailDialog(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleVerify = async (status: 'verified' | 'rejected', rejectionData?: any) => {
    if (!selectedMerchant) return;
    await verifyMerchant(selectedMerchant, status, rejectionData, approvalNotes);
  };

  const handleSuspend = async (merchant?: Merchant) => {
    const targetMerchant = merchant || selectedMerchant;
    if (!targetMerchant) return;
    await suspendMerchant(targetMerchant);
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

  const paginatedMerchants = filteredMerchants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredMerchants.length / PAGE_SIZE);

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
        <AdminMerchantStats 
          total={merchants.length}
          pending={merchants.filter(m => m.verification_status === 'pending').length}
          verified={merchants.filter(m => m.verification_status === 'verified').length}
          rejected={merchants.filter(m => m.verification_status === 'rejected').length}
          suspended={merchants.filter(m => m.verification_status === 'suspended').length}
          activePaid={activePaidCount}
          isLoading={loading}
        />

        {/* Filters */}
        <AdminMerchantFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          tierFilter={tierFilter}
          onTierFilterChange={setTierFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

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
            {error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Gagal memuat data merchant</p>
                <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
              </div>
            ) : (
              <AdminMerchantsTable
                merchants={paginatedMerchants}
                selectedMerchantIds={selectedMerchantIds}
                onToggleSelection={toggleMerchantSelection}
                onToggleSelectAll={toggleSelectAll}
                onViewDetails={handleViewMerchant}
                onApprove={(merchant) => {
                  setSelectedMerchant(merchant);
                  setShowApprovalNotesDialog(true);
                }}
                onReject={(merchant) => {
                  setSelectedMerchant(merchant);
                  setShowRejectionDialog(true);
                }}
                onSuspend={(merchant) => {
                  setSelectedMerchant(merchant);
                  handleSuspend(merchant);
                }}
                isLoading={loading}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>

        {/* Merchant Detail Dialog */}
        <MerchantDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          merchant={selectedMerchant}
          onSuspend={handleSuspend}
          onApprove={() => setShowApprovalNotesDialog(true)}
          onReject={() => setShowRejectionDialog(true)}
          actionLoading={actionLoading}
        />

        {/* Rejection Dialog */}
        <MerchantRejectionDialog
          open={showRejectionDialog}
          onOpenChange={setShowRejectionDialog}
          onConfirm={(data) => handleVerify('rejected', data)}
          isLoading={actionLoading}
        />

        {/* Approval Notes Dialog */}
        <MerchantApprovalDialog
          open={showApprovalNotesDialog}
          onOpenChange={setShowApprovalNotesDialog}
          onConfirm={() => handleVerify('verified')}
          approvalNotes={approvalNotes}
          setApprovalNotes={setApprovalNotes}
          isLoading={actionLoading}
        />

        {/* Bulk Approval Dialog */}
        <BulkApprovalDialog
          open={showBulkApprovalDialog}
          onOpenChange={setShowBulkApprovalDialog}
          merchantCount={selectedMerchantIds.length}
          onConfirm={handleBulkApprove}
          isLoading={actionLoading}
        />
      </div>
    </AdminLayout>
  );
}
