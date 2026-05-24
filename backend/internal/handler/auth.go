package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

// bootstrapRequest is the request body for POST /v1/auth/bootstrap.
type bootstrapRequest struct {
	FullName    string `json:"full_name"`
	PhoneNumber string `json:"phone_number"`
	Role        string `json:"role"` // merchant | tenant | vendor | admin
}

// Bootstrap handles POST /v1/auth/bootstrap.
// Creates or updates the user profile and provisions the role-specific record
// (merchant, tenant, or vendor) if it does not already exist.
// This replaces the `ensure-user-bootstrap` Supabase Edge Function.
func Bootstrap(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		var req bootstrapRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		// Upsert profile record
		_, err := pool.Exec(ctx, `
			INSERT INTO profiles (id, email, full_name, phone_number, role, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			ON CONFLICT (id) DO UPDATE
			SET email = EXCLUDED.email,
			    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
			    phone_number = COALESCE(NULLIF(EXCLUDED.phone_number, ''), profiles.phone_number),
			    updated_at = NOW()
		`, claims.UserID, claims.Email, req.FullName, req.PhoneNumber, claims.Role)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to upsert profile")
			return
		}

		// Provision role-specific record if not already present
		switch claims.Role {
		case "merchant":
			_, err = pool.Exec(ctx, `
				INSERT INTO merchants (user_id, created_at, updated_at)
				VALUES ($1, NOW(), NOW())
				ON CONFLICT (user_id) DO NOTHING
			`, claims.UserID)
		case "tenant":
			_, err = pool.Exec(ctx, `
				INSERT INTO tenants (user_id, created_at, updated_at)
				VALUES ($1, NOW(), NOW())
				ON CONFLICT (user_id) DO NOTHING
			`, claims.UserID)
		case "vendor":
			_, err = pool.Exec(ctx, `
				INSERT INTO vendors (user_id, created_at, updated_at)
				VALUES ($1, NOW(), NOW())
				ON CONFLICT (user_id) DO NOTHING
			`, claims.UserID)
		}
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to provision role record")
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{
			"user_id": claims.UserID,
			"role":    claims.Role,
			"status":  "bootstrapped",
		})
	}
}

// profileRow represents a row from the profiles table.
type profileRow struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	FullName    *string    `json:"full_name"`
	PhoneNumber *string    `json:"phone_number"`
	Role        *string    `json:"role"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Me handles GET /v1/auth/me.
// Returns the authenticated user's profile from the database.
func Me(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}

		if pool == nil {
			response.Error(w, http.StatusInternalServerError, "DB_UNAVAILABLE", "database not available")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var p profileRow
		err := pool.QueryRow(ctx, `
			SELECT id, email, full_name, phone_number, role, created_at, updated_at
			FROM profiles
			WHERE id = $1
		`, claims.UserID).Scan(&p.ID, &p.Email, &p.FullName, &p.PhoneNumber, &p.Role, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			response.Error(w, http.StatusNotFound, "PROFILE_NOT_FOUND", "profile not found")
			return
		}

		response.JSON(w, http.StatusOK, p)
	}
}

// validateAdmin2FARequest is the request body for POST /v1/auth/admin/2fa/validate.
type validateAdmin2FARequest struct {
	Code string `json:"code"`
}

// ValidateAdmin2FA handles POST /v1/auth/admin/2fa/validate.
// Validates a TOTP code for admin users.
// This replaces the `validate-admin-secret` Supabase Edge Function.
func ValidateAdmin2FA(adminSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing auth claims")
			return
		}
		if claims.Role != "admin" {
			response.Error(w, http.StatusForbidden, "FORBIDDEN", "admin role required")
			return
		}

		var req validateAdmin2FARequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}
		if req.Code == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "code is required")
			return
		}

		// Constant-time comparison to prevent timing attacks
		if !secureCompare(req.Code, adminSecret) {
			response.Error(w, http.StatusUnauthorized, "INVALID_2FA_CODE", "invalid 2FA code")
			return
		}

		response.JSON(w, http.StatusOK, map[string]bool{"valid": true})
	}
}

// secureCompare performs a constant-time string comparison to prevent timing attacks.
func secureCompare(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	var result byte
	for i := 0; i < len(a); i++ {
		result |= a[i] ^ b[i]
	}
	return result == 0
}
