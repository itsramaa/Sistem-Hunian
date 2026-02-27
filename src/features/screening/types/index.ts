export interface ScreeningFormData {
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  occupation: string;
  employer_name: string;
  monthly_income: number;
  previous_landlord_name: string;
  previous_landlord_phone: string;
  previous_rental_notes: string;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_relation: string;
  tenant_user_id?: string;
}

export type ScreeningGrade = 'green' | 'yellow' | 'red';
export type ScreeningStatus = 'pending' | 'scored' | 'approved' | 'rejected';

export interface TenantScreening {
  id: string;
  merchant_id: string;
  tenant_user_id: string | null;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  occupation: string | null;
  employer_name: string | null;
  monthly_income: number | null;
  income_proof_url: string | null;
  previous_landlord_name: string | null;
  previous_landlord_phone: string | null;
  previous_rental_notes: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  guarantor_relation: string | null;
  guarantor_id_url: string | null;
  screening_score: number | null;
  screening_grade: ScreeningGrade | null;
  ai_assessment: Record<string, unknown> | null;
  status: ScreeningStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapQualityGradeToScreeningGrade(grade: string): ScreeningGrade {
  if (['A', 'B'].includes(grade)) return 'green';
  if (grade === 'C') return 'yellow';
  return 'red';
}
