# Development Task Breakdown - SiHuni.com
## 6-Month MVP Timeline (24 Weeks)

---

## Sprint Structure
- **Sprint Duration:** 2 weeks
- **Total Sprints:** 12
- **Team Size:** 6 people
  - 1 Tech Lead / Architect
  - 2 Full-stack Engineers
  - 1 Frontend Engineer
  - 1 Backend Engineer
  - 1 QA Engineer

---

## Phase 1: Foundation (Sprint 1-3, Week 1-6)

### Sprint 1 (Week 1-2): Project Setup & Infrastructure

**Backend Tasks (40 hours)**
- [ ] Setup repository structure (monorepo/microservices decision)
- [ ] Setup PostgreSQL 15 (primary + read replica)
- [ ] Setup Redis cluster (cache + session + rate limiting)
- [ ] Setup RabbitMQ/BullMQ (job queue)
- [ ] Configure AWS S3 / GCP Cloud Storage (file uploads)
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure staging environment (Docker + Kubernetes OR AWS ECS)
- [ ] Setup monitoring (DataDog/New Relic + Sentry)
- [ ] Configure ELK Stack (logging)
- [ ] Setup Xendit sandbox account + webhook endpoints
- [ ] Setup Google Gemini API account

**Frontend Tasks (40 hours)**
- [ ] Setup Next.js 14 project (App Router)
- [ ] Configure Tailwind CSS + Shadcn UI
- [ ] Setup state management (Zustand / React Query)
- [ ] Setup PWA configuration (service worker, manifest)
- [ ] Configure CDN (CloudFront/GCP CDN)
- [ ] Setup E2E testing (Playwright)
- [ ] Create design system components (buttons, inputs, cards)
- [ ] Setup authentication flow (JWT handling)

**Database Tasks (20 hours)**
- [ ] Design ERD (all 30+ tables)
- [ ] Create migration scripts (all core tables)
- [ ] Setup database backup automation
- [ ] Configure read replica replication
- [ ] Create seed data for development

**DevOps Tasks (20 hours)**
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configure load balancer
- [ ] Setup secrets management (AWS Secrets Manager)
- [ ] Configure DDoS protection (CloudFlare)
- [ ] Setup health check endpoints

**Deliverables:**
- ✅ Working dev/staging environments
- ✅ CI/CD pipeline functional
- ✅ Database schema v1 deployed
- ✅ Design system ready

---

### Sprint 2 (Week 3-4): Authentication & User Management

**Backend Tasks (50 hours)**
- [ ] Implement user registration API (role: merchant/tenant/vendor)
- [ ] Implement login API (JWT access + refresh tokens)
- [ ] Implement logout API (invalidate refresh token)
- [ ] Implement password reset flow (email + token)
- [ ] Implement role-based access control (RBAC)
- [ ] Implement session management (Redis)
- [ ] Setup email service (SendGrid/AWS SES)
- [ ] Setup WhatsApp Business API (Twilio/Vonage)
- [ ] Implement rate limiting (Redis-based)
- [ ] Write unit tests (80% coverage target)

**Frontend Tasks (50 hours)**
- [ ] Create login page (email + password)
- [ ] Create registration page (role selection)
- [ ] Create password reset flow (email verification)
- [ ] Implement JWT token handling (interceptors)
- [ ] Create protected route wrapper
- [ ] Create profile page (edit user info)
- [ ] Create 404 & error pages
- [ ] Implement form validation (Zod)
- [ ] Add loading states & error handling

**Testing Tasks (20 hours)**
- [ ] Write API integration tests
- [ ] Write E2E tests (login, registration, password reset)
- [ ] Test rate limiting behavior
- [ ] Test session expiry scenarios

**Deliverables:**
- ✅ Users can register (merchant/vendor)
- ✅ Users can login/logout
- ✅ Password reset working
- ✅ RBAC enforced

---

### Sprint 3 (Week 5-6): Admin Dashboard & Verification System

