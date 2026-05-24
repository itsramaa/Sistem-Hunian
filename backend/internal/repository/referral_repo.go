package repository

import (
	"context"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ReferralRepo handles database operations for referrals.
type ReferralRepo struct {
	db *pgxpool.Pool
}

// NewReferralRepo creates a new ReferralRepo.
func NewReferralRepo(db *pgxpool.Pool) *ReferralRepo {
	return &ReferralRepo{db: db}
}

// ListReferrals returns referrals. If merchantID is provided, scopes to that merchant's users.
// If userID is provided, scopes to that specific referrer.
func (r *ReferralRepo) ListReferrals(ctx context.Context, userID string) ([]model.Referral, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, referrer_id, referred_id, type, status,
		       commission, reward_paid, created_at
		FROM referrals
		WHERE referrer_id = $1 OR referred_id = $1
		ORDER BY created_at DESC
	`, userID)
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

// ListAllReferrals returns all referrals (admin use).
func (r *ReferralRepo) ListAllReferrals(ctx context.Context) ([]model.Referral, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, referrer_id, referred_id, type, status,
		       commission, reward_paid, created_at
		FROM referrals
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: list all: %w", err)
	}
	defer rows.Close()

	var referrals []model.Referral
	for rows.Next() {
		var ref model.Referral
		if err := rows.Scan(
			&ref.ID, &ref.ReferrerID, &ref.ReferredID, &ref.Type, &ref.Status,
			&ref.Commission, &ref.RewardPaid, &ref.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("referral_repo: scan all: %w", err)
		}
		referrals = append(referrals, ref)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("referral_repo: rows all: %w", err)
	}
	return referrals, nil
}

// GetStats returns referral statistics for a user.
func (r *ReferralRepo) GetStats(ctx context.Context, userID string) (*model.ReferralStats, error) {
	var stats model.ReferralStats
	var paid int // scanned but not in model; used to derive unpaid
	var totalCommission float64
	err := r.db.QueryRow(ctx, `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status = 'pending') AS pending,
			COUNT(*) FILTER (WHERE status = 'completed') AS completed,
			COUNT(*) FILTER (WHERE status = 'paid') AS paid,
			COALESCE(SUM(commission), 0) AS total_commission,
			COALESCE(SUM(commission) FILTER (WHERE status != 'paid'), 0) AS unpaid_commission
		FROM referrals
		WHERE referrer_id = $1
	`, userID).Scan(
		&stats.Total,
		&stats.Pending,
		&stats.Completed,
		&paid,
		&totalCommission,
		&stats.TotalEarned,
	)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: get stats: %w", err)
	}
	stats.Unpaid = stats.Total - paid
	return &stats, nil
}

// ProcessReward marks a referral as paid and records the payout.
// TODO: integrate with Xendit disbursement for actual payout.
func (r *ReferralRepo) ProcessReward(ctx context.Context, req model.ProcessRewardRequest) (*model.Referral, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Update referral status to paid
	var ref model.Referral
	err = tx.QueryRow(ctx, `
		UPDATE referrals
		SET status = 'paid', reward_paid = true, updated_at = NOW()
		WHERE id = $1 AND status = 'completed'
		RETURNING id, referrer_id, referred_id, type, status,
		          commission, reward_paid, created_at
	`, req.ReferralID).Scan(
		&ref.ID, &ref.ReferrerID, &ref.ReferredID, &ref.Type, &ref.Status,
		&ref.Commission, &ref.RewardPaid, &ref.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: update referral: %w", err)
	}

	// Record the payout
	_, err = tx.Exec(ctx, `
		INSERT INTO referral_payouts (referral_id, amount, status)
		VALUES ($1, $2, 'pending')
	`, req.ReferralID, req.Amount)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: insert payout: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("referral_repo: commit: %w", err)
	}
	return &ref, nil
}

// ProcessVendorOrderReferral creates a referral record for a vendor order.
// Commission is taken directly from the request.
func (r *ReferralRepo) ProcessVendorOrderReferral(ctx context.Context, referrerID string, req model.VendorOrderReferralRequest) (*model.Referral, error) {
	commission := req.Commission

	var ref model.Referral
	err := r.db.QueryRow(ctx, `
		INSERT INTO referrals (referrer_id, referred_id, type, status, commission, reward_paid)
		VALUES ($1, $2, 'vendor', 'pending', $3, false)
		ON CONFLICT (referrer_id, referred_id, type) DO UPDATE
		SET commission = referrals.commission + EXCLUDED.commission,
		    updated_at = NOW()
		RETURNING id, referrer_id, referred_id, type, status,
		          commission, reward_paid, created_at
	`, referrerID, req.ReferredID, commission).Scan(
		&ref.ID, &ref.ReferrerID, &ref.ReferredID, &ref.Type, &ref.Status,
		&ref.Commission, &ref.RewardPaid, &ref.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("referral_repo: process vendor order referral: %w", err)
	}
	return &ref, nil
}

// ProcessPendingCommissions marks pending referrals as completed and calculates commissions.
// Returns the count of referrals processed.
func (r *ReferralRepo) ProcessPendingCommissions(ctx context.Context) (int, error) {
	result, err := r.db.Exec(ctx, `
		UPDATE referrals
		SET status = 'completed', updated_at = NOW()
		WHERE status = 'pending'
		  AND created_at < NOW() - INTERVAL '7 days'
	`)
	if err != nil {
		return 0, fmt.Errorf("referral_repo: process commissions: %w", err)
	}
	return int(result.RowsAffected()), nil
}
