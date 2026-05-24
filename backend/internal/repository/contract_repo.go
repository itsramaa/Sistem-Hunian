package repository

import (
	"context"
	"fmt"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ContractRepo handles database operations for contracts and move-out notices.
type ContractRepo struct {
	pool *pgxpool.Pool
}

// NewContractRepo creates a new ContractRepo.
func NewContractRepo(pool *pgxpool.Pool) *ContractRepo {
	return &ContractRepo{pool: pool}
}

// ListContracts returns all contracts for a given merchant.
func (r *ContractRepo) ListContracts(ctx context.Context, merchantID string) ([]model.Contract, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, merchant_id, tenant_user_id, unit_id,
		       start_date, end_date, status,
		       deposit_amount, deposit_status, created_at
		FROM contracts
		WHERE merchant_id = $1
		ORDER BY created_at DESC
	`, merchantID)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: list: %w", err)
	}
	defer rows.Close()

	var contracts []model.Contract
	for rows.Next() {
		var c model.Contract
		if err := rows.Scan(
			&c.ID, &c.MerchantID, &c.TenantUserID, &c.UnitID,
			&c.StartDate, &c.EndDate, &c.Status,
			&c.DepositAmount, &c.DepositStatus, &c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("contract_repo: scan: %w", err)
		}
		contracts = append(contracts, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("contract_repo: rows: %w", err)
	}
	return contracts, nil
}

// GetContract returns a single contract by ID, scoped to merchantID.
func (r *ContractRepo) GetContract(ctx context.Context, id, merchantID string) (*model.Contract, error) {
	var c model.Contract
	err := r.pool.QueryRow(ctx, `
		SELECT id, merchant_id, tenant_user_id, unit_id,
		       start_date, end_date, status,
		       deposit_amount, deposit_status, created_at
		FROM contracts
		WHERE id = $1 AND merchant_id = $2
	`, id, merchantID).Scan(
		&c.ID, &c.MerchantID, &c.TenantUserID, &c.UnitID,
		&c.StartDate, &c.EndDate, &c.Status,
		&c.DepositAmount, &c.DepositStatus, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: get: %w", err)
	}
	return &c, nil
}

// ProcessDepositRefund updates the deposit status for a contract.
// It sets deposit_status to "refunded" or "forfeited" and records the action.
func (r *ContractRepo) ProcessDepositRefund(ctx context.Context, contractID, merchantID string, req model.DepositRefundRequest) (*model.Contract, error) {
	depositStatus := "refunded"
	if req.Action == "forfeit" {
		depositStatus = "forfeited"
	}

	var c model.Contract
	err := r.pool.QueryRow(ctx, `
		UPDATE contracts
		SET deposit_status = $1, updated_at = NOW()
		WHERE id = $2 AND merchant_id = $3
		RETURNING id, merchant_id, tenant_user_id, unit_id,
		          start_date, end_date, status,
		          deposit_amount, deposit_status, created_at
	`, depositStatus, contractID, merchantID).Scan(
		&c.ID, &c.MerchantID, &c.TenantUserID, &c.UnitID,
		&c.StartDate, &c.EndDate, &c.Status,
		&c.DepositAmount, &c.DepositStatus, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: process deposit refund: %w", err)
	}
	return &c, nil
}

// ListMoveOuts returns all move-out notices for a given merchant.
func (r *ContractRepo) ListMoveOuts(ctx context.Context, merchantID string) ([]model.MoveOutNotice, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, contract_id, merchant_id, tenant_user_id,
		       move_out_date, status, COALESCE(notes, ''), created_at
		FROM move_out_notices
		WHERE merchant_id = $1
		ORDER BY created_at DESC
	`, merchantID)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: list move-outs: %w", err)
	}
	defer rows.Close()

	var notices []model.MoveOutNotice
	for rows.Next() {
		var m model.MoveOutNotice
		if err := rows.Scan(
			&m.ID, &m.ContractID, &m.MerchantID, &m.TenantUserID,
			&m.MoveOutDate, &m.Status, &m.Notes, &m.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("contract_repo: scan move-out: %w", err)
		}
		notices = append(notices, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("contract_repo: move-out rows: %w", err)
	}
	return notices, nil
}

// GetMoveOut returns a single move-out notice by ID, scoped to merchantID.
func (r *ContractRepo) GetMoveOut(ctx context.Context, id, merchantID string) (*model.MoveOutNotice, error) {
	var m model.MoveOutNotice
	err := r.pool.QueryRow(ctx, `
		SELECT id, contract_id, merchant_id, tenant_user_id,
		       move_out_date, status, COALESCE(notes, ''), created_at
		FROM move_out_notices
		WHERE id = $1 AND merchant_id = $2
	`, id, merchantID).Scan(
		&m.ID, &m.ContractID, &m.MerchantID, &m.TenantUserID,
		&m.MoveOutDate, &m.Status, &m.Notes, &m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: get move-out: %w", err)
	}
	return &m, nil
}

// UpdateMoveOutStatus updates the status of a move-out notice, scoped to merchantID.
func (r *ContractRepo) UpdateMoveOutStatus(ctx context.Context, id, merchantID string, req model.UpdateMoveOutStatusRequest) (*model.MoveOutNotice, error) {
	var m model.MoveOutNotice
	err := r.pool.QueryRow(ctx, `
		UPDATE move_out_notices
		SET status = $1, notes = COALESCE(NULLIF($2, ''), notes), updated_at = NOW()
		WHERE id = $3 AND merchant_id = $4
		RETURNING id, contract_id, merchant_id, tenant_user_id,
		          move_out_date, status, COALESCE(notes, ''), created_at
	`, req.Status, req.Notes, id, merchantID).Scan(
		&m.ID, &m.ContractID, &m.MerchantID, &m.TenantUserID,
		&m.MoveOutDate, &m.Status, &m.Notes, &m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: update move-out status: %w", err)
	}
	return &m, nil
}
