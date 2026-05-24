package model

import "time"

// Referral represents a referral relationship between two users.
type Referral struct {
	ID         string    `json:"id"`
	ReferrerID string    `json:"referrer_id"`
	ReferredID string    `json:"referred_id"`
	Type       string    `json:"type"`   // tenant, vendor
	Status     string    `json:"status"` // pending, completed, paid
	Commission float64   `json:"commission"`
	RewardPaid bool      `json:"reward_paid"`
	CreatedAt  time.Time `json:"created_at"`
}

// ReferralStats summarises referral activity for a user or merchant.
type ReferralStats struct {
	TotalReferrals    int     `json:"total_referrals"`
	PendingReferrals  int     `json:"pending_referrals"`
	CompletedReferrals int    `json:"completed_referrals"`
	TotalCommission   float64 `json:"total_commission"`
	UnpaidCommission  float64 `json:"unpaid_commission"`
}

// ReferralRewardRequest is the request body for processing a referral reward payout.
type ReferralRewardRequest struct {
	ReferralID string `json:"referral_id"`
	// PayoutMethod is the payout channel (e.g. bank_transfer, wallet).
	PayoutMethod string `json:"payout_method"`
}

// VendorOrderReferralRequest is the request body for processing a vendor order referral.
type VendorOrderReferralRequest struct {
	ReferrerID  string  `json:"referrer_id"`
	VendorID    string  `json:"vendor_id"`
	OrderID     string  `json:"order_id"`
	OrderAmount float64 `json:"order_amount"`
}
