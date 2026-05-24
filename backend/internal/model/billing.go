package model

import "time"

// Invoice represents a billing invoice in the system.
type Invoice struct {
	ID            string     `json:"id"`
	InvoiceNumber string     `json:"invoice_number"`
	MerchantID    string     `json:"merchant_id"`
	TenantUserID  string     `json:"tenant_user_id"`
	Amount        float64    `json:"amount"`
	TotalAmount   float64    `json:"total_amount"`
	LateFee       float64    `json:"late_fee"`
	Status        string     `json:"status"` // pending, sent, paid, overdue, cancelled
	DueDate       time.Time  `json:"due_date"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	Description   string     `json:"description"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// Payment represents a payment record linked to an invoice.
type Payment struct {
	ID            string    `json:"id"`
	InvoiceID     string    `json:"invoice_id"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"` // pending, paid, failed
	PaymentMethod string    `json:"payment_method"`
	XenditID      string    `json:"xendit_id"`
	PaymentURL    string    `json:"payment_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
