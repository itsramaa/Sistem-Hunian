import { supabase } from "@/integrations/supabase/client";

export interface DocumentTemplate {
  id: string;
  merchant_id: string | null;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: TemplateVariable[];
  is_default: boolean;
  is_system: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
}

export const TEMPLATE_CATEGORIES = [
  { value: 'lease_contract', label: 'Kontrak Sewa' },
  { value: 'house_rules', label: 'Peraturan Kost' },
  { value: 'move_in_checklist', label: 'Checklist Move-In' },
  { value: 'inspection_report', label: 'Laporan Inspeksi' },
  { value: 'eviction_notice', label: 'Surat Pengakhiran' },
  { value: 'payment_reminder', label: 'Surat Tagihan' },
  { value: 'other', label: 'Lainnya' },
];

export async function fetchTemplates(merchantId: string, category?: string) {
  let query = supabase
    .from('document_templates')
    .select('*')
    .or(`merchant_id.eq.${merchantId},is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(d => ({
    ...d,
    variables: (d.variables as any) || [],
  })) as DocumentTemplate[];
}

export async function createTemplate(data: {
  merchant_id: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  variables?: TemplateVariable[];
  is_default?: boolean;
}) {
  const { data: result, error } = await supabase
    .from('document_templates')
    .insert({
      ...data,
      variables: (data.variables || []) as any,
      is_system: false,
    })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateTemplate(id: string, data: Partial<{
  name: string;
  description: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
}>) {
  const updateData: any = { ...data };
  if (data.variables) updateData.variables = data.variables as any;

  // Bump version
  const { data: current } = await supabase
    .from('document_templates')
    .select('version')
    .eq('id', id)
    .single();

  updateData.version = (current?.version || 0) + 1;

  const { data: result, error } = await supabase
    .from('document_templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', id)
    .eq('is_system', false);
  if (error) throw error;
}

export async function duplicateTemplate(id: string, merchantId: string) {
  const { data: original, error: fetchError } = await supabase
    .from('document_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('document_templates')
    .insert({
      merchant_id: merchantId,
      name: `${original.name} (Salinan)`,
      description: original.description,
      category: original.category,
      content: original.content,
      variables: original.variables,
      is_system: false,
      is_default: false,
      version: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function fillTemplate(content: string, variables: Record<string, string>): string {
  let filled = content;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return filled;
}

export function getAvailableVariables(category: string): TemplateVariable[] {
  const common: TemplateVariable[] = [
    { name: 'property_name', label: 'Nama Properti' },
    { name: 'property_address', label: 'Alamat Properti' },
    { name: 'owner_name', label: 'Nama Pemilik' },
    { name: 'tenant_name', label: 'Nama Penyewa' },
    { name: 'unit_number', label: 'Nomor Kamar' },
    { name: 'current_date', label: 'Tanggal Hari Ini' },
    { name: 'city', label: 'Kota' },
  ];

  const categoryVars: Record<string, TemplateVariable[]> = {
    lease_contract: [
      { name: 'tenant_id_number', label: 'No KTP Penyewa' },
      { name: 'tenant_phone', label: 'No HP Penyewa' },
      { name: 'start_date', label: 'Tanggal Mulai' },
      { name: 'end_date', label: 'Tanggal Berakhir' },
      { name: 'rent_amount', label: 'Biaya Sewa' },
      { name: 'deposit_amount', label: 'Deposit' },
      { name: 'billing_day', label: 'Tanggal Bayar' },
      { name: 'house_rules', label: 'Peraturan Kost' },
    ],
    payment_reminder: [
      { name: 'billing_period', label: 'Periode Tagihan' },
      { name: 'amount_due', label: 'Jumlah Tagihan' },
      { name: 'due_date', label: 'Tanggal Jatuh Tempo' },
      { name: 'deadline_date', label: 'Batas Pembayaran' },
    ],
    eviction_notice: [
      { name: 'end_date', label: 'Tanggal Berakhir' },
      { name: 'termination_reason', label: 'Alasan' },
      { name: 'move_out_date', label: 'Tanggal Move-Out' },
    ],
    house_rules: [
      { name: 'curfew_time', label: 'Jam Malam' },
      { name: 'max_guest_nights', label: 'Maks Tamu Menginap' },
      { name: 'late_fee', label: 'Denda Keterlambatan' },
      { name: 'guardian_name', label: 'Nama Pengelola' },
      { name: 'guardian_phone', label: 'No HP Pengelola' },
    ],
    move_in_checklist: [
      { name: 'inspection_date', label: 'Tanggal Inspeksi' },
      { name: 'electricity_meter', label: 'Meter Listrik' },
      { name: 'water_meter', label: 'Meter Air' },
    ],
  };

  return [...common, ...(categoryVars[category] || [])];
}
