-- +goose Up
-- +goose StatementBegin

-- Rollback: goose -dir ./migrations postgres "$DATABASE_URL" down
-- This migration bootstraps the core schema for local development.
-- RLS is intentionally NOT included — authorization is enforced in Go middleware.
-- Schema mirrors the existing Supabase PostgreSQL schema.

-- Profiles table (mirrors Supabase auth.users via trigger)
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY,
    email       TEXT NOT NULL,
    full_name   TEXT,
    phone_number TEXT,
    role        TEXT CHECK (role IN ('admin', 'merchant', 'tenant', 'vendor')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    address     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    status      TEXT DEFAULT 'available',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant invitations table
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at  TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_merchant_id ON properties(merchant_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS idx_tenant_invitations_email;
DROP INDEX IF EXISTS idx_tenant_invitations_token;
DROP INDEX IF EXISTS idx_units_property_id;
DROP INDEX IF EXISTS idx_properties_merchant_id;
DROP INDEX IF EXISTS idx_vendors_user_id;
DROP INDEX IF EXISTS idx_tenants_user_id;
DROP INDEX IF EXISTS idx_merchants_user_id;
DROP INDEX IF EXISTS idx_profiles_email;

DROP TABLE IF EXISTS tenant_invitations;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS merchants;
DROP TABLE IF EXISTS profiles;

-- +goose StatementEnd
