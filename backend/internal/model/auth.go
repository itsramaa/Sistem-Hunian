package model

// AuthWebhookRequest is the payload from Supabase auth webhook.
// This is called after signup/login events.
type AuthWebhookRequest struct {
	UserID       string `json:"user_id"`
	Email        string `json:"email"`
	FullName     string `json:"full_name"`
	Phone        string `json:"phone"`
	Role         string `json:"role"`
	BusinessName string `json:"business_name"`
	MerchantCode string `json:"merchant_code"`
	ReferralCode string `json:"referral_code"`
}

// AuthWebhookResponse is the response for POST /v1/auth/webhook.
type AuthWebhookResponse struct {
	OK bool `json:"ok"`
}
