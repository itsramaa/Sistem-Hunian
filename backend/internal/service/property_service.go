package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// PropertyService handles business logic for properties and units.
type PropertyService struct {
	repo *repository.PropertyRepo
}

// NewPropertyService creates a new PropertyService.
func NewPropertyService(repo *repository.PropertyRepo) *PropertyService {
	return &PropertyService{repo: repo}
}

// ListProperties returns all properties for a merchant.
func (s *PropertyService) ListProperties(ctx context.Context, merchantID string) ([]model.Property, error) {
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	props, err := s.repo.ListProperties(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("property_service: list: %w", err)
	}
	if props == nil {
		props = []model.Property{}
	}
	return props, nil
}

// GetProperty returns a single property by ID, scoped to merchantID.
func (s *PropertyService) GetProperty(ctx context.Context, id, merchantID string) (*model.Property, error) {
	if id == "" {
		return nil, errors.New("property_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	prop, err := s.repo.GetProperty(ctx, id, merchantID)
	if err != nil {
		if isNotFound(err) {
			return nil, fmt.Errorf("property_service: not found")
		}
		return nil, fmt.Errorf("property_service: get: %w", err)
	}
	return prop, nil
}

// CreateProperty creates a new property for a merchant.
func (s *PropertyService) CreateProperty(ctx context.Context, merchantID string, req model.CreatePropertyRequest) (*model.Property, error) {
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	if err := validateCreateProperty(req); err != nil {
		return nil, err
	}
	prop, err := s.repo.CreateProperty(ctx, merchantID, req)
	if err != nil {
		return nil, fmt.Errorf("property_service: create: %w", err)
	}
	return prop, nil
}

// UpdateProperty updates a property, scoped to merchantID.
func (s *PropertyService) UpdateProperty(ctx context.Context, id, merchantID string, req model.UpdatePropertyRequest) (*model.Property, error) {
	if id == "" {
		return nil, errors.New("property_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	prop, err := s.repo.UpdateProperty(ctx, id, merchantID, req)
	if err != nil {
		if isNotFound(err) {
			return nil, fmt.Errorf("property_service: not found")
		}
		return nil, fmt.Errorf("property_service: update: %w", err)
	}
	return prop, nil
}

// DeleteProperty deletes a property, scoped to merchantID.
func (s *PropertyService) DeleteProperty(ctx context.Context, id, merchantID string) error {
	if id == "" {
		return errors.New("property_service: id is required")
	}
	if merchantID == "" {
		return errors.New("property_service: merchant_id is required")
	}
	if err := s.repo.DeleteProperty(ctx, id, merchantID); err != nil {
		if isNotFound(err) {
			return fmt.Errorf("property_service: not found")
		}
		return fmt.Errorf("property_service: delete: %w", err)
	}
	return nil
}

// ListUnits returns all units for a property, scoped to merchantID.
func (s *PropertyService) ListUnits(ctx context.Context, propertyID, merchantID string) ([]model.Unit, error) {
	if propertyID == "" {
		return nil, errors.New("property_service: property_id is required")
	}
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	units, err := s.repo.ListUnits(ctx, propertyID, merchantID)
	if err != nil {
		return nil, fmt.Errorf("property_service: list units: %w", err)
	}
	if units == nil {
		units = []model.Unit{}
	}
	return units, nil
}

// GetUnit returns a single unit by ID, scoped to merchantID.
func (s *PropertyService) GetUnit(ctx context.Context, unitID, merchantID string) (*model.Unit, error) {
	if unitID == "" {
		return nil, errors.New("property_service: unit_id is required")
	}
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	unit, err := s.repo.GetUnit(ctx, unitID, merchantID)
	if err != nil {
		if isNotFound(err) {
			return nil, fmt.Errorf("property_service: unit not found")
		}
		return nil, fmt.Errorf("property_service: get unit: %w", err)
	}
	return unit, nil
}

// CreateUnit creates a new unit for a property, scoped to merchantID.
func (s *PropertyService) CreateUnit(ctx context.Context, propertyID, merchantID string, req model.CreateUnitRequest) (*model.Unit, error) {
	if propertyID == "" {
		return nil, errors.New("property_service: property_id is required")
	}
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	if err := validateCreateUnit(req); err != nil {
		return nil, err
	}
	unit, err := s.repo.CreateUnit(ctx, propertyID, merchantID, req)
	if err != nil {
		return nil, fmt.Errorf("property_service: create unit: %w", err)
	}
	return unit, nil
}

// UpdateUnit updates a unit, scoped to merchantID.
func (s *PropertyService) UpdateUnit(ctx context.Context, unitID, merchantID string, req model.UpdateUnitRequest) (*model.Unit, error) {
	if unitID == "" {
		return nil, errors.New("property_service: unit_id is required")
	}
	if merchantID == "" {
		return nil, errors.New("property_service: merchant_id is required")
	}
	unit, err := s.repo.UpdateUnit(ctx, unitID, merchantID, req)
	if err != nil {
		if isNotFound(err) {
			return nil, fmt.Errorf("property_service: unit not found")
		}
		return nil, fmt.Errorf("property_service: update unit: %w", err)
	}
	return unit, nil
}

// DeleteUnit deletes a unit, scoped to merchantID.
func (s *PropertyService) DeleteUnit(ctx context.Context, unitID, merchantID string) error {
	if unitID == "" {
		return errors.New("property_service: unit_id is required")
	}
	if merchantID == "" {
		return errors.New("property_service: merchant_id is required")
	}
	if err := s.repo.DeleteUnit(ctx, unitID, merchantID); err != nil {
		if isNotFound(err) {
			return fmt.Errorf("property_service: unit not found")
		}
		return fmt.Errorf("property_service: delete unit: %w", err)
	}
	return nil
}

// validateCreateProperty validates the create property request.
func validateCreateProperty(req model.CreatePropertyRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("property_service: name is required")
	}
	if strings.TrimSpace(req.Type) == "" {
		return errors.New("property_service: type is required")
	}
	return nil
}

// validateCreateUnit validates the create unit request.
func validateCreateUnit(req model.CreateUnitRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return errors.New("property_service: unit name is required")
	}
	if req.RentAmount <= 0 {
		return errors.New("property_service: rent_amount must be positive")
	}
	return nil
}

// isNotFound checks if an error indicates a not-found condition.
func isNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
