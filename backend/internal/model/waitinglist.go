package model

import "time"

// Waitinglist represents a tenant's position in a property waiting list.
type Waitinglist struct {
	ID         string    `json:"id"`
	TenantID   string    `json:"tenant_id"`
	PropertyID string    `json:"property_id"`
	UnitID     *string   `json:"unit_id,omitempty"`
	Notes      string    `json:"notes"`
	Status     string    `json:"status"` // waiting, notified, cancelled
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CreateWaitinglistRequest is the request body for POST /v1/waitinglist.
type CreateWaitinglistRequest struct {
	TenantID   string  `json:"tenant_id"`
	PropertyID string  `json:"property_id"`
	UnitID     *string `json:"unit_id,omitempty"`
	Notes      string  `json:"notes,omitempty"`
}

// WaitinglistResponse is the response body for a single waitinglist entry.
type WaitinglistResponse struct {
	ID         string    `json:"id"`
	TenantID   string    `json:"tenant_id"`
	PropertyID string    `json:"property_id"`
	UnitID     *string   `json:"unit_id,omitempty"`
	Notes      string    `json:"notes"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ListWaitinglistResponse is the response body for a list of waitinglist entries.
type ListWaitinglistResponse struct {
	Total int                   `json:"total"`
	Items []WaitinglistResponse `json:"items"`
}
