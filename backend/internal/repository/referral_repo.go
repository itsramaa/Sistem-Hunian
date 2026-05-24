package repository

import (
	"context"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ReferralRepo handles database operations for referrals.
type ReferralRepo struct {
	pool *pgxpool.Pool
}

// NewReferralRepo creates a new ReferralRepo.
func NewReferralRepo(pool *pgxpool.Pool) *ReferralRepo {
	return &ReferralRepo{pool: pool}
}

// ListReferrals returns referrals. If merchantID is non-empty, scopes to that merchant's referrals.
// Admin callers pass an empty merchantID to get all referrals.
func (r *ReferralRepo) ListReferrals(ctx context.Context, merchantID string) ([]model.Referral, error) {
	const queryScoped = `
		SELECT id, referrer_id, referred_id, type, status,
		       commission, reward_paid, created_at
		FROM referrals
		WHERE referrer_id = $1 OR referred_id = $1
		ORDER BY created_at DESC
	`
	const queryAll = `
		SELECT id, referrer_id, referred_id, type, status,
		       commission, reward_paid, created_at
		FROM referrals
		ORDER BY created_at DESC
	`

	scanRows := func(query string, args ...any) ([]model.Referral, error) {
		rows, err := r.pool.Query(ctx, query, args...)
		if err != nil {
			return nil, fmt.Errorf("referral_repo: list: %w", err)
		}
		defer rows.Close()

		var referrals []model.Referral
		for rows.Next() {
			var ref model.Referral
			if err := rows.Scan(
				&ref.ID, &ref.ReferrerID, &ref.ReferredID, &ref.Type, &ref.Status,
				&ref.Commission, &ref.RewardPaid, &ref.CreatedAt,
			); err != nil {
				return nil, fmt.Errorf("referral_repo: scan: %w", err)
			}
			referrals = append(referrals, ref)
		}
		if err := rows.Err(); err != nil {
			return nil, fmt.Errorf("referral_repo: rows: %w", err)
		}
		return referrals, nil
	}

	if merchantID != "" {
		return scanRows(queryScoped, merchantID)
	}
	return scanRows(queryAll)
}

// GetStats returns aggregated referral statistics for a given referrer.
func (r *ReferralRepo) GetStats(ctx context.Context, referrerID string) (*model.ReferralStats, error) {
	var stats model.ReferralStats
	err := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status = 'pending') AS pending,
			COUNT(*) FILTER (WHERE status IN ('completed', 'paid')) AS completed,
			COALESCE(SUM(commission), 0) AS total_commission,
			COALESCE(SUM(commission) FILTER (WHERE NOT reward_paid), 0) AS unpaid_commission
		FROM referrals
		WHERE referrer_id = $1
	`, referrerID).Scan(
		&stats.TotalReferrals,
		&stats.PendingReferrals,
		&stats.CompletedReferrals,
		&stats.TotalCommission,
		&stats.UnpaidCommission,
	)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: get stats: %w", err)
	}
	return &stats, nil
}

// ProcessReward marks a referral's reward as paid.
// TODO: integrate with payout provider (e.g. Xendit disbursement).
func (r *ReferralRepo) ProcessReward(ctx context.Context, req model.ReferralRewardRequest) (*model.Referral, error) {
	var ref model.Referral
	err := r.pool.QueryRow(ctx, `
		UPDATE referrals
		SET reward_paid = true, status = 'paid', updated_at = NOW()
		WHERE id = $1 AND reward_paid = false
		RETURNING id, referrer_id, referred_id, type, status,
		          commission, reward_paid, created_at
	`, req.ReferralID).Scan(
		&ref.ID, &ref.ReferrerID, &ref.ReferredID, &ref.Type, &ref.Status,
		&ref.Commission, &ref.RewardPaid, &ref.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: process reward: %w", err)
	}
	return &ref, nil
}

// ProcessVendorOrderReferral creates a referral record for a vendor order.
// Commission is calculated as 2% of the order amount.
// TODO: make commission rate configurable via settings table.
func (r *ReferralRepo) ProcessVendorOrderReferral(ctx context.Context, req model.VendorOrderReferralRequest) (*model.Referral, error) {
	commission := req.OrderAmount * 0.02

	var ref model.Referral
	err := r.pool.QueryRow(ctx, `
		INSERT INTO referrals (referrer_id, referred_id, type, status, commission, reward_paid)
		VALUES ($1, $2, 'vendor', 'pending', $3, false)
		ON CONFLICT (referrer_id, referred_id, type) DO UPDATE
		SET commission = referrals.commission + EXCLUDED.commission,
		    updated_at = NOW()
		RETURNING id, referrer_id, referred_id, type, status,
		          commission, reward_paid, created_at
	`, req.ReferrerID, req.VendorID, commission).Scan(
		&ref.ID, &ref.ReferrerID, &ref.ReferredID, &ref.Type, &ref.Status,
		&ref.Commission, &ref.RewardPaid, &ref.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: process vendor order referral: %w", err)
	}
	return &ref, nil
}

// ProcessCommissions marks all pending completed referrals as paid.
// Returns the count of referrals processed.
// TODO: trigger actual payout via Xendit disbursement API.
func (r *ReferralRepo) ProcessCommissions(ctx context.Context) (int, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE referrals
		SET status = 'paid', reward_paid = true, updated_at = NOW()
		WHERE status = 'completed' AND reward_paid = false
	`)
	if err != nil {
		return 0, fmt.Errorf("referral_repo: process commissions: %w", err)
	}
	return int(result.RowsAffected()), nil
}
