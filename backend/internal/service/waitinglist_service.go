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

// CreateWaitinglist validates the request and creates a new waitinglist entry.
func CreateWaitinglist(ctx context.Context, pool *pgxpool.Pool, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
	if req.TenantID == "" {
		return nil, errors.New("waitinglist_service: tenant_id is required")
	}
	if req.PropertyID == "" {
		return nil, errors.New("waitinglist_service: property_id is required")
	}

	w, err := repository.CreateWaitinglist(ctx, pool, req)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_service: create: %w", err)
	}
	return w, nil
}

// ListWaitinglist returns all waitinglist entries, optionally filtered by property_id.
func ListWaitinglist(ctx context.Context, pool *pgxpool.Pool, propertyID string) ([]model.Waitinglist, error) {
	items, err := repository.ListWaitinglist(ctx, pool, propertyID)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_service: list: %w", err)
	}
	if items == nil {
		items = []model.Waitinglist{}
	}
	return items, nil
}

// DeleteWaitinglist verifies the entry exists then deletes it.
func DeleteWaitinglist(ctx context.Context, pool *pgxpool.Pool, id string) error {
	if id == "" {
		return errors.New("waitinglist_service: id is required")
	}

	if _, err := repository.GetWaitinglistByID(ctx, pool, id); err != nil {
		if strings.Contains(err.Error(), "no rows") {
			return fmt.Errorf("waitinglist_service: not found")
		}
		return fmt.Errorf("waitinglist_service: get: %w", err)
	}

	if err := repository.DeleteWaitinglist(ctx, pool, id); err != nil {
		return fmt.Errorf("waitinglist_service: delete: %w", err)
	}
	return nil
}
