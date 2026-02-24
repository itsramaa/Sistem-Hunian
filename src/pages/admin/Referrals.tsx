import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { AdminReferralFilters } from "@/features/referrals/components/admin/AdminReferralFilters";
import { AdminReferralPayoutDialog } from "@/features/referrals/components/admin/AdminReferralPayoutDialog";
import { AdminReferralsTable } from "@/features/referrals/components/admin/AdminReferralsTable";
import { AdminReferralStats } from "@/features/referrals/components/admin/AdminReferralStats";
import { useReferrals } from "@/features/referrals/hooks/useReferrals";
import { Referral } from "@/features/referrals/types/referrals";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

const ITEMS_PER_PAGE = 20;

const AdminReferrals = () => {
  const { isAdmin, isLoading: guardLoading } = useAdminGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    referrals,
    totalReferrals,
    loadingReferrals,
    referralsError,
    stats,
    loadingStats,
    profiles,
    payoutMutation
  } = useReferrals(currentPage, {
    status: statusFilter,
    dateRange
  });

  const rewardAmount = 50000;

  const getProfileName = (userId: string | null) => {
    if (!userId) return 'N/A';
    const profile = profiles.find(p => p.user_id === userId);
    if (profile?.full_name) return profile.full_name;
    if (profile?.email) return profile.email;
    return `User ${userId.slice(0, 8)}...`;
  };

  const handlePayout = () => {
    if (selectedReferral) {
      payoutMutation.mutate({
        referralId: selectedReferral.id,
        referral: selectedReferral,
        rewardAmount: selectedReferral.reward_amount || rewardAmount
      }, {
        onSuccess: () => {
          setShowPayoutDialog(false);
          setSelectedReferral(null);
        }
      });
    }
  };

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProfileName(referral.referrer_user_id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const displayStats = stats || {
    total: 0,
    completed: 0,
    pending: 0,
    totalPaid: 0,
    pendingPayout: 0
  };

  const totalPages = Math.ceil(totalReferrals / ITEMS_PER_PAGE);

  if (guardLoading || loadingReferrals || loadingStats) {
    return (
      <AdminLayout title="Manajemen Referral" description="Pantau dan kelola program referral">
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Memuat referral...</p>
        </div>
      </AdminLayout>
    );
  }

  if (referralsError) {
    return (
      <AdminLayout title="Manajemen Referral" description="Pantau dan kelola program referral">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat referral: {referralsError instanceof Error ? referralsError.message : 'Kesalahan tidak diketahui'}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Referral" description="Pantau dan kelola program referral">
      <div className="space-y-6">
        <AdminReferralStats stats={displayStats} isLoading={loadingStats} />

        <AdminReferralFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={(range) => {
            setDateRange(range);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          setStatusFilter={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        />

        <AdminReferralsTable
          referrals={filteredReferrals}
          isLoading={loadingReferrals}
          totalReferrals={totalReferrals}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPayout={(referral) => {
            setSelectedReferral(referral);
            setShowPayoutDialog(true);
          }}
          getProfileName={getProfileName}
          rewardAmount={rewardAmount}
        />

        <AdminReferralPayoutDialog
          isOpen={showPayoutDialog}
          onClose={() => setShowPayoutDialog(false)}
          referral={selectedReferral}
          onConfirm={handlePayout}
          isProcessing={payoutMutation.isPending}
          rewardAmount={rewardAmount}
          getProfileName={getProfileName}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;
