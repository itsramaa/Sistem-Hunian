package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
)

type contextKey string

const (
	// ContextKeyUserID is the context key for the authenticated user's ID.
	ContextKeyUserID contextKey = "user_id"
	// ContextKeyMerchantID is the context key for the authenticated merchant's ID.
	ContextKeyMerchantID contextKey = "merchant_id"
	// ContextKeyRole is the context key for the authenticated user's role.
	ContextKeyRole contextKey = "role"
	// ContextKeyClaims is the context key for the full JWT claims.
	ContextKeyClaims contextKey = "claims"
)

// Claims represents the JWT claims from Supabase.
type Claims struct {
	jwt.RegisteredClaims
	Role       string                 `json:"role"`
	Email      string                 `json:"email"`
	AppMetadata map[string]any        `json:"app_metadata"`
	UserMetadata map[string]any       `json:"user_metadata"`
}

// UserClaims is an alias for Claims used by test helpers.
type UserClaims struct {
	UserID      string
	Email       string
	Role        string
	AppMetadata map[string]interface{}
}

// UserClaimsKey is the context key used by test helpers to inject UserClaims.
const UserClaimsKey contextKey = "user_claims"

// RequireAuth validates the Bearer JWT token and injects claims into context.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing authorization header")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid authorization header format")
				return
			}

			tokenStr := parts[1]
			claims := &Claims{}

			token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired token")
				return
			}

			// Inject user info into context
			ctx := context.WithValue(r.Context(), ContextKeyClaims, claims)
			ctx = context.WithValue(ctx, ContextKeyUserID, claims.Subject)

			// Extract role from app_metadata (Supabase pattern)
			if role, ok := claims.AppMetadata["role"].(string); ok {
				ctx = context.WithValue(ctx, ContextKeyRole, role)
			}

			// Extract merchant_id from app_metadata if present
			if merchantID, ok := claims.AppMetadata["merchant_id"].(string); ok {
				ctx = context.WithValue(ctx, ContextKeyMerchantID, merchantID)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID extracts the user ID from the request context.
func GetUserID(r *http.Request) string {
	if v, ok := r.Context().Value(ContextKeyUserID).(string); ok {
		return v
	}
	return ""
}

// GetMerchantID extracts the merchant ID from the request context.
func GetMerchantID(r *http.Request) string {
	if v, ok := r.Context().Value(ContextKeyMerchantID).(string); ok {
		return v
	}
	return ""
}

// GetRole extracts the role from the request context.
func GetRole(r *http.Request) string {
	if v, ok := r.Context().Value(ContextKeyRole).(string); ok {
		return v
	}
	return ""
}
