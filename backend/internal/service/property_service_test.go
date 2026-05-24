package service_test

import (
	"context"
	"testing"

	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/service"
)

// mockPropertyRepo is a test double for PropertyRepo.
type mockPropertyRepo struct {
	properties []model.Property
	units      []model.Unit
	err        error
}

func (m *mockPropertyRepo) ListProperties(ctx context.Context, merchantID string) ([]model.Property, error) {
	if m.err != nil {
		return nil, m.err
	}
	var result []model.Property
	for _, p := range m.properties {
		if p.MerchantID == merchantID {
			result = append(result, p)
		}
	}
	return result, nil
}

func (m *mockPropertyRepo) GetProperty(ctx context.Context, id, merchantID string) (*model.Property, error) {
	if m.err != nil {
		return nil, m.err
	}
	for _, p := range m.properties {
		if p.ID == id && p.MerchantID == merchantID {
			return &p, nil
		}
	}
	return nil, errNotFound
}

func (m *mockPropertyRepo) CreateProperty(ctx context.Context, merchantID string, req model.CreatePropertyRequest) (*model.Property, error) {
	if m.err != nil {
		return nil, m.err
	}
	p := model.Property{
		ID:           "new-id",
		MerchantID:   merchantID,
		Name:         req.Name,
		PropertyType: req.PropertyType,
		Status:       req.Status,
	}
	m.properties = append(m.properties, p)
	return &p, nil
}

func (m *mockPropertyRepo) UpdateProperty(ctx context.Context, id, merchantID string, req model.UpdatePropertyRequest) (*model.Property, error) {
	if m.err != nil {
		return nil, m.err
	}
	for i, p := range m.properties {
		if p.ID == id && p.MerchantID == merchantID {
			if req.Name != nil {
				m.properties[i].Name = *req.Name
			}
			return &m.properties[i], nil
		}
	}
	return nil, errNotFound
}

func (m *mockPropertyRepo) DeleteProperty(ctx context.Context, id, merchantID string) error {
	if m.err != nil {
		return m.err
	}
	for i, p := range m.properties {
		if p.ID == id && p.MerchantID == merchantID {
			m.properties = append(m.properties[:i], m.properties[i+1:]...)
			return nil
		}
	}
	return errNotFound
}

func (m *mockPropertyRepo) ListUnits(ctx context.Context, propertyID, merchantID string) ([]model.Unit, error) {
	if m.err != nil {
		return nil, m.err
	}
	var result []model.Unit
	for _, u := range m.units {
		if u.PropertyID == propertyID {
			result = append(result, u)
		}
	}
	return result, nil
}

func (m *mockPropertyRepo) GetUnit(ctx context.Context, unitID, merchantID string) (*model.Unit, error) {
	if m.err != nil {
		return nil, m.err
	}
	for _, u := range m.units {
		if u.ID == unitID {
			return &u, nil
		}
	}
	return nil, errNotFound
}

func (m *mockPropertyRepo) CreateUnit(ctx context.Context, propertyID, merchantID string, req model.CreateUnitRequest) (*model.Unit, error) {
	if m.err != nil {
		return nil, m.err
	}
	u := model.Unit{
		ID:         "new-unit-id",
		PropertyID: propertyID,
		UnitNumber: req.UnitNumber,
		UnitType:   req.UnitType,
		RentAmount: req.RentAmount,
		Status:     req.Status,
	}
	m.units = append(m.units, u)
	return &u, nil
}

func (m *mockPropertyRepo) UpdateUnit(ctx context.Context, unitID, merchantID string, req model.UpdateUnitRequest) (*model.Unit, error) {
	if m.err != nil {
		return nil, m.err
	}
	for i, u := range m.units {
		if u.ID == unitID {
			if req.UnitNumber != nil {
				m.units[i].UnitNumber = *req.UnitNumber
			}
			return &m.units[i], nil
		}
	}
	return nil, errNotFound
}

