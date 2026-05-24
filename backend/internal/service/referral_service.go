package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// ReferralService handles business logic for referrals.
type ReferralService struct {
	repo *repository.ReferralRepo
}

// NewReferralService creates a new ReferralService.
func NewReferralService(repo *repository.ReferralRepo) *ReferralService {
	return &ReferralService{repo: repo}
}

// ListReferrals returns referrals. merchantID scopes to that merchant; empty = admin (all).
func (s *ReferralService) ListReferrals(ctx context.Context, merchantID string) ([]model.Referral, error) {
	refs, err := s.repo.ListReferrals(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("referral_service: list: %w", err)
	}
	if refs == nil {
		refs = []model.Referral{}
	}
	return refs, nil
}

// GetStats returns aggregated referral statistics for a referrer.
func (s *ReferralService) GetStats(ctx context.Context, referrerID string) (*model.ReferralStats, error) {
	if referrerID == "" {
		return nil, errors.New("referral_service: referrer_id is required")
	}
	stats, err := s.repo.GetStats(ctx, referrerID)
	if err != nil {
		return nil, fmt.Errorf("referral_service: get stats: %w", err)
	}
	return stats, nil
}

// ProcessReward processes a referral reward payout.
func (s *ReferralService) ProcessReward(ctx context.Context, req model.ReferralRewardRequest) (*model.Referral, error) {
	if req.ReferralID == "" {
		return nil, errors.New("referral_service: referral_id is required")
	}
	if req.PayoutMethod == "" {
		return nil, errors.New("referral_service: payout_method is required")
	}

	ref, err := s.repo.ProcessReward(ctx, req)
	if err != nil {
		if isReferralNotFound(err) {
			return nil, fmt.Errorf("referral_service: referral not found or already paid")
		}
		return nil, fmt.Errorf("referral_service: process reward: %w", err)
	}
	return ref, nil
}

// ProcessVendorOrderReferral creates or updates a referral record for a vendor order.
func (s *ReferralService) ProcessVendorOrderReferral(ctx context.Context, req model.VendorOrderReferralRequest) (*model.Referral, error) {
	if req.ReferrerID == "" {
		return nil, errors.New("referral_service: referrer_id is required")
	}
	if req.VendorID == "" {
		return nil, errors.New("referral_service: vendor_id is required")
	}
	if req.OrderID == "" {
		return nil, errors.New("referral_service: order_id is required")
	}
	if req.OrderAmount <= 0 {
		return nil, errors.New("referral_service: order_amount must be positive")
	}

	ref, err := s.repo.ProcessVendorOrderReferral(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("referral_service: process vendor order referral: %w", err)
	}
	return ref, nil
}

// ProcessCommissions marks all pending completed referrals as paid.
// Returns the count of referrals processed.
func (s *ReferralService) ProcessCommissions(ctx context.Context) (int, error) {
	count, err := s.repo.ProcessCommissions(ctx)
	if err != nil {
		return 0, fmt.Errorf("referral_service: process commissions: %w", err)
	}
	return count, nil
}

// isReferralNotFound checks if an error indicates a not-found condition.
func isReferralNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
