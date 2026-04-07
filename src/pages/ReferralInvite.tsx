import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Loader2, Gift, Building2, User, Wrench, CheckCircle, ArrowRight, AlertCircle, XCircle } from 'lucide-react';
import { REFERRAL_ERROR_MESSAGES } from '@/features/auth/utils/auth-errors';
import { referralCodeSchema, selectableRoleSchema } from '@/shared/utils/validations/auth';

// TypeScript interfaces for referral data
interface ReferralInfo {
  referrerName: string;
  referrerRole: string;
  code: string;
}

interface BonusInfo {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

type ReferralErrorType = 'NOT_FOUND' | 'EXPIRED' | 'MAX_USES' | 'INACTIVE';

export default function ReferralInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawRefCode = searchParams.get('ref');
  const rawRole = searchParams.get('role');
  const [manualCode, setManualCode] = useState('');
  const [errorType, setErrorType] = useState<ReferralErrorType | null>(null);

  // Normalize and validate referral code
  const refCode = rawRefCode ? rawRefCode.toUpperCase().trim() : null;
  const isValidCodeFormat = refCode ? /^[A-Z0-9]{8}$/.test(refCode) : false;

  // Validate role parameter
  const roleResult = selectableRoleSchema.safeParse(rawRole);
  const role = roleResult.success ? roleResult.data : null;

  // Store referral code in sessionStorage for use during signup
  useEffect(() => {
    if (refCode && isValidCodeFormat) {
      sessionStorage.setItem('referral_code', refCode);
    }
  }, [refCode, isValidCodeFormat]);

  // Validate referral code and get referrer info
  const { data: referralInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['validate-referral', refCode],
    queryFn: async () => {
      if (!refCode || !isValidCodeFormat) return null;

      // Find the referral code - check if it exists and hasn't been used
      const { data: referral, error: refError } = await supabase
        .from('referrals')
        .select('referrer_user_id, referrer_role, referral_code, referee_user_id')
        .eq('referral_code', refCode)
        .is('referee_user_id', null) // Only codes without assigned referee
        .maybeSingle();

      if (refError || !referral) {
        setErrorType('NOT_FOUND');
        throw new Error('Referral code not found');
      }

      // Get referrer's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', referral.referrer_user_id)
        .maybeSingle();

      // Get referrer's business name if merchant/vendor
      let businessName = null;
      if (referral.referrer_role === 'merchant') {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('business_name')
          .eq('user_id', referral.referrer_user_id)
          .maybeSingle();
        businessName = merchant?.business_name;
      } else if (referral.referrer_role === 'vendor') {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('business_name')
          .eq('user_id', referral.referrer_user_id)
          .maybeSingle();
        businessName = vendor?.business_name;
      }

      setErrorType(null);
      return {
        referrerName: profile?.full_name || businessName || 'Pengguna SiHuni',
        referrerRole: referral.referrer_role,
        code: refCode,
      };
    },
    enabled: !!refCode && isValidCodeFormat,
    retry: false,
  });

  const getBonusInfo = (): BonusInfo => {
    const targetRole = role || referralInfo?.referrerRole;
    switch (targetRole) {
      case 'merchant':
        return {
          title: 'Trial Diperpanjang + Diskon',
          description: '14 hari gratis trial (7 hari ekstra!) + diskon 10% bulan pertama',
          icon: Building2,
        };
      case 'tenant':
        return {
          title: 'Bonus Selamat Datang',
          description: 'Anda dan referrer akan mendapat reward!',
          icon: User,
        };
      case 'vendor':
        return {
          title: 'Bonus Quick Start',
          description: 'Dapatkan boost listing saat menyelesaikan pesanan pertama',
          icon: Wrench,
        };
      default:
        return {
          title: 'Bonus Spesial',
          description: 'Daftar sekarang untuk mendapat reward eksklusif',
          icon: Gift,
        };
    }
  };

  const handleContinue = () => {
    const targetRole = role || referralInfo?.referrerRole || 'merchant';
    navigate(`/auth?mode=signup&role=${targetRole}&ref=${refCode}`);
  };

  const handleManualCodeSubmit = () => {
    const normalizedCode = manualCode.toUpperCase().trim();
    const codeResult = referralCodeSchema.safeParse(normalizedCode);
    
    if (codeResult.success) {
      navigate(`/referral?ref=${normalizedCode}${rawRole ? `&role=${rawRole}` : ''}`);
    }
  };

  const handleTryAgain = () => {
    setErrorType(null);
    refetch();
  };

  // No referral code provided
  if (!refCode) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Tidak Ada Kode Referral</h2>
            <p className="text-muted-foreground mb-6">
              Link ini tidak mengandung kode referral yang valid.
            </p>
            
            <div className="space-y-4 text-left mb-6">
              <Label>Punya kode referral?</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan kode 8 karakter"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="uppercase"
                />
                <Button 
                  onClick={handleManualCodeSubmit}
                  disabled={manualCode.length !== 8}
                >
                  Cek
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
              Daftar Tanpa Referral
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid code format
  if (!isValidCodeFormat) {
    const errorInfo = REFERRAL_ERROR_MESSAGES.NOT_FOUND;
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">{errorInfo.title}</h2>
            <p className="text-muted-foreground mb-2">{errorInfo.message}</p>
            <p className="text-sm text-muted-foreground mb-6">{errorInfo.action}</p>
            <Button onClick={() => navigate('/auth')}>Daftar Tanpa Referral</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memvalidasi kode referral...</p>
        </div>
      </div>
    );
  }

  // Error handling with specific messages
  if (error || !referralInfo) {
    const errorInfo = errorType ? REFERRAL_ERROR_MESSAGES[errorType] : REFERRAL_ERROR_MESSAGES.NOT_FOUND;
    const IconComponent = errorType === 'EXPIRED' ? AlertCircle : XCircle;
    const iconColor = errorType === 'EXPIRED' ? 'text-warning' : 'text-destructive';

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <IconComponent className={`h-16 w-16 mx-auto mb-4 ${iconColor}`} />
            <h2 className="text-xl font-semibold mb-2">{errorInfo.title}</h2>
            <p className="text-muted-foreground mb-2">{errorInfo.message}</p>
            <p className="text-sm text-muted-foreground mb-6">{errorInfo.action}</p>
            
            <div className="space-y-2">
              <Button variant="outline" onClick={handleTryAgain} className="w-full">
                Coba Lagi
              </Button>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Daftar Tanpa Referral
              </Button>
            </div>
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
          <CardTitle className="text-2xl">Anda Diundang!</CardTitle>
          <CardDescription>
            {referralInfo.referrerName} mengundang Anda bergabung di SiHuni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referrer Info */}
          <div className="p-4 rounded-lg border bg-muted/30 text-center">
            <Badge variant="secondary" className="mb-2">
              Diundang oleh
            </Badge>
            <p className="font-semibold text-lg">{referralInfo.referrerName}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {referralInfo.referrerRole === 'merchant' ? 'Pemilik Properti' :
               referralInfo.referrerRole === 'vendor' ? 'Vendor Jasa' : 
               referralInfo.referrerRole}
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
            <p className="text-sm font-medium">Yang Anda dapatkan:</p>
            <div className="space-y-2">
              {[
                'Akses penuh ke platform SiHuni',
                'Periode trial diperpanjang',
                'Dukungan prioritas',
                'Reward referral eksklusif',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleContinue}>
            Mulai Sekarang
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
