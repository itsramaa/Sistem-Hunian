package middleware

import (
	"fmt"
	"net/http"
)

// RequireCronSecret returns middleware that validates the X-Cron-Secret header.
// This protects cron endpoints from unauthorized access.
func RequireCronSecret(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if secret == "" {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusServiceUnavailable)
				fmt.Fprint(w, `{"data":null,"error":{"code":"MISCONFIGURED","message":"cron secret not configured","status":503}}`)
				return
			}
			if r.Header.Get("X-Cron-Secret") != secret {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				fmt.Fprint(w, `{"data":null,"error":{"code":"UNAUTHORIZED","message":"invalid cron secret","status":401}}`)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
