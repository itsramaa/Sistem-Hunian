# Testing Strategy - SiHuni.com

## Overview

**Testing Philosophy:** Shift-left testing with 80% automated coverage target.

**Test Pyramid:**
```
           /\
          /  \    10% E2E Tests (Critical user flows)
         /____\
        /      \  
       /  30%   \ Integration Tests (API + DB + External services)
      /__________\
     /            \
    /     60%      \ Unit Tests (Business logic, utilities)
   /________________\
```

---

## 1. Unit Testing

### Backend Unit Tests (60% coverage target)

**Framework:** Jest + Supertest (Node.js) OR Go testing (if using Go)

**Test Categories:**

#### 1.1 Business Logic
```javascript
// Example: Fee calculation
describe('Fee Calculator', () => {
  test('should calculate 3.5% transaction fee for rent payment', () => {
    const amount = 1500000;
    const fee = calculateRentFee(amount);
    expect(fee).toBe(52500); // 1% platform + 2.5% Xendit
  });

  test('should calculate 5.5% transaction fee for vendor order', () => {
    const amount = 50000;
    const fee = calculateVendorFee(amount);
    expect(fee).toBe(2750); // 3% platform + 2.5% Xendit
  });

  test('should calculate daily disbursement fee (0.25%)', () => {
    const amount = 10000000;
    const fee = calculateDisbursementFee(amount, 'daily');
    expect(fee).toBe(25000);
  });

  test('should return 0 fee for weekly/monthly disbursement', () => {
    const amount = 10000000;
    expect(calculateDisbursementFee(amount, 'weekly')).toBe(0);
    expect(calculateDisbursementFee(amount, 'monthly')).toBe(0);
  });
});
```

#### 1.2 Utility Functions
```javascript
describe('Date Utilities', () => {
  test('should generate next disbursement date for weekly schedule', () => {
    const today = new Date('2025-12-22'); // Monday
    const next = getNextDisbursementDate('weekly', today);
    expect(next).toEqual(new Date('2025-12-29')); // Next Monday
  });

  test('should generate next disbursement date for monthly schedule', () => {
    const today = new Date('2025-12-22');
    const next = getNextDisbursementDate('monthly', today, 1); // 1st of month
    expect(next).toEqual(new Date('2026-01-01'));
  });
});
```

#### 1.3 Validation
```javascript
describe('Input Validation', () => {
  test('should validate email format', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });

  test('should validate phone number format (Indonesia)', () => {
    expect(isValidPhone('+6281234567890')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });

  test('should validate KTP number format', () => {
    expect(isValidKTP('3201234567890001')).toBe(true);
    expect(isValidKTP('123')).toBe(false);
  });
});
```

### Frontend Unit Tests (50% coverage target)

**Framework:** Vitest + React Testing Library

**Test Categories:**

#### 1.4 Component Logic
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentForm } from './PaymentForm';

describe('PaymentForm', () => {
  test('should render payment method options', () => {
    render(<PaymentForm />);
    expect(screen.getByText('Virtual Account')).toBeInTheDocument();
    expect(screen.getByText('QRIS')).toBeInTheDocument();
    expect(screen.getByText('E-Wallet')).toBeInTheDocument();
  });

  test('should show bank selection when VA is selected', () => {
    render(<PaymentForm />);
    fireEvent.click(screen.getByText('Virtual Account'));
    expect(screen.getByText('BCA')).toBeInTheDocument();
    expect(screen.getByText('Mandiri')).toBeInTheDocument();
  });

  test('should calculate total with fees', () => {
    render(<PaymentForm amount={1500000} />);
    expect(screen.getByText('Rp 1,552,500')).toBeInTheDocument(); // +3.5% fee
  });
});
```

#### 1.5 Custom Hooks
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useEscrowBalance } from './useEscrowBalance';

describe('useEscrowBalance', () => {
  test('should fetch escrow balance', async () => {
    const { result } = renderHook(() => useEscrowBalance('merchant-123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.balance).toBe(15450000);
    expect(result.current.pending).toBe(2300000);
  });
});
```

---

## 2. Integration Testing

### API Integration Tests (30% coverage target)

**Framework:** Jest + Supertest

**Test Categories:**

#### 2.1 Authentication Flow
```javascript
describe('Authentication API', () => {
  test('POST /auth/register - should register new merchant', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'merchant@test.com',
        password: 'SecurePass123!',
        full_name: 'Test Merchant',
        role: 'merchant',
        business_name: 'Test Kosan'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user_id).toBeDefined();
    expect(response.body.data.trial_tier).toBe('basic');
  });

  test('POST /auth/login - should return JWT tokens', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'merchant@test.com',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.data.refresh_token).toBeDefined();
  });

  test('POST /auth/login - should fail with wrong password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'merchant@test.com',
        password: 'WrongPassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
```

#### 2.2 Payment & Escrow Flow
```javascript
describe('Payment & Escrow Flow', () => {
  let accessToken, invoiceId, paymentId;

  beforeAll(async () => {
    // Setup: Login as tenant
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'tenant@test.com', password: 'pass' });
    accessToken = login.body.data.access_token;

    // Create invoice (seeded data or previous test)
    invoiceId = 'invoice-test-123';
  });

  test('POST /payments/create - should create payment', async () => {
    const response = await request(app)
      .post('/payments/create')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        invoice_id: invoiceId,
        payment_method: 'va',
        payment_channel: 'BCA'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.virtual_account_number).toBeDefined();
    expect(response.body.data.amount).toBe(1700000);
    paymentId = response.body.data.payment_id;
  });

  test('POST /webhooks/xendit/payment - should process payment webhook', async () => {
    // Simulate Xendit callback
    const response = await request(app)
      .post('/webhooks/xendit/payment')
      .send({
        id: 'xendit-123',
        external_id: paymentId,
        amount: 1700000,
        status: 'PAID',
        paid_at: new Date().toISOString()
      });

    expect(response.status).toBe(200);

    // Verify escrow balance updated
    const escrow = await request(app)
      .get('/escrow/balance')
      .set('Authorization', `Bearer ${merchantToken}`);
    
    expect(escrow.body.data.available_balance).toBeGreaterThan(0);
  });
});
```

#### 2.3 Database Transactions
```javascript
describe('Database Transactions', () => {
  test('should rollback on payment processing failure', async () => {
    const initialBalance = await getEscrowBalance('merchant-123');

    // Simulate payment processing with error
    try {
      await processPayment({
        amount: 1500000,
        merchant_id: 'merchant-123',
        xendit_callback: { status: 'FAILED' }
      });
    } catch (error) {
      // Expected error
    }

    const finalBalance = await getEscrowBalance('merchant-123');
    expect(finalBalance).toBe(initialBalance); // No change (rolled back)
  });
});
```

#### 2.4 External Service Integration

**Xendit Integration:**
```javascript
describe('Xendit Integration', () => {
  test('should create virtual account', async () => {
    const response = await xenditClient.createVirtualAccount({
      external_id: 'payment-test-123',
      bank_code: 'BCA',
      name: 'Jane Doe',
      expected_amount: 1700000
    });

    expect(response.status).toBe('ACTIVE');
    expect(response.account_number).toMatch(/^\d{12}$/);
  });

  test('should handle Xendit timeout gracefully', async () => {
    // Mock timeout
    jest.setTimeout(6000);
    
    try {
      await xenditClient.createVirtualAccount({ /* ... */ }, { timeout: 5000 });
    } catch (error) {
      expect(error.code).toBe('TIMEOUT');
    }
  });
});
```

**Google Gemini Integration:**
```javascript
describe('Gemini API Integration', () => {
  test('should classify intent correctly', async () => {
    const response = await geminiClient.generateContent({
      prompt: 'Cari laundry terdekat yang bagus',
      context: { property_location: 'Jakarta' }
    });

    expect(response.intent).toBe('vendor_recommendation');
    expect(response.confidence).toBeGreaterThan(0.8);
  });

  test('should handle Gemini API error gracefully', async () => {
    // Mock API error
    jest.spyOn(geminiClient, 'generateContent').mockRejectedValue(new Error('API Error'));

    const response = await chatbot.handleMessage('test query');
    expect(response.message).toContain('Maaf, terjadi kesalahan');
    expect(response.escalated).toBe(true);
  });
});
```

---

## 3. End-to-End (E2E) Testing

### Critical User Flows (10% coverage target)

**Framework:** Playwright

**Test Categories:**

#### 3.1 Merchant Onboarding Flow
```javascript
test('Merchant onboarding flow', async ({ page }) => {
  // 1. Register
  await page.goto('/register');
  await page.fill('[name="email"]', 'merchant-e2e@test.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.fill('[name="business_name"]', 'E2E Test Kosan');
  await page.selectOption('[name="role"]', 'merchant');
  await page.click('button[type="submit"]');

  // 2. Verify trial activated
  await expect(page.locator('text=14-day trial started')).toBeVisible();

  // 3. Add property
  await page.goto('/properties');
  await page.click('text=Add Property');
  await page.fill('[name="name"]', 'Test Property A');
  await page.fill('[name="address"]', 'Jl. Test No. 123');
  await page.selectOption('[name="type"]', 'kosan');
  await page.click('button:has-text("Save")');

  await expect(page.locator('text=Test Property A')).toBeVisible();

  // 4. Add unit
  await page.click('text=Test Property A');
  await page.click('text=Add Unit');
  await page.fill('[name="unit_number"]', 'A101');
  await page.fill('[name="price_monthly"]', '1500000');
  await page.click('button:has-text("Save")');

  await expect(page.locator('text=A101')).toBeVisible();
});
```

#### 3.2 Tenant Payment Flow
```javascript
test('Tenant rent payment flow', async ({ page }) => {
  // 1. Login as tenant
  await page.goto('/login');
  await page.fill('[name="email"]', 'tenant-e2e@test.com');
  await page.fill('[name="password"]', 'TenantPass123!');
  await page.click('button[type="submit"]');

  // 2. View pending invoice
  await page.goto('/invoices');
  await expect(page.locator('text=Pending')).toBeVisible();

  // 3. Click pay
  await page.click('button:has-text("Pay Now")');

  // 4. Select payment method
  await page.click('text=Virtual Account');
  await page.click('text=BCA');

  // 5. Confirm payment
  await page.click('button:has-text("Proceed to Payment")');

  // 6. Verify VA number displayed
  await expect(page.locator('[data-testid="va-number"]')).toHaveText(/^\d{12}$/);

  // 7. Copy VA number
  await page.click('button:has-text("Copy")');
  await expect(page.locator('text=Copied!')).toBeVisible();
});
```

#### 3.3 Vendor Order Flow
```javascript
test('Tenant orders from vendor', async ({ page, context }) => {
  // 1. Login as tenant
  await page.goto('/login');
  await page.fill('[name="email"]', 'tenant-e2e@test.com');
  await page.fill('[name="password"]', 'TenantPass123!');
  await page.click('button[type="submit"]');

  // 2. Browse vendors
  await page.goto('/vendors');
  await page.click('text=Laundry');
  await expect(page.locator('[data-testid="vendor-card"]')).toHaveCount(3, { timeout: 10000 });

  // 3. Select vendor
  await page.click('[data-testid="vendor-card"]:first-child');

  // 4. Add to order
  await page.click('text=Cuci Kering Setrika');
  await page.fill('[name="quantity"]', '3');
  await page.fill('[name="notes"]', 'Pakai pewangi lavender');
  await page.click('button:has-text("Order Now")');

  // 5. Pay order
  await page.click('text=QRIS');
  await page.click('button:has-text("Pay")');

  // 6. Verify QR code displayed
  await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

  // Open vendor dashboard in new tab
  const vendorPage = await context.newPage();
  await vendorPage.goto('/login');
  await vendorPage.fill('[name="email"]', 'vendor-e2e@test.com');
  await vendorPage.fill('[name="password"]', 'VendorPass123!');
  await vendorPage.click('button[type="submit"]');

  // 7. Vendor accepts order
  await vendorPage.goto('/orders');
  await expect(vendorPage.locator('text=New Order')).toBeVisible();
  await vendorPage.click('button:has-text("Accept")');

  // 8. Update status to processing
  await vendorPage.click('button:has-text("Start Processing")');
  await expect(vendorPage.locator('text=Processing')).toBeVisible();

  // 9. Mark as completed
  await vendorPage.click('button:has-text("Mark Completed")');
  await expect(vendorPage.locator('text=Completed')).toBeVisible();

  // 10. Tenant receives notification (verify in tenant page)
  await page.reload();
  await expect(page.locator('text=Order Completed')).toBeVisible();
});
```

#### 3.4 Referral Flow
```javascript
test('Referral system flow', async ({ page, context }) => {
  // 1. Login as merchant
  await page.goto('/login');
  await page.fill('[name="email"]', 'merchant-e2e@test.com');
  await page.fill('[name="password"]', 'MerchantPass123!');
  await page.click('button[type="submit"]');

  // 2. Go to referral dashboard
  await page.goto('/referral');
  await expect(page.locator('[data-testid="referral-code"]')).toBeVisible();

  // 3. Copy referral link
  const referralLink = await page.locator('[data-testid="referral-link"]').textContent();
  await page.click('button:has-text("Copy Link")');

  // 4. Open referral link in new tab (simulate referred user)
  const referredPage = await context.newPage();
  await referredPage.goto(referralLink);

  // 5. Register new merchant
  await referredPage.fill('[name="email"]', 'referred-merchant@test.com');
  await referredPage.fill('[name="password"]', 'SecurePass123!');
  await referredPage.fill('[name="business_name"]', 'Referred Kosan');
  await referredPage.click('button[type="submit"]');

  // 6. Verify referral tracked
  await referredPage.waitForURL('/dashboard');

  // 7. Back to referrer - check dashboard
  await page.reload();
  await expect(page.locator('text=1 referral')).toBeVisible();
  await expect(page.locator('text=Referred Merchant')).toBeVisible();
});
```

---

## 4. Performance Testing

### Load Testing (Apache JMeter / k6)

**Test Scenarios:**

#### 4.1 API Load Test
```javascript
// k6 script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Sustain 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Sustain 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // <1% failure rate
  },
};

export default function () {
  // Test merchant login
  const loginRes = http.post('https://api.sihuni.com/v1/auth/login', {
    email: 'merchant@test.com',
    password: 'pass',
  });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('data.access_token') !== '',
  });

  const token = loginRes.json('data.access_token');

  // Test get properties
  const propsRes = http.get('https://api.sihuni.com/v1/properties', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(propsRes, {
    'properties status 200': (r) => r.status === 200,
    'properties response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

#### 4.2 Database Performance Test
```sql
-- Test slow queries
EXPLAIN ANALYZE 
SELECT p.*, COUNT(u.id) as total_units, COUNT(tc.id) as occupied_units
FROM properties p
LEFT JOIN units u ON u.property_id = p.id
LEFT JOIN tenant_contracts tc ON tc.unit_id = u.id AND tc.status = 'active'
WHERE p.merchant_id = 'merchant-123'
GROUP BY p.id;

-- Expected: < 100ms for 1000 properties
```

#### 4.3 Concurrent Payment Test
```javascript
// Simulate 100 concurrent payments
test('should handle 100 concurrent payments', async () => {
  const promises = Array.from({ length: 100 }, (_, i) => 
    createPayment({
      invoice_id: `invoice-${i}`,
      amount: 1500000,
      payment_method: 'va'
    })
  );

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.status === 'success').length;

  expect(successCount).toBeGreaterThan(95); // >95% success rate
});
```

---

## 5. Security Testing

### Penetration Testing Checklist

**Tools:** OWASP ZAP, Burp Suite

#### 5.1 Authentication & Authorization
- [ ] Test JWT token expiry (access: 1h, refresh: 30d)
- [ ] Test JWT signature validation (tampered token should fail)
- [ ] Test RBAC enforcement (tenant cannot access merchant endpoints)
- [ ] Test session hijacking (logout should invalidate tokens)
- [ ] Test brute force protection (rate limiting login attempts)
- [ ] Test password strength enforcement (min 8 chars, uppercase, number, special)

#### 5.2 SQL Injection
- [ ] Test all endpoints with SQL injection payloads (`' OR '1'='1`)
- [ ] Verify parameterized queries (no raw SQL concatenation)
- [ ] Test stored procedures for SQL injection

#### 5.3 XSS (Cross-Site Scripting)
- [ ] Test all input fields with XSS payloads (`<script>alert('XSS')</script>`)
- [ ] Verify HTML sanitization (DOMPurify or similar)
- [ ] Test URL parameters for XSS
- [ ] Test forum posts/comments for XSS

#### 5.4 CSRF (Cross-Site Request Forgery)
- [ ] Verify CSRF tokens on all POST/PUT/DELETE requests
- [ ] Test CSRF token validation (expired/invalid should fail)

#### 5.5 API Security
- [ ] Test rate limiting (429 after quota exceeded)
- [ ] Test API key rotation (old keys should expire)
- [ ] Test unauthorized access (401 without token)
- [ ] Test forbidden access (403 for insufficient permissions)

#### 5.6 Payment Security
- [ ] Verify Xendit webhook signature validation
- [ ] Test payment idempotency (duplicate requests should not double-charge)
- [ ] Test escrow balance manipulation (cannot manually edit balance)
- [ ] Verify PCI-DSS compliance (no card data stored)

#### 5.7 File Upload Security
- [ ] Test file type validation (only allow jpg, png, pdf)
- [ ] Test file size limits (max 5MB)
- [ ] Test malicious file upload (executable, script)
- [ ] Verify S3 presigned URL expiry (expires in 1 hour)

---

## 6. Regression Testing

**Frequency:** Before every release

**Automation:** 80% automated (CI/CD pipeline)

### Regression Test Suite

#### 6.1 Core Flows (Must Pass)
- [ ] User registration & login (all roles)
- [ ] Property & unit CRUD (merchant)
- [ ] Tenant invitation & registration
- [ ] Invoice generation & payment (Xendit)
- [ ] Escrow credit & disbursement
- [ ] Vendor order creation & completion
- [ ] Referral tracking & reward issuance
- [ ] Forum post & comment
- [ ] Chatbot intent classification

#### 6.2 Edge Cases
- [ ] Trial expiry (auto downgrade to Free)
- [ ] Subscription renewal failure (retry logic)
- [ ] Payment webhook failure (retry webhook)
- [ ] Disbursement failure (notify merchant)
- [ ] Gemini API timeout (fallback to FAQ)
- [ ] Elasticsearch down (fallback to DB query)
- [ ] Redis cache miss (query DB)

---

## 7. Test Data Management

### Test Data Strategy

**Seed Data (Development):**
```sql
-- Merchants (3)
INSERT INTO merchants (id, user_id, business_name, verification_status) VALUES
('merchant-1', 'user-1', 'Kosan Sejahtera', 'verified'),
('merchant-2', 'user-2', 'Ruko Makmur', 'pending'),
('merchant-3', 'user-3', 'Apartemen Sentosa', 'non-verified');

