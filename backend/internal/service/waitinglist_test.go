package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/service"
)

// ── Mock repository ───────────────────────────────────────────────────────────

type mockWaitinglistRepo struct {
	createFn         func(ctx context.Context, req model.CreateWaitinglistRequest) (*model.Waitinglist, error)
	listFn           func(ctx context.Context, tenantID, propertyID string) ([]model.Waitinglist, error)
	getByIDFn        func(ctx context.Context, id string) (*model.Waitinglist, error)
	deleteFn         func(ctx context.Context, id string) error
}

func (m *mockWaitinglistRepo) CreateWaitinglist(ctx context.Context, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
	return m.createFn(ctx, req)
}
func (m *mockWaitinglistRepo) ListWaitinglist(ctx context.Context, tenantID, propertyID string) ([]model.Waitinglist, error) {
	return m.listFn(ctx, tenantID, propertyID)
}
func (m *mockWaitinglistRepo) GetWaitinglistByID(ctx context.Context, id string) (*model.Waitinglist, error) {
	return m.getByIDFn(ctx, id)
}
func (m *mockWaitinglistRepo) DeleteWaitinglist(ctx context.Context, id string) error {
	return m.deleteFn(ctx, id)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func newTestWaitinglistService(repo service.WaitinglistRepo) *service.WaitinglistService {
	return service.NewWaitinglistServiceWithRepo(repo)
}

func sampleEntry(id, tenantID, propertyID string) *model.Waitinglist {
	return &model.Waitinglist{
		ID:         id,
		TenantID:   tenantID,
		PropertyID: propertyID,
		Notes:      "test note",
		Status:     "waiting",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
}

// ── CreateWaitinglist tests ───────────────────────────────────────────────────

func TestCreateWaitinglist_HappyPath(t *testing.T) {
	want := sampleEntry("entry-1", "tenant-1", "prop-1")
	repo := &mockWaitinglistRepo{
		createFn: func(_ context.Context, req model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
			return want, nil
		},
	}
	svc := newTestWaitinglistService(repo)

	got, err := svc.CreateWaitinglist(context.Background(), "tenant-1", model.CreateWaitinglistRequest{
		TenantID:   "tenant-1",
		PropertyID: "prop-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != want.ID {
		t.Errorf("expected ID %q, got %q", want.ID, got.ID)
	}
}

func TestCreateWaitinglist_MissingTenantID(t *testing.T) {
	svc := newTestWaitinglistService(&mockWaitinglistRepo{})

	_, err := svc.CreateWaitinglist(context.Background(), "", model.CreateWaitinglistRequest{
		PropertyID: "prop-1",
	})
	if err == nil {
		t.Fatal("expected error for missing tenant_id, got nil")
	}
}

func TestCreateWaitinglist_MissingPropertyID(t *testing.T) {
	svc := newTestWaitinglistService(&mockWaitinglistRepo{})

	_, err := svc.CreateWaitinglist(context.Background(), "tenant-1", model.CreateWaitinglistRequest{
		TenantID: "tenant-1",
	})
	if err == nil {
		t.Fatal("expected error for missing property_id, got nil")
	}
}

func TestCreateWaitinglist_DuplicateEntry(t *testing.T) {
	repo := &mockWaitinglistRepo{
		createFn: func(_ context.Context, _ model.CreateWaitinglistRequest) (*model.Waitinglist, error) {
			return nil, errors.New("duplicate key value violates unique constraint")
		},
	}
	svc := newTestWaitinglistService(repo)

	_, err := svc.CreateWaitinglist(context.Background(), "tenant-1", model.CreateWaitinglistRequest{
		TenantID:   "tenant-1",
		PropertyID: "prop-1",
	})
	if err == nil {
		t.Fatal("expected error for duplicate entry, got nil")
	}
}

// ── DeleteWaitinglist tests ───────────────────────────────────────────────────

func TestDeleteWaitinglist_HappyPath(t *testing.T) {
	entry := sampleEntry("entry-1", "tenant-1", "prop-1")
	repo := &mockWaitinglistRepo{
		getByIDFn: func(_ context.Context, id string) (*model.Waitinglist, error) {
			return entry, nil
		},
		deleteFn: func(_ context.Context, id string) error {
			return nil
		},
	}
	svc := newTestWaitinglistService(repo)

	err := svc.DeleteWaitinglist(context.Background(), "tenant-1", "tenant", "entry-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteWaitinglist_NotFound(t *testing.T) {
	repo := &mockWaitinglistRepo{
		getByIDFn: func(_ context.Context, id string) (*model.Waitinglist, error) {
			return nil, errors.New("waitinglist_repo: get by id: not found")
		},
	}
	svc := newTestWaitinglistService(repo)

	err := svc.DeleteWaitinglist(context.Background(), "tenant-1", "tenant", "nonexistent")
	if err == nil {
		t.Fatal("expected not found error, got nil")
	}
}

func TestDeleteWaitinglist_Unauthorized(t *testing.T) {
	// Entry belongs to tenant-1, but caller is tenant-2.
	entry := sampleEntry("entry-1", "tenant-1", "prop-1")
	repo := &mockWaitinglistRepo{
		getByIDFn: func(_ context.Context, id string) (*model.Waitinglist, error) {
			return entry, nil
		},
	}
	svc := newTestWaitinglistService(repo)

	err := svc.DeleteWaitinglist(context.Background(), "tenant-2", "tenant", "entry-1")
	if err == nil {
		t.Fatal("expected forbidden error, got nil")
	}
}

func TestDeleteWaitinglist_AdminCanDeleteAny(t *testing.T) {
	// Entry belongs to tenant-1, but caller is admin.
	entry := sampleEntry("entry-1", "tenant-1", "prop-1")
	repo := &mockWaitinglistRepo{
		getByIDFn: func(_ context.Context, id string) (*model.Waitinglist, error) {
			return entry, nil
		},
		deleteFn: func(_ context.Context, id string) error {
			return nil
		},
	}
	svc := newTestWaitinglistService(repo)

	err := svc.DeleteWaitinglist(context.Background(), "admin-user", "admin", "entry-1")
	if err != nil {
		t.Fatalf("admin should be able to delete any entry, got error: %v", err)
	}
}

func TestDeleteWaitinglist_MerchantCanDeleteAny(t *testing.T) {
	entry := sampleEntry("entry-1", "tenant-1", "prop-1")
	repo := &mockWaitinglistRepo{
		getByIDFn: func(_ context.Context, id string) (*model.Waitinglist, error) {
			return entry, nil
		},
		deleteFn: func(_ context.Context, id string) error {
			return nil
		},
	}
	svc := newTestWaitinglistService(repo)

	err := svc.DeleteWaitinglist(context.Background(), "merchant-user", "merchant", "entry-1")
	if err != nil {
		t.Fatalf("merchant should be able to delete any entry, got error: %v", err)
	}
}

// ── ListWaitinglist tests ─────────────────────────────────────────────────────

func TestListWaitinglist_TenantOnlySeesOwnEntries(t *testing.T) {
	repo := &mockWaitinglistRepo{
		listFn: func(_ context.Context, tenantID, propertyID string) ([]model.Waitinglist, error) {
			// Verify the service passes the callerID as tenantID filter for tenant role.
			if tenantID != "tenant-1" {
				return nil, errors.New("expected tenantID filter to be set for tenant role")
			}
			return []model.Waitinglist{*sampleEntry("entry-1", "tenant-1", "prop-1")}, nil
		},
	}
	svc := newTestWaitinglistService(repo)

	items, err := svc.ListWaitinglist(context.Background(), "tenant-1", "tenant", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 1 {
		t.Errorf("expected 1 item, got %d", len(items))
	}
}

func TestListWaitinglist_MerchantSeesAll(t *testing.T) {
	repo := &mockWaitinglistRepo{
		listFn: func(_ context.Context, tenantID, propertyID string) ([]model.Waitinglist, error) {
			// Merchant should not have tenantID filter applied.
			if tenantID != "" {
				return nil, errors.New("merchant should not have tenantID filter")
			}
			return []model.Waitinglist{
				*sampleEntry("entry-1", "tenant-1", "prop-1"),
				*sampleEntry("entry-2", "tenant-2", "prop-1"),
			}, nil
		},
	}
	svc := newTestWaitinglistService(repo)

	items, err := svc.ListWaitinglist(context.Background(), "merchant-1", "merchant", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 2 {
		t.Errorf("expected 2 items, got %d", len(items))
	}
}
