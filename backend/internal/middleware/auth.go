package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

// UserClaimsKey is the context key for injected UserClaims.
const UserClaimsKey contextKey = "user_claims"

// UserClaims holds the parsed claims from a Supabase JWT.
type UserClaims struct {
	UserID      string
	Email       string
	Role        string
	AppMetadata map[string]interface{}
}

// Authenticate validates a Supabase-issued HS256 JWT and injects UserClaims into the request context.
// Requests without a valid Bearer token receive a 401 response.
// When APP_ENV=development and JWT_SECRET is empty, auth is bypassed and a mock user is injected.
func Authenticate(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Dev bypass: skip JWT validation when secret is not configured
			if jwtSecret == "" {
				mockClaims := &UserClaims{
					UserID: "dev-user-id",
					Email:  "dev@localhost",
					Role:   "merchant",
					AppMetadata: map[string]interface{}{
						"role":        "merchant",
						"merchant_id": "dev-merchant-id",
					},
				}
				ctx := context.WithValue(r.Context(), UserClaimsKey, mockClaims)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			authHeader := r.Header.Get("Authorization")
			if !strings.HasPrefix(authHeader, "Bearer ") {
				writeUnauthorized(w, "missing bearer token")
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				writeUnauthorized(w, "invalid token")
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeUnauthorized(w, "invalid claims")
				return
			}

			userClaims := &UserClaims{
				UserID: getString(claims, "sub"),
				Email:  getString(claims, "email"),
				Role:   getString(claims, "role"),
			}

			// app_metadata.role overrides the top-level role claim (Supabase pattern)
			if meta, ok := claims["app_metadata"].(map[string]interface{}); ok {
				userClaims.AppMetadata = meta
				if r, ok := meta["role"].(string); ok && r != "" {
					userClaims.Role = r
				}
			}

			ctx := context.WithValue(r.Context(), UserClaimsKey, userClaims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserClaims retrieves UserClaims from the request context.
// Returns nil if no claims are present (unauthenticated request).
func GetUserClaims(ctx context.Context) *UserClaims {
	claims, _ := ctx.Value(UserClaimsKey).(*UserClaims)
	return claims
}

// GetMerchantID is a convenience helper that extracts the merchant_id from app_metadata.
// Returns empty string if not present.
func GetMerchantID(r *http.Request) string {
	claims := GetUserClaims(r.Context())
	if claims == nil {
		return ""
	}
	if meta := claims.AppMetadata; meta != nil {
		if mid, ok := meta["merchant_id"].(string); ok {
			return mid
		}
	}
	return ""
}

// GetUserID is a convenience helper that extracts the user ID (sub) from the JWT claims.
// Returns empty string if not present.
func GetUserID(r *http.Request) string {
	claims := GetUserClaims(r.Context())
	if claims == nil {
		return ""
	}
	return claims.UserID
}

func writeUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	fmt.Fprintf(w, `{"data":null,"error":{"code":"UNAUTHORIZED","message":%q,"status":401}}`, message)
}

func getString(m jwt.MapClaims, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}
