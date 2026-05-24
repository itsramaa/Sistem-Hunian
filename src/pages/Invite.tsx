import { PasswordStrengthMeter } from "@/features/auth/components/PasswordStrengthMeter";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { INVITATION_ERROR_MESSAGES } from "@/features/auth/utils/auth-errors";
import { TenantProfileForm } from "@/features/users/components/TenantProfileForm";
import { apiClient } from '@/lib/axios';
import { supabase } from "@/lib/integrations/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { emailSchema, fullNameSchema, strongPasswordSchema } from "@/shared/utils/validations/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Building2, CheckCircle, Home, Loader2, Mail, MapPin, Phone, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

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
      if (!token) throw new Error('Token tidak ditemukan');

      // Use REST API to bypass RLS for unauthenticated users
      const response = await apiClient.get(`/api/v1/auth/invitations/${token}`);
      const responseData = response.data;

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      if (!responseData?.data) {
        throw new Error('INVITATION_INVALID');
      }

      return responseData.data;
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
      errors.fullName = 'Nama lengkap minimal 2 karakter';
    }

    // Validate email
    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      errors.email = 'Format email tidak valid';
    }

    // Validate password with strong policy
    const passwordResult = strongPasswordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      errors.password = 'Password minimal 8 karakter, harus mengandung huruf besar, kecil, angka, dan simbol';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createAccount = useMutation({
    mutationFn: async () => {
      if (!invitation) throw new Error('Undangan tidak ditemukan');

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

      // Call auth-webhook to create profiles, user_roles, and tenants right after signup
      
      let webhookSuccess = false;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (!webhookSuccess && retryCount <= maxRetries) {
        try {
          const { data: webhookData, error: webhookError } = await apiClient.post('/api/v1/auth/webhook', {
            user_id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: null,
            role: 'tenant',
            merchant_code: null,
          }).then((res) => ({ data: res.data, error: null })).catch((err) => ({ data: null, error: err }));

          if (webhookError) {
            console.error(`[Invite] Auth-webhook error (attempt ${retryCount + 1}):`, webhookError);
            retryCount++;
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
            }
          } else {
            webhookSuccess = true;
          }
        } catch (err) {
          console.error(`[Invite] Auth-webhook exception (attempt ${retryCount + 1}):`, err);
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (!webhookSuccess) {
        console.warn('[Invite] Auth-webhook failed after retries, but continuing with flow');
        // Show toast warning but don't block the flow
        toast.warning("Ada masalah saat setup akun. Silakan hubungi admin jika ada masalah.");
      }

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
      // Use REST API to bypass RLS and handle all updates atomically
      const response = await apiClient.post(`/api/v1/auth/invitations/${token}/accept`, {
        user_id: createdUserId,
        contract_duration_months: 12
      });

      const responseData = response.data;

      if (responseData?.error) {
        // Map error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          'INVITATION_NOT_FOUND': 'Undangan tidak ditemukan',
          'INVITATION_ALREADY_ACCEPTED': 'Undangan sudah diterima sebelumnya',
          'INVITATION_EXPIRED': 'Undangan sudah kedaluwarsa',
          'INVITATION_CANCELLED': 'Undangan sudah dibatalkan',
          'UNIT_NOT_AVAILABLE': 'Unit tidak tersedia',
          'CONTRACT_FAILED': 'Gagal membuat kontrak',
        };
        throw new Error(errorMessages[responseData.error] || responseData.message || 'Gagal memproses undangan');
      }

      toast.success('Selamat datang di rumah baru Anda!');
      navigate('/tenant');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Gagal menyelesaikan undangan');
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
                    <Label>Kata Sandi</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setValidationErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="Buat kata sandi yang kuat"
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
