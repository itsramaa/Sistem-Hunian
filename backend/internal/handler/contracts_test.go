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

	"github.com/itsramaa/sihuni-api/internal/handler"
	"github.com/itsramaa/sihuni-api/internal/middleware"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// ── Minimal mock service ──────────────────────────────────────────────────────

type mockContractService struct {
	listContracts        func(ctx context.Context, merchantID string) ([]model.Contract, error)
	getContract          func(ctx context.Context, id, merchantID string) (*model.Contract, error)
	processDepositRefund func(ctx context.Context, id, merchantID string, req model.DepositRefundRequest) (*model.Contract, error)
	listMoveOuts         func(ctx context.Context, merchantID string) ([]model.MoveOutNotice, error)
	getMoveOut           func(ctx context.Context, id, merchantID string) (*model.MoveOutNotice, error)
	updateMoveOutStatus  func(ctx context.Context, id, merchantID string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error)
}

func (m *mockContractService) ListContracts(ctx context.Context, merchantID string) ([]model.Contract, error) {
	return m.listContracts(ctx, merchantID)
}
func (m *mockContractService) GetContract(ctx context.Context, id, merchantID string) (*model.Contract, error) {
	return m.getContract(ctx, id, merchantID)
}
func (m *mockContractService) ProcessDepositRefund(ctx context.Context, id, merchantID string, req model.DepositRefundRequest) (*model.Contract, error) {
	return m.processDepositRefund(ctx, id, merchantID, req)
}
func (m *mockContractService) ListMoveOuts(ctx context.Context, merchantID string) ([]model.MoveOutNotice, error) {
	return m.listMoveOuts(ctx, merchantID)
}
func (m *mockContractService) GetMoveOut(ctx context.Context, id, merchantID string) (*model.MoveOutNotice, error) {
	return m.getMoveOut(ctx, id, merchantID)
}
func (m *mockContractService) UpdateMoveOutStatus(ctx context.Context, id, merchantID string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error) {
	return m.updateMoveOutStatus(ctx, id, merchantID, req)
}

