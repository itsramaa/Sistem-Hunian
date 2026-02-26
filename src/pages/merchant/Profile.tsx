import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/integrations/supabase/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FileUpload } from "@/shared/components/FileUpload";
import { Building2, Shield, Lock, Loader2, Save, CheckCircle, Clock, XCircle, Trash2, Copy, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ProfileFormSkeleton } from "@/shared/components/ui/skeletons";
import { z } from "zod";
import { strongPasswordSchema, loginPasswordSchema } from "@/shared/utils/validations/auth";

const passwordSchema = z.object({
  currentPassword: loginPasswordSchema,
  newPassword: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"],
});

const MerchantProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['merchant-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_merchants_with_addresses' as any).select('*').eq('user_id', user?.id).single() as any;
      if (error) throw error;
      return { ...data, address: data.resolved_address, city: data.resolved_city, province: data.resolved_province, postal_code: data.resolved_postal_code };
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: verifications = [], refetch: refetchVerifications } = useQuery({
    queryKey: ['merchant-verifications', merchant?.id],
    queryFn: async () => {
      if (!merchant?.id) return [];
      const { data, error } = await supabase.from('merchant_verifications').select('*').eq('merchant_id', merchant.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!merchant?.id,
  });

  const [businessForm, setBusinessForm] = useState({ business_name: '', business_type: '', address: '', city: '', province: '', postal_code: '' });
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    if (merchant) {
      setBusinessForm({
        business_name: merchant.business_name || '', business_type: merchant.business_type || 'individual',
        address: merchant.address || '', city: merchant.city || '', province: merchant.province || '', postal_code: merchant.postal_code || '',
      });
    }
    if (profile) {
      setProfileForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
  }, [merchant, profile]);

  const updateMerchant = useMutation({
    mutationFn: async (data: typeof businessForm) => {
      // Upsert address first
      const { address, city, province, postal_code, ...rest } = data;
      const merchantData = merchant as any;
      if (merchantData?.headquarters_address_id) {
        await (supabase.from('addresses' as any).update({ street_address: address, city, province, postal_code } as any) as any).eq('id', merchantData.headquarters_address_id);
      } else {
        const { data: addr } = await (supabase.from('addresses' as any).insert({ street_address: address, city, province, postal_code: postal_code || '', address_type: 'headquarters' } as any).select('id').single() as any);
        if (addr) {
          await supabase.from('merchants').update({ headquarters_address_id: addr.id } as any).eq('user_id', user?.id);
        }
      }
      const { error } = await supabase.from('merchants').update(rest as any).eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['merchant-profile'] }); toast.success('Profil bisnis diperbarui'); },
    onError: () => toast.error('Gagal memperbarui profil'),
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const { error } = await supabase.from('profiles').update(data).eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); toast.success('Informasi kontak diperbarui'); },
    onError: () => toast.error('Gagal memperbarui informasi kontak'),
  });

  const uploadVerificationDocument = async (url: string, documentType: string) => {
    if (!merchant?.id) return;
    const { error } = await supabase.from('merchant_verifications').insert({ merchant_id: merchant.id, document_type: documentType, document_url: url, status: 'pending' });
    if (error) { toast.error('Gagal menyimpan dokumen'); return; }
    toast.success('Dokumen berhasil diunggah');
    refetchVerifications();
  };

  const deleteVerification = async (id: string) => {
    const { error } = await supabase.from('merchant_verifications').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus dokumen'); return; }
    toast.success('Dokumen dihapus');
    refetchVerifications();
  };

  const copyMerchantCode = () => {
    if (merchant?.merchant_code) {
      navigator.clipboard.writeText(merchant.merchant_code);
      toast.success('Kode merchant disalin ke papan klip');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordErrors({});
    setPasswordSuccess(false);
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => { if (err.path[0]) { errors[err.path[0] as string] = err.message; } });
      setPasswordErrors(errors);
      return;
    }
    setIsChangingPassword(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) throw new Error("Email pengguna tidak ditemukan");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentUser.email, password: passwordForm.currentPassword });
      if (signInError) { setPasswordErrors({ currentPassword: "Kata sandi saat ini salah" }); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (updateError) throw updateError;
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Kata sandi berhasil diubah");
    } catch (error) {
      toast.error((error as Error).message || "Gagal mengubah kata sandi");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="rounded-full bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" /> Terverifikasi</Badge>;
      case 'pending': return <Badge variant="secondary" className="rounded-full bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" /> Menunggu</Badge>;
      case 'rejected': return <Badge variant="destructive" className="rounded-full"><XCircle className="h-3 w-3 mr-1" /> Ditolak</Badge>;
      default: return <Badge variant="outline" className="rounded-full">Belum Diajukan</Badge>;
    }
  };

  const documentTypes = [
    { value: 'ktp', label: 'KTP (Kartu Tanda Penduduk)' },
    { value: 'npwp', label: 'NPWP (Nomor Pokok Wajib Pajak)' },
    { value: 'surat_kepemilikan', label: 'Surat Kepemilikan (Sertifikat)' },
    { value: 'siup', label: 'SIUP (Izin Usaha)' },
    { value: 'akta_perusahaan', label: 'Akta Perusahaan' },
    { value: 'proof_of_address', label: 'Bukti Alamat (Tagihan Utilitas)' },
  ];

  const [selectedDocType, setSelectedDocType] = useState('ktp');

  if (isLoading) return <ProfileFormSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader icon={Building2} title="Profil" description="Kelola detail bisnis dan verifikasi Anda" />
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="inline-flex rounded-full bg-card/80 backdrop-blur-sm border border-border/40 p-1">
          <TabsTrigger value="business" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />Bisnis
          </TabsTrigger>
          <TabsTrigger value="verification" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />Verifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          {/* Merchant Code Card */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Kode Merchant</CardTitle>
              <CardDescription>Bagikan kode ini kepada penyewa untuk menghubungkan mereka dengan properti Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl font-mono text-2xl font-bold tracking-widest text-center">
                  {merchant?.merchant_code || 'Memuat...'}
                </div>
                <Button variant="outline" size="icon" onClick={copyMerchantCode} className="rounded-xl" aria-label="Salin Kode Merchant">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Penyewa akan menggunakan kode ini saat mendaftar.</p>
            </CardContent>
          </Card>

          {/* Business Profile */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div>
                <CardTitle>Profil Bisnis</CardTitle>
              </div>
              <CardDescription>Perbarui informasi bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nama Bisnis</Label>
                  <Input id="business_name" value={businessForm.business_name} onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })} placeholder="Nama bisnis Anda" className="rounded-xl bg-background/60 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Tipe Bisnis</Label>
                  <Select value={businessForm.business_type} onValueChange={(value) => setBusinessForm({ ...businessForm, business_type: value })}>
                    <SelectTrigger id="business_type" className="rounded-xl bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Perorangan</SelectItem>
                      <SelectItem value="company">Perusahaan</SelectItem>
                      <SelectItem value="partnership">Kemitraan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input id="address" value={businessForm.address} onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })} className="rounded-xl bg-background/60 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Kota</Label>
                  <Input id="city" value={businessForm.city} onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })} className="rounded-xl bg-background/60 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi</Label>
                  <Input id="province" value={businessForm.province} onChange={(e) => setBusinessForm({ ...businessForm, province: e.target.value })} className="rounded-xl bg-background/60 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Kode Pos</Label>
                  <Input id="postal_code" value={businessForm.postal_code} onChange={(e) => setBusinessForm({ ...businessForm, postal_code: e.target.value })} className="rounded-xl bg-background/60 border-border/50" />
                </div>
              </div>
              <Button onClick={() => updateMerchant.mutate(businessForm)} disabled={updateMerchant.isPending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                {updateMerchant.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle>Informasi Kontak</CardTitle>
              <CardDescription>Perbarui detail kontak pribadi Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input id="full_name" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="rounded-xl bg-background/60 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl bg-background/60 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email || ''} disabled className="rounded-xl bg-background/60 border-border/50" />
                </div>
              </div>
              <Button onClick={() => updateProfile.mutate(profileForm)} disabled={updateProfile.isPending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Simpan Info Kontak
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Shield className="h-4 w-4 text-primary" /></div>
                  <CardTitle>Status Verifikasi</CardTitle>
                </div>
                {getVerificationBadge(merchant?.verification_status || 'pending')}
              </div>
              <CardDescription>Verifikasi membantu membangun kepercayaan dengan penyewa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
                <h4 className="font-medium mb-2">Dokumen yang Diperlukan</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['ktp', 'npwp', 'surat_kepemilikan'].map((docType) => (
                    <li key={docType} className="flex items-center gap-2">
                      {verifications.some(v => v.document_type === docType) ? (
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center"><CheckCircle className="h-3 w-3 text-success" /></div>
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {documentTypes.find(d => d.value === docType)?.label}
                    </li>
                  ))}
                  {businessForm.business_type !== 'individual' && ['siup', 'akta_perusahaan'].map((docType) => (
                    <li key={docType} className="flex items-center gap-2">
                      {verifications.some(v => v.document_type === docType) ? (
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-success/30 to-success/10 flex items-center justify-center"><CheckCircle className="h-3 w-3 text-success" /></div>
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {documentTypes.find(d => d.value === docType)?.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc_type">Tipe Dokumen</Label>
                  <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                    <SelectTrigger id="doc_type" className="rounded-xl bg-background/60 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FileUpload bucket="verification-documents" folder="verifications" accept="image/*,application/pdf" maxSize={10} onUploadComplete={(url) => uploadVerificationDocument(url, selectedDocType)} />
              </div>

              {verifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Dokumen yang Diunggah</h4>
                  {verifications.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5"><Shield className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVerificationBadge(doc.status || 'pending')}
                        {doc.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={() => deleteVerification(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><Lock className="h-4 w-4 text-primary" /></div>
                Ubah Kata Sandi
              </CardTitle>
              <CardDescription>Perbarui kata sandi Anda untuk menjaga keamanan akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success">
                  <CheckCircle className="h-4 w-4" /><span className="text-sm">Kata sandi berhasil diubah</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Masukkan kata sandi saat ini" className="rounded-xl bg-background/60 border-border/50" />
                {passwordErrors.currentPassword && <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordErrors.currentPassword}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Masukkan kata sandi baru" className="rounded-xl bg-background/60 border-border/50" />
                {passwordErrors.newPassword && <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordErrors.newPassword}</p>}
                <p className="text-xs text-muted-foreground">Minimal 12 karakter dengan huruf besar, huruf kecil, dan angka</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Konfirmasi kata sandi baru" className="rounded-xl bg-background/60 border-border/50" />
                {passwordErrors.confirmPassword && <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordErrors.confirmPassword}</p>}
              </div>
              <Button onClick={handlePasswordChange} disabled={isChangingPassword} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md">
                {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ubah Kata Sandi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MerchantProfile;
