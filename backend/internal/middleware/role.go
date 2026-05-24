package middleware

import (
	"fmt"
	"net/http"
	"slices"
)

// RequireRole returns middleware that enforces the caller has one of the specified roles.
// Roles are matched against UserClaims.Role injected by the Authenticate middleware.
// Returns 403 if the role is not present or claims are missing.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserClaims(r.Context())
			if claims == nil || !slices.Contains(roles, claims.Role) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				fmt.Fprint(w, `{"data":null,"error":{"code":"FORBIDDEN","message":"insufficient permissions","status":403}}`)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
