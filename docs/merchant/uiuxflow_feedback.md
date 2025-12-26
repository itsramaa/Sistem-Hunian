# UI/UX Flow Feedback: Merchant Module

## 📋 Overview

Modul merchant menangani pengelolaan properti, unit, tenant, kontrak, pembayaran, dan disbursement untuk pemilik/pengelola properti.

---

## 🗺️ User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MERCHANT USER JOURNEY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Dashboard] ◄──────────────────────────────────────────────────────────┐   │
│      │                                                                   │   │
│      ├──► [Properties] ──► [Add Property] ──► [Manage Units]            │   │
│      │         │                                                         │   │
│      │         └──► [Units] ──► [Add Unit] ──► [Assign Tenant]          │   │
│      │                                                                   │   │
│      ├──► [Tenants] ──► [Invite Tenant] ──► [Create Contract]           │   │
│      │                                                                   │   │
│      ├──► [Contracts] ──► [New Contract] ──► [E-Signature] ──────────┘   │
│      │                                                                   │   │
│      ├──► [Invoices] ──► [Generate Invoice] ──► [Track Payment]         │   │
│      │                                                                   │   │
│      ├──► [Payments] ──► [View History] ──► [Reconciliation]            │   │
│      │                                                                   │   │
│      ├──► [Escrow] ──► [View Balance] ──► [Request Disbursement]        │   │
│      │                                                                   │   │
│      ├──► [Maintenance] ──► [Assign Vendor] ──► [Track Progress]        │   │
│      │                                                                   │   │
│      ├──► [Move-outs] ──► [Schedule Inspection] ──► [Process Refund]    │   │
│      │                                                                   │   │
│      ├──► [Reports] ──► [Generate Report] ──► [Export Data]             │   │
│      │                                                                   │   │
│      ├──► [Billing] ──► [Subscription] ──► [Payment History]            │   │
│      │                                                                   │   │
│      └──► [Settings] ──► [Profile] ──► [Bank Accounts] ──► [Notifications]│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Navigation Flow Analysis

### Sidebar Navigation Structure
```
├── Dashboard
├── Property Management
│   ├── Properties
│   └── Units
├── Tenant Management
│   ├── Tenants
│   ├── Contracts
│   └── Move-outs
├── Financial
│   ├── Invoices
│   ├── Payments
│   └── Escrow
├── Operations
│   ├── Maintenance
│   └── Reports
├── Account
│   ├── Billing
│   ├── Referrals
│   └── Settings
```

### Navigation Issues
| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Deep nesting untuk property → units → tenant | Many clicks | Add breadcrumb navigation |
| No quick actions dari dashboard | Slower workflow | Add floating action menu |
| Escrow buried in sidebar | Important feature hidden | Promote to dashboard widget |

---

## 🎯 Critical User Flows

### 1. Property Setup Flow
```mermaid
graph TD
    A["/merchant/properties"] --> B[Add Property]
    B --> C[Basic Info Form]
    C --> D[Address & Location]
    D --> E[Amenities Selection]
    E --> F[Upload Photos]
    F --> G[Save Property]
    G --> H[Add Units]
    H --> I[Unit Details Form]
    I --> J[Set Pricing]
    J --> K[Publish Unit]
```

### 2. Tenant Onboarding Flow
```mermaid
graph TD
    A["/merchant/tenants"] --> B[Invite Tenant]
    B --> C[Enter Email/Phone]
    C --> D[Select Unit]
    D --> E[Set Contract Terms]
    E --> F[Send Invitation]
    F --> G{Tenant Accepts?}
    G -->|Yes| H[Create Draft Contract]
    G -->|No| I[Resend or Cancel]
    H --> J[Review Contract]
    J --> K[Sign Contract]
    K --> L[Generate First Invoice]
```

### 3. Invoice & Payment Flow
```mermaid
graph TD
    A["/merchant/invoices"] --> B{Generate Method}
    B -->|Manual| C[Create Invoice Form]
    B -->|Auto| D[Auto-generate Settings]
    C --> E[Add Line Items]
    E --> F[Set Due Date]
    F --> G[Send to Tenant]
    D --> G
    G --> H[Track Payment Status]
    H --> I{Paid?}
    I -->|Yes| J[Add to Escrow]
    I -->|No| K[Send Reminder]
    I -->|Overdue| L[Apply Late Fee]
```

