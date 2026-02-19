import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useReferralTracking } from '@/features/analytics/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Share2, Copy, Users, Gift, Wallet, Check, Mail, ExternalLink, Info, ChevronDown, RefreshCw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, subMonths, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';

// TypeScript interfaces for referral data
interface Referral {
  id: string;
  referrer_user_id: string;
  referee_user_id: string | null;
  referrer_role: string;
  referee_role: string | null;
  referral_code: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface ReferralReward {
  id: string;
  user_id: string;
  referral_id: string | null;
  type: string;
  amount: number;
  status: string;
  credited_at: string | null;
  created_at: string;
}

interface ReferralStats {
  total: number;
  completed: number;
  pending: number;
}

interface RewardInfo {
  amount: string;
  description: string;
  steps: string[];
}

interface ReferralDashboardProps {
  userRole: 'merchant' | 'tenant' | 'vendor';
}

// Generate more secure referral code
const generateSecureCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = 'REF';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Date range options
const DATE_RANGES = [
  { value: 'all', label: 'Semua Waktu' },
  { value: '7d', label: '7 Hari Terakhir' },
  { value: '30d', label: '30 Hari Terakhir' },
  { value: '3m', label: '3 Bulan Terakhir' },
  { value: '6m', label: '6 Bulan Terakhir' },
];

const ITEMS_PER_PAGE = 5;

export function ReferralDashboard({ userRole }: ReferralDashboardProps) {
  const { user } = useAuth();
  const { trackReferralLinkCopied, trackReferralLinkShared } = useReferralTracking();
  const [copied, setCopied] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [rewardsPage, setRewardsPage] = useState(1);

  // Get date filter
  const getDateFilter = (range: string): Date | null => {
    const now = new Date();
    switch (range) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '3m': return subMonths(now, 3);
      case '6m': return subMonths(now, 6);
      default: return null;
    }
  };

