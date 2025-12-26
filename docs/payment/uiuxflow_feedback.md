# UI/UX Flow Feedback: Payment Module

## 📋 Overview

Modul payment menangani seluruh flow pembayaran termasuk invoice payment, subscription billing, auto-pay setup, dan disbursement processing melalui integrasi Xendit.

---

## 🗺️ User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT USER JOURNEY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Invoice/Subscription] ──► [Payment Modal] ──► [Xendit Gateway]            │
│                                    │                    │                    │
│                                    │                    ▼                    │
│                                    │            [Complete Payment]           │
│                                    │                    │                    │
│                                    │         ┌─────────┴─────────┐          │
│                                    │         ▼                   ▼          │
│                                    │   [/payment/success]  [/payment/failed]│
│                                    │         │                   │          │
│                                    │         ▼                   ▼          │
│                                    │   [Update Escrow]    [Retry Option]    │
│                                    │                                        │
│                                    ▼                                        │
│                            [Auto-pay Setup]                                 │
│                                    │                                        │
│                                    ▼                                        │
│                            [Save Payment Method]                            │
│                                    │                                        │
│                                    ▼                                        │
│                            [Recurring Billing]                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Payment Method Options

### Available Payment Methods (via Xendit)
| Method | Type | Status | Notes |
|--------|------|--------|-------|
| Virtual Account | Bank Transfer | ✅ Active | BCA, Mandiri, BNI, BRI, etc |
| QRIS | QR Payment | ✅ Active | Universal QR |
| E-Wallet | Digital Wallet | ✅ Active | OVO, DANA, ShopeePay, GoPay |
| Credit Card | Card | ✅ Active | Visa, Mastercard |
| Retail Outlet | Cash | ✅ Active | Alfamart, Indomaret |

### Payment Method Selection UX
| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Method icons small | Hard to identify | Increase icon size |
| No saved method indicator | User re-selects each time | Remember last used |
| Processing fees not shown upfront | Surprise at checkout | Show fee breakdown before confirmation |

---

## 🎯 Critical User Flows

### 1. Invoice Payment Flow
```mermaid
graph TD
    A[View Invoice] --> B[Click Pay Button]
    B --> C[Open Payment Modal]
    C --> D[View Amount Breakdown]
    D --> E[Select Payment Method]
    E --> F{Method Type}
    F -->|VA| G[Generate VA Number]
    F -->|QRIS| H[Show QR Code]
    F -->|E-Wallet| I[Redirect to App]
    F -->|Card| J[Enter Card Details]
    F -->|Retail| K[Generate Payment Code]
    G --> L[User Transfers]
    H --> L
    I --> L
    J --> L
    K --> L
    L --> M{Payment Received?}
    M -->|Yes| N["/payment/success"]
    M -->|No/Timeout| O["/payment/failed"]
    N --> P[Update Invoice Status]
    N --> Q[Credit Escrow]
    O --> R[Show Retry Option]
```

### 2. Subscription Payment Flow
```mermaid
graph TD
    A[Select Subscription Tier] --> B[View Tier Details]
    B --> C[Click Subscribe]
    C --> D[Payment Modal]
    D --> E[Select Payment Method]
    E --> F[Complete Payment]
    F --> G{Success?}
    G -->|Yes| H[Activate Subscription]
    G -->|No| I[Show Error]
    H --> J[Set Next Billing Date]
    J --> K[Dashboard with Active Plan]
    I --> L[Retry or Cancel]
```

### 3. Auto-pay Setup Flow
```mermaid
graph TD
    A["/tenant/settings"] --> B[Auto-pay Section]
    B --> C[Enable Auto-pay Toggle]
    C --> D[Select Payment Method]
    D --> E{Method Supports Recurring?}
    E -->|Yes| F[Authorize Recurring]
    E -->|No| G[Show Alternative Methods]
    F --> H[Save Authorization]
    H --> I[Confirmation Message]
    I --> J[Auto-pay Active]
    G --> D
```

### 4. Disbursement Flow (Merchant/Vendor)
```mermaid
graph TD
    A[Escrow Balance] --> B{Min Amount Met?}
    B -->|Yes| C[Request Disbursement]
    B -->|No| D[Show Minimum Warning]
    C --> E[Select Bank Account]
    E --> F[Confirm Details]
    F --> G[Submit Request]
    G --> H{Requires Review?}
    H -->|Yes| I[Admin Review Queue]
    H -->|No| J[Auto-process]
    I --> K{Approved?}
    K -->|Yes| J
    K -->|No| L[Notify Merchant]
    J --> M[Xendit Disbursement]
    M --> N{Success?}
    N -->|Yes| O[Update Balance]
    N -->|No| P[Retry/Investigate]
    O --> Q[Notify Recipient]
```

