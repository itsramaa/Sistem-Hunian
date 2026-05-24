import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Trophy, Medal, Award, Crown, TrendingUp, Star } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  referral_count: number;
  rank: number;
}

interface ReferralLeaderboardProps {
  userRole: 'merchant' | 'tenant' | 'vendor';
}

const RANK_BADGES = [
  { rank: 1, icon: Crown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Champion' },
  { rank: 2, icon: Medal, color: 'text-gray-400', bgColor: 'bg-gray-400/10', label: 'Runner Up' },
  { rank: 3, icon: Award, color: 'text-amber-600', bgColor: 'bg-amber-600/10', label: 'Third Place' },
];

const ACHIEVEMENT_MILESTONES = [
  { count: 5, label: 'Starter', icon: Star, color: 'text-blue-500' },
  { count: 10, label: 'Active', icon: TrendingUp, color: 'text-green-500' },
  { count: 25, label: 'Champion', icon: Trophy, color: 'text-purple-500' },
  { count: 50, label: 'Legend', icon: Crown, color: 'text-yellow-500' },
];

export function ReferralLeaderboard({ userRole }: ReferralLeaderboardProps) {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['referral-leaderboard', userRole],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      try {
        const response = await apiClient.get('/referrals/leaderboard', {
          params: { role: userRole },
        });
        return (response.data.data || []) as LeaderboardEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { data: userRank } = useQuery({
    queryKey: ['user-referral-rank', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const response = await apiClient.get('/referrals/stats');
        return (response.data.data?.completed as number) || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user?.id,
  });

  const getUserAchievement = (count: number) => {
    for (let i = ACHIEVEMENT_MILESTONES.length - 1; i >= 0; i--) {
      if (count >= ACHIEVEMENT_MILESTONES[i].count) {
        return ACHIEVEMENT_MILESTONES[i];
      }
    }
    return null;
  };

  const getNextMilestone = (count: number) => {
    for (const milestone of ACHIEVEMENT_MILESTONES) {
      if (count < milestone.count) {
        return milestone;
      }
    }
    return null;
  };

  const userAchievement = getUserAchievement(userRank || 0);
  const nextMilestone = getNextMilestone(userRank || 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard Referral
        </CardTitle>
        <CardDescription>
          Top referrers bulan ini
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User's Current Progress */}
        {userRank !== undefined && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress Anda</span>
              <Badge variant="secondary">{userRank} referral</Badge>
            </div>
            
            {userAchievement && (
              <div className="flex items-center gap-2 mb-2">
                <userAchievement.icon className={`h-4 w-4 ${userAchievement.color}`} />
                <span className="text-sm">{userAchievement.label}</span>
              </div>
            )}
            
            {nextMilestone && (
              <div className="text-xs text-muted-foreground">
                {nextMilestone.count - (userRank || 0)} lagi untuk mencapai{' '}
                <span className={nextMilestone.color}>{nextMilestone.label}</span>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard List */}
        {leaderboard && leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const rankBadge = RANK_BADGES.find(b => b.rank === entry.rank);
              const isCurrentUser = entry.user_id === user?.id;
              
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentUser 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {/* Rank */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    rankBadge ? rankBadge.bgColor : 'bg-muted'
                  }`}>
                    {rankBadge ? (
                      <rankBadge.icon className={`h-4 w-4 ${rankBadge.color}`} />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {entry.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isCurrentUser ? 'Anda' : entry.full_name || 'User'}
                    </p>
                    {rankBadge && (
                      <p className="text-xs text-muted-foreground">{rankBadge.label}</p>
                    )}
                  </div>

                  {/* Count */}
                  <div className="text-right">
                    <p className="text-sm font-bold">{entry.referral_count}</p>
                    <p className="text-xs text-muted-foreground">referral</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada data leaderboard</p>
            <p className="text-sm">Jadilah yang pertama!</p>
          </div>
        )}

        {/* Achievement Badges */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Achievement Badges</p>
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENT_MILESTONES.map((milestone) => {
              const achieved = (userRank || 0) >= milestone.count;
              
              return (
                <div
                  key={milestone.count}
                  className={`flex flex-col items-center p-2 rounded-lg ${
                    achieved 
                      ? 'bg-primary/10' 
                      : 'bg-muted/30 opacity-50'
                  }`}
                >
                  <milestone.icon className={`h-6 w-6 ${achieved ? milestone.color : 'text-muted-foreground'}`} />
                  <span className="text-xs mt-1">{milestone.label}</span>
                  <span className="text-xs text-muted-foreground">{milestone.count}+</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
