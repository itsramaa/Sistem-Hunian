package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/repository"
)

// SubscriptionService handles business logic for subscriptions.
type SubscriptionService struct {
	repo *repository.SubscriptionRepo
}

// NewSubscriptionService creates a new SubscriptionService.
func NewSubscriptionService(repo *repository.SubscriptionRepo) *SubscriptionService {
	return &SubscriptionService{repo: repo}
}

// ListSubscriptions returns all subscriptions for a merchant.
func (s *SubscriptionService) ListSubscriptions(ctx context.Context, merchantID string) ([]model.Subscription, error) {
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	subs, err := s.repo.ListSubscriptions(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("subscription_service: list: %w", err)
	}
	if subs == nil {
		subs = []model.Subscription{}
	}
	return subs, nil
}

// GetSubscription returns a single subscription by ID, scoped to merchantID.
func (s *SubscriptionService) GetSubscription(ctx context.Context, id, merchantID string) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	sub, err := s.repo.GetSubscription(ctx, id, merchantID)
	if err != nil {
		if subIsNotFound(err) {
			return nil, fmt.Errorf("subscription_service: not found")
		}
		return nil, fmt.Errorf("subscription_service: get: %w", err)
	}
	return sub, nil
}

// CreateSubscription creates a new subscription for a merchant.
func (s *SubscriptionService) CreateSubscription(ctx context.Context, merchantID string, req model.CreateSubscriptionRequest) (*model.Subscription, error) {
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	if req.TierID == "" {
		return nil, errors.New("subscription_service: tier_id is required")
	}
	sub, err := s.repo.CreateSubscription(ctx, merchantID, req.TierID)
	if err != nil {
		if subIsNotFound(err) {
			return nil, fmt.Errorf("subscription_service: tier not found or inactive")
		}
		return nil, fmt.Errorf("subscription_service: create: %w", err)
	}
	return sub, nil
}

// UpdateSubscriptionStatus updates the status of a subscription.
func (s *SubscriptionService) UpdateSubscriptionStatus(ctx context.Context, id, merchantID string, req model.UpdateSubscriptionStatusRequest) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}

	validStatuses := map[string]bool{
		"active": true, "grace_period": true, "expired": true, "cancelled": true,
	}
	if !validStatuses[req.Status] {
		return nil, fmt.Errorf("subscription_service: invalid status %q", req.Status)
	}

	sub, err := s.repo.UpdateSubscriptionStatus(ctx, id, merchantID, req.Status)
	if err != nil {
		if subIsNotFound(err) {
			return nil, fmt.Errorf("subscription_service: not found")
		}
		return nil, fmt.Errorf("subscription_service: update status: %w", err)
	}
	return sub, nil
}

// ListTiers returns all active subscription tiers.
func (s *SubscriptionService) ListTiers(ctx context.Context) ([]model.SubscriptionTier, error) {
	tiers, err := s.repo.ListTiers(ctx)
	if err != nil {
		return nil, fmt.Errorf("subscription_service: list tiers: %w", err)
	}
	if tiers == nil {
		tiers = []model.SubscriptionTier{}
	}
	return tiers, nil
}

// ProcessPayment processes a subscription payment and extends the period.
func (s *SubscriptionService) ProcessPayment(ctx context.Context, id, merchantID string, req model.SubscriptionPaymentRequest) (*model.Subscription, error) {
	if id == "" {
		return nil, errors.New("subscription_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("subscription_service: merchant_id is required")
	}
	if req.Amount <= 0 {
		return nil, errors.New("subscription_service: amount must be positive")
	}
	if req.PaymentMethod == "" {
		return nil, errors.New("subscription_service: payment_method is required")
	}

	sub, err := s.repo.ProcessPayment(ctx, id, merchantID, req)
	if err != nil {
		if subIsNotFound(err) {
			return nil, fmt.Errorf("subscription_service: not found")
		}
		return nil, fmt.Errorf("subscription_service: process payment: %w", err)
	}
	return sub, nil
}

// RunBillingCycle generates invoices for subscriptions due for renewal.
func (s *SubscriptionService) RunBillingCycle(ctx context.Context) (int, error) {
	count, err := s.repo.RunBillingCycle(ctx)
	if err != nil {
		return 0, fmt.Errorf("subscription_service: billing cycle: %w", err)
	}
	return count, nil
}

// RunRenewal processes subscriptions that have been paid and extends their period.
func (s *SubscriptionService) RunRenewal(ctx context.Context) (int, error) {
	count, err := s.repo.RunRenewal(ctx)
	if err != nil {
		return 0, fmt.Errorf("subscription_service: renewal: %w", err)
	}
	return count, nil
}

// RunGraceCheck transitions overdue subscriptions to grace_period or expired.
func (s *SubscriptionService) RunGraceCheck(ctx context.Context) (int, error) {
	count, err := s.repo.RunGraceCheck(ctx)
	if err != nil {
		return 0, fmt.Errorf("subscription_service: grace check: %w", err)
	}
	return count, nil
}

// subIsNotFound checks if an error indicates a not-found condition.
func subIsNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
