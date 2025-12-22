import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, User, Phone, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenantProfileFormProps {
  userId: string;
  onComplete: () => void;
}

export function TenantProfileForm({ userId, onComplete }: TenantProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ktp_number: "",
    date_of_birth: "",
    gender: "",
    occupation: "",
    income_range: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    notes: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let ktpPhotoUrl = null;

      // Upload KTP photo if provided
      if (ktpFile) {
        const fileExt = ktpFile.name.split('.').pop();
        const fileName = `${userId}-ktp-${Date.now()}.${fileExt}`;
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

      // Check if tenant record exists
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingTenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update({
            ktp_number: formData.ktp_number || null,
            ktp_photo_url: ktpPhotoUrl,
            date_of_birth: formData.date_of_birth || null,
            gender: formData.gender || null,
            occupation: formData.occupation || null,
            income_range: formData.income_range || null,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,
            emergency_contact_relation: formData.emergency_contact_relation || null,
            notes: formData.notes || null,
            verification_status: 'pending',
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new tenant record
        const { error } = await supabase
          .from('tenants')
          .insert({
            user_id: userId,
            ktp_number: formData.ktp_number || null,
            ktp_photo_url: ktpPhotoUrl,
            date_of_birth: formData.date_of_birth || null,
            gender: formData.gender || null,
            occupation: formData.occupation || null,
            income_range: formData.income_range || null,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,
            emergency_contact_relation: formData.emergency_contact_relation || null,
            notes: formData.notes || null,
            verification_status: 'pending',
          });

        if (error) throw error;
      }

      toast.success("Profile completed successfully!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Please provide your personal details for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ktp_number">KTP Number (NIK)</Label>
              <Input
                id="ktp_number"
                value={formData.ktp_number}
                onChange={(e) => setFormData({ ...formData, ktp_number: e.target.value })}
                placeholder="16 digit NIK"
                maxLength={16}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Income Range (Monthly)</Label>
            <Select
              value={formData.income_range}
              onValueChange={(value) => setFormData({ ...formData, income_range: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select income range" />
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
        </CardContent>
      </Card>

      {/* KTP Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            KTP Photo
          </CardTitle>
          <CardDescription>
            Upload a clear photo of your KTP for identity verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {ktpPreview ? (
              <div className="space-y-4">
                <img
                  src={ktpPreview}
                  alt="KTP Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setKtpFile(null);
                    setKtpPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload KTP photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>
            Provide emergency contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                placeholder="+62..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select
              value={formData.emergency_contact_relation}
              onValueChange={(value) => setFormData({ ...formData, emergency_contact_relation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any additional information you'd like to share (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g., pets, specific requirements..."
            rows={3}
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Complete Profile
      </Button>
    </form>
  );
}
