import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReferralTracking } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Users, Gift, Wallet, Check, Mail, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

export function ReferralDashboard({ userRole }: ReferralDashboardProps) {
  const { user } = useAuth();
  const { trackReferralLinkCopied, trackReferralLinkShared } = useReferralTracking();
  const [copied, setCopied] = useState(false);

  // Get or create referral code
  const { data: referralData, isLoading, error } = useQuery({
    queryKey: ['my-referral', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Check if user has a referral code
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .is('referee_user_id', null)
        .single();

      if (existing) return existing as Referral;

      // Create new referral entry with secure code
      const { data: newReferral, error } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: user.id,
          referrer_role: userRole,
          status: 'pending',
          referral_code: generateSecureCode(),
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
  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, completed: 0, pending: 0 };

      const { data: referrals } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_user_id', user.id)
        .not('referee_user_id', 'is', null);

      const total = referrals?.length || 0;
      const completed = referrals?.filter(r => r.status === 'completed').length || 0;
      const pending = referrals?.filter(r => r.status === 'pending').length || 0;

      return { total, completed, pending };
    },
    enabled: !!user?.id,
  });

  // Get rewards
  const { data: rewards = [] } = useQuery<ReferralReward[]>({
    queryKey: ['my-rewards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return (data || []) as ReferralReward[];
    },
    enabled: !!user?.id,
  });

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
    return <div className="text-center py-8">Memuat...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{(error as Error).message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rewardInfo.steps.map((step, i) => (
              <div key={i} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-xs text-muted-foreground">{step}</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Total Referral</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats?.completed || 0}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(totalRewards)}
            </p>
            <p className="text-xs text-muted-foreground">Diperoleh</p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada reward. Mulai bagikan link referral Anda!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
