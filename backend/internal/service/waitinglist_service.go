package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

// WaitinglistRepo defines the repository operations required by WaitinglistService.
// This interface enables unit testing with mocks.
type WaitinglistRepo interface {
	CreateWaitinglist(ctx context.Context, req model.CreateWaitinglistRequest) (*model.Waitinglist, error)
	ListWaitinglist(ctx context.Context, tenantID, propertyID string) ([]model.Waitinglist, error)
	GetWaitinglistByID(ctx context.Context, id string) (*model.Waitinglist, error)
	DeleteWaitinglist(ctx context.Context, id string) error
}

// WaitinglistService implements business logic for the waitinglist feature.
type WaitinglistService struct {
	repo WaitinglistRepo
}

// NewWaitinglistService creates a new WaitinglistService backed by a pgxpool.
func NewWaitinglistService(pool *pgxpool.Pool) *WaitinglistService {
	return &WaitinglistService{repo: repository.NewWaitinglistRepo(pool)}
}

// NewWaitinglistServiceWithRepo creates a WaitinglistService with a custom repo (for testing).
func NewWaitinglistServiceWithRepo(repo WaitinglistRepo) *WaitinglistService {
	return &WaitinglistService{repo: repo}
}

// CreateWaitinglist validates the request and creates a new waitinglist entry.
// callerID is the authenticated user's ID (already set on req.TenantID by the handler).
func (s *WaitinglistService) CreateWaitinglist(ctx context.Context, callerID string, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
	if req.TenantID == "" {
		return nil, errors.New("waitinglist_service: tenant_id is required")
	}
	if req.PropertyID == "" {
		return nil, errors.New("waitinglist_service: property_id is required")
	}

	w, err := s.repo.CreateWaitinglist(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_service: create: %w", err)
	}
	return w, nil
}

// ListWaitinglist returns waitinglist entries with role-based filtering.
// #28: If callerRole is "tenant", only entries belonging to callerID are returned.
// merchant/admin may filter by propertyID.
func (s *WaitinglistService) ListWaitinglist(ctx context.Context, callerID, callerRole, propertyID string) ([]model.Waitinglist, error) {
	// Tenants can only see their own entries.
	tenantFilter := ""
	if callerRole == "tenant" {
		tenantFilter = callerID
	}

	items, err := s.repo.ListWaitinglist(ctx, tenantFilter, propertyID)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_service: list: %w", err)
	}
	if items == nil {
		items = []model.Waitinglist{}
	}
	return items, nil
}

// DeleteWaitinglist verifies ownership then deletes the entry.
// #28: Tenants may only delete their own entries; merchant/admin may delete any.
func (s *WaitinglistService) DeleteWaitinglist(ctx context.Context, callerID, callerRole, id string) error {
	if id == "" {
		return errors.New("waitinglist_service: id is required")
	}

	entry, err := s.repo.GetWaitinglistByID(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "no rows") {
			return fmt.Errorf("waitinglist_service: not found")
		}
		return fmt.Errorf("waitinglist_service: get: %w", err)
	}

	// #28: Authorization check — tenants may only delete their own entries.
	if callerRole == "tenant" && entry.TenantID != callerID {
		return fmt.Errorf("waitinglist_service: forbidden: not authorized to delete this entry")
	}

	if err := s.repo.DeleteWaitinglist(ctx, id); err != nil {
		return fmt.Errorf("waitinglist_service: delete: %w", err)
	}
	return nil
}
