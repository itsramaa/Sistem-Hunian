package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/service"
)

// --- Stub repo ---

type stubContractRepo struct {
	contracts []model.Contract
	moveOuts  []model.MoveOutNotice
	err       error
}

func (s *stubContractRepo) ListContracts(_ context.Context, _ string) ([]model.Contract, error) {
	return s.contracts, s.err
}

func (s *stubContractRepo) GetContract(_ context.Context, id, _ string) (*model.Contract, error) {
	if s.err != nil {
		return nil, s.err
	}
	for _, c := range s.contracts {
		if c.ID == id {
			return &c, nil
		}
	}
	return nil, errors.New("no rows in result set")
}

func (s *stubContractRepo) ProcessDepositRefund(_ context.Context, id, _ string, _ model.DepositRefundRequest) (*model.Contract, error) {
	if s.err != nil {
		return nil, s.err
	}
	for _, c := range s.contracts {
		if c.ID == id {
			c.DepositStatus = "refunded"
			return &c, nil
		}
	}
	return nil, errors.New("no rows in result set")
}

func (s *stubContractRepo) ListMoveOuts(_ context.Context, _ string) ([]model.MoveOutNotice, error) {
	return s.moveOuts, s.err
}

func (s *stubContractRepo) GetMoveOut(_ context.Context, id, _ string) (*model.MoveOutNotice, error) {
	if s.err != nil {
		return nil, s.err
	}
	for _, m := range s.moveOuts {
		if m.ID == id {
			return &m, nil
		}
	}
	return nil, errors.New("no rows in result set")
}

func (s *stubContractRepo) UpdateMoveOutStatus(_ context.Context, id, _ string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error) {
	if s.err != nil {
		return nil, s.err
	}
	for _, m := range s.moveOuts {
		if m.ID == id {
			m.Status = req.Status
			return &m, nil
		}
	}
	return nil, errors.New("no rows in result set")
}

// contractServiceFromStub creates a ContractService backed by a stub repo via interface.
// We use a thin adapter since ContractService takes *repository.ContractRepo.
// For unit tests we test the validation logic directly.

func TestContractService_ListContracts_EmptyMerchantID(t *testing.T) {
	svc := service.NewContractService(nil)
	_, err := svc.ListContracts(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty merchant_id")
	}
}

func TestContractService_GetContract_EmptyID(t *testing.T) {
	svc := service.NewContractService(nil)
	_, err := svc.GetContract(context.Background(), "", "merchant-1")
	if err == nil {
		t.Fatal("expected error for empty id")
	}
}

func TestContractService_ProcessDepositRefund_InvalidAmount(t *testing.T) {
	svc := service.NewContractService(nil)
	negAmt := float64(-100)
	_, err := svc.ProcessDepositRefund(context.Background(), "c-1", "m-1", model.DepositRefundRequest{
		RefundAmount: &negAmt,
	})
	if err == nil {
		t.Fatal("expected error for negative refund amount")
	}
}

func TestContractService_UpdateMoveOutStatus_InvalidStatus(t *testing.T) {
	svc := service.NewContractService(nil)
	_, err := svc.UpdateMoveOutStatus(context.Background(), "m-1", "merchant-1", model.UpdateMoveOutStatusRequest{
		Status: "invalid_status",
	})
	if err == nil {
		t.Fatal("expected error for invalid status")
	}
}

func TestContractService_UpdateMoveOutStatus_ValidStatuses(t *testing.T) {
	validStatuses := []string{"approved", "rejected", "completed"}
	svc := service.NewContractService(nil)
	for _, status := range validStatuses {
		// Will fail at repo level (nil repo), but validation should pass
		_, err := svc.UpdateMoveOutStatus(context.Background(), "m-1", "merchant-1", model.UpdateMoveOutStatusRequest{
			Status: status,
		})
		// We expect a nil pointer panic or repo error, not a validation error
		if err != nil && containsStr(err.Error(), "invalid status") {
			t.Errorf("status %q should be valid but got validation error: %v", status, err)
		}
	}
}

// --- Helpers ---

func containsStr(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstr(s, substr))
}

func containsSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Compile-time check that model types are usable.
var _ = model.Contract{
	ID:            "test",
	MerchantID:    "m-1",
	TenantUserID:  "u-1",
	UnitID:        "unit-1",
	StartDate:     time.Now(),
	Status:        "active",
	DepositAmount: 1000000,
	DepositStatus: "held",
}
