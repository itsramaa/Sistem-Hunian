package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/itsramaa/sihuni-api/internal/model"
)

// ContractRepo handles database operations for contracts and move-out notices.
type ContractRepo struct {
	pool *pgxpool.Pool
}

// NewContractRepo creates a new ContractRepo.
func NewContractRepo(pool *pgxpool.Pool) *ContractRepo {
	return &ContractRepo{pool: pool}
}

// ListContracts returns all contracts scoped to a merchant.
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

// ProcessDepositRefund marks the deposit as refunded and records the refund amount.
// Uses a transaction to update both the contract and insert a refund record.
func (r *ContractRepo) ProcessDepositRefund(ctx context.Context, id, merchantID string, req model.DepositRefundRequest) (*model.Contract, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Update deposit status on the contract
	var c model.Contract
	err = tx.QueryRow(ctx, `
		UPDATE contracts
		SET deposit_status = 'refunded', updated_at = NOW()
		WHERE id = $1 AND merchant_id = $2
		  AND deposit_status = 'held'
		RETURNING id, merchant_id, tenant_user_id, unit_id,
		          start_date, end_date, status,
		          deposit_amount, deposit_status, created_at
	`, id, merchantID).Scan(
		&c.ID, &c.MerchantID, &c.TenantUserID, &c.UnitID,
		&c.StartDate, &c.EndDate, &c.Status,
		&c.DepositAmount, &c.DepositStatus, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: update deposit: %w", err)
	}

	// Record the refund transaction
	// TODO: integrate with Xendit disbursement for actual payout
	_, err = tx.Exec(ctx, `
		INSERT INTO deposit_refunds (contract_id, refund_amount, reason, status)
		VALUES ($1, $2, $3, 'pending')
	`, id, req.RefundAmount, req.Reason)
	if err != nil {
		return nil, fmt.Errorf("contract_repo: insert refund record: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("contract_repo: commit: %w", err)
	}
	return &c, nil
}

// ListMoveOuts returns all move-out notices scoped to a merchant.
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
		SET status = $1,
		    notes = CASE WHEN $2 != '' THEN $2 ELSE notes END,
		    updated_at = NOW()
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
