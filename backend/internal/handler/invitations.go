package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itsramaa/sihuni-api/internal/pkg/apierror"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

// acceptInvitationRequest is the request body for accepting an invitation.
type acceptInvitationRequest struct {
	Token  string `json:"token"`
	UserID string `json:"user_id"`
}

// GetInvitation returns an http.Handler that looks up an invitation by token.
// The token is read from the chi URL param "token".
func GetInvitation(pool *pgxpool.Pool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := chi.URLParam(r, "token")
		if token == "" {
			response.APIError(w, apierror.BadRequest("token is required"))
			return
		}

		if pool == nil {
			response.APIError(w, apierror.NotFound("invitation not found"))
			return
		}

		var invitationID, email, role string
		err := pool.QueryRow(r.Context(), `
			SELECT id, email, role FROM invitations WHERE token = $1 AND used = false
		`, token).Scan(&invitationID, &email, &role)
		if err != nil {
			response.APIError(w, apierror.NotFound("invitation not found"))
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{
			"id":    invitationID,
			"email": email,
			"role":  role,
		})
	})
}

// AcceptInvitation returns an http.Handler that accepts an invitation.
// Requires token and user_id in the request body.
func AcceptInvitation(pool *pgxpool.Pool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req acceptInvitationRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.APIError(w, apierror.BadRequest("invalid request body: "+err.Error()))
			return
		}

		if req.Token == "" {
			response.APIError(w, apierror.BadRequest("token is required"))
			return
		}
		if req.UserID == "" {
			response.APIError(w, apierror.BadRequest("user_id is required"))
			return
		}

		if pool == nil {
			response.APIError(w, apierror.NotFound("invitation not found"))
			return
		}

		result, err := pool.Exec(r.Context(), `
			UPDATE invitations SET used = true, used_by = $1, used_at = NOW()
			WHERE token = $2 AND used = false
		`, req.UserID, req.Token)
		if err != nil || result.RowsAffected() == 0 {
			response.APIError(w, apierror.NotFound("invitation not found or already used"))
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"status": "accepted"})
	})
}