**Backend Tasks (50 hours)**
- [ ] Implement admin CRUD merchants API
- [ ] Implement admin CRUD vendors API
- [ ] Implement merchant verification approval/rejection API
- [ ] Implement vendor verification approval/rejection API
- [ ] Implement file upload API (presigned URLs)
- [ ] Implement notification API (email + WhatsApp)
- [ ] Create admin analytics API (basic metrics)
- [ ] Implement audit logging (all admin actions)

**Frontend Tasks (50 hours)**
- [ ] Create admin dashboard layout (sidebar navigation)
- [ ] Create merchant list page (table + filters)
- [ ] Create merchant detail page (info + verification status)
- [ ] Create merchant verification review page (approve/reject)
- [ ] Create vendor list page (table + filters)
- [ ] Create vendor detail page (info + verification status)
- [ ] Create vendor verification review page (approve/reject)
- [ ] Create file viewer (KTP, NPWP, NIB, photos)
- [ ] Add toast notifications (success/error)

**Testing Tasks (20 hours)**
- [ ] Test file upload flow (S3 presigned URLs)
- [ ] Test verification approval/rejection
- [ ] Test admin permission enforcement
- [ ] Test audit logs

**Deliverables:**
- ✅ Admin can view & manage merchants
- ✅ Admin can approve/reject merchant verification
- ✅ Admin can view & manage vendors
- ✅ Admin can approve/reject vendor verification
- ✅ File upload working (KTP, NPWP, NIB)

---

## Phase 2: Core Features (Sprint 4-8, Week 7-16)

### Sprint 4 (Week 7-8): Merchant - Property & Unit Management

**Backend Tasks (50 hours)**
- [ ] Implement property CRUD API
- [ ] Implement unit CRUD API (nested under property)
- [ ] Implement property search API (Elasticsearch setup)
- [ ] Implement unit status update API (available/occupied/maintenance)
- [ ] Implement property photos upload (S3)
- [ ] Implement subscription tier limits enforcement
- [ ] Create property analytics API (occupancy rate)

**Frontend Tasks (50 hours)**
- [ ] Create merchant dashboard layout (sidebar + header)
- [ ] Create property list page (grid view + add button)
- [ ] Create add/edit property form (multi-step)
- [ ] Create property detail page (info + units list)
- [ ] Create add/edit unit form (inline or modal)
- [ ] Create unit status toggle (available/occupied/maintenance)
- [ ] Create property photo gallery (upload + drag-drop reorder)
- [ ] Create property analytics widget (occupancy rate chart)

**Testing Tasks (20 hours)**
- [ ] Test property CRUD operations
- [ ] Test unit CRUD operations
- [ ] Test subscription tier limits (e.g., Basic max 5 properties)
- [ ] Test photo upload & storage

**Deliverables:**
- ✅ Merchant can add/edit/delete properties
- ✅ Merchant can add/edit/delete units
- ✅ Merchant can upload property photos
- ✅ Subscription limits enforced

---

### Sprint 5 (Week 9-10): Tenant Management & Invitation System

**Backend Tasks (50 hours)**
- [ ] Implement tenant invitation API (generate token + link)
- [ ] Implement tenant registration via invitation API
- [ ] Implement tenant KYC upload API (KTP)
- [ ] Implement tenant contract creation API
- [ ] Implement tenant contract e-signature API
- [ ] Implement tenant list API (filter by property/unit)
- [ ] Implement tenant status API (active/notice/expired)
- [ ] Create email/WhatsApp templates (invitation, contract)

**Frontend Tasks (50 hours)**
- [ ] Create tenant list page (table + filters + search)
- [ ] Create tenant invitation form (email/phone/pre-assign unit)
- [ ] Create tenant invitation success page (copy link + share)
- [ ] Create tenant registration page (via invitation link)
- [ ] Create tenant KYC upload form (KTP + emergency contact)
- [ ] Create contract creation form (dates + rent + deposit)
- [ ] Create contract e-signature page (tenant + merchant)
- [ ] Create tenant detail page (info + contract + payment history)

