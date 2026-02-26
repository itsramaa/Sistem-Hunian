export type ApplicantStatus = 'interested' | 'applied' | 'offered' | 'accepted' | 'rejected' | 'waitlisted';

export interface WaitingListApplicant {
  id: string;
  merchantId: string;
  propertyId: string | null;
  unitId: string | null;
  applicantName: string;
  applicantPhone: string | null;
  applicantEmail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredMoveIn: string | null;
  specialNeeds: string | null;
  status: ApplicantStatus;
  qualityScore: number | null;
  priorityRank: number | null;
  notes: string | null;
  offeredAt: string | null;
  offerExpiresAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicantPayload {
  merchantId: string;
  propertyId?: string;
  applicantName: string;
  applicantPhone?: string;
  applicantEmail?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredMoveIn?: string;
  specialNeeds?: string;
  notes?: string;
}

export interface SendOfferPayload {
  applicantId: string;
  unitId: string;
  offerExpiresAt?: string;
}
