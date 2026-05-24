package model

import "time"

// Property represents a rental property owned by a merchant.
type Property struct {
	ID          string    `json:"id"`
	MerchantID  string    `json:"merchant_id"`
	Name        string    `json:"name"`
	PropertyType string   `json:"property_type"`
	AddressID   *string   `json:"address_id,omitempty"`
	Address     string    `json:"address,omitempty"`
	City        string    `json:"city,omitempty"`
	Province    string    `json:"province,omitempty"`
	PostalCode  *string   `json:"postal_code,omitempty"`
	Description *string   `json:"description,omitempty"`
	Status      string    `json:"status"`
	TotalUnits  int       `json:"total_units"`
	OccupiedUnits int     `json:"occupied_units"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Unit represents a rentable unit within a property.
type Unit struct {
	ID                  string    `json:"id"`
	PropertyID          string    `json:"property_id"`
	UnitNumber          string    `json:"unit_number"`
	UnitType            string    `json:"unit_type"`
	Floor               *int      `json:"floor,omitempty"`
	SizeSqm             *float64  `json:"size_sqm,omitempty"`
	RentAmount          float64   `json:"rent_amount"`
	DepositAmount       *float64  `json:"deposit_amount,omitempty"`
	Status              string    `json:"status"`
	Description         *string   `json:"description,omitempty"`
	OccupancyType       *string   `json:"occupancy_type,omitempty"`
	ElectricityIncluded bool      `json:"electricity_included"`
	WaterIncluded       bool      `json:"water_included"`
	WifiIncluded        bool      `json:"wifi_included"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// CreatePropertyRequest is the request body for creating a property.
type CreatePropertyRequest struct {
	Name         string  `json:"name"`
	PropertyType string  `json:"property_type"`
	Address      string  `json:"address"`
	City         string  `json:"city"`
	Province     string  `json:"province"`
	PostalCode   *string `json:"postal_code,omitempty"`
	Description  *string `json:"description,omitempty"`
	Status       string  `json:"status"`
}

// UpdatePropertyRequest is the request body for updating a property.
type UpdatePropertyRequest struct {
	Name         *string `json:"name,omitempty"`
	PropertyType *string `json:"property_type,omitempty"`
	Address      *string `json:"address,omitempty"`
	City         *string `json:"city,omitempty"`
	Province     *string `json:"province,omitempty"`
	PostalCode   *string `json:"postal_code,omitempty"`
	Description  *string `json:"description,omitempty"`
	Status       *string `json:"status,omitempty"`
}

// CreateUnitRequest is the request body for creating a unit.
type CreateUnitRequest struct {
	UnitNumber          string   `json:"unit_number"`
	UnitType            string   `json:"unit_type"`
	Floor               *int     `json:"floor,omitempty"`
	SizeSqm             *float64 `json:"size_sqm,omitempty"`
	RentAmount          float64  `json:"rent_amount"`
	DepositAmount       *float64 `json:"deposit_amount,omitempty"`
	Status              string   `json:"status"`
	Description         *string  `json:"description,omitempty"`
	OccupancyType       *string  `json:"occupancy_type,omitempty"`
	ElectricityIncluded bool     `json:"electricity_included"`
	WaterIncluded       bool     `json:"water_included"`
	WifiIncluded        bool     `json:"wifi_included"`
}

// UpdateUnitRequest is the request body for updating a unit.
type UpdateUnitRequest struct {
	UnitNumber          *string  `json:"unit_number,omitempty"`
	UnitType            *string  `json:"unit_type,omitempty"`
	Floor               *int     `json:"floor,omitempty"`
	SizeSqm             *float64 `json:"size_sqm,omitempty"`
	RentAmount          *float64 `json:"rent_amount,omitempty"`
	DepositAmount       *float64 `json:"deposit_amount,omitempty"`
	Status              *string  `json:"status,omitempty"`
	Description         *string  `json:"description,omitempty"`
	OccupancyType       *string  `json:"occupancy_type,omitempty"`
	ElectricityIncluded *bool    `json:"electricity_included,omitempty"`
	WaterIncluded       *bool    `json:"water_included,omitempty"`
	WifiIncluded        *bool    `json:"wifi_included,omitempty"`
}
