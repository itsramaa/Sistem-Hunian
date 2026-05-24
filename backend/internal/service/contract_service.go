package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sistem-hunian/backend/internal/model"
	"github.com/itsramaa/sistem-hunian/backend/internal/repository"
)

// ContractService handles business logic for contracts and move-out notices.
type ContractService struct {
	repo *repository.ContractRepo
}

// NewContractService creates a new ContractService.
func NewContractService(repo *repository.ContractRepo) *ContractService {
	return &ContractService{repo: repo}
}

// ListContracts returns all contracts for a merchant.
func (s *ContractService) ListContracts(ctx context.Context, merchantID string) ([]model.Contract, error) {
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	contracts, err := s.repo.ListContracts(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("contract_service: list: %w", err)
	}
	if contracts == nil {
		contracts = []model.Contract{}
	}
	return contracts, nil
}

// GetContract returns a single contract by ID, scoped to merchantID.
func (s *ContractService) GetContract(ctx context.Context, id, merchantID string) (*model.Contract, error) {
	if id == "" {
		return nil, errors.New("contract_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	c, err := s.repo.GetContract(ctx, id, merchantID)
	if err != nil {
		if contractIsNotFound(err) {
			return nil, fmt.Errorf("contract_service: not found")
		}
		return nil, fmt.Errorf("contract_service: get: %w", err)
	}
	return c, nil
}

// ProcessDepositRefund validates and processes a deposit refund for a contract.
func (s *ContractService) ProcessDepositRefund(ctx context.Context, id, merchantID string, req model.DepositRefundRequest) (*model.Contract, error) {
	if id == "" {
		return nil, errors.New("contract_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	if req.RefundAmount <= 0 {
		return nil, errors.New("contract_service: refund_amount must be positive")
	}

	c, err := s.repo.ProcessDepositRefund(ctx, id, merchantID, req)
	if err != nil {
		if contractIsNotFound(err) {
			return nil, fmt.Errorf("contract_service: not found or deposit already processed")
		}
		return nil, fmt.Errorf("contract_service: process refund: %w", err)
	}
	return c, nil
}

// ListMoveOuts returns all move-out notices for a merchant.
func (s *ContractService) ListMoveOuts(ctx context.Context, merchantID string) ([]model.MoveOutNotice, error) {
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	notices, err := s.repo.ListMoveOuts(ctx, merchantID)
	if err != nil {
		return nil, fmt.Errorf("contract_service: list move-outs: %w", err)
	}
	if notices == nil {
		notices = []model.MoveOutNotice{}
	}
	return notices, nil
}

// GetMoveOut returns a single move-out notice by ID, scoped to merchantID.
func (s *ContractService) GetMoveOut(ctx context.Context, id, merchantID string) (*model.MoveOutNotice, error) {
	if id == "" {
		return nil, errors.New("contract_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	m, err := s.repo.GetMoveOut(ctx, id, merchantID)
	if err != nil {
		if contractIsNotFound(err) {
			return nil, fmt.Errorf("contract_service: not found")
		}
		return nil, fmt.Errorf("contract_service: get move-out: %w", err)
	}
	return m, nil
}

// UpdateMoveOutStatus updates the status of a move-out notice.
func (s *ContractService) UpdateMoveOutStatus(ctx context.Context, id, merchantID string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error) {
	if id == "" {
		return nil, errors.New("contract_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}

	validStatuses := map[string]bool{
		"approved": true, "rejected": true, "completed": true,
	}
	if !validStatuses[req.Status] {
		return nil, fmt.Errorf("contract_service: invalid status %q — must be approved, rejected, or completed", req.Status)
	}

	if s.repo == nil {
		return nil, errors.New("contract_service: repository not initialized")
	}

	m, err := s.repo.UpdateMoveOutStatus(ctx, id, merchantID, req)
	if err != nil {
		if contractIsNotFound(err) {
			return nil, fmt.Errorf("contract_service: not found")
		}
		return nil, fmt.Errorf("contract_service: update move-out status: %w", err)
	}
	return m, nil
}

// contractIsNotFound checks if an error indicates a not-found condition.
func contractIsNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