### 4. Disbursement Flow
```mermaid
graph TD
    A["/merchant/escrow"] --> B[View Balance]
    B --> C[Check Available Amount]
    C --> D{Min Amount Met?}
    D -->|Yes| E[Request Disbursement]
    D -->|No| F[Show Warning]
    E --> G[Select Bank Account]
    G --> H[Confirm Details]
    H --> I[Submit Request]
    I --> J[Processing via Xendit]
    J --> K[Disbursement Complete]
```

---

## ⚠️ Issues & Recommendations

### High Severity

| ID | Issue | Current State | Impact | Recommendation |
|----|-------|---------------|--------|----------------|
| MER-H01 | Property setup wizard tidak jelas | Multi-step tanpa progress | User dropout | Add visual step indicator dengan save progress |
| MER-H02 | Bulk invoice generation missing | One-by-one manual | Time consuming | Add bulk generation dengan filter |
| MER-H03 | No undo untuk delete actions | Permanent delete | Data loss | Implement soft delete + undo toast |

### Medium Severity

| ID | Issue | Current State | Impact | Recommendation |
|----|-------|---------------|--------|----------------|
| MER-M01 | Tenant invitation link expiry tidak shown | Hidden info | Confusion | Display expiry date on link |
| MER-M02 | Escrow disbursement schedule unclear | Text only | Hard to plan | Add visual calendar view |
| MER-M03 | Report export loading terlalu lama | No background job | UI freeze | Implement async export with notification |
| MER-M04 | Contract template tidak bisa saved | Create from scratch | Repetitive work | Add template save & reuse |

### Low Severity

| ID | Issue | Current State | Impact | Recommendation |
|----|-------|---------------|--------|----------------|
| MER-L01 | Unit photo reorder tidak drag-drop | Delete & re-upload | Minor friction | Add drag-drop reorder |
| MER-L02 | Dashboard chart tidak interactive | Static display | Less insight | Add drill-down capability |

---

## 📱 Mobile UX Assessment

### Desktop-First Design Issues
| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Complex tables | Horizontal scroll | Convert to card layout on mobile |
| Multi-column forms | Cramped layout | Stack columns on mobile |
| Sidebar navigation | Takes screen space | Implement hamburger menu |

### Mobile Navigation
| Aspect | Score | Notes |
|--------|-------|-------|
| Responsive Layout | 6/10 | Desktop-optimized |
| Touch Targets | 7/10 | Adequate but could improve |
| Data Tables | 4/10 | Need mobile redesign |
| Forms | 6/10 | Long forms on mobile |

### Recommendations
- [ ] Redesign tables as cards for mobile
- [ ] Add mobile-specific quick actions
- [ ] Implement collapsible form sections
- [ ] Add swipe gestures for common actions

---

## ♿ Accessibility Assessment

| Criteria | Status | Notes |
|----------|--------|-------|
| ARIA Labels | ⚠️ Partial | Charts missing descriptions |
| Keyboard Navigation | ✅ Good | Forms navigable |
| Color Contrast | ✅ Good | Meets standards |
| Screen Reader | ⚠️ Partial | Tables need headers |
| Focus Management | ⚠️ Partial | Modal focus trap incomplete |

### Recommendations
- [ ] Add ARIA descriptions to charts
- [ ] Implement proper table headers
- [ ] Complete focus trap for modals
- [ ] Add skip navigation links

---

## ⚡ Performance UX

### Loading States
| Page | Current State | Recommendation |
|------|---------------|----------------|
| Dashboard | Skeleton + Charts | ✅ Good |
| Properties List | Spinner | Add skeleton cards |
| Tenant List | Spinner | Add skeleton table |
| Reports | Spinner | Add skeleton + cancel option |

### Data Pagination
| Table | Current | Recommendation |
|-------|---------|----------------|
| Tenants | Client pagination | Implement server pagination |
| Invoices | Client pagination | Implement server pagination |
| Payments | Client pagination | Implement infinite scroll option |

### Caching Strategy
| Data | Cached | Recommendation |
|------|--------|----------------|
| Properties | ❌ | Cache with invalidation |
| Dashboard Stats | ❌ | Cache for 5 minutes |
| User Profile | ✅ | Good |

---

## 📊 Flow Diagram

