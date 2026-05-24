package repository

import (
	"context"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CreateWaitinglist inserts a new waitinglist entry and returns the full record.
func CreateWaitinglist(ctx context.Context, pool *pgxpool.Pool, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
	var w model.Waitinglist
	err := pool.QueryRow(ctx, `
		INSERT INTO waitinglist (tenant_id, property_id, unit_id, notes)
		VALUES ($1, $2, $3, $4)
		RETURNING id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
	`, req.TenantID, req.PropertyID, req.UnitID, req.Notes).Scan(
		&w.ID, &w.TenantID, &w.PropertyID, &w.UnitID, &w.Notes, &w.Status, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_repo: create: %w", err)
	}
	return &w, nil
}

// ListWaitinglist returns all waitinglist entries, optionally filtered by property_id.
func ListWaitinglist(ctx context.Context, pool *pgxpool.Pool, propertyID string) ([]model.Waitinglist, error) {
	var (
		query string
		args  []interface{}
	)

	if propertyID != "" {
		query = `
			SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
			FROM waitinglist
			WHERE property_id = $1
			ORDER BY created_at ASC
		`
		args = []interface{}{propertyID}
	} else {
		query = `
			SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
			FROM waitinglist
			ORDER BY created_at ASC
		`
	}

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_repo: list: %w", err)
	}
	defer rows.Close()

	var items []model.Waitinglist
	for rows.Next() {
		var w model.Waitinglist
		if err := rows.Scan(
			&w.ID, &w.TenantID, &w.PropertyID, &w.UnitID, &w.Notes, &w.Status, &w.CreatedAt, &w.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("waitinglist_repo: scan: %w", err)
		}
		items = append(items, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("waitinglist_repo: rows: %w", err)
	}
	return items, nil
}

// GetWaitinglistByID returns a single waitinglist entry by ID.
func GetWaitinglistByID(ctx context.Context, pool *pgxpool.Pool, id string) (*model.Waitinglist, error) {
	var w model.Waitinglist
	err := pool.QueryRow(ctx, `
		SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
		FROM waitinglist
		WHERE id = $1
	`, id).Scan(
		&w.ID, &w.TenantID, &w.PropertyID, &w.UnitID, &w.Notes, &w.Status, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("waitinglist_repo: get by id: no rows in result set")
	}
	return &w, nil
}

// DeleteWaitinglist removes a waitinglist entry by ID.
// Returns an error if no rows were affected (not found).
func DeleteWaitinglist(ctx context.Context, pool *pgxpool.Pool, id string) error {
	tag, err := pool.Exec(ctx, `
		DELETE FROM waitinglist WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("waitinglist_repo: delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("waitinglist_repo: delete: no rows in result set")
	}
	return nil
}
