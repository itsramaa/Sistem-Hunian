package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/repository"
)

// ReferralService handles business logic for referrals.
type ReferralService struct {
	repo *repository.ReferralRepo
}

// NewReferralService creates a new ReferralService.
func NewReferralService(repo *repository.ReferralRepo) *ReferralService {
	return &ReferralService{repo: repo}
}

// ListReferrals returns referrals for a user. Admins pass empty userID to get all.
func (s *ReferralService) ListReferrals(ctx context.Context, userID, role string) ([]model.Referral, error) {
	var (
		referrals []model.Referral
		err       error
	)

	if role == "admin" {
		referrals, err = s.repo.ListAllReferrals(ctx)
	} else {
		if userID == "" {
			return nil, errors.New("referral_service: user_id is required")
		}
		referrals, err = s.repo.ListReferrals(ctx, userID)
	}

	if err != nil {
		return nil, fmt.Errorf("referral_service: list: %w", err)
	}
	if referrals == nil {
		referrals = []model.Referral{}
	}
	return referrals, nil
}

// GetStats returns referral statistics for a user.
func (s *ReferralService) GetStats(ctx context.Context, userID string) (*model.ReferralStats, error) {
	if userID == "" {
		return nil, errors.New("referral_service: user_id is required")
	}
	stats, err := s.repo.GetStats(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("referral_service: get stats: %w", err)
	}
	return stats, nil
}

// ProcessReward validates and processes a referral reward payout.
func (s *ReferralService) ProcessReward(ctx context.Context, req model.ProcessRewardRequest) (*model.Referral, error) {
	if req.ReferralID == "" {
		return nil, errors.New("referral_service: referral_id is required")
	}
	if req.Amount <= 0 {
		return nil, errors.New("referral_service: amount must be positive")
	}

	ref, err := s.repo.ProcessReward(ctx, req)
	if err != nil {
		if referralIsNotFound(err) {
			return nil, fmt.Errorf("referral_service: not found or not in completed status")
		}
		return nil, fmt.Errorf("referral_service: process reward: %w", err)
	}
	return ref, nil
}

// ProcessVendorOrderReferral creates a referral record for a vendor order.
func (s *ReferralService) ProcessVendorOrderReferral(ctx context.Context, referrerID string, req model.VendorOrderReferralRequest) (*model.Referral, error) {
	if referrerID == "" {
		return nil, errors.New("referral_service: referrer_id is required")
	}
	if req.ReferredID == "" {
		return nil, errors.New("referral_service: referred_id is required")
	}
	if req.OrderID == "" {
		return nil, errors.New("referral_service: order_id is required")
	}
	if req.Commission < 0 {
		return nil, errors.New("referral_service: commission must be non-negative")
	}

	ref, err := s.repo.ProcessVendorOrderReferral(ctx, referrerID, req)
	if err != nil {
		return nil, fmt.Errorf("referral_service: process vendor order referral: %w", err)
	}
	return ref, nil
}

// ProcessPendingCommissions marks pending referrals as completed.
func (s *ReferralService) ProcessPendingCommissions(ctx context.Context) (int, error) {
	count, err := s.repo.ProcessPendingCommissions(ctx)
	if err != nil {
		return 0, fmt.Errorf("referral_service: process commissions: %w", err)
	}
	return count, nil
}

// referralIsNotFound checks if an error indicates a not-found condition.
func referralIsNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
