package middleware

import (
	"net/http"

	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
)

// RequireWebhookSecret returns middleware that validates the X-Webhook-Secret header.
// This protects webhook endpoints (e.g., Supabase auth webhooks) from unauthorized callers.
func RequireWebhookSecret(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if secret == "" {
				response.Error(w, http.StatusServiceUnavailable, "MISCONFIGURED", "webhook secret not configured")
				return
			}
			if r.Header.Get("X-Webhook-Secret") != secret {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid webhook secret")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
