import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Gift, TrendingUp, CheckCircle, XCircle, Search, Loader2, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";

type Referral = {
  id: string;
  referral_code: string;
  referrer_user_id: string;
  referee_user_id: string | null;
  referrer_role: string;
  referee_role: string | null;
  status: string;
  reward_amount: number | null;
  reward_paid: boolean;
  created_at: string;
  completed_at: string | null;
};

type ReferralReward = {
  id: string;
  user_id: string;
  referral_id: string | null;
  amount: number;
  type: string;
  status: string;
  credited_at: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const AdminReferrals = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const { data: referrals = [], isLoading: loadingReferrals } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Referral[];
    },
  });

  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ['admin-referral-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReferralReward[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles-for-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      if (error) throw error;
      return data;
    },
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return 'N/A';
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.full_name || profile?.email || 'Unknown';
  };

  const payoutMutation = useMutation({
    mutationFn: async (referralId: string) => {
      const referral = referrals.find(r => r.id === referralId);
      if (!referral) throw new Error('Referral not found');

      // Update referral as paid
      const { error: referralError } = await supabase
        .from('referrals')
        .update({ reward_paid: true })
        .eq('id', referralId);
      if (referralError) throw referralError;

      // Create reward record
      const { error: rewardError } = await supabase
        .from('referral_rewards')
        .insert({
          user_id: referral.referrer_user_id,
          referral_id: referralId,
          amount: referral.reward_amount || 50000,
          type: 'subscription_credit',
          status: 'credited',
          credited_at: new Date().toISOString(),
        });
      if (rewardError) throw rewardError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-referral-rewards'] });
      toast.success('Reward paid successfully');
      setShowPayoutDialog(false);
      setSelectedReferral(null);
    },
    onError: () => {
      toast.error('Failed to process payout');
    },
  });

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.referral_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProfileName(referral.referrer_user_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: referrals.length,
    completed: referrals.filter(r => r.status === 'completed').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    totalPaid: referrals.filter(r => r.reward_paid).reduce((sum, r) => sum + (r.reward_amount || 0), 0),
    pendingPayout: referrals.filter(r => r.status === 'completed' && !r.reward_paid).length,
  };

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

  if (loadingReferrals) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
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
                  <p className="text-xl font-bold">{stats.total}</p>
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
                  <p className="text-xl font-bold">{stats.completed}</p>
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
                  <p className="text-xl font-bold">{stats.pending}</p>
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
                  <p className="text-xl font-bold">{stats.pendingPayout}</p>
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
                  <p className="text-lg font-bold">{formatCurrency(stats.totalPaid)}</p>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <CardDescription>View and manage referral submissions</CardDescription>
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
                      <TableCell>{formatCurrency(referral.reward_amount || 50000)}</TableCell>
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
                <span className="font-medium">{formatCurrency(selectedReferral?.reward_amount || 50000)}</span>
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
                onClick={() => selectedReferral && payoutMutation.mutate(selectedReferral.id)}
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