```mermaid
flowchart TD
    subgraph Dashboard["Dashboard"]
        Home["/merchant/dashboard"]
        Stats["Key Metrics"]
        Actions["Quick Actions"]
    end

    subgraph PropertyMgmt["Property Management"]
        Properties["/merchant/properties"]
        Units["/merchant/units"]
        AddProperty["Add Property"]
        AddUnit["Add Unit"]
    end

    subgraph TenantMgmt["Tenant Management"]
        Tenants["/merchant/tenants"]
        Contracts["/merchant/contracts"]
        MoveOuts["/merchant/move-outs"]
        InviteTenant["Invite Tenant"]
        CreateContract["Create Contract"]
    end

    subgraph Financial["Financial"]
        Invoices["/merchant/invoices"]
        Payments["/merchant/payments"]
        Escrow["/merchant/escrow"]
        GenerateInvoice["Generate Invoice"]
        RequestDisbursement["Request Disbursement"]
    end

    subgraph Operations["Operations"]
        Maintenance["/merchant/maintenance"]
        Reports["/merchant/reports"]
        AssignVendor["Assign Vendor"]
    end

    subgraph Account["Account"]
        Billing["/merchant/billing"]
        Referrals["/merchant/referrals"]
        Settings["/merchant/settings"]
        Profile["/merchant/profile"]
    end

    Home --> Stats
    Home --> Actions
    Actions --> AddProperty
    Actions --> InviteTenant
    Actions --> GenerateInvoice

    Properties --> AddProperty
    AddProperty --> AddUnit
    AddUnit --> Units

    Tenants --> InviteTenant
    InviteTenant --> CreateContract
    CreateContract --> Contracts
    Contracts --> MoveOuts

    Invoices --> GenerateInvoice
    Invoices --> Payments
    Payments --> Escrow
    Escrow --> RequestDisbursement

    Maintenance --> AssignVendor
    Reports --> Financial

    Billing --> Settings
    Settings --> Profile

    style Dashboard fill:#e3f2fd
    style PropertyMgmt fill:#fff3e0
    style TenantMgmt fill:#e8f5e9
    style Financial fill:#fce4ec
    style Operations fill:#f3e5f5
    style Account fill:#e0f2f1
```

---

## 🔔 Notification Touchpoints

| Event | In-App | Push | Email | WhatsApp |
|-------|--------|------|-------|----------|
| New Tenant Registration | ✅ | ❌ | ✅ | ❌ |
| Contract Signed | ✅ | ❌ | ✅ | ❌ |
| Payment Received | ✅ | ❌ | ✅ | ❌ |
| Payment Overdue | ✅ | ❌ | ✅ | ❌ |
| Disbursement Complete | ✅ | ❌ | ✅ | ❌ |
| Maintenance Request | ✅ | ❌ | ✅ | ❌ |
| Move-out Notice | ✅ | ❌ | ✅ | ❌ |
| Subscription Expiring | ✅ | ❌ | ✅ | ❌ |

---

## 📈 Subscription Tier Integration

### Feature Visibility by Tier
| Feature | Starter | Basic | Pro | Enterprise |
|---------|---------|-------|-----|------------|
| Properties | 1 | 5 | 20 | Unlimited |
| Units | 5 | 25 | 100 | Unlimited |
| AI Chatbot | ❌ | ✅ | ✅ | ✅ |
| Reports | Basic | Standard | Advanced | Custom |
| API Access | ❌ | ❌ | ✅ | ✅ |

### Upgrade Prompts
| Trigger | Current | Recommendation |
|---------|---------|----------------|
| Limit Reached | Modal popup | Inline warning + upgrade CTA |
| Feature Locked | Hidden | Show with "Pro" badge |
| Trial Ending | Toast | Banner + countdown |

---

## ✅ Summary Checklist

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Issues Found | 0 | 3 | 4 | 2 | 9 |
| Fixed | 0 | 0 | 0 | 0 | 0 |
| In Progress | 0 | 0 | 0 | 0 | 0 |
| Pending | 0 | 3 | 4 | 2 | 9 |

---

## 📝 Action Items

1. [ ] **MER-H01**: Add property setup wizard with progress
2. [ ] **MER-H02**: Implement bulk invoice generation
3. [ ] **MER-H03**: Add soft delete with undo
4. [ ] **MER-M01**: Display invitation link expiry
5. [ ] **MER-M02**: Add disbursement calendar view
6. [ ] **MER-M03**: Implement async report export
7. [ ] **MER-M04**: Add contract template save
8. [ ] **MER-L01**: Implement drag-drop photo reorder
9. [ ] **MER-L02**: Add interactive dashboard charts

---

*Last Updated: 2025-01-26*
*Reviewed By: System*