**Testing Tasks (20 hours)**
- [ ] Test invitation link generation
- [ ] Test tenant registration flow
- [ ] Test contract creation & e-signature
- [ ] Test invalid/expired invitation links

**Deliverables:**
- ✅ Merchant can invite tenants
- ✅ Tenant can register via invitation
- ✅ Tenant can upload KYC documents
- ✅ Merchant can create contracts
- ✅ E-signature working

---

### Sprint 6 (Week 11-12): Payment System & Xendit Integration

**Backend Tasks (60 hours)**
- [ ] Implement Xendit payment creation API (VA/QRIS/E-Wallet/CC)
- [ ] Implement Xendit webhook handler (payment success/failed)
- [ ] Implement invoice auto-generation API (monthly recurring)
- [ ] Implement invoice list API (filter by status/tenant)
- [ ] Implement payment list API (history + filters)
- [ ] Implement payment reminder job (scheduled via BullMQ)
- [ ] Implement transaction fee calculation (3.5% for rent)
- [ ] Write payment reconciliation script (daily cron)

**Frontend Tasks (50 hours)**
- [ ] Create merchant payment dashboard (summary + list)
- [ ] Create invoice list page (pending/paid/overdue)
- [ ] Create invoice detail page (line items + payment button)
- [ ] Create tenant payment page (select method + pay)
- [ ] Create payment success page (receipt + download PDF)
- [ ] Create payment failed page (retry + support)
- [ ] Create payment history page (filter by date/status)
- [ ] Add payment reminder settings (auto/manual)

**Testing Tasks (30 hours)**
- [ ] Test Xendit sandbox payment (VA, QRIS, E-Wallet, CC)
- [ ] Test webhook handling (payment success/failed/expired)
- [ ] Test invoice auto-generation (monthly)
- [ ] Test payment reminder job
- [ ] Test fee calculation accuracy
- [ ] Test reconciliation script

**Deliverables:**
- ✅ Tenant can pay rent via Xendit (all methods)
- ✅ Payment success updates invoice status
- ✅ Monthly invoices auto-generated
- ✅ Payment reminder working
- ✅ Merchant can view payment history

---

### Sprint 7 (Week 13-14): Escrow System & Disbursement

**Backend Tasks (60 hours)**
- [ ] Implement escrow account creation API (per merchant/vendor)
- [ ] Implement escrow transaction API (credit/debit)
- [ ] Implement escrow balance API (available/pending)
- [ ] Implement disbursement schedule settings API (daily/weekly/monthly/on-demand)
- [ ] Implement disbursement creation API (manual + auto)
- [ ] Implement Xendit disbursement API integration
- [ ] Implement disbursement webhook handler (success/failed)
- [ ] Implement disbursement fee calculation (0.25%/0.5%/FREE)
- [ ] Create reconciliation job (hourly balance audit)
- [ ] Write disbursement scheduler job (daily 14:00 WIB, weekly Monday, monthly 1st/15th)

**Frontend Tasks (50 hours)**
- [ ] Create escrow balance dashboard (available/pending/total)
- [ ] Create escrow transaction history page (filter by type/date)
- [ ] Create disbursement settings page (schedule + bank account)
- [ ] Create disbursement request page (on-demand)
- [ ] Create disbursement history page (status tracking)
- [ ] Create disbursement detail page (fee breakdown)
- [ ] Add balance widgets (merchant/vendor home page)
- [ ] Create bank account management form

**Testing Tasks (30 hours)**
- [ ] Test escrow credit/debit transactions
- [ ] Test disbursement schedules (daily/weekly/monthly)
- [ ] Test disbursement fee calculation
- [ ] Test Xendit disbursement API (sandbox)
- [ ] Test reconciliation accuracy
- [ ] Test edge cases (insufficient balance, failed disbursement)

