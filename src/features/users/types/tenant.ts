export interface TenantInvitation {
  id: string;
  merchant_id: string;
  unit_id: string;
  email: string;
  phone: string | null;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  unit?: {
    unit_number: string;
    property?: {
      name: string;
    };
  };
}

export interface ActiveTenant {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number | null;
  tenant_user_id: string;
  unit: {
    id: string;
    unit_number: string;
    property: {
      id: string;
      name: string;
    };
  } | null;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface AdminTenant extends ActiveTenant {
  merchant_id: string;
  merchant_profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}
