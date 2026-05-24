package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/repository"
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
	contract, err := s.repo.GetContract(ctx, id, merchantID)
	if err != nil {
		if isContractNotFound(err) {
			return nil, fmt.Errorf("contract_service: not found")
		}
		return nil, fmt.Errorf("contract_service: get: %w", err)
	}
	return contract, nil
}

// ProcessDepositRefund processes a deposit refund or forfeiture for a contract.
func (s *ContractService) ProcessDepositRefund(ctx context.Context, contractID, merchantID string, req model.DepositRefundRequest) (*model.Contract, error) {
	if contractID == "" {
		return nil, errors.New("contract_service: contract_id is required")
	}
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	if req.Action != "refund" && req.Action != "forfeit" {
		return nil, errors.New("contract_service: action must be 'refund' or 'forfeit'")
	}

	contract, err := s.repo.ProcessDepositRefund(ctx, contractID, merchantID, req)
	if err != nil {
		if isContractNotFound(err) {
			return nil, fmt.Errorf("contract_service: not found")
		}
		return nil, fmt.Errorf("contract_service: process deposit refund: %w", err)
	}
	return contract, nil
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
	notice, err := s.repo.GetMoveOut(ctx, id, merchantID)
	if err != nil {
		if isContractNotFound(err) {
			return nil, fmt.Errorf("contract_service: move-out not found")
		}
		return nil, fmt.Errorf("contract_service: get move-out: %w", err)
	}
	return notice, nil
}

// UpdateMoveOutStatus updates the status of a move-out notice.
func (s *ContractService) UpdateMoveOutStatus(ctx context.Context, id, merchantID string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error) {
	if id == "" {
		return nil, errors.New("contract_service: id is required")
	}
	if merchantID == "" {
		return nil, errors.New("contract_service: merchant_id is required")
	}
	validStatuses := map[string]bool{"approved": true, "rejected": true, "completed": true}
	if !validStatuses[req.Status] {
		return nil, errors.New("contract_service: status must be approved, rejected, or completed")
	}

	notice, err := s.repo.UpdateMoveOutStatus(ctx, id, merchantID, req)
	if err != nil {
		if isContractNotFound(err) {
			return nil, fmt.Errorf("contract_service: move-out not found")
		}
		return nil, fmt.Errorf("contract_service: update move-out status: %w", err)
	}
	return notice, nil
}

// isContractNotFound checks if an error indicates a not-found condition.
func isContractNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "no rows") ||
		strings.Contains(msg, "not found") ||
		strings.Contains(msg, "ErrNoRows")
}
