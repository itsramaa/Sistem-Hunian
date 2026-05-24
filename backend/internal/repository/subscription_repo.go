package repository

import (
	"context"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SubscriptionRepo handles database operations for subscriptions and tiers.
type SubscriptionRepo struct {
	pool *pgxpool.Pool
}

// NewSubscriptionRepo creates a new SubscriptionRepo.
func NewSubscriptionRepo(pool *pgxpool.Pool) *SubscriptionRepo {
	return &SubscriptionRepo{pool: pool}
}

// ListSubscriptions returns all subscriptions. Admin-scoped (no merchant filter).
func (r *SubscriptionRepo) ListSubscriptions(ctx context.Context) ([]model.Subscription, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, merchant_id, tier_id, status,
		       current_period_start, current_period_end, created_at
		FROM subscriptions
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("subscription_repo: list: %w", err)
	}
	defer rows.Close()

	var subs []model.Subscription
	for rows.Next() {
		var s model.Subscription
		if err := rows.Scan(
			&s.ID, &s.MerchantID, &s.TierID, &s.Status,
			&s.CurrentPeriodStart, &s.CurrentPeriodEnd, &s.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("subscription_repo: scan: %w", err)
		}
		subs = append(subs, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("subscription_repo: rows: %w", err)
	}
	return subs, nil
}

// GetSubscription returns a single subscription by ID.
func (r *SubscriptionRepo) GetSubscription(ctx context.Context, id string) (*model.Subscription, error) {
	var s model.Subscription
	err := r.pool.QueryRow(ctx, `
		SELECT id, merchant_id, tier_id, status,
		       current_period_start, current_period_end, created_at
		FROM subscriptions
		WHERE id = $1
	`, id).Scan(
		&s.ID, &s.MerchantID, &s.TierID, &s.Status,
		&s.CurrentPeriodStart, &s.CurrentPeriodEnd, &s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("subscription_repo: get: %w", err)
	}
	return &s, nil
}

// ListTiers returns all active subscription tiers.
func (r *SubscriptionRepo) ListTiers(ctx context.Context) ([]model.SubscriptionTier, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, COALESCE(description, ''), price,
		       billing_cycle_days, max_units, max_properties, is_active
		FROM subscription_tiers
		WHERE is_active = true
		ORDER BY price ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("subscription_repo: list tiers: %w", err)
	}
	defer rows.Close()

	var tiers []model.SubscriptionTier
	for rows.Next() {
		var t model.SubscriptionTier
		if err := rows.Scan(
			&t.ID, &t.Name, &t.Description, &t.Price,
			&t.BillingCycleDays, &t.MaxUnits, &t.MaxProperties, &t.IsActive,
		); err != nil {
			return nil, fmt.Errorf("subscription_repo: scan tier: %w", err)
		}
		tiers = append(tiers, t)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("subscription_repo: tier rows: %w", err)
	}
	return tiers, nil
}

