import { supabase } from '@/lib/integrations/supabase/client';
import { Profile, TenantProfile, UpdateProfilePayload, UpdateTenantPayload } from '../types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Profile;
  },

  async getTenantProfile(userId: string): Promise<TenantProfile | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as TenantProfile;
  },

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Profile;
  },

  async updateTenantProfile(userId: string, payload: UpdateTenantPayload): Promise<TenantProfile> {
    // Check if tenant record exists first, if not create it
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let query;
    if (existing) {
      query = supabase
        .from('tenants')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      query = supabase
        .from('tenants')
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as TenantProfile;
  },

  async uploadKtp(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-ktp-${Date.now()}.${fileExt}`;
    const filePath = `ktp/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  }
};
