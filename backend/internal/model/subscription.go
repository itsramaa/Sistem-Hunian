package model

import "time"

// Subscription represents a merchant's active subscription plan.
type Subscription struct {
	ID                 string    `json:"id"`
	MerchantID         string    `json:"merchant_id"`
	TierID             string    `json:"tier_id"`
	Status             string    `json:"status"` // active, grace_period, expired, cancelled
	CurrentPeriodStart time.Time `json:"current_period_start"`
	CurrentPeriodEnd   time.Time `json:"current_period_end"`
	CreatedAt          time.Time `json:"created_at"`
}

// SubscriptionTier represents a subscription plan tier.
type SubscriptionTier struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	// BillingCycleDays is the number of days in a billing cycle (e.g. 30 for monthly).
	BillingCycleDays int  `json:"billing_cycle_days"`
	MaxUnits         *int `json:"max_units,omitempty"`
	MaxProperties    *int `json:"max_properties,omitempty"`
	IsActive         bool `json:"is_active"`
}

// CreateSubscriptionRequest is the request body for creating a subscription.
type CreateSubscriptionRequest struct {
	TierID string `json:"tier_id"`
}

// UpdateSubscriptionStatusRequest is the request body for updating subscription status.
type UpdateSubscriptionStatusRequest struct {
	Status string `json:"status"` // active, grace_period, expired, cancelled
}

// SubscriptionPaymentRequest is the request body for processing a subscription payment.
type SubscriptionPaymentRequest struct {
	SubscriptionID string  `json:"subscription_id"`
	Amount         float64 `json:"amount"`
	// PaymentMethod is the payment method identifier (e.g. xendit invoice ID).
	PaymentMethod string `json:"payment_method"`
}
