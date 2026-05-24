package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
	"github.com/itsramaa/sihuni-api/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CreateWaitinglist handles POST /v1/waitinglist
// Requires JWT auth. Tenant submits themselves to a property waiting list.
func CreateWaitinglist(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "authentication required")
			return
		}

		var req model.CreateWaitinglistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "invalid request body")
			return
		}

		// Use the authenticated user's ID as tenant_id if not explicitly provided
		if req.TenantID == "" {
			req.TenantID = claims.UserID
		}

		if req.PropertyID == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "property_id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		entry, err := service.CreateWaitinglist(ctx, pool, req)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
				response.Error(w, http.StatusConflict, "CONFLICT", "already on waiting list for this property")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusCreated, entry)
	}
}

// ListWaitinglist handles GET /v1/waitinglist
// Requires JWT auth. Accepts optional ?property_id= query param.
func ListWaitinglist(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "authentication required")
			return
		}

		propertyID := r.URL.Query().Get("property_id")

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		items, err := service.ListWaitinglist(ctx, pool, propertyID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		resp := model.ListWaitinglistResponse{
			Total: len(items),
			Items: make([]model.WaitinglistResponse, 0, len(items)),
		}
		for _, item := range items {
			resp.Items = append(resp.Items, model.WaitinglistResponse{
				ID:         item.ID,
				TenantID:   item.TenantID,
				PropertyID: item.PropertyID,
				UnitID:     item.UnitID,
				Notes:      item.Notes,
				Status:     item.Status,
				CreatedAt:  item.CreatedAt,
				UpdatedAt:  item.UpdatedAt,
			})
		}

		response.JSON(w, http.StatusOK, resp)
	}
}

// DeleteWaitinglist handles DELETE /v1/waitinglist/{id}
// Requires JWT auth.
func DeleteWaitinglist(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := middleware.GetUserClaims(r.Context())
		if claims == nil {
			response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "authentication required")
			return
		}

		id := chi.URLParam(r, "id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "INVALID_REQUEST", "waitinglist id is required")
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		if err := service.DeleteWaitinglist(ctx, pool, id); err != nil {
			if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "no rows") {
				response.Error(w, http.StatusNotFound, "NOT_FOUND", "waitinglist entry not found")
				return
			}
			response.Error(w, http.StatusInternalServerError, "DB_ERROR", err.Error())
			return
		}

		response.JSON(w, http.StatusOK, map[string]string{"message": "waitinglist entry deleted"})
	}
}
