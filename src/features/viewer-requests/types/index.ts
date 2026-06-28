// ViewerRequest — sesuai schema DB & Class Diagram
export type ViewerRequestType = "payment" | "damage" | "prospect";
export type ViewerRequestStatus = "forwarded" | "wa_failed";

export interface ViewerRequestPayload {
  request_type: ViewerRequestType;
  property_id: string;
  room_id: string;
  description: string;
  prospect_name?: string | null;
  prospect_phone?: string | null;
}

export interface ViewerRequest {
  id: string;
  request_type: ViewerRequestType;
  room_id: string;
  room_number: string;
  property_name?: string;
  description: string;
  prospect_name?: string | null;
  prospect_phone?: string | null;
  created_by?: string | null;
  reporter_name?: string | null;
  status: ViewerRequestStatus;
  created_at: string;
}

export interface ViewerRequestListResponse {
  success: boolean;
  data: ViewerRequest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
