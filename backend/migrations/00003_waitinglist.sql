-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS waitinglist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id     UUID REFERENCES units(id) ON DELETE SET NULL,
    notes       TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, notified, cancelled
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_waitinglist_property_id ON waitinglist(property_id);
CREATE INDEX IF NOT EXISTS idx_waitinglist_tenant_id ON waitinglist(tenant_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS waitinglist;
-- +goose StatementEnd
