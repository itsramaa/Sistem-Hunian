package middleware

import (
	"net/http"

	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
)

// RequireCronSecret returns middleware that validates the X-Cron-Secret header.
// This protects cron endpoints from unauthorized access.
func RequireCronSecret(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if secret == "" {
				// If no secret configured, reject all requests for safety
				response.Error(w, http.StatusServiceUnavailable, "MISCONFIGURED", "cron secret not configured")
				return
			}
			if r.Header.Get("X-Cron-Secret") != secret {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid cron secret")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
