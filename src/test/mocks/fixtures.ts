/**
 * Test fixtures — reusable mock data untuk semua test
 */
import type { UserProfile } from "@/features/auth/types/auth";
import type { Property } from "@/features/properties/types";
import type { Room } from "@/features/rooms/types";
import type { Tenant } from "@/features/tenant/types";
import type { Payment } from "@/features/payments/types";
import type { Maintenance } from "@/features/maintenance/types";
import type { Confirmation } from "@/features/confirmations/types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const mockOperatorProfile: UserProfile = {
  id: "user-operator-1",
  name: "Operator Test",
  email: "operator@test.com",
  role: "operator",
  is_active: true,
  phone_number: "08123456789",
  token_version: 1,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockViewerProfile: UserProfile = {
  id: "user-viewer-1",
  name: "Viewer Test",
  email: "viewer@test.com",
  role: "viewer",
  is_active: true,
  phone_number: null,
  token_version: 1,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockAuthTokens = {
  access_token: "mock-jwt-token-abc123",
  expires_in: 3600,
  user: {
    id: "user-operator-1",
    email: "operator@test.com",
    name: "Operator Test",
    role: "operator" as const,
  },
};

// ─── Properties ──────────────────────────────────────────────────────────────
export const mockProperty: Property = {
  id: "prop-1",
  property_name: "Kos Anggrek",
  address: "Jl. Anggrek No.1, Jakarta",
  description: "Kos nyaman di pusat kota",
  total_rooms: 10,
  available_rooms: 3,
  occupied_rooms: 6,
  dp_confirmation_rooms: 1,
  active_tenants: 6,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockProperty2: Property = {
  id: "prop-2",
  property_name: "Kos Melati",
  address: "Jl. Melati No.5, Bandung",
  description: "Kos dekat kampus",
  total_rooms: 8,
  available_rooms: 2,
  occupied_rooms: 5,
  dp_confirmation_rooms: 1,
  active_tenants: 5,
  created_at: "2025-02-01T00:00:00Z",
  updated_at: "2025-02-01T00:00:00Z",
};

export const mockPropertiesList = [mockProperty, mockProperty2];

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const mockRoom: Room = {
  id: "room-1",
  property_id: "prop-1",
  property_name: "Kos Anggrek",
  room_number: "A01",
  room_type: "Standard",
  rent_price: 1500000,
  status: "occupied",
  active_tenant_name: "Budi Santoso",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-03-01T00:00:00Z",
};

export const mockRoomAvailable: Room = {
  id: "room-2",
  property_id: "prop-1",
  property_name: "Kos Anggrek",
  room_number: "A02",
  room_type: "Deluxe",
  rent_price: 2000000,
  status: "available",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockRoomDp: Room = {
  id: "room-3",
  property_id: "prop-1",
  property_name: "Kos Anggrek",
  room_number: "A03",
  room_type: "Standard",
  rent_price: 1500000,
  status: "dp_confirmation",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-15T00:00:00Z",
};

export const mockRoomsList = [mockRoom, mockRoomAvailable, mockRoomDp];

// ─── Tenants ─────────────────────────────────────────────────────────────────
export const mockTenant: Tenant = {
  id: "tenant-1",
  room_id: "room-1",
  property_id: "prop-1",
  room_number: "A01",
  property_name: "Kos Anggrek",
  name: "Budi Santoso",
  identity_number: "3201234567890001",
  phone_number: "08111222333",
  check_in_date: "2025-03-01",
  rental_duration: 6,
  status: "active",
  check_out_date: null,
  created_at: "2025-03-01T00:00:00Z",
  updated_at: "2025-03-01T00:00:00Z",
};

export const mockTenantCheckedOut: Tenant = {
  id: "tenant-2",
  room_id: "room-4",
  property_id: "prop-1",
  room_number: "B01",
  property_name: "Kos Anggrek",
  name: "Sari Dewi",
  identity_number: "3201234567890002",
  phone_number: "08222333444",
  check_in_date: "2024-01-01",
  rental_duration: 12,
  status: "checked_out",
  check_out_date: "2025-01-01",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockTenantsList = [mockTenant, mockTenantCheckedOut];

// ─── Payments ─────────────────────────────────────────────────────────────────
export const mockPayment: Payment = {
  id: "pay-1",
  room_id: "room-1",
  tenant_id: "tenant-1",
  period: "2025-06",
  amount: 1500000,
  payment_date: "2025-06-01",
  status: "paid",
  transfer_proof_url: "https://cdn.example.com/bukti1.jpg",
  wa_sent: true,
  room_number: "A01",
  property_name: "Kos Anggrek",
  tenant_name: "Budi Santoso",
  created_at: "2025-06-01T00:00:00Z",
  updated_at: "2025-06-01T00:00:00Z",
};

export const mockPaymentUnpaid: Payment = {
  id: "pay-2",
  room_id: "room-1",
  tenant_id: "tenant-1",
  period: "2025-07",
  amount: 1500000,
  payment_date: null,
  status: "unpaid",
  transfer_proof_url: null,
  wa_sent: false,
  room_number: "A01",
  property_name: "Kos Anggrek",
  tenant_name: "Budi Santoso",
  created_at: "2025-07-01T00:00:00Z",
  updated_at: "2025-07-01T00:00:00Z",
};

export const mockPaymentOverdue: Payment = {
  id: "pay-3",
  room_id: "room-1",
  tenant_id: "tenant-1",
  period: "2025-05",
  amount: 1500000,
  payment_date: null,
  status: "overdue",
  transfer_proof_url: null,
  wa_sent: true,
  room_number: "A01",
  property_name: "Kos Anggrek",
  tenant_name: "Budi Santoso",
  created_at: "2025-05-01T00:00:00Z",
  updated_at: "2025-05-01T00:00:00Z",
};

export const mockPaymentsList = [
  mockPayment,
  mockPaymentUnpaid,
  mockPaymentOverdue,
];

// ─── Maintenance ─────────────────────────────────────────────────────────────
export const mockMaintenance: Maintenance = {
  id: "maint-1",
  room_id: "room-1",
  room_number: "A01",
  property_name: "Kos Anggrek",
  report_date: "2025-06-10",
  damage_description: "AC tidak dingin",
  repair_action: "Isi freon",
  cost: 350000,
  damage_photo_url: "https://cdn.example.com/damage1.jpg",
  repair_photo_url: "https://cdn.example.com/repair1.jpg",
  status: "completed",
  created_at: "2025-06-10T00:00:00Z",
  updated_at: "2025-06-12T00:00:00Z",
};

export const mockMaintenanceReported: Maintenance = {
  id: "maint-2",
  room_id: "room-2",
  room_number: "A02",
  property_name: "Kos Anggrek",
  report_date: "2025-06-20",
  damage_description: "Lampu mati",
  repair_action: null,
  cost: null,
  damage_photo_url: null,
  repair_photo_url: null,
  status: "reported",
  created_at: "2025-06-20T00:00:00Z",
  updated_at: "2025-06-20T00:00:00Z",
};

export const mockMaintenanceInProgress: Maintenance = {
  id: "maint-3",
  room_id: "room-3",
  room_number: "A03",
  property_name: "Kos Anggrek",
  report_date: "2025-06-18",
  damage_description: "Wastafel bocor",
  repair_action: null,
  cost: null,
  damage_photo_url: null,
  repair_photo_url: null,
  status: "in_progress",
  created_at: "2025-06-18T00:00:00Z",
  updated_at: "2025-06-19T00:00:00Z",
};

export const mockMaintenanceList = [
  mockMaintenance,
  mockMaintenanceReported,
  mockMaintenanceInProgress,
];

// ─── Confirmations ────────────────────────────────────────────────────────────
export const mockConfirmation: Confirmation = {
  id: "conf-1",
  room_id: "room-3",
  room_number: "A03",
  property_name: "Kos Anggrek",
  prospect_name: "Andi Wijaya",
  phone_number: "08133344455",
  down_payment_amount: 500000,
  confirmation_deadline: "2025-07-01T00:00:00Z",
  remaining_days: 6,
  status: "pending",
  created_at: "2025-06-20T00:00:00Z",
  updated_at: "2025-06-20T00:00:00Z",
};

export const mockConfirmationConfirmed: Confirmation = {
  id: "conf-2",
  room_id: "room-5",
  room_number: "B02",
  property_name: "Kos Anggrek",
  prospect_name: "Rina Sari",
  phone_number: "08222333444",
  down_payment_amount: 750000,
  confirmation_deadline: "2025-06-25T00:00:00Z",
  remaining_days: 0,
  status: "confirmed",
  created_at: "2025-06-15T00:00:00Z",
  updated_at: "2025-06-22T00:00:00Z",
};

export const mockConfirmationList = [
  mockConfirmation,
  mockConfirmationConfirmed,
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const mockDashboardSummary = {
  total_properties: 2,
  total_rooms: 18,
  rooms_available: 5,
  rooms_occupied: 11,
  rooms_dp_confirmation: 2,
  property_summary: [],
  maintenance_summary: { reported: 2, in_progress: 0 },
};

export const mockDashboardAlerts = {
  dp_alerts: [
    {
      confirmation_id: "conf-1",
      room_number: "A03",
      property_name: "Kos Anggrek",
      tenant_name: "Andi Wijaya",
      deadline: "2025-07-01T00:00:00Z",
      hours_remaining: 72,
    },
  ],
  payment_alerts: [
    {
      payment_id: "pay-3",
      room_number: "A01",
      property_name: "Kos Anggrek",
      tenant_name: "Budi Santoso",
      period: "2025-05",
      amount: 1500000,
      days_overdue: 30,
    },
  ],
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const mockPagination = {
  page: 1,
  limit: 20,
  total: 10,
  total_pages: 1,
};
