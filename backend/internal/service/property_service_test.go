package service_test

import (
	"context"
	"testing"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/service"
)

// These tests validate the validation logic in the PropertyService layer.
// They use nil repo because validation happens before any repo call.

func TestPropertyService_ListProperties_EmptyMerchantID(t *testing.T) {
	svc := service.NewPropertyService(nil)
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
		Type: "kost",
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
		t.Fatal("expected error for missing type, got nil")
	}
}

func TestPropertyService_CreateUnit_MissingName(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.CreateUnit(context.Background(), "prop-1", "merchant-1", model.CreateUnitRequest{
		RentAmount: 1000000,
	})
	if err == nil {
		t.Fatal("expected error for missing unit name, got nil")
	}
}

func TestPropertyService_CreateUnit_InvalidRentAmount(t *testing.T) {
	svc := service.NewPropertyService(nil)
	_, err := svc.CreateUnit(context.Background(), "prop-1", "merchant-1", model.CreateUnitRequest{
		Name:       "Unit A1",
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
