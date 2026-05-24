package model

import "time"

// Property represents a rental property owned by a merchant.
type Property struct {
	ID          string    `json:"id"`
	MerchantID  string    `json:"merchant_id"`
	Name        string    `json:"name"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	Province    string    `json:"province"`
	Type        string    `json:"type"`        // kos, apartment, ruko, villa
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Unit represents a rentable unit within a property.
type Unit struct {
	ID          string    `json:"id"`
	PropertyID  string    `json:"property_id"`
	MerchantID  string    `json:"merchant_id"`
	Name        string    `json:"name"`
	Floor       *int      `json:"floor,omitempty"`
	Type        string    `json:"type"`        // standard, deluxe, suite
	Status      string    `json:"status"`      // available, occupied, maintenance
	RentAmount  float64   `json:"rent_amount"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreatePropertyRequest is the request body for POST /v1/properties.
type CreatePropertyRequest struct {
	Name        string `json:"name"`
	Address     string `json:"address"`
	City        string `json:"city"`
	Province    string `json:"province"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

// UpdatePropertyRequest is the request body for PUT /v1/properties/{id}.
type UpdatePropertyRequest struct {
	Name        string `json:"name"`
	Address     string `json:"address"`
	City        string `json:"city"`
	Province    string `json:"province"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

// CreateUnitRequest is the request body for POST /v1/properties/{id}/units.
type CreateUnitRequest struct {
	Name        string  `json:"name"`
	Floor       *int    `json:"floor,omitempty"`
	Type        string  `json:"type"`
	Status      string  `json:"status"`
	RentAmount  float64 `json:"rent_amount"`
	Description string  `json:"description"`
}

// UpdateUnitRequest is the request body for PUT /v1/units/{id}.
type UpdateUnitRequest struct {
	Name        string  `json:"name"`
	Floor       *int    `json:"floor,omitempty"`
	Type        string  `json:"type"`
	Status      string  `json:"status"`
	RentAmount  float64 `json:"rent_amount"`
	Description string  `json:"description"`
}
