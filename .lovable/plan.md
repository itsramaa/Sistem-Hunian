
# Implementasi 1.5: Refactor Pending Subscription Changes

## Ringkasan

Rename tabel `pending_subscription_changes` menjadi `subscription_changes` dengan kolom yang lebih bersih, menambah audit trail (`requested_by`, `cancellation_reason`), dan menghapus redundansi (`current_tier_id` diambil dari `merchant_subscriptions`). Existing data dimigrasikan ke tabel baru.

## Perubahan Database

### Migration SQL

```sql
-- 1. Create new table
CREATE TABLE subscription_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL DEFAULT 'downgrade',
    from_tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    to_tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    effective_date DATE NOT NULL,
    applied_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    reason TEXT,
    requested_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Migrate existing data
INSERT INTO subscription_changes (id, merchant_id, change_type, from_tier_id, to_tier_id, status, effective_date, applied_at, cancelled_at, reason, created_at, updated_at)
SELECT id, merchant_id, change_type, current_tier_id, pending_tier_id, status, effective_date, applied_at, cancelled_at, reason, created_at, updated_at
FROM pending_subscription_changes;

-- 3. Indexes
CREATE INDEX idx_subscription_changes_merchant_status ON subscription_changes (merchant_id, status);
CREATE INDEX idx_subscription_changes_effective_date ON subscription_changes (effective_date);

-- 4. Updated_at trigger
CREATE TRIGGER update_subscription_changes_updated_at
BEFORE UPDATE ON subscription_changes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscription changes" ON subscription_changes
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants can view their subscription changes" ON subscription_changes
FOR SELECT USING (EXISTS (
  SELECT 1 FROM merchants m WHERE m.id = subscription_changes.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can insert their subscription changes" ON subscription_changes
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM merchants m WHERE m.id = subscription_changes.merchant_id AND m.user_id = auth.uid()
));

CREATE POLICY "Merchants can cancel their subscription changes" ON subscription_changes
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM merchants m WHERE m.id = subscription_changes.merchant_id AND m.user_id = auth.uid()
));

-- 6. Drop old table
DROP TABLE pending_subscription_changes;
```

## Perubahan Code

### Files yang Diubah

| File | Perubahan |
|------|-----------|
| **Database** | Migration: create `subscription_changes`, migrate data, drop `pending_subscription_changes` |
| `src/features/subscriptions/types/subscriptions.ts` | Rename `PendingSubscriptionChange` fields: `current_tier` -> `from_tier`, `pending_tier` -> `to_tier`. Add `cancelled_at`, `cancellation_reason`, `requested_by` |
| `src/features/subscriptions/services/subscriptionService.ts` | `fetchPendingChanges`: query `subscription_changes` instead, update FK hint names to new table |
| `src/features/subscriptions/components/PendingSubscriptionChanges.tsx` | Query `subscription_changes`, update FK hints, cancel mutation sets `cancellation_reason` |
| `src/features/subscriptions/components/SubscriptionPayment.tsx` | Insert to `subscription_changes` with `from_tier_id`/`to_tier_id` instead of `current_tier_id`/`pending_tier_id` |
| `src/features/subscriptions/components/admin/AdminSubscriptionPendingChangesTable.tsx` | Read `from_tier`/`to_tier` instead of `current_tier`/`pending_tier` |
| `supabase/functions/subscription-renewal/index.ts` | Query `subscription_changes`, update column names |
| `old-docs/merchant_database_refactor.md` | Mark 1.5 as DONE |

### Detail Perubahan per File

**`subscriptions.ts` (types)**:
- `current_tier` -> `from_tier`
- `pending_tier` -> `to_tier`
- Add optional: `cancelled_at`, `cancellation_reason`, `requested_by`

**`subscriptionService.ts`**:
- `fetchPendingChanges`: `.from('subscription_changes')` with new FK hint names `subscription_changes_from_tier_id_fkey` and `subscription_changes_to_tier_id_fkey`

**`PendingSubscriptionChanges.tsx`**:
- Query from `subscription_changes`
- FK hints: `subscription_tiers!subscription_changes_from_tier_id_fkey` and `subscription_tiers!subscription_changes_to_tier_id_fkey`
- Cancel mutation: update `cancellation_reason` field

**`SubscriptionPayment.tsx`**:
- Insert to `subscription_changes` with fields: `from_tier_id` (was `current_tier_id`), `to_tier_id` (was `pending_tier_id`), remove `subscription_id`

**`AdminSubscriptionPendingChangesTable.tsx`**:
- `change.current_tier` -> `change.from_tier`
- `change.pending_tier` -> `change.to_tier`

**`subscription-renewal/index.ts`**:
- Query `subscription_changes` instead of `pending_subscription_changes`
- Update FK hint and column names (`pending_tier_id` -> `to_tier_id`)

## Strategy

Approach yang sama seperti section sebelumnya -- rename table + columns, update semua references. Karena `subscription_id` juga redundant (bisa di-derive dari merchant_id), kolom tersebut tidak dimigrasikan ke tabel baru.
