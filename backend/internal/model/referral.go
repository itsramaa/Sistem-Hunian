package model

import "time"

// Referral represents a referral relationship between two users.
type Referral struct {
	ID         string    `json:"id"`
	ReferrerID string    `json:"referrer_id"`
	ReferredID string    `json:"referred_id"`
	Type       string    `json:"type"`       // merchant, vendor_order
	Status     string    `json:"status"`     // pending, completed, rejected
	Commission float64   `json:"commission"` // commission amount in IDR
	RewardPaid bool      `json:"reward_paid"`
	CreatedAt  time.Time `json:"created_at"`
}

// ReferralStats is a summary of referral activity for a user.
type ReferralStats struct {
	Total     int     `json:"total"`
	Completed int     `json:"completed"`
	Pending   int     `json:"pending"`
	Unpaid    int     `json:"unpaid"`
	TotalEarned float64 `json:"total_earned"`
}

// ProcessRewardRequest is the request body for processing a referral reward payout.
type ProcessRewardRequest struct {
	ReferralID    string  `json:"referral_id"`
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
}

// VendorOrderReferralRequest is the request body for recording a vendor order referral.
type VendorOrderReferralRequest struct {
	ReferredID  string  `json:"referred_id"`
	OrderID     string  `json:"order_id"`
	Commission  float64 `json:"commission"`
}
