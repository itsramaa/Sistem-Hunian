import { VendorVerificationFilters } from '@/features/verification/components/admin/VendorVerificationFilters';
import { VendorVerificationStats } from '@/features/verification/components/admin/VendorVerificationStats';
import { VendorVerificationTable } from '@/features/verification/components/admin/VendorVerificationTable';
import { useVendorVerifications } from '@/features/verification/hooks/useVendorVerifications';
import { VendorVerification } from '@/features/verification/types';
import { AdminLayout } from '@/shared/components/layouts/AdminLayout';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminVendorVerifications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<VendorVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { verifications, isLoading, updateVerification, isUpdating } = useVendorVerifications();

  const handleApprove = (verification: VendorVerification) => {
    updateVerification(
      { id: verification.id, status: 'verified' },
      {
        onSuccess: () => {
          toast.success('Verifikasi berhasil disetujui');
        },
        onError: (error) => {
          toast.error(`Gagal menyetujui: ${error.message}`);
        }
      }
    );
  };

  const handleReject = () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast.error('Mohon berikan alasan penolakan');
      return;
    }
    updateVerification(
      { 
        id: selectedVerification.id, 
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      },
      {
        onSuccess: () => {
          toast.success('Verifikasi ditolak');
          setShowRejectDialog(false);
          setSelectedVerification(null);
          setRejectionReason('');
        },
        onError: (error) => {
          toast.error(`Gagal menolak: ${error.message}`);
        }
      }
    );
  };

  const openRejectDialog = (verification: VendorVerification) => {
    setSelectedVerification(verification);
    setShowRejectDialog(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = 
      v.vendor?.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.document_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    verified: verifications.filter(v => v.status === 'verified').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
  };

  return (
    <AdminLayout 
      title="Verifikasi Vendor" 
      description="Tinjau dan kelola pengajuan dokumen vendor"
    >
      <div className="space-y-6">
        <VendorVerificationStats stats={stats} isLoading={isLoading} />

        <div className="space-y-4">
          <VendorVerificationFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onResetFilters={handleResetFilters}
          />

          <VendorVerificationTable
            verifications={filteredVerifications}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={openRejectDialog}
          />
        </div>

        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Verifikasi</DialogTitle>
              <DialogDescription>
                Berikan alasan penolakan permintaan verifikasi ini. Ini akan terlihat oleh vendor.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Masukkan alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tolak Verifikasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
