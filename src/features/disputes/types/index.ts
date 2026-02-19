export interface Dispute {
  id: string;
  title: string;
  description: string;
  status: string | null;
  priority: string | null;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  tenant_user_id: string;
  merchant_id: string;
  contract_id: string | null;
  contract?: {
    id: string;
    unit?: {
      unit_number: string;
      property?: {
        name: string;
      };
    };
  } | null;
}

export interface DisputesResponse {
  disputes: Dispute[];
  total: number;
}

export interface ResolveDisputeParams {
  id: string;
  status: string;
  resolution: string;
  resolved_by?: string;
}