// newTestContractHandler wires a mock service into a real ContractHandler.
func newTestContractHandler(svc handler.ContractServicer) *handler.ContractHandler {
	return handler.NewContractHandler(svc)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// injectMerchantID injects a fake merchant_id into the request context,
// simulating what middleware.Authenticate would do after JWT validation.
func injectMerchantID(r *http.Request, merchantID string) *http.Request {
	claims := &middleware.UserClaims{
		UserID: "user-test-001",
		AppMetadata: map[string]interface{}{
			"merchant_id": merchantID,
		},
	}
	ctx := context.WithValue(r.Context(), middleware.UserClaimsKey, claims)
	return r.WithContext(ctx)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// TestListContracts_NoMerchantID verifies that a request without a merchant_id
// in the token context returns 403 Forbidden.
func TestListContracts_NoMerchantID(t *testing.T) {
	// Build a handler backed by a mock that should never be called.
	mock := &mockContractService{
		listContracts: func(_ context.Context, _ string) ([]model.Contract, error) {
			t.Fatal("service should not be called when merchant_id is missing")
			return nil, nil
		},
	}

	// Use the exported constructor via the interface adapter below.
	h := newTestContractHandler(mock)

	req := httptest.NewRequest(http.MethodGet, "/v1/contracts/", nil)
	// Deliberately do NOT inject merchant_id — context has no claims.
	rr := httptest.NewRecorder()

	h.ListContracts(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden, got %d", rr.Code)
	}
}

// TestListContracts_Success verifies that a valid merchant request returns 200
// with the contract list JSON.
func TestListContracts_Success(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	want := []model.Contract{
		{
			ID:            "contract-001",
			MerchantID:    "merchant-abc",
			TenantUserID:  "tenant-xyz",
			UnitID:        "unit-001",
			StartDate:     now,
			Status:        "active",
			DepositAmount: 1_500_000,
			DepositStatus: "held",
			CreatedAt:     now,
		},
	}

	mock := &mockContractService{
		listContracts: func(_ context.Context, merchantID string) ([]model.Contract, error) {
			if merchantID != "merchant-abc" {
				return nil, errors.New("unexpected merchant_id")
			}
			return want, nil
		},
	}

	h := newTestContractHandler(mock)

	req := httptest.NewRequest(http.MethodGet, "/v1/contracts/", nil)
	req = injectMerchantID(req, "merchant-abc")
	rr := httptest.NewRecorder()

	h.ListContracts(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d — body: %s", rr.Code, rr.Body.String())
	}

	var got []model.Contract
	var envelope struct {
		Data []model.Contract `json:"data"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&envelope); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}
	got = envelope.Data
	if len(got) != 1 {
		t.Errorf("expected 1 contract, got %d", len(got))
	}
	if got[0].ID != want[0].ID {
		t.Errorf("expected contract ID %q, got %q", want[0].ID, got[0].ID)
	}
}

// TestGetContract_NotFound verifies that a missing contract returns 404.
func TestGetContract_NotFound(t *testing.T) {
	mock := &mockContractService{
		getContract: func(_ context.Context, id, _ string) (*model.Contract, error) {
			return nil, errors.New("contract_service: not found")
		},
	}

	h := newTestContractHandler(mock)

	req := httptest.NewRequest(http.MethodGet, "/v1/contracts/nonexistent", nil)
	req = injectMerchantID(req, "merchant-abc")
	// Simulate chi URL param via Go 1.22 PathValue by setting it on the request.
	req.SetPathValue("id", "nonexistent")
	rr := httptest.NewRecorder()

	h.GetContract(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestProcessDepositRefund_InvalidAction verifies that an invalid action returns 400.
func TestProcessDepositRefund_InvalidAction(t *testing.T) {
	mock := &mockContractService{
		processDepositRefund: func(_ context.Context, _, _ string, req model.DepositRefundRequest) (*model.Contract, error) {
			return nil, errors.New("contract_service: action must be 'refund' or 'forfeit'")
		},
	}

	h := newTestContractHandler(mock)

	body := `{"action":"invalid","reason":"test"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/contracts/contract-001/deposit-refund", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectMerchantID(req, "merchant-abc")
	req.SetPathValue("id", "contract-001")
	rr := httptest.NewRecorder()

	h.ProcessDepositRefund(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// TestListMoveOuts_Success verifies that a valid merchant request returns 200
// with the move-out notice list.
func TestListMoveOuts_Success(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	want := []model.MoveOutNotice{
		{
			ID:           "moveout-001",
			ContractID:   "contract-001",
			MerchantID:   "merchant-abc",
			TenantUserID: "tenant-xyz",
			MoveOutDate:  now,
			Status:       "pending",
			Notes:        "",
			CreatedAt:    now,
		},
	}

	mock := &mockContractService{
		listMoveOuts: func(_ context.Context, merchantID string) ([]model.MoveOutNotice, error) {
			if merchantID != "merchant-abc" {
				return nil, errors.New("unexpected merchant_id")
			}
			return want, nil
		},
	}

	h := newTestContractHandler(mock)

	req := httptest.NewRequest(http.MethodGet, "/v1/contracts/move-outs/", nil)
	req = injectMerchantID(req, "merchant-abc")
	rr := httptest.NewRecorder()

	h.ListMoveOuts(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d — body: %s", rr.Code, rr.Body.String())
	}

	var got []model.MoveOutNotice
	var envelope struct {
		Data []model.MoveOutNotice `json:"data"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&envelope); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}
	got = envelope.Data
	if len(got) != 1 {
		t.Errorf("expected 1 move-out notice, got %d", len(got))
	}
	if got[0].ID != want[0].ID {
		t.Errorf("expected move-out ID %q, got %q", want[0].ID, got[0].ID)
	}
}

// TestUpdateMoveOutStatus_InvalidStatus verifies that an invalid status returns 400.
func TestUpdateMoveOutStatus_InvalidStatus(t *testing.T) {
	mock := &mockContractService{
		updateMoveOutStatus: func(_ context.Context, _, _ string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error) {
			return nil, errors.New("contract_service: status must be approved, rejected, or completed")
		},
	}

	h := newTestContractHandler(mock)

	body := `{"status":"unknown"}`
	req := httptest.NewRequest(http.MethodPut, "/v1/contracts/move-outs/moveout-001/status", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectMerchantID(req, "merchant-abc")
	req.SetPathValue("id", "moveout-001")
	rr := httptest.NewRecorder()

	h.UpdateMoveOutStatus(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d — body: %s", rr.Code, rr.Body.String())
	}
}