-- Properties (10)
INSERT INTO properties (id, merchant_id, type, name, city) VALUES
('property-1', 'merchant-1', 'kosan', 'Kosan Sejahtera A', 'Jakarta'),
('property-2', 'merchant-1', 'kosan', 'Kosan Sejahtera B', 'Jakarta');

-- Units (50)
INSERT INTO units (id, property_id, unit_number, price_monthly, status) VALUES
('unit-1', 'property-1', 'A101', 1500000, 'occupied'),
('unit-2', 'property-1', 'A102', 1500000, 'available');

-- Tenants (20)
INSERT INTO tenants (id, user_id, ktp_number, verification_status) VALUES
('tenant-1', 'user-10', '3201234567890001', 'verified');

-- Contracts (15)
INSERT INTO tenant_contracts (id, tenant_id, unit_id, start_date, end_date, monthly_rent, status) VALUES
('contract-1', 'tenant-1', 'unit-1', '2025-01-01', '2025-12-31', 1500000, 'active');
```

**Test Data Cleanup:**
```javascript
// After each test
afterEach(async () => {
  await db.query('DELETE FROM payments WHERE created_at > $1', [testStartTime]);
  await db.query('DELETE FROM invoices WHERE created_at > $1', [testStartTime]);
});
```

---

## 8. Test Metrics & Reporting

### Key Metrics

**Code Coverage Target:**
- Backend: 80% line coverage
- Frontend: 70% line coverage
- Critical paths: 100% coverage (payment, escrow, authentication)

**Test Execution:**
- Unit tests: < 5 minutes
- Integration tests: < 15 minutes
- E2E tests: < 30 minutes
- Full regression: < 1 hour

**Success Criteria:**
- 100% critical tests pass
- 0 P0 bugs (showstopper)
- <5 P1 bugs (high-priority)
- API response time p95 < 500ms
- Payment success rate > 95%

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Test & Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Run security scan
        run: npm audit --production
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: npm run deploy:staging
```

---

## 9. Bug Tracking & Prioritization

### Bug Severity Levels

| Priority | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 (Critical)** | System down, data loss, security breach | Immediate (< 1 hour) | Payment not processing, escrow balance incorrect, API down |
| **P1 (High)** | Major feature broken, workaround exists | < 4 hours | Disbursement failed, invoice not generated, vendor order not visible |
| **P2 (Medium)** | Minor feature broken, affects some users | < 24 hours | Notification not sent, search not working, UI misalignment |
| **P3 (Low)** | Cosmetic issue, no impact on functionality | < 1 week | Typo, color inconsistency, tooltip missing |

---

## 10. Test Environment Strategy

### Environments

| Environment | Purpose | Data | Xendit | Gemini | Uptime Target |
|-------------|---------|------|--------|--------|---------------|
| **Local** | Development | Seed data | Sandbox | Test API | N/A |
| **Staging** | Pre-production testing | Anonymized prod data | Sandbox | Test API | 95% |
| **Production** | Live users | Real data | Production | Production API | 99.5% |

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Next Review:** After Sprint 6 (Payment testing)