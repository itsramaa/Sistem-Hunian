package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

// invitationRow represents a tenant invitation record.
type invitationRow struct {
	Token       string     `json:"token"`
	Email       string     `json:"email"`
	PropertyID  string     `json:"property_id"`
	UnitID      *string    `json:"unit_id"`
	MerchantID  string     `json:"merchant_id"`
	Status      string     `json:"status"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

// GetInvitation handles GET /v1/invitations/:token (public, no auth required).
// Returns invitation details for the given token.
// This replaces the `get-tenant-invitation` Supabase Edge Function.
func GetInvitation(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := chi.URLParam(r, "token")
		if token == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "token is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var inv invitationRow
		err := pool.QueryRow(ctx, `
			SELECT token, email, property_id, unit_id, merchant_id, status, expires_at, created_at
			FROM tenant_invitations
			WHERE token = $1
		`, token).Scan(
			&inv.Token, &inv.Email, &inv.PropertyID, &inv.UnitID,
			&inv.MerchantID, &inv.Status, &inv.ExpiresAt, &inv.CreatedAt,
		)
		if err != nil {
			response.Error(w, http.StatusNotFound, "INVITATION_NOT_FOUND", "invitation not found")
			return
		}

		// Check expiry
		if inv.ExpiresAt != nil && time.Now().After(*inv.ExpiresAt) {
			response.Error(w, http.StatusGone, "INVITATION_EXPIRED", "invitation has expired")
			return
		}

		if inv.Status != "pending" {
			response.Error(w, http.StatusConflict, "INVITATION_ALREADY_USED", "invitation has already been used")
			return
		}

		response.JSON(w, http.StatusOK, inv)
	}
}

// acceptInvitationRequest is the request body for POST /v1/invitations/accept.
type acceptInvitationRequest struct {
	Token    string `json:"token"`
	UserID   string `json:"user_id"`
	FullName string `json:"full_name"`
}

// AcceptInvitation handles POST /v1/invitations/accept (public, no auth required).
// Marks the invitation as accepted and creates the tenant record + contract.
// This replaces the `accept-tenant-invitation` Supabase Edge Function.
func AcceptInvitation(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req acceptInvitationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}
		if req.Token == "" || req.UserID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "token and user_id are required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()

		// Fetch and validate invitation
		var inv invitationRow
		err := pool.QueryRow(ctx, `
			SELECT token, email, property_id, unit_id, merchant_id, status, expires_at, created_at
			FROM tenant_invitations
			WHERE token = $1
		`, req.Token).Scan(
			&inv.Token, &inv.Email, &inv.PropertyID, &inv.UnitID,
			&inv.MerchantID, &inv.Status, &inv.ExpiresAt, &inv.CreatedAt,
		)
		if err != nil {
			response.Error(w, http.StatusNotFound, "INVITATION_NOT_FOUND", "invitation not found")
			return
		}

		if inv.ExpiresAt != nil && time.Now().After(*inv.ExpiresAt) {
			response.Error(w, http.StatusGone, "INVITATION_EXPIRED", "invitation has expired")
			return
		}
		if inv.Status != "pending" {
			response.Error(w, http.StatusConflict, "INVITATION_ALREADY_USED", "invitation has already been used")
			return
		}

		// Execute acceptance in a transaction
		tx, err := pool.Begin(ctx)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to begin transaction")
			return
		}
		defer tx.Rollback(ctx)

		// Upsert tenant profile
		_, err = tx.Exec(ctx, `
			INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
			VALUES ($1, $2, $3, 'tenant', NOW(), NOW())
			ON CONFLICT (id) DO UPDATE
			SET email = EXCLUDED.email,
			    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
			    updated_at = NOW()
		`, req.UserID, inv.Email, req.FullName)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to upsert profile")
			return
		}

		// Upsert tenant record
		_, err = tx.Exec(ctx, `
			INSERT INTO tenants (user_id, created_at, updated_at)
			VALUES ($1, NOW(), NOW())
			ON CONFLICT (user_id) DO NOTHING
		`, req.UserID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to create tenant record")
			return
		}

		// Mark invitation as accepted
		_, err = tx.Exec(ctx, `
			UPDATE tenant_invitations
			SET status = 'accepted', accepted_at = NOW(), accepted_by = $1
			WHERE token = $2
		`, req.UserID, req.Token)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to update invitation status")
			return
		}

		if err := tx.Commit(ctx); err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", "failed to commit transaction")
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{
			"status":  "accepted",
			"user_id": req.UserID,
			"token":   req.Token,
		})
	}
}