**Deliverables:**
- ✅ Payment goes to escrow (after Xendit success)
- ✅ Merchant can set disbursement schedule
- ✅ Auto-disbursement working (daily/weekly/monthly)
- ✅ On-demand disbursement working
- ✅ Fee calculation correct
- ✅ Reconciliation hourly

---

### Sprint 8 (Week 15-16): Subscription Management & Billing

**Backend Tasks (50 hours)**
- [ ] Implement subscription tier CRUD API (admin)
- [ ] Implement subscription purchase API (merchant)
- [ ] Implement Xendit invoice creation API (subscription payment)
- [ ] Implement subscription webhook handler (payment success)
- [ ] Implement subscription renewal job (monthly/yearly)
- [ ] Implement subscription upgrade/downgrade API
- [ ] Implement trial expiry job (auto downgrade to Free)
- [ ] Implement subscription limits enforcement (properties/units/features)
- [ ] Create subscription analytics API (MRR, churn)

**Frontend Tasks (50 hours)**
- [ ] Create subscription tier management page (admin)
- [ ] Create subscription purchase page (merchant)
- [ ] Create subscription payment page (Xendit invoice)
- [ ] Create subscription success page (receipt)
- [ ] Create subscription management page (current plan + upgrade/downgrade)
- [ ] Create trial countdown widget (days remaining)
- [ ] Create upgrade prompt modal (when limits reached)
- [ ] Add subscription status badges (trial/active/expired)

**Testing Tasks (20 hours)**
- [ ] Test subscription purchase flow
- [ ] Test trial expiry (auto downgrade)
- [ ] Test subscription renewal (auto-charge)
- [ ] Test upgrade/downgrade scenarios
- [ ] Test limits enforcement (properties/units)

**Deliverables:**
- ✅ Merchant can subscribe to paid tiers
- ✅ Trial auto-expires & downgrades to Free
- ✅ Subscription auto-renews
- ✅ Limits enforced by tier
- ✅ Admin can manage tiers

---

## Phase 3: Advanced Features (Sprint 9-10, Week 17-20)

### Sprint 9 (Week 17-18): Vendor Marketplace

**Backend Tasks (50 hours)**
- [ ] Implement vendor product CRUD API
- [ ] Implement vendor product search API (Elasticsearch)
- [ ] Implement vendor order creation API
- [ ] Implement vendor order status update API
- [ ] Implement vendor order payment API (Xendit)
- [ ] Implement vendor order webhook handler
- [ ] Implement vendor rating & review API
- [ ] Implement vendor analytics API (sales, top products)
- [ ] Implement vendor escrow & disbursement (same as merchant)

**Frontend Tasks (50 hours)**
- [ ] Create vendor product list page (grid + add button)
- [ ] Create add/edit product form (photos + pricing)
- [ ] Create vendor profile page (public view)
- [ ] Create tenant vendor browse page (filter by category + distance)
- [ ] Create vendor detail page (products + reviews)
- [ ] Create order creation page (quantity + notes)
- [ ] Create order payment page (Xendit)
- [ ] Create vendor order inbox page (accept/reject)
- [ ] Create order tracking page (status updates)
- [ ] Create review form (rating + text + photos)

**Testing Tasks (20 hours)**
- [ ] Test vendor product CRUD
- [ ] Test order creation & payment
- [ ] Test order status updates
- [ ] Test vendor disbursement
- [ ] Test rating & review system

**Deliverables:**
- ✅ Vendor can add/edit products
- ✅ Tenant can browse & order from vendors
- ✅ Payment goes to vendor escrow
- ✅ Vendor can track orders
- ✅ Rating & review working

---

### Sprint 10 (Week 19-20): AI Chatbot (Google Gemini)

