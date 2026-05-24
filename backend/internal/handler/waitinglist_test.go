package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/itsramaa/sihuni-api/internal/handler"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// ── Mock service ──────────────────────────────────────────────────────────────

type mockWaitinglistService struct {
	createFn func(ctx context.Context, callerID string, req model.CreateWaitinglistRequest) (*model.Waitinglist, error)
	listFn   func(ctx context.Context, callerID, callerRole, propertyID string) ([]model.Waitinglist, error)
	deleteFn func(ctx context.Context, callerID, callerRole, id string) error
}

func (m *mockWaitinglistService) CreateWaitinglist(ctx context.Context, callerID string, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
	return m.createFn(ctx, callerID, req)
}
func (m *mockWaitinglistService) ListWaitinglist(ctx context.Context, callerID, callerRole, propertyID string) ([]model.Waitinglist, error) {
	return m.listFn(ctx, callerID, callerRole, propertyID)
}
func (m *mockWaitinglistService) DeleteWaitinglist(ctx context.Context, callerID, callerRole, id string) error {
	return m.deleteFn(ctx, callerID, callerRole, id)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func newTestWaitinglistHandler(svc handler.WaitinglistServicer) *handler.WaitinglistHandler {
	return handler.NewWaitinglistHandler(svc)
}

// injectWaitinglistClaims injects UserClaims into the request context.
func injectWaitinglistClaims(r *http.Request, userID, role string) *http.Request {
	claims := &middleware.UserClaims{
		UserID: userID,
		Role:   role,
		AppMetadata: map[string]interface{}{
			"role": role,
		},
	}
	ctx := context.WithValue(r.Context(), middleware.UserClaimsKey, claims)
	return r.WithContext(ctx)
}

func sampleWaitinglistEntry() *model.Waitinglist {
	return &model.Waitinglist{
		ID:         "11111111-1111-1111-1111-111111111111",
		TenantID:   "22222222-2222-2222-2222-222222222222",
		PropertyID: "33333333-3333-3333-3333-333333333333",
		Notes:      "test note",
		Status:     "waiting",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
}

// ── POST /v1/waitinglist ──────────────────────────────────────────────────────

func TestCreateWaitinglist_201_Success(t *testing.T) {
	entry := sampleWaitinglistEntry()
	svc := &mockWaitinglistService{
		createFn: func(_ context.Context, callerID string, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
			return entry, nil
		},
	}
	h := newTestWaitinglistHandler(svc)

	body := `{"property_id":"33333333-3333-3333-3333-333333333333","notes":"test note"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/waitinglist/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectWaitinglistClaims(req, "22222222-2222-2222-2222-222222222222", "tenant")
	rr := httptest.NewRecorder()

	h.CreateWaitinglist(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 Created, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestCreateWaitinglist_400_InvalidBody(t *testing.T) {
	svc := &mockWaitinglistService{}
	h := newTestWaitinglistHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/v1/waitinglist/", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.CreateWaitinglist(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", rr.Code)
	}
}

func TestCreateWaitinglist_400_InvalidUUID(t *testing.T) {
	svc := &mockWaitinglistService{}
	h := newTestWaitinglistHandler(svc)

	body := `{"property_id":"not-a-uuid"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/waitinglist/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.CreateWaitinglist(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid UUID, got %d", rr.Code)
	}
}

func TestCreateWaitinglist_401_Unauthorized(t *testing.T) {
	svc := &mockWaitinglistService{}
	h := newTestWaitinglistHandler(svc)

	body := `{"property_id":"33333333-3333-3333-3333-333333333333"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/waitinglist/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// No claims injected.
	rr := httptest.NewRecorder()

	h.CreateWaitinglist(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d", rr.Code)
	}
}

func TestCreateWaitinglist_TenantIDFromJWT(t *testing.T) {
	// Verify that tenant_id in the body is ignored and JWT callerID is used.
	var capturedCallerID string
	svc := &mockWaitinglistService{
		createFn: func(_ context.Context, callerID string, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
			capturedCallerID = callerID
			// Verify req.TenantID was overridden by handler.
			if req.TenantID != "jwt-user-id" {
				return nil, errors.New("tenant_id was not overridden from JWT")
			}
			return sampleWaitinglistEntry(), nil
		},
	}
	h := newTestWaitinglistHandler(svc)

	// Body contains a different tenant_id — should be ignored.
	body := `{"tenant_id":"attacker-id","property_id":"33333333-3333-3333-3333-333333333333"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/waitinglist/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectWaitinglistClaims(req, "jwt-user-id", "tenant")
	rr := httptest.NewRecorder()

	h.CreateWaitinglist(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 Created, got %d — body: %s", rr.Code, rr.Body.String())
	}
	if capturedCallerID != "jwt-user-id" {
		t.Errorf("expected callerID %q, got %q", "jwt-user-id", capturedCallerID)
	}
}

// ── GET /v1/waitinglist ───────────────────────────────────────────────────────

func TestListWaitinglist_200_Success(t *testing.T) {
	entries := []model.Waitinglist{*sampleWaitinglistEntry()}
	svc := &mockWaitinglistService{
		listFn: func(_ context.Context, callerID, callerRole, propertyID string) ([]model.Waitinglist, error) {
			return entries, nil
		},
	}
	h := newTestWaitinglistHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/v1/waitinglist/", nil)
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.ListWaitinglist(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d — body: %s", rr.Code, rr.Body.String())
	}

	var envelope struct {
		Data model.ListWaitinglistResponse `json:"data"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&envelope); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if envelope.Data.Total != 1 {
		t.Errorf("expected total=1, got %d", envelope.Data.Total)
	}
}

func TestListWaitinglist_400_InvalidPropertyUUID(t *testing.T) {
	svc := &mockWaitinglistService{}
	h := newTestWaitinglistHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/v1/waitinglist/?property_id=not-a-uuid", nil)
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.ListWaitinglist(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid property_id UUID, got %d", rr.Code)
	}
}

// ── DELETE /v1/waitinglist/:id ────────────────────────────────────────────────

func TestDeleteWaitinglist_204_Success(t *testing.T) {
	svc := &mockWaitinglistService{
		deleteFn: func(_ context.Context, callerID, callerRole, id string) error {
			return nil
		},
	}
	h := newTestWaitinglistHandler(svc)

	entryID := "11111111-1111-1111-1111-111111111111"
	req := httptest.NewRequest(http.MethodDelete, "/v1/waitinglist/"+entryID, nil)
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	// Inject chi URL param.
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", entryID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	// Re-inject claims after context replacement.
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.DeleteWaitinglist(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Errorf("expected 204 No Content, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteWaitinglist_403_Forbidden(t *testing.T) {
	svc := &mockWaitinglistService{
		deleteFn: func(_ context.Context, callerID, callerRole, id string) error {
			return errors.New("waitinglist_service: forbidden: not authorized to delete this entry")
		},
	}
	h := newTestWaitinglistHandler(svc)

	entryID := "11111111-1111-1111-1111-111111111111"
	req := httptest.NewRequest(http.MethodDelete, "/v1/waitinglist/"+entryID, nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", entryID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req = injectWaitinglistClaims(req, "tenant-2", "tenant")
	rr := httptest.NewRecorder()

	h.DeleteWaitinglist(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteWaitinglist_404_NotFound(t *testing.T) {
	svc := &mockWaitinglistService{
		deleteFn: func(_ context.Context, callerID, callerRole, id string) error {
			return errors.New("waitinglist_service: not found")
		},
	}
	h := newTestWaitinglistHandler(svc)

	entryID := "11111111-1111-1111-1111-111111111111"
	req := httptest.NewRequest(http.MethodDelete, "/v1/waitinglist/"+entryID, nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", entryID)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.DeleteWaitinglist(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteWaitinglist_400_InvalidUUID(t *testing.T) {
	svc := &mockWaitinglistService{}
	h := newTestWaitinglistHandler(svc)

	req := httptest.NewRequest(http.MethodDelete, "/v1/waitinglist/not-a-uuid", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "not-a-uuid")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	req = injectWaitinglistClaims(req, "tenant-1", "tenant")
	rr := httptest.NewRecorder()

	h.DeleteWaitinglist(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid UUID, got %d", rr.Code)
	}
}
