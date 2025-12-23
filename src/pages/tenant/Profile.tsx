import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantLayout } from "@/components/layouts/TenantLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Loader2, Save, CreditCard, Upload, Phone, AlertTriangle } from "lucide-react";

const TenantProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = profileLoading || tenantLoading;

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
    }
  }, [tenant]);

  const updateProfile = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profil berhasil disimpan');
    },
    onError: () => toast.error('Gagal menyimpan profil'),
  });

  const updateTenantProfile = useMutation({
    mutationFn: async () => {
      let ktpPhotoUrl = tenant?.ktp_photo_url || null;

      if (ktpFile) {
        const fileExt = ktpFile.name.split('.').pop();
        const fileName = `${user?.id}-ktp-${Date.now()}.${fileExt}`;
        const filePath = `ktp/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(filePath, ktpFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(filePath);

        ktpPhotoUrl = publicUrl;
      }

      const tenantData = {
        ktp_number: tenantForm.ktp_number || null,
        ktp_photo_url: ktpPhotoUrl,
        date_of_birth: tenantForm.date_of_birth || null,
        gender: tenantForm.gender || null,
        occupation: tenantForm.occupation || null,
        income_range: tenantForm.income_range || null,
        emergency_contact_name: tenantForm.emergency_contact_name || null,
        emergency_contact_phone: tenantForm.emergency_contact_phone || null,
        emergency_contact_relation: tenantForm.emergency_contact_relation || null,
      };

      if (tenant) {
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('user_id', user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert({ user_id: user?.id, ...tenantData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success('Data identitas berhasil disimpan');
      setKtpFile(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleKtpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
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

  if (isLoading) {
    return (
      <TenantLayout title="Profil">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout 
      title="Profil Saya"
      description="Kelola informasi pribadi Anda"
    >
      <div className="space-y-6">
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
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Nomor telepon Anda"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">Hubungi support untuk mengubah email</p>
              </div>
            </div>
            <Button 
              onClick={() => updateProfile.mutate(profileForm)}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
            <CardDescription>KTP dan informasi verifikasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor KTP (NIK)</Label>
                <Input
                  value={tenantForm.ktp_number}
                  onChange={(e) => setTenantForm({ ...tenantForm, ktp_number: e.target.value })}
                  placeholder="16 digit NIK"
                  maxLength={16}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={tenantForm.date_of_birth}
                  onChange={(e) => setTenantForm({ ...tenantForm, date_of_birth: e.target.value })}
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
                    <img
                      src={ktpPreview}
                      alt="KTP Preview"
                      className="max-h-40 mx-auto rounded-lg object-contain"
                    />
                    <div className="flex justify-center">
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
                      accept="image/*"
                      onChange={handleKtpFileChange}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm mt-2">Klik untuk upload foto KTP</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG maksimal 5MB</p>
                  </label>
                )}
              </div>
            </div>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  value={tenantForm.emergency_contact_phone}
                  onChange={(e) => setTenantForm({ ...tenantForm, emergency_contact_phone: e.target.value })}
                  placeholder="Nomor telepon"
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

            <Button 
              onClick={() => updateTenantProfile.mutate()}
              disabled={updateTenantProfile.isPending}
            >
              {updateTenantProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan Data Identitas
            </Button>
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
};

export default TenantProfile;