---

## ⚠️ Issues & Recommendations

### High Severity

| ID | Issue | Current State | Impact | Recommendation |
|----|-------|---------------|--------|----------------|
| PAY-H01 | No payment confirmation dialog | Direct submit | Accidental payments | Add confirmation with amount review |
| PAY-H02 | Failed payment no quick retry | Must restart flow | User dropout | Add inline retry button |
| PAY-H03 | Auto-pay setup confusing | Too many steps | Low adoption | Simplify to 2-step wizard |

### Medium Severity

| ID | Issue | Current State | Impact | Recommendation |
|----|-------|---------------|--------|----------------|
| PAY-M01 | Payment method not remembered | Re-select each time | Friction | Save last used method |
| PAY-M02 | VA expiry unclear | Small text | Missed payments | Show prominent countdown |
| PAY-M03 | Subscription downgrade impact unclear | Generic warning | Confusion | Show specific feature loss |

### Low Severity

| ID | Issue | Current State | Impact | Recommendation |
|----|-------|---------------|--------|----------------|
| PAY-L01 | No payment history export | View only | Minor inconvenience | Add CSV/PDF export |

---

## 📱 Mobile Payment UX

### Current State
| Aspect | Score | Notes |
|--------|-------|-------|
| Modal Responsiveness | 8/10 | Good on mobile |
| QR Display | 7/10 | Could be larger |
| E-Wallet Deep Link | 9/10 | Works well |
| Form Input | 7/10 | Keyboard types correct |

### Mobile-Specific Issues
| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Payment modal scroll | Some content cut off | Ensure full visibility |
| QRIS QR too small | Hard to scan | Make full-width on mobile |
| Card form autocomplete | Not working consistently | Add autocomplete attributes |

### Recommendations
- [ ] Optimize QR code size for mobile
- [ ] Add biometric payment confirmation
- [ ] Implement Apple Pay / Google Pay
- [ ] Add payment status push notifications

---

## ♿ Accessibility Assessment

| Criteria | Status | Notes |
|----------|--------|-------|
| ARIA Labels | ⚠️ Partial | Payment buttons need labels |
| Keyboard Navigation | ✅ Good | Modal focusable |
| Color Contrast | ✅ Good | Success/error colors clear |
| Screen Reader | ⚠️ Partial | Status updates not announced |
| Form Labels | ✅ Good | All inputs labeled |

### Recommendations
- [ ] Add aria-live for payment status updates
- [ ] Announce amount before confirmation
- [ ] Add keyboard shortcut for quick pay
- [ ] Improve error message clarity

---

## ⚡ Performance UX

### Loading States
| Action | Current State | Recommendation |
|--------|---------------|----------------|
| Opening Modal | Spinner | Skeleton with amount |
| Generating VA | Spinner | Progress with message |
| Processing Payment | Spinner | Steps indicator |
| Webhook Confirmation | Polling | WebSocket for instant |

### Payment Status Polling
| Current | Issue | Recommendation |
|---------|-------|----------------|
| 5-second interval | Slow feedback | Use Supabase Realtime |
| Max 5 minutes | May timeout | Add "check manually" option |

### Error Handling
| Error Type | Current | Recommendation |
|------------|---------|----------------|
| Network Error | Toast | Inline with retry |
| Payment Failed | Redirect | Stay in modal with options |
| Timeout | Generic message | Specific guidance |

---

## 📊 Flow Diagram

