package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// waitinglistRepo is the concrete pgx-backed implementation.
type waitinglistRepo struct {
	pool *pgxpool.Pool
}

// NewWaitinglistRepo creates a new waitinglistRepo.
func NewWaitinglistRepo(pool *pgxpool.Pool) *waitinglistRepo {
	return &waitinglistRepo{pool: pool}
}

// CreateWaitinglist inserts a new waitinglist entry and returns the full record.
func (r *waitinglistRepo) CreateWaitinglist(ctx context.Context, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
	var w model.Waitinglist
	err := r.pool.QueryRow(ctx, `
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

// ListWaitinglist returns waitinglist entries.
// If tenantID is non-empty, results are filtered to that tenant (IDOR fix).
// If propertyID is non-empty, results are additionally filtered by property.
func (r *waitinglistRepo) ListWaitinglist(ctx context.Context, tenantID, propertyID string) ([]model.Waitinglist, error) {
	var (
		query string
		args  []interface{}
	)

	switch {
	case tenantID != "" && propertyID != "":
		query = `
			SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
			FROM waitinglist
			WHERE tenant_id = $1 AND property_id = $2
			ORDER BY created_at ASC
		`
		args = []interface{}{tenantID, propertyID}
	case tenantID != "":
		query = `
			SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
			FROM waitinglist
			WHERE tenant_id = $1
			ORDER BY created_at ASC
		`
		args = []interface{}{tenantID}
	case propertyID != "":
		query = `
			SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
			FROM waitinglist
			WHERE property_id = $1
			ORDER BY created_at ASC
		`
		args = []interface{}{propertyID}
	default:
		query = `
			SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
			FROM waitinglist
			ORDER BY created_at ASC
		`
	}

	rows, err := r.pool.Query(ctx, query, args...)
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
// #32: Properly distinguishes pgx.ErrNoRows from other errors.
func (r *waitinglistRepo) GetWaitinglistByID(ctx context.Context, id string) (*model.Waitinglist, error) {
	var w model.Waitinglist
	err := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, property_id, unit_id, notes, status, created_at, updated_at
		FROM waitinglist
		WHERE id = $1
	`, id).Scan(
		&w.ID, &w.TenantID, &w.PropertyID, &w.UnitID, &w.Notes, &w.Status, &w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("waitinglist_repo: get by id: not found")
		}
		return nil, fmt.Errorf("waitinglist_repo: get by id: %w", err)
	}
	return &w, nil
}

// DeleteWaitinglist removes a waitinglist entry by ID.
// Returns an error if no rows were affected (not found).
func (r *waitinglistRepo) DeleteWaitinglist(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM waitinglist WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("waitinglist_repo: delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("waitinglist_repo: delete: not found")
	}
	return nil
}