**Backend Tasks (50 hours)**
- [ ] Setup Google Gemini API integration
- [ ] Setup vector database (Pinecone/Weaviate)
- [ ] Implement chatbot conversation API (create/continue)
- [ ] Implement chatbot message API (send/receive)
- [ ] Implement intent classification (FAQ/vendor_rec/data_query/unknown)
- [ ] Implement FAQ knowledge base (seed data)
- [ ] Implement vendor recommendation logic (Gemini + DB query)
- [ ] Implement context management (user property, payment status, order history)
- [ ] Implement chatbot analytics API (usage, satisfaction, escalation rate)
- [ ] Setup caching (Redis, 1h TTL for frequent queries)

**Frontend Tasks (50 hours)**
- [ ] Create chatbot floating button (all pages)
- [ ] Create chatbot widget (popup chat interface)
- [ ] Implement chat message list (user + bot bubbles)
- [ ] Implement chat input (text + send button)
- [ ] Implement suggested actions buttons (quick replies)
- [ ] Implement typing indicator (while waiting response)
- [ ] Implement error handling (retry, escalate to human)
- [ ] Add satisfaction feedback (thumbs up/down)
- [ ] Create chatbot admin page (knowledge base management)

**Testing Tasks (20 hours)**
- [ ] Test chatbot intent classification (80% accuracy target)
- [ ] Test vendor recommendation accuracy
- [ ] Test FAQ responses
- [ ] Test escalation to human
- [ ] Test Gemini API cost (monitor token usage)

**Deliverables:**
- ✅ Chatbot working (FAQ support)
- ✅ Vendor recommendations working
- ✅ Intent classification >80% accuracy
- ✅ Cost under control (caching + rate limiting)

---

## Phase 4: Engagement & Growth (Sprint 11-12, Week 21-24)

### Sprint 11 (Week 21-22): Referral System & Community Forum

**Backend Tasks (50 hours)**
- [ ] Implement referral code generation API (per user)
- [ ] Implement referral tracking API (register via referral link)
- [ ] Implement referral milestone tracking API (3-tier progress)
- [ ] Implement referral reward issuance API (credit/voucher/cashback)
- [ ] Implement referral analytics API (dashboard)
- [ ] Implement forum post CRUD API (global + private)
- [ ] Implement forum comment CRUD API (nested replies)
- [ ] Implement forum like API
- [ ] Implement forum report API (spam/abuse)
- [ ] Implement forum search API (Elasticsearch)

**Frontend Tasks (50 hours)**
- [ ] Create referral dashboard page (link + progress + earnings)
- [ ] Create referral share modal (WhatsApp/Email/Copy link)
- [ ] Create referral tracking page (referee list + milestones)
- [ ] Create forum homepage (global + private tabs)
- [ ] Create forum post list page (infinite scroll + filters)
- [ ] Create forum post detail page (comments + replies)
- [ ] Create forum post creation form (title + content + photos + tags)
- [ ] Create forum comment form (inline reply)
- [ ] Create forum search page (keyword + tag filters)
- [ ] Create forum report modal (reason + description)

**Testing Tasks (20 hours)**
- [ ] Test referral link generation
- [ ] Test referral tracking (register via link)
- [ ] Test milestone progression
- [ ] Test reward issuance
- [ ] Test forum post/comment/like
- [ ] Test forum report & moderation

**Deliverables:**
- ✅ Referral system working (3-tier)
- ✅ Referral rewards issued (credit/voucher/cashback)
- ✅ Forum working (global + private)
- ✅ Forum moderation working

---

### Sprint 12 (Week 23-24): Analytics, Maintenance & Polish

**Backend Tasks (40 hours)**
- [ ] Implement maintenance request CRUD API
- [ ] Implement maintenance status update API
- [ ] Implement maintenance assignment API (to technician)
- [ ] Implement analytics API (merchant: occupancy, revenue, churn)
- [ ] Implement analytics API (vendor: sales, top products, customers)
- [ ] Implement analytics API (admin: platform metrics, GMV, MRR)
- [ ] Implement notification preferences API
- [ ] Optimize slow queries (database indexing)
- [ ] Setup API documentation (Swagger/OpenAPI)

