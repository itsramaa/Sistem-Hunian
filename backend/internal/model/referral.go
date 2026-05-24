package model

import "time"

// Referral represents a referral relationship between two users.
type Referral struct {
	ID         string    `json:"id"`
	ReferrerID string    `json:"referrer_id"`
	ReferredID string    `json:"referred_id"`
	Type       string    `json:"type"`       // merchant, vendor, tenant
	Status     string    `json:"status"`     // pending, completed, paid
	Commission float64   `json:"commission"` // commission amount in IDR
	RewardPaid bool      `json:"reward_paid"`
	CreatedAt  time.Time `json:"created_at"`
}

// ReferralStats holds aggregated referral statistics for a referrer.
type ReferralStats struct {
	TotalReferrals     int     `json:"total_referrals"`
	PendingReferrals   int     `json:"pending_referrals"`
	CompletedReferrals int     `json:"completed_referrals"`
	TotalCommission    float64 `json:"total_commission"`
	UnpaidCommission   float64 `json:"unpaid_commission"`
}

// ReferralRewardRequest is the request body for processing a referral reward payout.
type ReferralRewardRequest struct {
	ReferralID string `json:"referral_id"`
	// PayoutMethod is the payout channel (e.g. bank_transfer, wallet).
	PayoutMethod string `json:"payout_method,omitempty"`
}

// VendorOrderReferralRequest is the request body for recording a vendor order referral.
type VendorOrderReferralRequest struct {
	ReferrerID  string  `json:"referrer_id"`
	VendorID    string  `json:"vendor_id"`
	OrderID     string  `json:"order_id,omitempty"`
	OrderAmount float64 `json:"order_amount"`
}
