import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_PERMISSIONS, type PermissionKey, type StaffRole } from '../constants/permissions';

export interface MerchantStaff {
  id: string;
  merchant_id: string;
  user_id: string;
  staff_role: StaffRole;
  display_name: string;
  email: string;
  phone: string | null;
  property_ids: string[];
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffPermission {
  id: string;
  staff_id: string;
  permission_key: PermissionKey;
  is_granted: boolean;
  created_at: string;
}

export interface InviteStaffData {
  merchant_id: string;
  user_id: string;
  staff_role: StaffRole;
  display_name: string;
  email: string;
  phone?: string;
  property_ids?: string[];
}

export interface UpdateStaffData {
  staff_role?: StaffRole;
  display_name?: string;
  phone?: string;
  property_ids?: string[];
  is_active?: boolean;
}

export async function fetchStaff(merchantId: string): Promise<MerchantStaff[]> {
  const { data, error } = await supabase
    .from('merchant_staff')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as MerchantStaff[];
}

export async function inviteStaff(payload: InviteStaffData): Promise<MerchantStaff> {
  const { data, error } = await supabase
    .from('merchant_staff')
    .insert({
      merchant_id: payload.merchant_id,
      user_id: payload.user_id,
      staff_role: payload.staff_role,
      display_name: payload.display_name,
      email: payload.email,
      phone: payload.phone || null,
      property_ids: payload.property_ids || [],
    })
    .select()
    .single();

  if (error) throw error;

  // Insert default permissions
  const defaults = DEFAULT_PERMISSIONS[payload.staff_role];
  if (defaults.length > 0) {
    const permRows = defaults.map((key) => ({
      staff_id: data.id,
      permission_key: key,
      is_granted: true,
    }));
    await supabase.from('staff_permissions').insert(permRows);
  }

  return data as unknown as MerchantStaff;
}

export async function updateStaff(id: string, updates: UpdateStaffData): Promise<void> {
  const { error } = await supabase
    .from('merchant_staff')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function removeStaff(id: string): Promise<void> {
  const { error } = await supabase
    .from('merchant_staff')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchPermissions(staffId: string): Promise<StaffPermission[]> {
  const { data, error } = await supabase
    .from('staff_permissions')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data || []) as unknown as StaffPermission[];
}

export async function updatePermissions(
  staffId: string,
  permissions: { permission_key: string; is_granted: boolean }[]
): Promise<void> {
  // Delete existing and re-insert
  await supabase.from('staff_permissions').delete().eq('staff_id', staffId);

  if (permissions.length > 0) {
    const rows = permissions.map((p) => ({
      staff_id: staffId,
      permission_key: p.permission_key,
      is_granted: p.is_granted,
    }));
    const { error } = await supabase.from('staff_permissions').insert(rows);
    if (error) throw error;
  }
}

export async function checkPermission(
  userId: string,
  merchantId: string,
  permissionKey: PermissionKey,
  propertyId?: string
): Promise<boolean> {
  // Check if user is the merchant owner
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (merchant) return true; // Owner has all permissions

  // Check staff permissions
  const { data: staff } = await supabase
    .from('merchant_staff')
    .select('id, property_ids')
    .eq('merchant_id', merchantId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!staff) return false;

  // Property-level scoping: if propertyId provided and staff has specific property_ids, check access
  if (propertyId) {
    const propertyIds = (staff.property_ids as string[]) || [];
    if (propertyIds.length > 0 && !propertyIds.includes(propertyId)) {
      return false; // Staff not assigned to this property
    }
  }

  const { data: perm } = await supabase
    .from('staff_permissions')
    .select('is_granted')
    .eq('staff_id', staff.id)
    .eq('permission_key', permissionKey)
    .maybeSingle();

  return perm?.is_granted ?? false;
}

export async function checkPropertyAccess(
  userId: string,
  merchantId: string,
  propertyId: string
): Promise<boolean> {
  // Check if user is the merchant owner
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (merchant) return true; // Owner has access to all properties

  // Check staff record
  const { data: staff } = await supabase
    .from('merchant_staff')
    .select('property_ids')
    .eq('merchant_id', merchantId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!staff) return false;

  const propertyIds = (staff.property_ids as string[]) || [];
  // Empty property_ids = all access (backward compatible)
  if (propertyIds.length === 0) return true;
  return propertyIds.includes(propertyId);
}

export async function getStaffPropertyIds(
  userId: string,
  merchantId: string
): Promise<{ propertyIds: string[] | null; isOwner: boolean }> {
  // Check if owner
  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (merchant) return { propertyIds: null, isOwner: true };

  const { data: staff } = await supabase
    .from('merchant_staff')
    .select('property_ids')
    .eq('merchant_id', merchantId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!staff) return { propertyIds: [], isOwner: false };

  const ids = (staff.property_ids as string[]) || [];
  return { propertyIds: ids, isOwner: false };
}