**Frontend Tasks (40 hours)**
- [ ] Create maintenance request form (tenant)
- [ ] Create maintenance inbox page (merchant)
- [ ] Create maintenance detail page (status tracking + photos)
- [ ] Create merchant analytics dashboard (charts + KPIs)
- [ ] Create vendor analytics dashboard (sales trends)
- [ ] Create admin platform analytics dashboard (revenue + users)
- [ ] Create notification preferences page (channels + types)
- [ ] Polish UI/UX (consistent spacing, colors, loading states)
- [ ] Add empty states (no data placeholders)

**Testing Tasks (20 hours)**
- [ ] Test maintenance request flow
- [ ] Test analytics accuracy (revenue, occupancy, GMV)
- [ ] Perform load testing (1000 concurrent users)
- [ ] Perform security testing (penetration test)
- [ ] Final E2E testing (all critical flows)

**QA & Bug Fixing (20 hours)**
- [ ] Fix critical bugs (P0)
- [ ] Fix high-priority bugs (P1)
- [ ] Improve error messages
- [ ] Optimize performance (lazy loading, caching)

**Deliverables:**
- ✅ Maintenance request system working
- ✅ Analytics dashboards complete
- ✅ All critical bugs fixed
- ✅ Performance optimized
- ✅ Ready for beta launch

---

## Post-MVP Tasks (After Week 24)

### Beta Launch Preparation
- [ ] Setup production environment (scaling config)
- [ ] Configure production Xendit account
- [ ] Switch Gemini API to production
- [ ] Setup monitoring alerts (PagerDuty)
- [ ] Prepare launch announcement (email + social media)
- [ ] Create onboarding tutorial (interactive walkthrough)
- [ ] Prepare support documentation (help center)

### Beta Testing (2 weeks)
- [ ] Onboard 10 pilot merchants (friends & family)
- [ ] Gather feedback (surveys + user interviews)
- [ ] Fix beta bugs
- [ ] Optimize based on feedback

### Public Launch (Week 27)
- [ ] Launch marketing campaign
- [ ] Monitor system health 24/7
- [ ] Respond to support tickets (<4h SLA)
- [ ] Track KPIs (signups, payments, churn)

---

## Risk Mitigation

**High-Risk Items:**
1. **Xendit Integration Complexity** → Start Sprint 6, allocate 30% buffer time
2. **Gemini API Cost Overrun** → Implement caching early, monitor daily
3. **Escrow Reconciliation Accuracy** → Write comprehensive tests, daily audits
4. **Mobile Performance** → Optimize from Sprint 1, target <1MB initial load
5. **Security Vulnerabilities** → Penetration test in Sprint 12, fix before launch

**Dependencies:**
- Xendit account approval (apply Week 1)
- Gemini API quota increase (request Week 1)
- SSL certificate (setup Week 1)
- Domain registration (buy Week 1)

---

## Success Criteria (MVP Launch)

**Must Have:**
- ✅ 4 roles working (Admin, Merchant, Tenant, Vendor)
- ✅ Subscription system (3 tiers + Free)
- ✅ Payment via Xendit (rent + vendor orders)
- ✅ Escrow + Disbursement (auto schedules)
- ✅ Referral system (3-tier)
- ✅ AI Chatbot (basic FAQ + vendor rec)
- ✅ Forum (global + private)
- ✅ Verification system (merchants + vendors)
- ✅ Mobile responsive (PWA)
- ✅ 99.5% uptime (staging tested)

**Nice to Have (Post-MVP):**
- ⏳ Push notifications (PWA)
- ⏳ Advanced analytics (predictive)
- ⏳ IoT integration (smart locks)
- ⏳ Multi-language (English)
- ⏳ White-label (Enterprise)

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Team:** 6 people, 24 weeks  
**Target:** Beta launch Q2 2026