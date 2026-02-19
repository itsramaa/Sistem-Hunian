import { useAdminGuard } from "@/features/auth/hooks/useAdminGuard";
import { useReferrals } from "@/features/referrals/hooks/useReferrals";
import { Referral } from "@/features/referrals/types";
import { AdminLayout } from "@/shared/components/layouts/AdminLayout";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DateRangePicker } from "@/shared/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, DollarSign, Gift, Loader2, Search, Users } from "lucide-react";
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

  // Calculate default reward amount locally or fetch from config if needed
  // For now using constant from types or fallback
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

  // Client-side search filtering (since server-side search by name is complex)
  // Note: This only filters the current page of results.
  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProfileName(referral.referrer_user_id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats if not available from server (fallback) or use server stats
  const displayStats = stats || {
    total: 0,
    completed: 0,
    pending: 0,
    totalPaid: 0,
    pendingPayout: 0
  };

  const totalPages = Math.ceil(totalReferrals / ITEMS_PER_PAGE);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string, rewardPaid: boolean) => {
    if (status === 'completed' && rewardPaid) {
      return <Badge className="bg-success/10 text-success border-success/20">Paid</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Payout</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (guardLoading || loadingReferrals || loadingStats) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading referrals...</p>
        </div>
      </AdminLayout>
    );
  }

  if (referralsError) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load referrals: {referralsError instanceof Error ? referralsError.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Referral Management</h1>
          <p className="text-muted-foreground">Monitor and manage referral program</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                  <p className="text-xl font-bold">{displayStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{displayStats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{displayStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Gift className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Payout</p>
                  <p className="text-xl font-bold">{displayStats.pendingPayout}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold">{formatCurrency(displayStats.totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or referrer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setCurrentPage(1);
            }}
          />
          <Select value={statusFilter} onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Referrals</CardTitle>
            <CardDescription>View and manage referral submissions ({totalReferrals} total)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No referrals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-mono text-sm">{referral.referral_code}</TableCell>
                      <TableCell>{getProfileName(referral.referrer_user_id)}</TableCell>
                      <TableCell>{getProfileName(referral.referee_user_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{referral.referrer_role}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status, referral.reward_paid)}</TableCell>
                      <TableCell>{formatCurrency(referral.reward_amount || rewardAmount)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {referral.status === 'completed' && !referral.reward_paid && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setShowPayoutDialog(true);
                            }}
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            Payout
                          </Button>
                        )}
                        {referral.reward_paid && (
                          <span className="text-sm text-success flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Paid
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Dialog */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payout</DialogTitle>
              <DialogDescription>
                Process reward payout for referral {selectedReferral?.referral_code}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referrer</span>
                <span className="font-medium">{getProfileName(selectedReferral?.referrer_user_id || null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward Amount</span>
                <span className="font-medium">{formatCurrency(selectedReferral?.reward_amount || rewardAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">Subscription Credit</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayout}
                disabled={payoutMutation.isPending}
              >
                {payoutMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReferrals;