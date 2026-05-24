#!/bin/bash
# Phase 3 Batch 1 — commit and push script
# Run from repo root: bash batch1-commit.sh

set -e

cd "$(dirname "$0")"

echo "=== Batch 1: Creating branch ==="
git checkout -b refactor/frontend-batch1 2>/dev/null || git checkout refactor/frontend-batch1

echo "=== Staging changed files ==="
git add \
  src/lib/axios.ts \
  src/features/notifications/utils/notifications.ts \
  src/features/auth/components/AuthForm.tsx \
  src/features/auth/pages/Invite.tsx \
  src/features/auth/pages/Onboarding.tsx \
  src/features/auth/services/adminSecurityService.ts \
  src/features/users/components/TenantProfileForm.tsx \
  src/features/users/services/merchantService.ts \
  src/features/users/services/merchantTenantService.ts \
  src/features/properties/services/propertyService.ts \
  src/features/properties/services/unitService.ts \
  src/features/compliance/services/ocrComplianceService.ts \
  src/shared/components/OcrCameraButton.tsx \
  src/shared/components/forms/OcrCameraButton.tsx \
  src/pages/merchant/PropertyDetail.tsx

echo "=== Committing ==="
git commit -m "refactor(frontend): replace supabase.functions.invoke with apiClient [batch1]

- axios.ts: auto-inject Supabase JWT in request interceptor
- notifications: sendNotification() now uses apiClient.post('/notifications/send')
- auth-webhook: replaced in AuthForm, Invite, Onboarding with apiClient.post('/auth/webhook')
- validate-admin-secret: replaced with apiClient.post('/auth/admin/2fa/validate')
- ensure-user-bootstrap: replaced with apiClient.post('/auth/bootstrap')
- create-tenant-account: replaced with apiClient.post('/auth/bootstrap')
- create-tenant: replaced with apiClient.post('/auth/bootstrap')
- propertyService: CRUD via apiClient /properties and /properties/:id
- unitService: CRUD via apiClient /properties/:id/units and /units/:id
- OCR stubs: ocrComplianceService, OcrCameraButton (x2) — feature unavailable

Closes #3"

echo "=== Pushing ==="
git push -u origin refactor/frontend-batch1

echo "=== Build check ==="
npm run build

echo "=== Remaining supabase.functions.invoke calls ==="
grep -rn "supabase.functions.invoke" src/ --include="*.ts" --include="*.tsx" || echo "None found"

echo "=== DONE ==="
