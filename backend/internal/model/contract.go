package model

import "time"

// Contract represents a rental agreement between a merchant and a tenant.
type Contract struct {
	ID            string     `json:"id"`
	MerchantID    string     `json:"merchant_id"`
	TenantUserID  string     `json:"tenant_user_id"`
	UnitID        string     `json:"unit_id"`
	StartDate     time.Time  `json:"start_date"`
	EndDate       *time.Time `json:"end_date,omitempty"`
	Status        string     `json:"status"`         // active, terminated, expired
	DepositAmount float64    `json:"deposit_amount"`
	DepositStatus string     `json:"deposit_status"` // held, refunded, forfeited
	CreatedAt     time.Time  `json:"created_at"`
}

// MoveOutNotice represents a tenant's intent to vacate a unit.
type MoveOutNotice struct {
	ID           string    `json:"id"`
	ContractID   string    `json:"contract_id"`
	MerchantID   string    `json:"merchant_id"`
	TenantUserID string    `json:"tenant_user_id"`
	MoveOutDate  time.Time `json:"move_out_date"`
	Status       string    `json:"status"` // pending, approved, rejected, completed
	Notes        string    `json:"notes,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// DepositRefundRequest is the request body for processing a deposit refund or forfeiture.
type DepositRefundRequest struct {
	// RefundAmount is the amount to refund. If zero, full deposit is refunded.
	RefundAmount *float64 `json:"refund_amount,omitempty"`
	// Reason describes why the deposit is being refunded or forfeited.
	Reason string `json:"reason,omitempty"`
	// Action is either "refund" or "forfeit".
	Action string `json:"action"`
	Notes  string `json:"notes,omitempty"`
}

// UpdateMoveOutStatusRequest is the request body for updating a move-out notice status.
type UpdateMoveOutStatusRequest struct {
	Status string `json:"status"` // approved, rejected, completed
	Notes  string `json:"notes,omitempty"`
}
