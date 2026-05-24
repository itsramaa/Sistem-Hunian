export interface Waitinglist {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  notes?: string;
  status: 'waiting' | 'notified' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateWaitinglistRequest {
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  notes?: string;
}

export interface WaitinglistResponse {
  data: Waitinglist;
}

export interface ListWaitinglistResponse {
  data: Waitinglist[];
  total: number;
}
