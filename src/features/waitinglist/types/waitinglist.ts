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

// Backend returns a flat Waitinglist object for create/get single
export type WaitinglistResponse = Waitinglist;

// Backend returns { items: Waitinglist[], total: number } for list
export interface ListWaitinglistResponse {
  items: Waitinglist[];
  total: number;
}
