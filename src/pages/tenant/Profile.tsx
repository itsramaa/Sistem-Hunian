import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfile, useTenantProfile, useUpdateProfile, useUpdateTenantProfile, useUploadKtp } from "@/features/profile/hooks/useProfile";
import { supabase } from "@/lib/integrations/supabase/client";
import { TenantLayout } from "@/shared/components/layouts/TenantLayout";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ProfileFormSkeleton } from "@/shared/components/ui/skeletons";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Banknote, Calendar, CreditCard, Eye, EyeOff, Loader2, Phone, RefreshCw, Save, Shield, Upload, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor telepon tidak valid").or(z.literal("")),
});

const ktpSchema = z.string().regex(/^[0-9]{16}$/, "NIK harus 16 digit angka").or(z.literal(""));

const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

const TenantProfile = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(user?.id);
  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useTenantProfile(user?.id);
  
  const updateProfileMutation = useUpdateProfile();
  const updateTenantMutation = useUpdateTenantProfile();
  const uploadKtpMutation = useUploadKtp();

  const isLoading = profileLoading || tenantLoading;
  const hasError = profileError || tenantError;

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  const [tenantForm, setTenantForm] = useState({
    ktp_number: '',
    date_of_birth: '',
    gender: '',
    occupation: '',
    income_range: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
  });

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [showKtp, setShowKtp] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [autoPaySettings, setAutoPaySettings] = useState({
    enabled: false,
    day: 1,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (tenant) {
      setTenantForm({
        ktp_number: tenant.ktp_number || '',
        date_of_birth: tenant.date_of_birth || '',
        gender: tenant.gender || '',
        occupation: tenant.occupation || '',
        income_range: tenant.income_range || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        emergency_contact_relation: tenant.emergency_contact_relation || '',
      });
      if (tenant.ktp_photo_url) {
        setKtpPreview(tenant.ktp_photo_url);
      }
      setAutoPaySettings({
        enabled: (tenant as { auto_pay_enabled?: boolean }).auto_pay_enabled || false,
        day: (tenant as { auto_pay_day?: number }).auto_pay_day || 1,
      });
    }
  }, [tenant]);

  const handleUpdateProfile = async (data: typeof profileForm) => {
    // Validate
    const result = profileSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      throw new Error(Object.values(errors)[0]);
    }
    setValidationErrors({});

    updateProfileMutation.mutate(
      { userId: user!.id, payload: { full_name: data.full_name.trim(), phone: data.phone.trim() } },
      {
        onSuccess: () => toast.success('Profil berhasil disimpan'),
        onError: (err: Error) => toast.error(err.message || 'Gagal menyimpan profil'),
      }
    );
  };

  const handleUpdateTenantProfile = async () => {
    try {
      // Validate KTP
      if (tenantForm.ktp_number) {
        const result = ktpSchema.safeParse(tenantForm.ktp_number);
        if (!result.success) {
          throw new Error("NIK harus 16 digit angka");
        }
      }

      let ktpPhotoUrl = tenant?.ktp_photo_url || null;

      if (ktpFile) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(ktpFile.type)) {
          throw new Error("Format file harus JPG atau PNG");
        }

        ktpPhotoUrl = await uploadKtpMutation.mutateAsync({ userId: user!.id, file: ktpFile });
      }

      const tenantData = {
        ktp_number: tenantForm.ktp_number.trim() || null,
        ktp_photo_url: ktpPhotoUrl,
        date_of_birth: tenantForm.date_of_birth || null,
        gender: tenantForm.gender || null,
        occupation: tenantForm.occupation.trim().slice(0, 100) || null,
        income_range: tenantForm.income_range || null,
        emergency_contact_name: tenantForm.emergency_contact_name.trim().slice(0, 100) || null,
        emergency_contact_phone: tenantForm.emergency_contact_phone.trim().slice(0, 20) || null,
        emergency_contact_relation: tenantForm.emergency_contact_relation || null,
      };

      updateTenantMutation.mutate(
        { userId: user!.id, payload: tenantData },
        {
          onSuccess: () => {
            toast.success('Data identitas berhasil disimpan');
            setKtpFile(null);
          },
          onError: (error) => toast.error((error as Error).message),
      }
    );
  } catch (error) {
    const err = error as Error;
    toast.error(err.message);
  }
};

  const handleChangePassword = async () => {
    try {
      // Validate
      const result = passwordSchema.safeParse(passwordForm);
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      
      toast.success('Password berhasil diubah');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleUpdateAutoPaySettings = async (settings: { enabled: boolean; day: number }) => {
    updateTenantMutation.mutate(
      { 
        userId: user!.id, 
        payload: { 
          auto_pay_enabled: settings.enabled, 
          auto_pay_day: settings.day 
        } 
      },
      {
        onSuccess: () => toast.success('Pengaturan auto-pay disimpan'),
        onError: () => toast.error('Gagal menyimpan pengaturan auto-pay'),
      }
    );
  };

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      // Validate type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format file harus JPG atau PNG');
        return;
      }
      setKtpFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mask KTP number for display
  const maskedKtpNumber = tenantForm.ktp_number 
    ? (showKtp ? tenantForm.ktp_number : tenantForm.ktp_number.slice(0, 4) + '********' + tenantForm.ktp_number.slice(-4))
    : '';

  if (isLoading) {
    return (
      <TenantLayout title="Profil">
        <ProfileFormSkeleton />
      </TenantLayout>
    );
  }

  if (hasError) {
    return (
      <TenantLayout title="Profil">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Gagal memuat profil. Silakan coba lagi.</span>
            <Button variant="outline" size="sm" onClick={() => { refetchProfile(); refetchTenant(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Profil Saya"
      description="Kelola informasi pribadi Anda"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Keamanan</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pembayaran</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
              <CardDescription>Data dasar akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    maxLength={100}
                  />
                  {validationErrors.full_name && (
                    <p className="text-xs text-destructive">{validationErrors.full_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    maxLength={15}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-destructive">{validationErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Hubungi support untuk mengubah email</p>
                </div>
              </div>
              <Button 
                onClick={() => handleUpdateProfile(profileForm)}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>

          {/* Identity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Data Identitas
              </CardTitle>
              <CardDescription>KTP dan informasi verifikasi (data ini dienkripsi)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor KTP (NIK)</Label>
                  <div className="relative">
                    <Input
                      value={showKtp ? tenantForm.ktp_number : maskedKtpNumber}
                      onChange={(e) => setTenantForm({ ...tenantForm, ktp_number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                      placeholder="16 digit NIK"
                      maxLength={16}
                      disabled={!showKtp && !!tenantForm.ktp_number}
                    />
                    {tenantForm.ktp_number && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowKtp(!showKtp)}
                      >
                        {showKtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Data ini hanya digunakan untuk verifikasi</p>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Lahir</Label>
                  <Input
                    type="date"
                    value={tenantForm.date_of_birth}
                    onChange={(e) => setTenantForm({ ...tenantForm, date_of_birth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select
                    value={tenantForm.gender}
                    onValueChange={(value) => setTenantForm({ ...tenantForm, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Laki-laki</SelectItem>
                      <SelectItem value="female">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pekerjaan</Label>
                  <Input
                    value={tenantForm.occupation}
                    onChange={(e) => setTenantForm({ ...tenantForm, occupation: e.target.value })}
                    placeholder="contoh: Karyawan Swasta"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Range Pendapatan (Bulanan)</Label>
                <Select
                  value={tenantForm.income_range}
                  onValueChange={(value) => setTenantForm({ ...tenantForm, income_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih range pendapatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="< 5 Juta">{"< Rp 5.000.000"}</SelectItem>
                    <SelectItem value="5-10 Juta">Rp 5.000.000 - Rp 10.000.000</SelectItem>
                    <SelectItem value="10-20 Juta">Rp 10.000.000 - Rp 20.000.000</SelectItem>
                    <SelectItem value="20-50 Juta">Rp 20.000.000 - Rp 50.000.000</SelectItem>
                    <SelectItem value="> 50 Juta">{"> Rp 50.000.000"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* KTP Photo Upload */}
              <div className="space-y-2">
                <Label>Foto KTP</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {ktpPreview ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={ktpPreview}
                          alt="KTP Preview"
                          className={`max-h-40 mx-auto rounded-lg object-contain ${!showKtp ? 'blur-lg' : ''}`}
                        />
                        {!showKtp && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button variant="secondary" size="sm" onClick={() => setShowKtp(true)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Tampilkan
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center gap-2">
                        {showKtp && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowKtp(false)}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Sembunyikan
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setKtpFile(null);
                            setKtpPreview(null);
                          }}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleKtpFileChange}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm mt-2">Klik untuk upload foto KTP</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG maksimal 5MB</p>
                    </label>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleUpdateTenantProfile}
                disabled={updateTenantMutation.isPending || uploadKtpMutation.isPending}
              >
                {(updateTenantMutation.isPending || uploadKtpMutation.isPending) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Data Identitas
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Kontak Darurat
              </CardTitle>
              <CardDescription>Kontak yang dapat dihubungi dalam keadaan darurat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nama</Label>
                  <Input
                    value={tenantForm.emergency_contact_name}
                    onChange={(e) => setTenantForm({ ...tenantForm, emergency_contact_name: e.target.value })}
                    placeholder="Nama kontak darurat"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input
                    value={tenantForm.emergency_contact_phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, emergency_contact_phone: e.target.value })}
                    placeholder="Nomor telepon"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hubungan</Label>
                  <Select
                    value={tenantForm.emergency_contact_relation}
                    onValueChange={(value) => setTenantForm({ ...tenantForm, emergency_contact_relation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih hubungan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Orang Tua</SelectItem>
                      <SelectItem value="spouse">Pasangan</SelectItem>
                      <SelectItem value="sibling">Saudara</SelectItem>
                      <SelectItem value="friend">Teman</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>Perbarui password untuk keamanan akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimal 8 karakter"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi password baru"
                  />
                </div>
              </div>
              <Button 
                onClick={handleChangePassword}
                disabled={changePassword.isPending || !passwordForm.newPassword || passwordForm.newPassword.length < 8}
              >
                {changePassword.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Ubah Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          {/* Auto-Pay Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Pengaturan Auto-Pay
              </CardTitle>
              <CardDescription>Atur pembayaran otomatis untuk sewa Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Aktifkan Auto-Pay</p>
                  <p className="text-sm text-muted-foreground">
                    Bayar sewa secara otomatis setiap bulan
                  </p>
                </div>
                <Switch
                  checked={autoPaySettings.enabled}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...autoPaySettings, enabled: checked };
                    setAutoPaySettings(newSettings);
                    handleUpdateAutoPaySettings(newSettings);
                  }}
                />
              </div>

              {autoPaySettings.enabled && (
                <div className="space-y-2 p-4 rounded-lg border bg-muted/50">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tanggal Pembayaran
                  </Label>
                  <Select
                    value={autoPaySettings.day.toString()}
                    onValueChange={(value) => {
                      const newSettings = { ...autoPaySettings, day: parseInt(value) };
                      setAutoPaySettings(newSettings);
                      handleUpdateAutoPaySettings(newSettings);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue placeholder="Pilih tanggal" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Tanggal {day} setiap bulan
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pembayaran akan diproses otomatis pada tanggal ini setiap bulan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Payment Methods */}
          <SavedPaymentMethodsSection userId={user?.id} />
        </TabsContent>
      </Tabs>
    </TenantLayout>
  );
};

// Saved Payment Methods Component
function SavedPaymentMethodsSection({ userId }: { userId?: string }) {
  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["saved-payment-methods", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xendit_transactions")
        .select("payment_method, payment_channel, created_at")
        .eq("user_id", userId)
        .eq("status", "paid")
        .not("payment_method", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const seen = new Set<string>();
      const unique = data?.filter(pm => {
        const key = `${pm.payment_method}-${pm.payment_channel}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }) || [];
      
      return unique;
    },
    enabled: !!userId,
  });

  const formatMethodName = (method: string | null, channel: string | null) => {
    if (channel) {
      return channel.replace(/_/g, ' ').toUpperCase();
    }
    if (method) {
      return method.replace(/_/g, ' ').toUpperCase();
    }
    return 'Metode Tidak Diketahui';
  };

  const getMethodIcon = (method: string | null) => {
    switch (method?.toLowerCase()) {
      case 'virtual_account':
        return '🏦';
      case 'ewallet':
        return '📱';
      case 'qr_code':
        return '📷';
      case 'credit_card':
        return '💳';
      default:
        return '💰';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Metode Pembayaran
        </CardTitle>
        <CardDescription>Metode pembayaran yang pernah digunakan</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.map((pm, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMethodIcon(pm.payment_method)}</span>
                  <div>
                    <p className="font-medium text-sm">
                      {formatMethodName(pm.payment_method, pm.payment_channel)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Terakhir digunakan {format(new Date(pm.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada metode pembayaran tersimpan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TenantProfile;
