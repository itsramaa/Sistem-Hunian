package repository

import (
	"context"
	"fmt"

	"github.com/itsramaa/sistem-hunian/backend/internal/model"
)

// PropertyRepo handles database operations for properties and units.
type PropertyRepo struct {
	db *DB
}

// NewPropertyRepo creates a new PropertyRepo.
func NewPropertyRepo(db *DB) *PropertyRepo {
	return &PropertyRepo{db: db}
}

// ListProperties returns all properties for a given merchant.
// Enforces merchant_id scoping (RLS disabled — enforced in Go).
func (r *PropertyRepo) ListProperties(ctx context.Context, merchantID string) ([]model.Property, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT
			p.id, p.merchant_id, p.name, p.property_type,
			p.address_id,
			COALESCE(a.street_address, '') AS address,
			COALESCE(a.city, '') AS city,
			COALESCE(a.province, '') AS province,
			a.postal_code,
			p.description, p.status,
			COALESCE(p.total_units, 0) AS total_units,
			COALESCE(p.occupied_units, 0) AS occupied_units,
			p.created_at, p.updated_at
		FROM properties p
		LEFT JOIN addresses a ON a.id = p.address_id
		WHERE p.merchant_id = $1
		ORDER BY p.created_at DESC
	`, merchantID)
	if err != nil {
		return nil, fmt.Errorf("property_repo: list: %w", err)
	}
	defer rows.Close()

	var props []model.Property
	for rows.Next() {
		var p model.Property
		if err := rows.Scan(
			&p.ID, &p.MerchantID, &p.Name, &p.PropertyType,
			&p.AddressID, &p.Address, &p.City, &p.Province, &p.PostalCode,
			&p.Description, &p.Status,
			&p.TotalUnits, &p.OccupiedUnits,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("property_repo: scan: %w", err)
		}
		props = append(props, p)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("property_repo: rows: %w", err)
	}
	return props, nil
}

// GetProperty returns a single property by ID, scoped to merchantID.
func (r *PropertyRepo) GetProperty(ctx context.Context, id, merchantID string) (*model.Property, error) {
	var p model.Property
	err := r.db.Pool.QueryRow(ctx, `
		SELECT
			p.id, p.merchant_id, p.name, p.property_type,
			p.address_id,
			COALESCE(a.street_address, '') AS address,
			COALESCE(a.city, '') AS city,
			COALESCE(a.province, '') AS province,
			a.postal_code,
			p.description, p.status,
			COALESCE(p.total_units, 0) AS total_units,
			COALESCE(p.occupied_units, 0) AS occupied_units,
			p.created_at, p.updated_at
		FROM properties p
		LEFT JOIN addresses a ON a.id = p.address_id
		WHERE p.id = $1 AND p.merchant_id = $2
	`, id, merchantID).Scan(
		&p.ID, &p.MerchantID, &p.Name, &p.PropertyType,
		&p.AddressID, &p.Address, &p.City, &p.Province, &p.PostalCode,
		&p.Description, &p.Status,
		&p.TotalUnits, &p.OccupiedUnits,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: get: %w", err)
	}
	return &p, nil
}

// CreateProperty inserts a new property and its address.
func (r *PropertyRepo) CreateProperty(ctx context.Context, merchantID string, req model.CreatePropertyRequest) (*model.Property, error) {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("property_repo: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Insert address
	var addressID *string
	if req.Address != "" && req.City != "" && req.Province != "" {
		var addrID string
		err = tx.QueryRow(ctx, `
			INSERT INTO addresses (street_address, city, province, postal_code, address_type)
			VALUES ($1, $2, $3, $4, 'property')
			RETURNING id
		`, req.Address, req.City, req.Province, req.PostalCode).Scan(&addrID)
		if err != nil {
			return nil, fmt.Errorf("property_repo: insert address: %w", err)
		}
		addressID = &addrID
	}

	status := req.Status
	if status == "" {
		status = "active"
	}

	var p model.Property
	err = tx.QueryRow(ctx, `
		INSERT INTO properties (merchant_id, name, property_type, address_id, description, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, merchant_id, name, property_type, address_id, description, status,
		          COALESCE(total_units, 0), COALESCE(occupied_units, 0), created_at, updated_at
	`, merchantID, req.Name, req.PropertyType, addressID, req.Description, status).Scan(
		&p.ID, &p.MerchantID, &p.Name, &p.PropertyType,
		&p.AddressID, &p.Description, &p.Status,
		&p.TotalUnits, &p.OccupiedUnits,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: insert property: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("property_repo: commit: %w", err)
	}

	// Fill address fields from request
	p.Address = req.Address
	p.City = req.City
	p.Province = req.Province
	p.PostalCode = req.PostalCode

	return &p, nil
}

// UpdateProperty updates a property's fields, scoped to merchantID.
func (r *PropertyRepo) UpdateProperty(ctx context.Context, id, merchantID string, req model.UpdatePropertyRequest) (*model.Property, error) {
	// Build dynamic update query
	setClauses := []string{"updated_at = NOW()"}
	args := []any{}
	argIdx := 1

	if req.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *req.Name)
		argIdx++
	}
	if req.PropertyType != nil {
		setClauses = append(setClauses, fmt.Sprintf("property_type = $%d", argIdx))
		args = append(args, *req.PropertyType)
		argIdx++
	}
	if req.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	// Add WHERE clause args
	args = append(args, id, merchantID)
	whereIdx := argIdx

	query := fmt.Sprintf(`
		UPDATE properties
		SET %s
		WHERE id = $%d AND merchant_id = $%d
		RETURNING id, merchant_id, name, property_type, address_id, description, status,
		          COALESCE(total_units, 0), COALESCE(occupied_units, 0), created_at, updated_at
	`, joinClauses(setClauses), whereIdx, whereIdx+1)

	var p model.Property
	err := r.db.Pool.QueryRow(ctx, query, args...).Scan(
		&p.ID, &p.MerchantID, &p.Name, &p.PropertyType,
		&p.AddressID, &p.Description, &p.Status,
		&p.TotalUnits, &p.OccupiedUnits,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: update: %w", err)
	}

	// Update address if address fields provided
	if req.Address != nil || req.City != nil || req.Province != nil {
		if p.AddressID != nil {
			addrClauses := []string{}
			addrArgs := []any{}
			addrIdx := 1
			if req.Address != nil {
				addrClauses = append(addrClauses, fmt.Sprintf("street_address = $%d", addrIdx))
				addrArgs = append(addrArgs, *req.Address)
				addrIdx++
			}
			if req.City != nil {
				addrClauses = append(addrClauses, fmt.Sprintf("city = $%d", addrIdx))
				addrArgs = append(addrArgs, *req.City)
				addrIdx++
			}
			if req.Province != nil {
				addrClauses = append(addrClauses, fmt.Sprintf("province = $%d", addrIdx))
				addrArgs = append(addrArgs, *req.Province)
				addrIdx++
			}
			if req.PostalCode != nil {
				addrClauses = append(addrClauses, fmt.Sprintf("postal_code = $%d", addrIdx))
				addrArgs = append(addrArgs, *req.PostalCode)
				addrIdx++
			}
			if len(addrClauses) > 0 {
				addrArgs = append(addrArgs, *p.AddressID)
				_, _ = r.db.Pool.Exec(ctx,
					fmt.Sprintf("UPDATE addresses SET %s WHERE id = $%d", joinClauses(addrClauses), addrIdx),
					addrArgs...,
				)
			}
		}
	}

	return &p, nil
}

// DeleteProperty deletes a property, scoped to merchantID.
func (r *PropertyRepo) DeleteProperty(ctx context.Context, id, merchantID string) error {
	result, err := r.db.Pool.Exec(ctx,
		"DELETE FROM properties WHERE id = $1 AND merchant_id = $2",
		id, merchantID,
	)
	if err != nil {
		return fmt.Errorf("property_repo: delete: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("property_repo: not found")
	}
	return nil
}

// ListUnits returns all units for a given property, scoped to merchantID.
func (r *PropertyRepo) ListUnits(ctx context.Context, propertyID, merchantID string) ([]model.Unit, error) {
	rows, err := r.db.Pool.Query(ctx, `
		SELECT u.id, u.property_id, u.unit_number, u.unit_type,
		       u.floor, u.size_sqm, u.rent_amount, u.deposit_amount,
		       u.status, u.description, u.occupancy_type,
		       COALESCE(u.electricity_included, false),
		       COALESCE(u.water_included, false),
		       COALESCE(u.wifi_included, false),
		       u.created_at, u.updated_at
		FROM units u
		JOIN properties p ON p.id = u.property_id
		WHERE u.property_id = $1 AND p.merchant_id = $2
		ORDER BY u.unit_number ASC
	`, propertyID, merchantID)
	if err != nil {
		return nil, fmt.Errorf("property_repo: list units: %w", err)
	}
	defer rows.Close()

	var units []model.Unit
	for rows.Next() {
		var u model.Unit
		if err := rows.Scan(
			&u.ID, &u.PropertyID, &u.UnitNumber, &u.UnitType,
			&u.Floor, &u.SizeSqm, &u.RentAmount, &u.DepositAmount,
			&u.Status, &u.Description, &u.OccupancyType,
			&u.ElectricityIncluded, &u.WaterIncluded, &u.WifiIncluded,
			&u.CreatedAt, &u.UpdatedAt,
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

// GetUnit returns a single unit by ID, scoped to merchantID.
func (r *PropertyRepo) GetUnit(ctx context.Context, unitID, merchantID string) (*model.Unit, error) {
	var u model.Unit
	err := r.db.Pool.QueryRow(ctx, `
		SELECT u.id, u.property_id, u.unit_number, u.unit_type,
		       u.floor, u.size_sqm, u.rent_amount, u.deposit_amount,
		       u.status, u.description, u.occupancy_type,
		       COALESCE(u.electricity_included, false),
		       COALESCE(u.water_included, false),
		       COALESCE(u.wifi_included, false),
		       u.created_at, u.updated_at
		FROM units u
		JOIN properties p ON p.id = u.property_id
		WHERE u.id = $1 AND p.merchant_id = $2
	`, unitID, merchantID).Scan(
		&u.ID, &u.PropertyID, &u.UnitNumber, &u.UnitType,
		&u.Floor, &u.SizeSqm, &u.RentAmount, &u.DepositAmount,
		&u.Status, &u.Description, &u.OccupancyType,
		&u.ElectricityIncluded, &u.WaterIncluded, &u.WifiIncluded,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: get unit: %w", err)
	}
	return &u, nil
}

// CreateUnit inserts a new unit for a property, scoped to merchantID.
func (r *PropertyRepo) CreateUnit(ctx context.Context, propertyID, merchantID string, req model.CreateUnitRequest) (*model.Unit, error) {
	// Verify property belongs to merchant
	var exists bool
	err := r.db.Pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM properties WHERE id = $1 AND merchant_id = $2)",
		propertyID, merchantID,
	).Scan(&exists)
	if err != nil || !exists {
		return nil, fmt.Errorf("property_repo: property not found or access denied")
	}

	status := req.Status
	if status == "" {
		status = "available"
	}

	var u model.Unit
	err = r.db.Pool.QueryRow(ctx, `
		INSERT INTO units (
			property_id, unit_number, unit_type, floor, size_sqm,
			rent_amount, deposit_amount, status, description, occupancy_type,
			electricity_included, water_included, wifi_included
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, property_id, unit_number, unit_type, floor, size_sqm,
		          rent_amount, deposit_amount, status, description, occupancy_type,
		          COALESCE(electricity_included, false),
		          COALESCE(water_included, false),
		          COALESCE(wifi_included, false),
		          created_at, updated_at
	`,
		propertyID, req.UnitNumber, req.UnitType, req.Floor, req.SizeSqm,
		req.RentAmount, req.DepositAmount, status, req.Description, req.OccupancyType,
		req.ElectricityIncluded, req.WaterIncluded, req.WifiIncluded,
	).Scan(
		&u.ID, &u.PropertyID, &u.UnitNumber, &u.UnitType,
		&u.Floor, &u.SizeSqm, &u.RentAmount, &u.DepositAmount,
		&u.Status, &u.Description, &u.OccupancyType,
		&u.ElectricityIncluded, &u.WaterIncluded, &u.WifiIncluded,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: create unit: %w", err)
	}
	return &u, nil
}

// UpdateUnit updates a unit's fields, scoped to merchantID.
func (r *PropertyRepo) UpdateUnit(ctx context.Context, unitID, merchantID string, req model.UpdateUnitRequest) (*model.Unit, error) {
	setClauses := []string{"updated_at = NOW()"}
	args := []any{}
	argIdx := 1

	if req.UnitNumber != nil {
		setClauses = append(setClauses, fmt.Sprintf("unit_number = $%d", argIdx))
		args = append(args, *req.UnitNumber)
		argIdx++
	}
	if req.UnitType != nil {
		setClauses = append(setClauses, fmt.Sprintf("unit_type = $%d", argIdx))
		args = append(args, *req.UnitType)
		argIdx++
	}
	if req.Floor != nil {
		setClauses = append(setClauses, fmt.Sprintf("floor = $%d", argIdx))
		args = append(args, *req.Floor)
		argIdx++
	}
	if req.SizeSqm != nil {
		setClauses = append(setClauses, fmt.Sprintf("size_sqm = $%d", argIdx))
		args = append(args, *req.SizeSqm)
		argIdx++
	}
	if req.RentAmount != nil {
		setClauses = append(setClauses, fmt.Sprintf("rent_amount = $%d", argIdx))
		args = append(args, *req.RentAmount)
		argIdx++
	}
	if req.DepositAmount != nil {
		setClauses = append(setClauses, fmt.Sprintf("deposit_amount = $%d", argIdx))
		args = append(args, *req.DepositAmount)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.OccupancyType != nil {
		setClauses = append(setClauses, fmt.Sprintf("occupancy_type = $%d", argIdx))
		args = append(args, *req.OccupancyType)
		argIdx++
	}
	if req.ElectricityIncluded != nil {
		setClauses = append(setClauses, fmt.Sprintf("electricity_included = $%d", argIdx))
		args = append(args, *req.ElectricityIncluded)
		argIdx++
	}
	if req.WaterIncluded != nil {
		setClauses = append(setClauses, fmt.Sprintf("water_included = $%d", argIdx))
		args = append(args, *req.WaterIncluded)
		argIdx++
	}
	if req.WifiIncluded != nil {
		setClauses = append(setClauses, fmt.Sprintf("wifi_included = $%d", argIdx))
		args = append(args, *req.WifiIncluded)
		argIdx++
	}

	args = append(args, unitID, merchantID)
	whereIdx := argIdx

	query := fmt.Sprintf(`
		UPDATE units u
		SET %s
		FROM properties p
		WHERE u.id = $%d AND u.property_id = p.id AND p.merchant_id = $%d
		RETURNING u.id, u.property_id, u.unit_number, u.unit_type,
		          u.floor, u.size_sqm, u.rent_amount, u.deposit_amount,
		          u.status, u.description, u.occupancy_type,
		          COALESCE(u.electricity_included, false),
		          COALESCE(u.water_included, false),
		          COALESCE(u.wifi_included, false),
		          u.created_at, u.updated_at
	`, joinClauses(setClauses), whereIdx, whereIdx+1)

	var u model.Unit
	err := r.db.Pool.QueryRow(ctx, query, args...).Scan(
		&u.ID, &u.PropertyID, &u.UnitNumber, &u.UnitType,
		&u.Floor, &u.SizeSqm, &u.RentAmount, &u.DepositAmount,
		&u.Status, &u.Description, &u.OccupancyType,
		&u.ElectricityIncluded, &u.WaterIncluded, &u.WifiIncluded,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("property_repo: update unit: %w", err)
	}
	return &u, nil
}

// DeleteUnit deletes a unit, scoped to merchantID.
func (r *PropertyRepo) DeleteUnit(ctx context.Context, unitID, merchantID string) error {
	result, err := r.db.Pool.Exec(ctx, `
		DELETE FROM units u
		USING properties p
		WHERE u.id = $1 AND u.property_id = p.id AND p.merchant_id = $2
	`, unitID, merchantID)
	if err != nil {
		return fmt.Errorf("property_repo: delete unit: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("property_repo: unit not found")
	}
	return nil
}

// joinClauses joins SET clauses with commas.
func joinClauses(clauses []string) string {
	result := ""
	for i, c := range clauses {
		if i > 0 {
			result += ", "
		}
		result += c
	}
	return result
}
