package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/pkg/apierror"
	"github.com/itsramaa/sihuni-api/internal/pkg/response"
)

// uuidRegex matches a canonical UUID v4 string (case-insensitive).
var uuidRegex = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

// isValidUUID returns true if s is a valid UUID string.
func isValidUUID(s string) bool {
	return uuidRegex.MatchString(s)
}

// WaitinglistServicer defines the business-logic operations required by WaitinglistHandler.
// Using an interface here allows the handler to be unit-tested with a mock.
type WaitinglistServicer interface {
	CreateWaitinglist(ctx context.Context, callerID string, req model.CreateWaitinglistRequest) (*model.Waitinglist, error)
	ListWaitinglist(ctx context.Context, callerID, callerRole, propertyID string) ([]model.Waitinglist, error)
	DeleteWaitinglist(ctx context.Context, callerID, callerRole, id string) error
}

// WaitinglistHandler handles waitinglist HTTP requests.
type WaitinglistHandler struct {
	svc WaitinglistServicer
}

// NewWaitinglistHandler creates a new WaitinglistHandler.
func NewWaitinglistHandler(svc WaitinglistServicer) *WaitinglistHandler {
	return &WaitinglistHandler{svc: svc}
}

// CreateWaitinglist handles POST /v1/waitinglist
// Requires JWT auth. tenant_id is always taken from JWT claims — never from the request body.
func (h *WaitinglistHandler) CreateWaitinglist(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	if claims == nil {
		response.APIError(w, apierror.Unauthorized("authentication required"))
		return
	}

	var req model.CreateWaitinglistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.APIError(w, apierror.BadRequest("invalid request body"))
		return
	}

	// #30: Always override tenant_id from JWT — never trust the request body.
	req.TenantID = claims.UserID

	// #29: Validate property_id is a valid UUID.
	if req.PropertyID == "" {
		response.APIError(w, apierror.BadRequest("property_id is required"))
		return
	}
	if !isValidUUID(req.PropertyID) {
		response.APIError(w, apierror.BadRequest("invalid UUID format"))
		return
	}

	// #29: Validate unit_id if provided.
	if req.UnitID != nil && *req.UnitID != "" {
		if !isValidUUID(*req.UnitID) {
			response.APIError(w, apierror.BadRequest("invalid UUID format"))
			return
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	entry, err := h.svc.CreateWaitinglist(ctx, claims.UserID, req)
	if err != nil {
		// #31: Never leak raw DB errors to clients.
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			response.APIError(w, apierror.New(http.StatusConflict, "CONFLICT", "already on waiting list for this property"))
			return
		}
		log.Printf("waitinglist: create error: %v", err)
		response.APIError(w, apierror.Internal("internal server error"))
		return
	}

	response.JSON(w, http.StatusCreated, entry)
}

// ListWaitinglist handles GET /v1/waitinglist
// Requires JWT auth.
// - tenant role: returns only their own entries.
// - merchant/admin role: may filter by ?property_id= query param.
func (h *WaitinglistHandler) ListWaitinglist(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	if claims == nil {
		response.APIError(w, apierror.Unauthorized("authentication required"))
		return
	}

	// #29: Validate property_id query param if provided.
	propertyID := r.URL.Query().Get("property_id")
	if propertyID != "" {
		if !isValidUUID(propertyID) {
			response.APIError(w, apierror.BadRequest("invalid UUID format"))
			return
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// #28: Pass caller identity to service for role-based filtering.
	items, err := h.svc.ListWaitinglist(ctx, claims.UserID, claims.Role, propertyID)
	if err != nil {
		// #31: Never leak raw DB errors to clients.
		log.Printf("waitinglist: list error: %v", err)
		response.APIError(w, apierror.Internal("internal server error"))
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

// DeleteWaitinglist handles DELETE /v1/waitinglist/{id}
// Requires JWT auth. Tenants may only delete their own entries; merchant/admin may delete any.
func (h *WaitinglistHandler) DeleteWaitinglist(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	if claims == nil {
		response.APIError(w, apierror.Unauthorized("authentication required"))
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		response.APIError(w, apierror.BadRequest("waitinglist id is required"))
		return
	}

	// #29: Validate id is a valid UUID.
	if !isValidUUID(id) {
		response.APIError(w, apierror.BadRequest("invalid UUID format"))
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// #28: Pass caller identity to service for ownership check.
	if err := h.svc.DeleteWaitinglist(ctx, claims.UserID, claims.Role, id); err != nil {
		// #31: Never leak raw DB errors to clients.
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "no rows") {
			response.APIError(w, apierror.NotFound("waitinglist entry not found"))
			return
		}
		if strings.Contains(err.Error(), "forbidden") || strings.Contains(err.Error(), "unauthorized") {
			response.APIError(w, apierror.Forbidden("not authorized to delete this entry"))
			return
		}
		log.Printf("waitinglist: delete error: %v", err)
		response.APIError(w, apierror.Internal("internal server error"))
		return
	}

	response.NoContent(w)
}
