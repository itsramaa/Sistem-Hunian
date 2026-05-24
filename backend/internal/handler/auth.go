package handler

import (
	"context"
	"fmt"
	"net/http"

	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/validator"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	db *pgxpool.Pool
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{db: db}
}

// Webhook handles POST /v1/auth/webhook
// Called by Supabase after auth events (signup, login).
// Upserts profile and creates role-specific records.
// Protected by X-Webhook-Secret middleware.
func (h *AuthHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	var req model.AuthWebhookRequest
	if err := validator.DecodeJSONLenient(r, &req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
		return
	}

	if req.UserID == "" || req.Email == "" {
		response.APIError(w, apierror.BadRequest("user_id and email are required"))
		return
	}

	if err := h.processAuthWebhook(r.Context(), req); err != nil {
		response.APIError(w, apierror.Internal("webhook processing failed: "+err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, model.AuthWebhookResponse{OK: true})
}

// processAuthWebhook handles the business logic for the auth webhook.
func (h *AuthHandler) processAuthWebhook(ctx context.Context, req model.AuthWebhookRequest) error {
	tx, err := h.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("auth_webhook: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Upsert profile
	var profileID string
	err = tx.QueryRow(ctx,
		"SELECT id FROM profiles WHERE user_id = $1",
		req.UserID,
	).Scan(&profileID)

	if err == pgx.ErrNoRows {
		// Create new profile
		phone := nullableStr(req.Phone)
		err = tx.QueryRow(ctx, `
			INSERT INTO profiles (user_id, email, full_name, phone)
			VALUES ($1, $2, $3, $4)
			RETURNING id
		`, req.UserID, req.Email, req.FullName, phone).Scan(&profileID)
		if err != nil {
			return fmt.Errorf("auth_webhook: create profile: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("auth_webhook: check profile: %w", err)
	}

	// Upsert user role
	userRole := req.Role
	if userRole == "" {
		userRole = "tenant"
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_roles (user_id, role)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO NOTHING
	`, req.UserID, userRole)
	if err != nil {
		return fmt.Errorf("auth_webhook: upsert role: %w", err)
	}

	// Create role-specific records
	switch userRole {
	case "merchant":
		if err := createMerchantRecord(ctx, tx, req); err != nil {
			return err
		}
	case "tenant":
		if err := createTenantRecord(ctx, tx, req); err != nil {
			return err
		}
	case "vendor":
		if err := createVendorRecord(ctx, tx, req); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func createMerchantRecord(ctx context.Context, tx pgx.Tx, req model.AuthWebhookRequest) error {
	var exists bool
	_ = tx.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM merchants WHERE user_id = $1)",
		req.UserID,
	).Scan(&exists)
	if exists {
		return nil
	}

	businessName := req.BusinessName
	if businessName == "" {
		businessName = "My Business"
	}

	var merchantID string
	err := tx.QueryRow(ctx, `
		INSERT INTO merchants (user_id, business_name)
		VALUES ($1, $2)
		RETURNING id
	`, req.UserID, businessName).Scan(&merchantID)
	if err != nil {
		return fmt.Errorf("auth_webhook: create merchant: %w", err)
	}

	// Create free subscription trial
	var freeTierID string
	err = tx.QueryRow(ctx, `
		SELECT id FROM subscription_tiers WHERE name = 'free' AND is_active = true LIMIT 1
	`).Scan(&freeTierID)
	if err == nil && freeTierID != "" {
		_, _ = tx.Exec(ctx, `
			INSERT INTO merchant_subscriptions (
				merchant_id, tier_id, status,
				trial_ends_at, current_period_start, current_period_end, next_billing_date
			) VALUES ($1, $2, 'trialing',
				NOW() + INTERVAL '14 days',
				NOW(),
				NOW() + INTERVAL '14 days',
				NOW() + INTERVAL '14 days'
			)
			ON CONFLICT DO NOTHING
		`, merchantID, freeTierID)
	}

	return nil
}

func createTenantRecord(ctx context.Context, tx pgx.Tx, req model.AuthWebhookRequest) error {
	var exists bool
	_ = tx.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM tenants WHERE user_id = $1)",
		req.UserID,
	).Scan(&exists)
	if exists {
		return nil
	}

	var linkedMerchantID *string
	if req.MerchantCode != "" {
		var merchantID string
		err := tx.QueryRow(ctx,
			"SELECT id FROM merchants WHERE merchant_code = $1",
			req.MerchantCode,
		).Scan(&merchantID)
		if err == nil {
			linkedMerchantID = &merchantID
		}
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO tenants (user_id, linked_merchant_id, verification_status)
		VALUES ($1, $2, 'pending')
		ON CONFLICT DO NOTHING
	`, req.UserID, linkedMerchantID)
	if err != nil {
		return fmt.Errorf("auth_webhook: create tenant: %w", err)
	}
	return nil
}

func createVendorRecord(ctx context.Context, tx pgx.Tx, req model.AuthWebhookRequest) error {
	var exists bool
	_ = tx.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM vendors WHERE user_id = $1)",
		req.UserID,
	).Scan(&exists)
	if exists {
		return nil
	}

	businessName := req.BusinessName
	if businessName == "" {
		businessName = "My Business"
	}

	_, err := tx.Exec(ctx, `
		INSERT INTO vendors (user_id, business_name, contact_email, verification_status)
		VALUES ($1, $2, $3, 'pending')
		ON CONFLICT DO NOTHING
	`, req.UserID, businessName, req.Email)
	if err != nil {
		return fmt.Errorf("auth_webhook: create vendor: %w", err)
	}
	return nil
}

func nullableStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
