package middleware

import (
	"net/http"
	"strings"

	"github.com/rs/cors"
)

// CORS returns a CORS middleware configured for the given allowed origins.
// In development, credentials are allowed so the frontend can send cookies/auth headers.
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Cron-Secret", "X-Request-ID"},
		ExposedHeaders:   []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	return func(next http.Handler) http.Handler {
		return c.Handler(next)
	}
}

// CronAuth validates the X-Cron-Secret header for internal cron endpoints.
// Returns 401 if the secret is missing or does not match.
func CronAuth(cronSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			secret := r.Header.Get("X-Cron-Secret")
			if cronSecret == "" || !strings.EqualFold(secret, cronSecret) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"data":null,"error":{"code":"UNAUTHORIZED","message":"invalid cron secret","status":401}}`))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
