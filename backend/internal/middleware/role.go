package middleware

import (
	"net/http"

	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
)

// RequireRole returns middleware that checks the user has one of the allowed roles.
// Must be used after RequireAuth.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetRole(r)
			if _, ok := allowed[role]; !ok {
				response.Error(w, http.StatusForbidden, "FORBIDDEN", "insufficient permissions")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
