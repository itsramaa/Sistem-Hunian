package handler

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itsramaa/sistem-hunian/backend/internal/middleware"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/apierror"
	"github.com/itsramaa/sistem-hunian/backend/internal/pkg/response"
)

// bootstrapRequest is the request body for the Bootstrap endpoint.
type bootstrapRequest struct {
	FullName     string `json:"full_name"`
	BusinessName string `json:"business_name"`
	Phone        string `json:"phone"`
}

// Bootstrap handles POST /v1/auth/bootstrap
// Initialises a user's profile after first login.
func Bootstrap(pool *pgxpool.Pool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.UserClaims)
		if !ok || claims == nil {
			response.APIError(w, apierror.Unauthorized("authentication required"))
			return
		}

		var req bootstrapRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
			return
		}

		if pool == nil {
			response.APIError(w, apierror.Internal("database unavailable"))
			return
		}

		_, err := pool.Exec(r.Context(), `
			INSERT INTO profiles (user_id, email, full_name, phone)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (user_id) DO UPDATE
			SET full_name = EXCLUDED.full_name,
			    phone = EXCLUDED.phone
		`, claims.UserID, claims.Email, req.FullName, req.Phone)
		if err != nil {
			response.APIError(w, apierror.Internal("bootstrap failed: "+err.Error()))
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
}

// Me handles GET /v1/auth/me
// Returns the authenticated user's profile.
func Me(pool *pgxpool.Pool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(middleware.UserClaimsKey).(*middleware.UserClaims)
		if !ok || claims == nil {
			response.APIError(w, apierror.Unauthorized("authentication required"))
			return
		}

		if pool == nil {
			response.APIError(w, apierror.Internal("database unavailable"))
			return
		}

		var userID, email, fullName string
		err := pool.QueryRow(r.Context(), `
			SELECT user_id, email, COALESCE(full_name, '') FROM profiles WHERE user_id = $1
		`, claims.UserID).Scan(&userID, &email, &fullName)
		if err != nil {
			response.APIError(w, apierror.NotFound("profile not found"))
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{
			"user_id":   userID,
			"email":     email,
			"full_name": fullName,
			"role":      claims.Role,
		})
	})
}