```mermaid
flowchart TD
    subgraph Entry["Payment Entry Points"]
        Invoice["Invoice Payment"]
        Subscription["Subscription Payment"]
        Order["Order Payment"]
    end

    subgraph Modal["Payment Modal"]
        AmountReview["Amount Breakdown"]
        MethodSelect["Method Selection"]
        Confirmation["Confirm Payment"]
    end

    subgraph Gateway["Xendit Gateway"]
        VA["Virtual Account"]
        QRIS["QRIS QR Code"]
        EWallet["E-Wallet Redirect"]
        Card["Card Payment"]
        Retail["Retail Outlet"]
    end

    subgraph Result["Payment Result"]
        Success["/payment/success"]
        Failed["/payment/failed"]
    end

    subgraph PostPayment["Post-Payment"]
        UpdateInvoice["Update Invoice"]
        CreditEscrow["Credit Escrow"]
        SendReceipt["Send Receipt"]
        ActivateSub["Activate Subscription"]
    end

    Invoice --> Modal
    Subscription --> Modal
    Order --> Modal

    AmountReview --> MethodSelect
    MethodSelect --> Confirmation
    Confirmation --> Gateway

    VA --> Result
    QRIS --> Result
    EWallet --> Result
    Card --> Result
    Retail --> Result

    Success --> UpdateInvoice
    Success --> CreditEscrow
    Success --> SendReceipt
    Success --> ActivateSub

    Failed --> Modal

    style Entry fill:#e3f2fd
    style Modal fill:#fff3e0
    style Gateway fill:#e8f5e9
    style Result fill:#fce4ec
    style PostPayment fill:#f3e5f5
```

---

## 🔔 Payment Notifications

| Event | In-App | Push | Email | WhatsApp | SMS |
|-------|--------|------|-------|----------|-----|
| Payment Received | ✅ | ❌ | ✅ | ❌ | ❌ |
| Payment Failed | ✅ | ❌ | ✅ | ❌ | ❌ |
| VA Generated | ✅ | ❌ | ✅ | ❌ | ❌ |
| VA Expiring | ✅ | ❌ | ✅ | ❌ | ❌ |
| Auto-pay Executed | ✅ | ❌ | ✅ | ❌ | ❌ |
| Auto-pay Failed | ✅ | ❌ | ✅ | ❌ | ❌ |
| Disbursement Complete | ✅ | ❌ | ✅ | ❌ | ❌ |

### Recommendations
- [ ] Add push notifications for payment status
- [ ] Enable WhatsApp for payment reminders
- [ ] Add SMS fallback for critical alerts

---

## 💰 Fee Transparency

### Current Fee Display
| Stage | Shown | Recommendation |
|-------|-------|----------------|
| Invoice View | Base amount only | Show with platform fee |
| Method Selection | No fee comparison | Show fee per method |
| Confirmation | Total with fees | ✅ Good |
| Receipt | Full breakdown | ✅ Good |

### Recommended Fee Breakdown Component
```
┌─────────────────────────────────┐
│ Payment Breakdown               │
├─────────────────────────────────┤
│ Rent Amount        Rp 5,000,000 │
│ Late Fee           Rp   100,000 │
├─────────────────────────────────┤
│ Subtotal           Rp 5,100,000 │
│ Platform Fee (2%)  Rp   102,000 │
│ Payment Fee        Rp    10,000 │
├─────────────────────────────────┤
│ Total              Rp 5,212,000 │
└─────────────────────────────────┘
```

---

## 🔄 Recurring Payment Management

### Auto-pay States
```mermaid
stateDiagram-v2
    [*] --> Inactive
    Inactive --> Setup: Enable Auto-pay
    Setup --> Active: Authorize Method
    Active --> Processing: Billing Date
    Processing --> Active: Success
    Processing --> Failed: Payment Failed
    Failed --> Active: Retry Success
    Failed --> Suspended: Max Retries
    Suspended --> Active: Manual Payment
    Active --> Inactive: Disable
```

### Issues with Current Flow
| Issue | Impact | Recommendation |
|-------|--------|----------------|
| No method preview before auth | Uncertainty | Show method details first |
| Failed auto-pay notification delayed | Missed window | Immediate alert |
| No easy method update | Friction | Quick change link in notification |

---

## ✅ Summary Checklist

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Issues Found | 0 | 3 | 3 | 1 | 7 |
| Fixed | 0 | 0 | 0 | 0 | 0 |
| In Progress | 0 | 0 | 0 | 0 | 0 |
| Pending | 0 | 3 | 3 | 1 | 7 |

---

## 📝 Action Items

1. [ ] **PAY-H01**: Add payment confirmation dialog
2. [ ] **PAY-H02**: Implement inline retry for failed payments
3. [ ] **PAY-H03**: Simplify auto-pay setup wizard
4. [ ] **PAY-M01**: Remember last used payment method
5. [ ] **PAY-M02**: Add prominent VA expiry countdown
6. [ ] **PAY-M03**: Show specific impact of subscription downgrade
7. [ ] **PAY-L01**: Add payment history export

---

*Last Updated: 2025-01-26*
*Reviewed By: System*