func (m *mockPropertyRepo) DeleteUnit(ctx context.Context, unitID, merchantID string) error {
	if m.err != nil {
		return m.err
	}
	for i, u := range m.units {
		if u.ID == unitID {
			m.units = append(m.units[:i], m.units[i+1:]...)
			return nil
		}
	}
	return errNotFound
}

// errNotFound is a sentinel error for not-found conditions.
var errNotFound = &notFoundError{}

type notFoundError struct{}

func (e *notFoundError) Error() string { return "not found" }

// propertyRepoInterface defines the interface for the mock.
type propertyRepoInterface interface {
	ListProperties(ctx context.Context, merchantID string) ([]model.Property, error)
	GetProperty(ctx context.Context, id, merchantID string) (*model.Property, error)
	CreateProperty(ctx context.Context, merchantID string, req model.CreatePropertyRequest) (*model.Property, error)
	UpdateProperty(ctx context.Context, id, merchantID string, req model.UpdatePropertyRequest) (*model.Property, error)
	DeleteProperty(ctx context.Context, id, merchantID string) error
	ListUnits(ctx context.Context, propertyID, merchantID string) ([]model.Unit, error)
	GetUnit(ctx context.Context, unitID, merchantID string) (*model.Unit, error)
	CreateUnit(ctx context.Context, propertyID, merchantID string, req model.CreateUnitRequest) (*model.Unit, error)
	UpdateUnit(ctx context.Context, unitID, merchantID string, req model.UpdateUnitRequest) (*model.Unit, error)
	DeleteUnit(ctx context.Context, unitID, merchantID string) error
}

// newTestPropertyService creates a PropertyService with a mock repo.
// Note: This uses the concrete PropertyService with a real repo.
// For full isolation, PropertyService would accept an interface.
// These tests validate the validation logic in the service layer.
func TestPropertyService_ListProperties_EmptyMerchantID(t *testing.T) {
	// PropertyService validates merchantID before calling repo
	// We test this by calling with empty merchantID
	svc := service.NewPropertyService(nil) // repo won't be called
	_, err := svc.ListProperties(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty merchantID, got nil")
	}
}

func TestPropertyService_GetProperty_EmptyID(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.GetProperty(context.Background(), "", "merchant-1")
	if err == nil {
		t.Fatal("expected error for empty id, got nil")
	}
}

func TestPropertyService_CreateProperty_MissingName(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.CreateProperty(context.Background(), "merchant-1", model.CreatePropertyRequest{
		PropertyType: "kost",
	})
	if err == nil {
		t.Fatal("expected error for missing name, got nil")
	}
}

func TestPropertyService_CreateProperty_MissingType(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.CreateProperty(context.Background(), "merchant-1", model.CreatePropertyRequest{
		Name: "Test Property",
	})
	if err == nil {
		t.Fatal("expected error for missing property_type, got nil")
	}
}

func TestPropertyService_CreateUnit_MissingUnitNumber(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.CreateUnit(context.Background(), "prop-1", "merchant-1", model.CreateUnitRequest{
		RentAmount: 1000000,
	})
	if err == nil {
		t.Fatal("expected error for missing unit_number, got nil")
	}
}

func TestPropertyService_CreateUnit_InvalidRentAmount(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.CreateUnit(context.Background(), "prop-1", "merchant-1", model.CreateUnitRequest{
		UnitNumber: "A1",
		RentAmount: 0,
	})
	if err == nil {
		t.Fatal("expected error for zero rent_amount, got nil")
	}
}

func TestPropertyService_DeleteProperty_EmptyID(t *testing.T) {
	svc := service.NewPropertyService(nil)
	err := svc.DeleteProperty(context.Background(), "", "merchant-1")
	if err == nil {
		t.Fatal("expected error for empty id, got nil")
	}
}

func TestPropertyService_ListUnits_EmptyPropertyID(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.ListUnits(context.Background(), "", "merchant-1")
	if err == nil {
		t.Fatal("expected error for empty property_id, got nil")
	}
}
