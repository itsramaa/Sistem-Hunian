import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Home, Loader2, CheckCircle, XCircle, Building2, MapPin, ArrowRight, AlertCircle, Mail, Phone } from "lucide-react";
import { TenantProfileForm } from "@/components/tenant/TenantProfileForm";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { INVITATION_ERROR_MESSAGES } from "@/lib/auth-errors";
import { strongPasswordSchema, emailSchema, fullNameSchema } from "@/lib/validations/auth";

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [isNewUser, setIsNewUser] = useState(true);
  const [step, setStep] = useState<'auth' | 'profile' | 'complete'>('auth');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate token format first
  const isValidTokenFormat = token && /^[a-zA-Z0-9-]{20,100}$/.test(token);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');

      // Include expiry check and unit availability in query
      const { data, error } = await supabase
        .from('tenant_invitations')
        .select(`
          *,
          unit:units (
            id,
            unit_number,
            rent_amount,
            deposit_amount,
            status,
            property:properties (
              name,
              address,
              city
            )
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString()) // Expiry check in query
        .single();

      if (error) {
        // Check if it's an expired token
        const { data: expiredInvite } = await supabase
          .from('tenant_invitations')
          .select('status, expires_at')
          .eq('token', token)
          .single();

        if (expiredInvite) {
          if (expiredInvite.status === 'accepted') {
            throw new Error('INVITATION_USED');
          }
          if (new Date(expiredInvite.expires_at) < new Date()) {
            throw new Error('INVITATION_EXPIRED');
          }
        }
        throw new Error('INVITATION_INVALID');
      }

      // Check unit availability
      if (data.unit?.status !== 'available' && data.status === 'pending') {
        throw new Error('UNIT_NOT_AVAILABLE');
      }

      return data;
    },
    enabled: !!token && isValidTokenFormat,
    retry: false,
  });

  useEffect(() => {
    if (invitation?.email) {
      setFormData(prev => ({ ...prev, email: invitation.email }));
    }
  }, [invitation]);

  // If user is already logged in, go to profile step
  useEffect(() => {
    if (user && step === 'auth') {
      setCreatedUserId(user.id);
      setStep('profile');
    }
  }, [user, step]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate full name
    const nameResult = fullNameSchema.safeParse(formData.fullName);
    if (!nameResult.success) {
      errors.fullName = nameResult.error.errors[0]?.message || 'Nama tidak valid';
    }

    // Validate email
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      errors.email = emailResult.error.errors[0]?.message || 'Email tidak valid';
    }

    // Validate password with strong policy
    const passwordResult = strongPasswordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      errors.password = passwordResult.error.errors[0]?.message || 'Password tidak memenuhi syarat';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!invitation) throw new Error('Invitation not found');

      if (!validateForm()) {
        throw new Error('Mohon perbaiki error pada form');
      }

      const { data: authData, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          role: 'tenant',
        }
      );
      if (signUpError) throw signUpError;
      if (!authData?.user?.id) throw new Error('Gagal membuat akun');

      setCreatedUserId(authData.user.id);
      return authData.user.id;
    },
    onSuccess: () => {
      setStep('profile');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const completeInvitation = async () => {
    if (!invitation || !createdUserId) return;

    try {
      // Default contract duration is 1 year (12 months)
      const contractDurationMonths = 12;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + contractDurationMonths);

      // Ensure rent_amount is set from unit
      const rentAmount = invitation.unit?.rent_amount;
      if (!rentAmount || rentAmount <= 0) {
        throw new Error('Harga sewa unit tidak valid. Hubungi pemilik properti.');
      }

      // Update invitation status first
      const { error: updateError } = await supabase
        .from('tenant_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: createdUserId,
        })
        .eq('id', invitation.id)
        .eq('status', 'pending'); // Ensure still pending (prevent double use)

      if (updateError) throw updateError;

      // Update unit status to occupied
      const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', invitation.unit_id)
        .eq('status', 'available'); // Only update if still available

      if (unitError) throw unitError;

      // Create contract for the tenant with rent_amount from unit
      const { error: contractError } = await supabase
        .from('contracts')
        .insert({
          merchant_id: invitation.merchant_id,
          unit_id: invitation.unit_id,
          tenant_user_id: createdUserId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          rent_amount: rentAmount,
          deposit_amount: invitation.unit?.deposit_amount || 0,
          status: 'active',
          signature_status: 'pending',
        });

      if (contractError) throw contractError;

      toast.success('Selamat datang di rumah baru Anda!');
      navigate('/tenant');
    } catch (error: any) {
      // Attempt rollback on error
      if (invitation.id) {
        await supabase
          .from('tenant_invitations')
          .update({ status: 'pending', accepted_at: null, accepted_by_user_id: null })
          .eq('id', invitation.id);
      }
      toast.error(error.message || 'Gagal menyelesaikan undangan');
    }
  };

  // Invalid token format
  if (!isValidTokenFormat && token) {
    const errorInfo = INVITATION_ERROR_MESSAGES.INVALID;
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">{errorInfo.title}</h2>
            <p className="text-muted-foreground mb-2">{errorInfo.message}</p>
            <p className="text-sm text-muted-foreground mb-6">{errorInfo.action}</p>
            <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
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
          <p className="text-muted-foreground">Memvalidasi undangan...</p>
        </div>
      </div>
    );
  }

  // Handle specific error types
  if (error || !invitation) {
    const errorMessage = (error as Error)?.message || 'INVALID';
    let errorInfo = INVITATION_ERROR_MESSAGES.INVALID;

    if (errorMessage === 'INVITATION_EXPIRED' || errorMessage.includes('expired')) {
      errorInfo = INVITATION_ERROR_MESSAGES.EXPIRED;
    } else if (errorMessage === 'INVITATION_USED' || errorMessage.includes('accepted')) {
      errorInfo = INVITATION_ERROR_MESSAGES.USED;
    } else if (errorMessage === 'UNIT_NOT_AVAILABLE') {
      errorInfo = INVITATION_ERROR_MESSAGES.UNIT_NOT_AVAILABLE;
    }

    const IconComponent = errorMessage === 'INVITATION_USED' ? CheckCircle : 
                          errorMessage === 'INVITATION_EXPIRED' ? AlertCircle : XCircle;
    const iconColor = errorMessage === 'INVITATION_USED' ? 'text-success' : 
                      errorMessage === 'INVITATION_EXPIRED' ? 'text-warning' : 'text-destructive';

    // Show "Contact Property Owner" option for expired/invalid invitations
    const showContactOption = errorMessage === 'INVITATION_EXPIRED' || 
                               errorMessage === 'UNIT_NOT_AVAILABLE' ||
                               errorMessage === 'INVALID' ||
                               errorMessage === 'INVITATION_INVALID';

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <IconComponent className={`h-16 w-16 mx-auto mb-4 ${iconColor}`} />
            <h2 className="text-xl font-semibold mb-2">{errorInfo.title}</h2>
            <p className="text-muted-foreground mb-2">{errorInfo.message}</p>
            <p className="text-sm text-muted-foreground mb-6">{errorInfo.action}</p>
            <div className="flex flex-col gap-2">
              {errorMessage === 'INVITATION_USED' && (
                <Button onClick={() => navigate('/auth')}>Masuk ke Akun</Button>
              )}
              {showContactOption && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Open email client to contact property owner
                    window.location.href = 'mailto:?subject=Permintaan%20Undangan%20Baru%20-%20SiHuni&body=Halo,%0A%0ASaya%20ingin%20meminta%20undangan%20baru%20untuk%20mendaftar%20di%20SiHuni.%0A%0AKode%20undangan%20sebelumnya:%20' + encodeURIComponent(token || '') + '%0A%0ATerima%20kasih.';
                  }}
                  className="gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Hubungi Pemilik Properti
                </Button>
              )}
              <Button variant={errorMessage === 'INVITATION_USED' ? 'outline' : 'default'} onClick={() => navigate('/')}>
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === 'accepted') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success" />
            <h2 className="text-xl font-semibold mb-2">Undangan Sudah Diterima</h2>
            <p className="text-muted-foreground mb-6">
              Undangan ini sudah digunakan sebelumnya.
            </p>
            <Button onClick={() => navigate('/auth')}>Masuk ke Akun</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile completion step
  if (step === 'profile' && createdUserId) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center text-success-foreground">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Akun</span>
            </div>
            <div className="h-px w-8 bg-primary" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                2
              </div>
              <span className="text-sm font-medium">Profil</span>
            </div>
            <div className="h-px w-8 bg-muted-foreground/30" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                3
              </div>
              <span className="text-sm text-muted-foreground">Selesai</span>
            </div>
          </div>

          {/* Property info banner */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{invitation.unit?.property?.name}</p>
                  <p className="text-sm text-muted-foreground">Unit {invitation.unit?.unit_number}</p>
                  <p className="text-sm font-medium text-primary mt-1">
                    Rp {Number(invitation.unit?.rent_amount || 0).toLocaleString('id-ID')}/bulan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Lengkapi Profil Anda</CardTitle>
              <CardDescription>
                Mohon lengkapi informasi untuk keperluan verifikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantProfileForm
                userId={createdUserId}
                onComplete={completeInvitation}
              />
            </CardContent>
          </Card>

          {/* Skip option */}
          <div className="text-center">
            <Button variant="ghost" onClick={completeInvitation}>
              Lewati untuk sekarang
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Auth step
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Anda Diundang!</CardTitle>
          <CardDescription>Anda telah diundang menjadi penghuni</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Details */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{invitation.unit?.property?.name}</p>
                <p className="text-sm text-muted-foreground">Unit {invitation.unit?.unit_number}</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {invitation.unit?.property?.address}, {invitation.unit?.property?.city}
                </div>
                <p className="mt-2 font-medium text-primary">
                  Rp {Number(invitation.unit?.rent_amount || 0).toLocaleString('id-ID')}/bulan
                </p>
              </div>
            </div>
          </div>

          {/* Account Creation Form */}
          {!user && (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Button
                  variant={isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(true)}
                  className="flex-1"
                >
                  Buat Akun
                </Button>
                <Button
                  variant={!isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(false)}
                  className="flex-1"
                >
                  Sudah Punya Akun
                </Button>
              </div>

              {isNewUser && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        setValidationErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="Nama lengkap Anda"
                      className={validationErrors.fullName ? 'border-destructive' : ''}
                    />
                    {validationErrors.fullName && (
                      <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="Email Anda"
                      className={validationErrors.email ? 'border-destructive' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-destructive">{validationErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Buat password yang kuat"
                      className={validationErrors.password ? 'border-destructive' : ''}
                    />
                    <PasswordStrengthMeter password={formData.password} />
                    {validationErrors.password && (
                      <p className="text-sm text-destructive">{validationErrors.password}</p>
                    )}
                  </div>
                </div>
              )}

              {!isNewUser && (
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Jika Anda sudah memiliki akun, silakan masuk terlebih dahulu, lalu kembali ke link ini.
                  </p>
                  <Button variant="link" onClick={() => navigate('/auth')}>
                    Ke Halaman Masuk
                  </Button>
                </div>
              )}
            </div>
          )}

          {user && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <p className="text-success font-medium">Anda masuk sebagai {user.email}</p>
              </div>
            </div>
          )}

          <Button
            className="w-full gradient-primary"
            onClick={() => {
              if (user) {
                setCreatedUserId(user.id);
                setStep('profile');
              } else if (isNewUser) {
                createAccount.mutate();
              }
            }}
            disabled={createAccount.isPending || (!user && isNewUser && (!formData.email || !formData.password || !formData.fullName))}
          >
            {createAccount.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {user ? "Lanjut ke Profil" : "Buat Akun & Lanjutkan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