  // Get or create referral code
  const { data: referralData, isLoading, error, refetch } = useQuery({
    queryKey: ['my-referral', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Check if user has a referral code
      const { data: existing, error: fetchError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .is('referee_user_id', null)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) return existing as Referral;

      // Check uniqueness of generated code
      let code = generateSecureCode();
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const { data: existingCode } = await supabase
          .from('referrals')
          .select('id')
          .eq('referral_code', code)
          .maybeSingle();
        
        if (!existingCode) break;
        code = generateSecureCode();
        attempts++;
      }

      // Create new referral entry with secure code
      const { data: newReferral, error } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: user.id,
          referrer_role: userRole,
          status: 'pending',
          referral_code: code,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create referral:', error);
        throw new Error('Gagal membuat kode referral. Silakan coba lagi.');
      }
      return newReferral as Referral;
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // Get referral stats with optimized query
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ReferralStats>({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, completed: 0, pending: 0 };

      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_user_id', user.id)
        .not('referee_user_id', 'is', null);

      if (error) throw error;

      const total = referrals?.length || 0;
      const completed = referrals?.filter(r => r.status === 'completed').length || 0;
      const pending = referrals?.filter(r => r.status === 'pending').length || 0;

      return { total, completed, pending };
    },
    enabled: !!user?.id,
  });

  // Get referral history with pagination and date filter
  const { data: referralHistoryData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['referral-history', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return { items: [], total: 0 };

      let query = supabase
        .from('referrals')
        .select(`
          id,
          referee_user_id,
          referee_role,
          status,
          created_at,
          completed_at,
          profiles!referrals_referee_user_id_fkey (
            full_name,
            email
          )
        `, { count: 'exact' })
        .eq('referrer_user_id', user.id)
        .not('referee_user_id', 'is', null)
        .order('created_at', { ascending: false });

      const dateFilter = getDateFilter(dateRange);
      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
    enabled: !!user?.id,
  });

  // Get rewards with pagination and date filter
  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards } = useQuery({
    queryKey: ['my-rewards', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return { items: [], total: 0 };

      let query = supabase
        .from('referral_rewards')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const dateFilter = getDateFilter(dateRange);
      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { items: (data || []) as ReferralReward[], total: count || 0 };
    },
    enabled: !!user?.id,
  });

  // Paginated data
  const referralHistory = referralHistoryData?.items || [];
  const paginatedHistory = referralHistory.slice(0, historyPage * ITEMS_PER_PAGE);
  const hasMoreHistory = referralHistory.length > historyPage * ITEMS_PER_PAGE;

  const rewards = rewardsData?.items || [];
  const paginatedRewards = rewards.slice(0, rewardsPage * ITEMS_PER_PAGE);
  const hasMoreRewards = rewards.length > rewardsPage * ITEMS_PER_PAGE;

  // Normalize referral code to uppercase for consistent display
  const referralCode = referralData?.referral_code?.toUpperCase() || '';
  const referralLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      trackReferralLinkCopied();
      toast.success('Link referral berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const handleShareWhatsApp = () => {
    const userName = user?.user_metadata?.full_name || 'Saya';
    const message = encodeURIComponent(
      `Hai! ${userName} mengundang kamu untuk bergabung di SiHuni. Dapatkan bonus spesial dengan daftar menggunakan link ini: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
    trackReferralLinkShared('whatsapp');
  };

  const handleShareEmail = () => {
    const userName = user?.user_metadata?.full_name || 'Teman Anda';
    const subject = encodeURIComponent(`${userName} mengundang Anda ke SiHuni`);
    const body = encodeURIComponent(
      `Hai!\n\n${userName} mengundang Anda untuk bergabung di SiHuni - platform manajemen properti terbaik.\n\nDaftar sekarang dan dapatkan bonus spesial:\n${referralLink}\n\nSampai jumpa di SiHuni!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    trackReferralLinkShared('email');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bergabung dengan SiHuni',
          text: 'Daftar SiHuni pakai link saya dan dapatkan bonus spesial!',
          url: referralLink,
        });
        trackReferralLinkShared('native');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRefreshAll = () => {
    refetch();
    refetchStats();
    refetchHistory();
    refetchRewards();
    toast.success('Data referral diperbarui');
  };

  const getRewardInfo = (): RewardInfo => {
    switch (userRole) {
      case 'merchant':
        return { 
          amount: '20%', 
          description: 'komisi dari langganan referral selama 6 bulan',
          steps: [
            'Bagikan link referral ke teman pemilik properti',
            'Teman mendaftar sebagai merchant',
            'Teman upgrade ke paket berbayar',
            'Anda dapat 20% komisi selama 6 bulan!'
          ]
        };
      case 'tenant':
        return { 
          amount: 'Rp25.000', 
          description: 'voucher saat referral bayar sewa pertama',
          steps: [
            'Bagikan link referral ke teman',
            'Teman mendaftar sebagai tenant',
            'Teman bayar sewa pertama',
            'Bonus tambahan Rp25.000 jika bayar 3 bulan berturut!'
          ]
        };
      case 'vendor':
        return { 
          amount: 'Rp50.000', 
          description: 'cashback saat referral selesaikan 10 order',
          steps: [
            'Bagikan link ke sesama vendor',
            'Teman mendaftar sebagai vendor',
            'Teman selesaikan 10 order',
            'Bonus Rp100.000 di bulan ke-3 aktif!'
          ]
        };
      default:
        return { amount: 'Rp0', description: '', steps: [] };
    }
  };

  const rewardInfo = getRewardInfo();
  const totalRewards = rewards
    .filter(r => r.status === 'credited')
    .reduce((sum, r) => sum + Number(r.amount), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Memuat data referral...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{(error as Error).message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Cara Kerja Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewardInfo.steps.map((step, i) => (
              <div key={i} className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-base font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Link Referral Anda
          </CardTitle>
          <CardDescription>
            Bagikan dan dapatkan {rewardInfo.amount} {rewardInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={handleCopyLink} aria-label="Salin link">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Native share on mobile */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <Button className="flex-1" onClick={handleNativeShare}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Bagikan
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={handleShareWhatsApp}>
              <Share2 className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleShareEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
          
          {/* Terms link */}
          <p className="text-xs text-muted-foreground text-center">
            Dengan membagikan, Anda menyetujui{' '}
            <a href="/terms" className="underline hover:text-foreground">
              Syarat & Ketentuan Referral
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6 flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
            <Users className="h-8 w-8 sm:h-6 sm:w-6 text-primary" />
            <div className="flex-1 sm:flex-none">
              <p className="text-2xl sm:text-3xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Referral</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
            <Gift className="h-8 w-8 sm:h-6 sm:w-6 text-green-500" />
            <div className="flex-1 sm:flex-none">
              <p className="text-2xl sm:text-3xl font-bold">{stats?.completed || 0}</p>
              <p className="text-sm text-muted-foreground">Selesai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
            <Wallet className="h-8 w-8 sm:h-6 sm:w-6 text-yellow-500" />
            <div className="flex-1 sm:flex-none">
              <p className="text-2xl sm:text-3xl font-bold">
                {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(totalRewards)}
              </p>
              <p className="text-sm text-muted-foreground">Diperoleh</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih rentang waktu" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Referral</CardTitle>
          <CardDescription>
            Daftar orang yang mendaftar menggunakan kode Anda
            {referralHistoryData?.total ? ` (${referralHistoryData.total} total)` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada yang mendaftar menggunakan kode Anda.</p>
              <p className="text-sm mt-1">Bagikan link referral untuk mulai mengundang!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedHistory.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {(ref.profiles as any)?.full_name || 'Pengguna Baru'}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {ref.referee_role || 'User'} • {format(new Date(ref.created_at), 'd MMM yyyy', { locale: id })}
                    </p>
                  </div>
                  <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'}>
                    {ref.status === 'completed' ? 'Selesai' : 
                     ref.status === 'pending' ? 'Menunggu' : ref.status}
                  </Badge>
                </div>
              ))}
              
              {hasMoreHistory && (
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setHistoryPage(p => p + 1)}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Tampilkan Lebih Banyak
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Rewards</CardTitle>
          <CardDescription>
            Semua reward yang Anda peroleh
            {rewardsData?.total ? ` (${rewardsData.total} total)` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rewardsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : paginatedRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada reward. Mulai bagikan link referral Anda!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedRewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{reward.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(reward.created_at), 'd MMM yyyy', { locale: id })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(Number(reward.amount))}
                    </p>
                    <Badge variant={reward.status === 'credited' ? 'default' : 'secondary'}>
                      {reward.status === 'credited' ? 'Dikreditkan' : 
                       reward.status === 'pending' ? 'Menunggu' : reward.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {hasMoreRewards && (
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setRewardsPage(p => p + 1)}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Tampilkan Lebih Banyak
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