// ProcessPayment records a subscription payment and updates the subscription period.
// TODO: integrate with Xendit invoice creation for real payment flow.
func (r *SubscriptionRepo) ProcessPayment(ctx context.Context, req model.SubscriptionPaymentRequest) (*model.Subscription, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("subscription_repo: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Record the payment
	_, err = tx.Exec(ctx, `
		INSERT INTO subscription_payments (subscription_id, amount, payment_method, status)
		VALUES ($1, $2, $3, 'completed')
	`, req.SubscriptionID, req.Amount, req.PaymentMethod)
	if err != nil {
		return nil, fmt.Errorf("subscription_repo: insert payment: %w", err)
	}

	// Extend the subscription period by one billing cycle
	var s model.Subscription
	err = tx.QueryRow(ctx, `
		UPDATE subscriptions s
		SET
			status = 'active',
			current_period_start = GREATEST(current_period_end, NOW()),
			current_period_end = GREATEST(current_period_end, NOW()) + (
				SELECT (billing_cycle_days || ' days')::interval
				FROM subscription_tiers
				WHERE id = s.tier_id
			),
			updated_at = NOW()
		WHERE s.id = $1
		RETURNING s.id, s.merchant_id, s.tier_id, s.status,
		          s.current_period_start, s.current_period_end, s.created_at
	`, req.SubscriptionID).Scan(
		&s.ID, &s.MerchantID, &s.TierID, &s.Status,
		&s.CurrentPeriodStart, &s.CurrentPeriodEnd, &s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("subscription_repo: extend period: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("subscription_repo: commit: %w", err)
	}
	return &s, nil
}

// RunBillingCycle generates invoices for subscriptions due for renewal.
// Returns the count of subscriptions processed.
// TODO: integrate with Xendit to create actual invoices.
func (r *SubscriptionRepo) RunBillingCycle(ctx context.Context) (int, error) {
	result, err := r.pool.Exec(ctx, `
		INSERT INTO subscription_invoices (subscription_id, amount, due_date, status)
		SELECT s.id, t.price, s.current_period_end, 'pending'
		FROM subscriptions s
		JOIN subscription_tiers t ON t.id = s.tier_id
		WHERE s.status = 'active'
		  AND s.current_period_end <= NOW() + INTERVAL '3 days'
		  AND NOT EXISTS (
			SELECT 1 FROM subscription_invoices si
			WHERE si.subscription_id = s.id
			  AND si.due_date = s.current_period_end
		  )
	`)
	if err != nil {
		return 0, fmt.Errorf("subscription_repo: billing cycle: %w", err)
	}
	return int(result.RowsAffected()), nil
}

// RunRenewal processes subscriptions that have been paid and extends their period.
// Returns the count of subscriptions renewed.
func (r *SubscriptionRepo) RunRenewal(ctx context.Context) (int, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE subscriptions s
		SET
			current_period_start = current_period_end,
			current_period_end = current_period_end + (
				SELECT (billing_cycle_days || ' days')::interval
				FROM subscription_tiers
				WHERE id = s.tier_id
			),
			updated_at = NOW()
		WHERE s.status = 'active'
		  AND s.current_period_end <= NOW()
		  AND EXISTS (
			SELECT 1 FROM subscription_invoices si
			WHERE si.subscription_id = s.id
			  AND si.status = 'paid'
			  AND si.due_date = s.current_period_end
		  )
	`)
	if err != nil {
		return 0, fmt.Errorf("subscription_repo: renewal: %w", err)
	}
	return int(result.RowsAffected()), nil
}

// RunGraceCheck transitions overdue subscriptions to grace_period or expired.
// Returns the count of subscriptions updated.
func (r *SubscriptionRepo) RunGraceCheck(ctx context.Context) (int, error) {
	// Move active → grace_period if period ended and no paid invoice
	r1, err := r.pool.Exec(ctx, `
		UPDATE subscriptions
		SET status = 'grace_period', updated_at = NOW()
		WHERE status = 'active'
		  AND current_period_end < NOW()
		  AND NOT EXISTS (
			SELECT 1 FROM subscription_invoices si
			WHERE si.subscription_id = subscriptions.id
			  AND si.status = 'paid'
			  AND si.due_date >= subscriptions.current_period_end
		  )
	`)
	if err != nil {
		return 0, fmt.Errorf("subscription_repo: grace check (active→grace): %w", err)
	}

	// Move grace_period → expired after 7 days
	r2, err := r.pool.Exec(ctx, `
		UPDATE subscriptions
		SET status = 'expired', updated_at = NOW()
		WHERE status = 'grace_period'
		  AND current_period_end < NOW() - INTERVAL '7 days'
	`)
	if err != nil {
		return 0, fmt.Errorf("subscription_repo: grace check (grace→expired): %w", err)
	}

	return int(r1.RowsAffected()) + int(r2.RowsAffected()), nil
}
