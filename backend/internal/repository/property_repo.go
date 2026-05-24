package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// ── Properties ────────────────────────────────────────────────────────────────

// ListProperties returns all properties belonging to the given merchant.
func ListProperties(ctx context.Context, pool *pgxpool.Pool, merchantID string) ([]model.Property, error) {
	rows, err := pool.Query(ctx, `
		SELECT id, merchant_id, name, address, city, province, type, description, created_at, updated_at
		FROM properties
		WHERE merchant_id = $1
		ORDER BY created_at DESC
	`, merchantID)
	if err != nil {
		return nil, fmt.Errorf("property_repo: list properties: %w", err)
	}
	defer rows.Close()

	var props []model.Property
	for rows.Next() {
		var p model.Property
		if err := rows.Scan(
			&p.ID, &p.MerchantID, &p.Name, &p.Address, &p.City,
			&p.Province, &p.Type, &p.Description, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("property_repo: scan property: %w", err)
		}
		props = append(props, p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("property_repo: property rows: %w", err)
	}
	return props, nil
}

// GetProperty returns a single property by ID scoped to the given merchant.
func GetProperty(ctx context.Context, pool *pgxpool.Pool, id, merchantID string) (*model.Property, error) {
	var p model.Property
	err := pool.QueryRow(ctx, `
		SELECT id, merchant_id, name, address, city, province, type, description, created_at, updated_at
		FROM properties
		WHERE id = $1 AND merchant_id = $2
	`, id, merchantID).Scan(
		&p.ID, &p.MerchantID, &p.Name, &p.Address, &p.City,
		&p.Province, &p.Type, &p.Description, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: get property: no rows in result set")
	}
	return &p, nil
}

// CreateProperty inserts a new property and returns the full record.
func CreateProperty(ctx context.Context, pool *pgxpool.Pool, merchantID string, req model.CreatePropertyRequest) (*model.Property, error) {
	var p model.Property
	err := pool.QueryRow(ctx, `
		INSERT INTO properties (merchant_id, name, address, city, province, type, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, merchant_id, name, address, city, province, type, description, created_at, updated_at
	`, merchantID, req.Name, req.Address, req.City, req.Province, req.Type, req.Description).Scan(
		&p.ID, &p.MerchantID, &p.Name, &p.Address, &p.City,
		&p.Province, &p.Type, &p.Description, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: create property: %w", err)
	}
	return &p, nil
}

// UpdateProperty updates an existing property scoped to the given merchant and returns the updated record.
func UpdateProperty(ctx context.Context, pool *pgxpool.Pool, id, merchantID string, req model.UpdatePropertyRequest) (*model.Property, error) {
	var p model.Property
	err := pool.QueryRow(ctx, `
		UPDATE properties
		SET name = $1, address = $2, city = $3, province = $4, type = $5, description = $6, updated_at = NOW()
		WHERE id = $7 AND merchant_id = $8
		RETURNING id, merchant_id, name, address, city, province, type, description, created_at, updated_at
	`, req.Name, req.Address, req.City, req.Province, req.Type, req.Description, id, merchantID).Scan(
		&p.ID, &p.MerchantID, &p.Name, &p.Address, &p.City,
		&p.Province, &p.Type, &p.Description, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: update property: no rows in result set")
	}
	return &p, nil
}

// DeleteProperty removes a property scoped to the given merchant.
// Returns an error if no rows were affected (not found).
func DeleteProperty(ctx context.Context, pool *pgxpool.Pool, id, merchantID string) error {
	tag, err := pool.Exec(ctx, `
		DELETE FROM properties WHERE id = $1 AND merchant_id = $2
	`, id, merchantID)
	if err != nil {
		return fmt.Errorf("property_repo: delete property: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("property_repo: delete property: no rows in result set")
	}
	return nil
}

// ── Units ─────────────────────────────────────────────────────────────────────

// ListUnits returns all units for a given property scoped to the merchant.
func ListUnits(ctx context.Context, pool *pgxpool.Pool, propertyID, merchantID string) ([]model.Unit, error) {
	rows, err := pool.Query(ctx, `
		SELECT id, property_id, merchant_id, name, floor, type, status, rent_amount, description, created_at, updated_at
		FROM units
		WHERE property_id = $1 AND merchant_id = $2
		ORDER BY created_at DESC
	`, propertyID, merchantID)
	if err != nil {
		return nil, fmt.Errorf("property_repo: list units: %w", err)
	}
	defer rows.Close()

	var units []model.Unit
	for rows.Next() {
		var u model.Unit
		if err := rows.Scan(
			&u.ID, &u.PropertyID, &u.MerchantID, &u.Name, &u.Floor,
			&u.Type, &u.Status, &u.RentAmount, &u.Description, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("property_repo: scan unit: %w", err)
		}
		units = append(units, u)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("property_repo: unit rows: %w", err)
	}
	return units, nil
}

// GetUnit returns a single unit by ID scoped to the given merchant.
func GetUnit(ctx context.Context, pool *pgxpool.Pool, id, merchantID string) (*model.Unit, error) {
	var u model.Unit
	err := pool.QueryRow(ctx, `
		SELECT id, property_id, merchant_id, name, floor, type, status, rent_amount, description, created_at, updated_at
		FROM units
		WHERE id = $1 AND merchant_id = $2
	`, id, merchantID).Scan(
		&u.ID, &u.PropertyID, &u.MerchantID, &u.Name, &u.Floor,
		&u.Type, &u.Status, &u.RentAmount, &u.Description, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: get unit: no rows in result set")
	}
	return &u, nil
}

// CreateUnit inserts a new unit under a property and returns the full record.
func CreateUnit(ctx context.Context, pool *pgxpool.Pool, propertyID, merchantID string, req model.CreateUnitRequest) (*model.Unit, error) {
	var u model.Unit
	err := pool.QueryRow(ctx, `
		INSERT INTO units (property_id, merchant_id, name, floor, type, status, rent_amount, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, property_id, merchant_id, name, floor, type, status, rent_amount, description, created_at, updated_at
	`, propertyID, merchantID, req.Name, req.Floor, req.Type, req.Status, req.RentAmount, req.Description).Scan(
		&u.ID, &u.PropertyID, &u.MerchantID, &u.Name, &u.Floor,
		&u.Type, &u.Status, &u.RentAmount, &u.Description, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: create unit: %w", err)
	}
	return &u, nil
}

// UpdateUnit updates an existing unit scoped to the given merchant and returns the updated record.
func UpdateUnit(ctx context.Context, pool *pgxpool.Pool, id, merchantID string, req model.UpdateUnitRequest) (*model.Unit, error) {
	var u model.Unit
	err := pool.QueryRow(ctx, `
		UPDATE units
		SET name = $1, floor = $2, type = $3, status = $4, rent_amount = $5, description = $6, updated_at = NOW()
		WHERE id = $7 AND merchant_id = $8
		RETURNING id, property_id, merchant_id, name, floor, type, status, rent_amount, description, created_at, updated_at
	`, req.Name, req.Floor, req.Type, req.Status, req.RentAmount, req.Description, id, merchantID).Scan(
		&u.ID, &u.PropertyID, &u.MerchantID, &u.Name, &u.Floor,
		&u.Type, &u.Status, &u.RentAmount, &u.Description, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: update unit: no rows in result set")
	}
	return &u, nil
}

// DeleteUnit removes a unit scoped to the given merchant.
// Returns an error if no rows were affected (not found).
func DeleteUnit(ctx context.Context, pool *pgxpool.Pool, id, merchantID string) error {
	tag, err := pool.Exec(ctx, `
		DELETE FROM units WHERE id = $1 AND merchant_id = $2
	`, id, merchantID)
	if err != nil {
		return fmt.Errorf("property_repo: delete unit: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("property_repo: delete unit: no rows in result set")
	}
	return nil
}

// ── PropertyRepo struct (wraps pool for service layer use) ────────────────────

// PropertyRepo is a struct-based wrapper around the property repository functions.
type PropertyRepo struct {
	pool *pgxpool.Pool
}

// NewPropertyRepo creates a new PropertyRepo.
func NewPropertyRepo(pool *pgxpool.Pool) *PropertyRepo {
	return &PropertyRepo{pool: pool}
}

func (r *PropertyRepo) ListProperties(ctx context.Context, merchantID string) ([]model.Property, error) {
	return ListProperties(ctx, r.pool, merchantID)
}

func (r *PropertyRepo) GetProperty(ctx context.Context, id, merchantID string) (*model.Property, error) {
	return GetProperty(ctx, r.pool, id, merchantID)
}

func (r *PropertyRepo) CreateProperty(ctx context.Context, merchantID string, req model.CreatePropertyRequest) (*model.Property, error) {
	return CreateProperty(ctx, r.pool, merchantID, req)
}

func (r *PropertyRepo) UpdateProperty(ctx context.Context, id, merchantID string, req model.UpdatePropertyRequest) (*model.Property, error) {
	return UpdateProperty(ctx, r.pool, id, merchantID, req)
}

func (r *PropertyRepo) DeleteProperty(ctx context.Context, id, merchantID string) error {
	return DeleteProperty(ctx, r.pool, id, merchantID)
}

func (r *PropertyRepo) ListUnits(ctx context.Context, propertyID, merchantID string) ([]model.Unit, error) {
	return ListUnits(ctx, r.pool, propertyID, merchantID)
}

func (r *PropertyRepo) GetUnit(ctx context.Context, id, merchantID string) (*model.Unit, error) {
	return GetUnit(ctx, r.pool, id, merchantID)
}

func (r *PropertyRepo) CreateUnit(ctx context.Context, propertyID, merchantID string, req model.CreateUnitRequest) (*model.Unit, error) {
	return CreateUnit(ctx, r.pool, propertyID, merchantID, req)
}

func (r *PropertyRepo) UpdateUnit(ctx context.Context, id, merchantID string, req model.UpdateUnitRequest) (*model.Unit, error) {
	return UpdateUnit(ctx, r.pool, id, merchantID, req)
}

func (r *PropertyRepo) DeleteUnit(ctx context.Context, id, merchantID string) error {
	return DeleteUnit(ctx, r.pool, id, merchantID)
}
