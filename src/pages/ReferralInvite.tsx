import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, Building2, User, Wrench, CheckCircle, ArrowRight } from 'lucide-react';

export default function ReferralInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref');
  const role = searchParams.get('role') as 'merchant' | 'tenant' | 'vendor' | null;

  // Store referral code in sessionStorage for use during signup
  useEffect(() => {
    if (refCode) {
      sessionStorage.setItem('referral_code', refCode);
    }
  }, [refCode]);

  // Validate referral code and get referrer info
  const { data: referralInfo, isLoading, error } = useQuery({
    queryKey: ['validate-referral', refCode],
    queryFn: async () => {
      if (!refCode) return null;

      // Find the referral code
      const { data: referral, error: refError } = await supabase
        .from('referrals')
        .select('referrer_user_id, referrer_role, referral_code')
        .eq('referral_code', refCode)
        .is('referee_user_id', null) // Only codes without assigned referee
        .single();

      if (refError || !referral) {
        throw new Error('Invalid or expired referral code');
      }

      // Get referrer's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', referral.referrer_user_id)
        .single();

      // Get referrer's business name if merchant/vendor
      let businessName = null;
      if (referral.referrer_role === 'merchant') {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('business_name')
          .eq('user_id', referral.referrer_user_id)
          .single();
        businessName = merchant?.business_name;
      } else if (referral.referrer_role === 'vendor') {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('business_name')
          .eq('user_id', referral.referrer_user_id)
          .single();
        businessName = vendor?.business_name;
      }

      return {
        referrerName: profile?.full_name || businessName || 'A SiHuni user',
        referrerRole: referral.referrer_role,
        code: refCode,
      };
    },
    enabled: !!refCode,
  });

  const getBonusInfo = () => {
    const targetRole = role || referralInfo?.referrerRole;
    switch (targetRole) {
      case 'merchant':
        return {
          title: 'Extended Trial + Discount',
          description: '14 days free trial (7 extra days!) + 10% off your first month',
          icon: Building2,
        };
      case 'tenant':
        return {
          title: 'Welcome Bonus',
          description: 'You and your referrer will both receive rewards!',
          icon: User,
        };
      case 'vendor':
        return {
          title: 'Quick Start Bonus',
          description: 'Get featured listing boost when you complete your first orders',
          icon: Wrench,
        };
      default:
        return {
          title: 'Special Welcome Bonus',
          description: 'Sign up now to receive exclusive rewards',
          icon: Gift,
        };
    }
  };

  const handleContinue = () => {
    const targetRole = role || referralInfo?.referrerRole || 'merchant';
    navigate(`/auth?mode=signup&role=${targetRole}&ref=${refCode}`);
  };

  if (!refCode) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Referral Code</h2>
            <p className="text-muted-foreground mb-6">
              This link doesn't contain a valid referral code.
            </p>
            <Button onClick={() => navigate('/auth')}>Sign Up Without Referral</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !referralInfo) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-destructive/50" />
            <h2 className="text-xl font-semibold mb-2">Invalid Referral Code</h2>
            <p className="text-muted-foreground mb-6">
              This referral code is invalid or has already been used.
            </p>
            <Button onClick={() => navigate('/auth')}>Sign Up Without Referral</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bonusInfo = getBonusInfo();
  const BonusIcon = bonusInfo.icon;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
          <CardDescription>
            {referralInfo.referrerName} invited you to join SiHuni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referrer Info */}
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <Badge variant="secondary" className="mb-2">
              Invited by
            </Badge>
            <p className="font-semibold text-lg">{referralInfo.referrerName}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {referralInfo.referrerRole}
            </p>
          </div>

          {/* Bonus Info */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BonusIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">{bonusInfo.title}</p>
                <p className="text-sm text-muted-foreground">{bonusInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">What you'll get:</p>
            <div className="space-y-2">
              {[
                'Full access to SiHuni platform',
                'Extended trial period',
                'Priority support',
                'Exclusive referral rewards',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleContinue}>
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
