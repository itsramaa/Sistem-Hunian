package service_test

import (
	"context"
	"testing"

	"github.com/itsramaa/sihuni-api/internal/model"
	"github.com/itsramaa/sihuni-api/internal/service"
)

func TestNotificationService_Send_MissingEmail(t *testing.T) {
	svc := service.NewNotificationService(nil, nil)
	_, err := svc.Send(context.Background(), model.SendNotificationRequest{
		Type:          model.NotificationTypeInvoice,
		RecipientName: "Test User",
		Data:          map[string]any{},
	})
	if err == nil {
		t.Fatal("expected error for missing recipient_email, got nil")
	}
}

func TestNotificationService_Send_MissingName(t *testing.T) {
	svc := service.NewNotificationService(nil, nil)
	_, err := svc.Send(context.Background(), model.SendNotificationRequest{
		Type:           model.NotificationTypeInvoice,
		RecipientEmail: "test@example.com",
		Data:           map[string]any{},
	})
	if err == nil {
		t.Fatal("expected error for missing recipient_name, got nil")
	}
}

func TestNotificationService_Send_ValidRequest_NilResend(t *testing.T) {
	// With nil resend client, Send should fail at the resend call, not at validation
	svc := service.NewNotificationService(nil, nil)
	_, err := svc.Send(context.Background(), model.SendNotificationRequest{
		Type:           model.NotificationTypeGeneral,
		RecipientEmail: "test@example.com",
		RecipientName:  "Test User",
		Data:           map[string]any{"message": "Hello"},
	})
	// Should fail because resend client is nil, but validation passed
	if err == nil {
		t.Fatal("expected error from nil resend client, got nil")
	}
}
