# Product Requirements Document: Donation Page

**Version**: 1.0
**Status**: Draft - Pending Conductor Sign-off
**Owner**: Product Team
**Last Updated**: 2025-11-13

---

## Executive Summary

The Donation Page is the cornerstone of the Raisin Next platform, enabling supporters to make one-time and recurring donations with a mobile-first, conversion-optimized experience. This PRD defines the scope, user stories, acceptance criteria, and success metrics for the initial release.

---

## Problem Statement

Nonprofits need a modern, accessible, high-converting donation experience that:
- Minimizes friction in the donation flow
- Supports multiple giving types (one-time, recurring, tribute)
- Maximizes fee recovery through transparent donor-covers-fees options
- Integrates seamlessly with payment processors and CRM systems
- Meets strict accessibility and security requirements

---

## Goals & Success Metrics

### Primary Goals
1. **Maximize Conversion**: Streamlined checkout flow with minimal steps
2. **Increase Average Gift**: Strategic amount presets and upsell prompts
3. **Boost Recurring Adoption**: Clear value proposition for monthly giving
4. **Optimize Fee Coverage**: Transparent fee display increases fee-cover rate

### Key Performance Indicators (KPIs)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Conversion Rate | TBD | 35%+ | Completed donations / Form views |
| Average Gift | TBD | 15% increase | Total revenue / Gift count |
| Recurring Uptake | TBD | 25%+ | Recurring plans / Total gifts |
| Fee-Cover Rate | TBD | 40%+ | Gifts with fee coverage / Total gifts |
| Abandonment Rate | TBD | <30% | Started but incomplete flows |
| LCP (Mobile) | TBD | <2.5s | Core Web Vitals |
| p95 Flow Latency | TBD | <8s | End-to-end donation time |

---

## Shared Ontology

**Core Entities**:
- **Donor**: Individual making the gift (anonymous or authenticated)
- **Gift**: Single donation transaction
- **RecurringPlan**: Ongoing subscription for recurring gifts
- **Campaign**: Fundraising initiative tied to forms
- **Form**: Configurable donation form schema
- **Receipt**: Tax receipt generated post-donation
- **Tribute**: Honour/memory dedication attached to gift

**Status Enums** (centralized in `/packages/types`):
- Gift Status: `pending`, `success`, `failed`, `refunded`
- RecurringPlan Status: `active`, `paused`, `cancelled`

---

## Epic Breakdown

### Epic 1: One-Time Donation Flow
**Goal**: Enable supporters to make single donations with minimal friction

#### User Stories

**Story 1.1: Amount Selection**
- **As a** supporter
- **I want to** select a donation amount quickly
- **So that** I can proceed to payment without confusion

**Acceptance Criteria**:
- ✅ Display 3-5 preset amounts based on campaign configuration
- ✅ Custom amount input field with validation (min $1, max $100,000)
- ✅ Multi-currency support (USD, CAD, EUR) with proper formatting
- ✅ Selected amount visually highlighted
- ✅ Amount persists if user navigates back
- ✅ Mobile-optimized button sizes (min 44x44px touch targets)

**Story 1.2: Donor Information Capture**
- **As a** supporter
- **I want to** provide my contact information
- **So that** I receive a receipt and updates

**Acceptance Criteria**:
- ✅ Fields: First Name, Last Name, Email (required), Phone (optional)
- ✅ Client-side validation with clear error messages
- ✅ Server-side validation via Zod schemas
- ✅ Auto-fill support for returning donors
- ✅ Privacy notice with link to policy
- ✅ Email opt-in checkbox (unchecked by default, GDPR compliant)
- ✅ WCAG 2.2 AA compliant labels and error states

**Story 1.3: Payment Processing**
- **As a** supporter
- **I want to** securely enter my payment information
- **So that** my donation is processed safely

**Acceptance Criteria**:
- ✅ Hosted payment fields from processor (Stripe/Adyen/PayPal)
- ✅ Support for credit/debit cards, Apple Pay, Google Pay
- ✅ PCI SAQ-A-EP compliance (no PAN/CVV storage)
- ✅ Real-time validation of card details
- ✅ Error handling with user-friendly messages
- ✅ Loading state during submission
- ✅ Idempotency to prevent duplicate charges

**Story 1.4: Confirmation & Receipt**
- **As a** supporter
- **I want to** receive immediate confirmation
- **So that** I know my donation was successful

**Acceptance Criteria**:
- ✅ Thank-you page with donation summary
- ✅ Immediate email receipt with PDF attachment
- ✅ Receipt includes: amount, date, org details, tax info, receipt number
- ✅ Social sharing prompts (optional)
- ✅ Next steps / impact messaging
- ✅ Audit log entry created for gift

---

### Epic 2: Recurring Donation Flow
**Goal**: Enable monthly/annual recurring gifts with donor self-service

#### User Stories

**Story 2.1: Recurring Setup**
- **As a** supporter
- **I want to** set up a recurring monthly gift
- **So that** I can support the cause consistently

**Acceptance Criteria**:
- ✅ Toggle between one-time and recurring (clear visual indicator)
- ✅ Frequency options: Monthly, Quarterly, Annually
- ✅ First charge date displayed clearly
- ✅ Next charge date calculated and shown
- ✅ Mandate/subscription created with payment processor
- ✅ Confirmation email explains recurring terms
- ✅ Cancellation policy clearly stated

**Story 2.2: Recurring Management**
- **As an** authenticated donor
- **I want to** manage my recurring plan
- **So that** I can update amount, payment method, or cancel

**Acceptance Criteria**:
- ✅ View all active recurring plans
- ✅ Update amount with immediate effect
- ✅ Update payment method (tokenized)
- ✅ Pause plan (resume later)
- ✅ Cancel plan (effective immediately or next cycle)
- ✅ View charge history
- ✅ Audit trail of all changes
- ✅ Email confirmation for all modifications

---

### Epic 3: Donor-Covers-Fees
**Goal**: Maximize fee recovery through transparent, optional fee coverage

#### User Stories

**Story 3.1: Fee Display & Selection**
- **As a** supporter
- **I want to** understand and optionally cover processing fees
- **So that** 100% of my donation reaches the cause

**Acceptance Criteria**:
- ✅ Checkbox to "Cover processing fees" (unchecked by default)
- ✅ Fee amount calculated and displayed in real-time
- ✅ Total amount updates when fee coverage toggled
- ✅ Fee breakdown shown (e.g., "$5 donation + $0.50 fee = $5.50 total")
- ✅ Fee calculation accurate for processor (Stripe/Adyen/PayPal rates)
- ✅ Fee coverage flag stored in Gift record
- ✅ Receipt clearly shows donation vs. fee amounts

**Story 3.2: Fee Reporting**
- **As a** finance admin
- **I want to** track fee coverage rates
- **So that** I can measure uplift and optimize messaging

**Acceptance Criteria**:
- ✅ Analytics dashboard shows fee-cover rate
- ✅ Export includes fee coverage flag
- ✅ A/B test different fee messaging variants
- ✅ Track fee-cover uplift as KPI

---

### Epic 4: Tribute Donations
**Goal**: Enable supporters to make gifts in honour or memory of others

#### User Stories

**Story 4.1: Tribute Information**
- **As a** supporter
- **I want to** dedicate my gift in honour/memory of someone
- **So that** I can celebrate or commemorate them

**Acceptance Criteria**:
- ✅ Checkbox to "Make this a tribute gift" (optional)
- ✅ Tribute type selection: Honour, Memory, Celebration
- ✅ Honoree name field (required if tribute selected)
- ✅ Tribute message field (optional, max 500 chars)
- ✅ Tribute details stored with Gift record
- ✅ Receipt includes tribute dedication

**Story 4.2: E-Card Notification**
- **As a** supporter
- **I want to** send an e-card to notify someone of my tribute gift
- **So that** they know about the donation

**Acceptance Criteria**:
- ✅ Option to send e-card (optional)
- ✅ Recipient name and email fields
- ✅ E-card design gallery (3-5 templates)
- ✅ Personal message field (max 250 chars)
- ✅ Delivery scheduling (immediate or future date)
- ✅ E-card sent via email with accessible HTML + plain-text
- ✅ Tracking: sent timestamp, opened timestamp
- ✅ Ecard entity created with tribute reference

---

### Epic 5: Campaign Integration
**Goal**: Support campaign-branded forms with theming and goal tracking

#### User Stories

**Story 5.1: Campaign-Branded Forms**
- **As an** org admin
- **I want to** create forms tied to specific campaigns
- **So that** I can track performance by initiative

**Acceptance Criteria**:
- ✅ Form URL includes campaign slug (e.g., /donate/spring-appeal)
- ✅ Campaign name, description, and imagery displayed
- ✅ Theme/branding applied (colors, logo, fonts)
- ✅ Goal progress thermometer (optional)
- ✅ Supporter count and total raised (optional)
- ✅ Gift records include campaignId for attribution

**Story 5.2: Impact Messaging**
- **As a** supporter
- **I want to** see the impact of my donation
- **So that** I feel connected to the cause

**Acceptance Criteria**:
- ✅ Thank-you page shows campaign impact statement
- ✅ Personalized impact message based on gift amount
- ✅ Option to share impact on social media
- ✅ Follow-up email with impact stories

---

## Integration Requirements

### Payment Processors
- **Adapters**: Stripe, Adyen, PayPal
- **Features**: Hosted fields, Apple Pay, Google Pay, ACH/direct debit
- **Webhooks**: `payment.succeeded`, `payment.failed`, `charge.refunded`
- **Idempotency**: Use idempotency keys for all payment creation requests
- **Security**: HMAC signature verification, PCI SAQ-A-EP compliance

### CRM/ESP
- **Salesforce NPSP**: Sync donor, gift, and recurring plan data
- **Raiser's Edge**: Bidirectional sync with field mapping
- **ESP (Mailchimp/SendGrid)**: Trigger stewardship journeys
- **UTM Tracking**: Capture source attribution for all gifts
- **Deduplication**: Match donors by email, prevent duplicates

### Analytics
- **Events**: `donation_started`, `amount_selected`, `payment_submitted`, `donation_completed`, `donation_failed`
- **Properties**: amount, currency, recurring flag, fee-cover flag, campaign, source
- **Conversion Funnel**: Track abandonment by step
- **A/B Testing**: Form variants with autopromote winner

---

## Technical Constraints

### Performance
- **LCP**: <2.5s on mobile
- **p95 Latency**: End-to-end donation <8s
- **ISR/Edge**: Cache campaign pages, revalidate on changes
- **Image Optimization**: Next.js Image component, WebP format

### Accessibility
- **WCAG 2.2 AA**: Mandatory compliance
- **Keyboard Navigation**: Full flow navigable via keyboard
- **Screen Readers**: Proper ARIA labels, roles, live regions
- **Color Contrast**: 4.5:1 minimum for text
- **Focus Indicators**: Visible on all interactive elements
- **Form Validation**: Clear, accessible error messages

### Security
- **PCI SAQ-A-EP**: Hosted fields only, no PAN/CVV storage
- **CSRF Protection**: All state-changing operations
- **Rate Limiting**: Prevent abuse on form submission
- **Input Validation**: Server-side Zod schemas
- **Audit Logging**: All gift creation, updates, refunds
- **Secrets Management**: AWS Secrets Manager

### Data Privacy
- **GDPR/CCPA**: Consent capture, data minimization
- **PII Exclusion**: No PII in logs or traces
- **Retention**: 12-month audit logs
- **Right to Erasure**: Support donor deletion requests

---

## User Flows

### One-Time Donation Flow
1. Land on campaign donation page
2. Select amount (preset or custom)
3. Enter donor information
4. Optionally add tribute details
5. Optionally cover fees
6. Enter payment information (hosted fields)
7. Submit donation
8. View thank-you page
9. Receive email receipt

### Recurring Donation Flow
1. Land on campaign donation page
2. Toggle to "Monthly" recurring
3. Select amount and frequency
4. Enter donor information
5. Optionally cover fees
6. Enter payment information
7. Review recurring terms
8. Submit recurring plan
9. View confirmation page
10. Receive email with recurring details

---

## Definition of Done (Per Story)

Each user story is complete when:
- ✅ Acceptance criteria met
- ✅ All tests pass (unit, component, E2E)
- ✅ Accessibility checks pass (WCAG 2.2 AA)
- ✅ Threat model note updated (if security-relevant)
- ✅ Documentation updated
- ✅ Telemetry/instrumentation added
- ✅ QA sign-off received
- ✅ Code review approved

---

## Out of Scope (v1)

- Full P2P fundraising features
- Ticketing integration
- Matching gift verification (basic prompts only)
- Advanced donor portal (coming in v1.1)
- Multi-page forms (single-page flow only)
- Pledge management (payment later)

---

## Release Phases

### Phase 1: MVP (v1.0)
- One-time donations
- Basic recurring setup
- Donor-covers-fees
- Single payment processor (Stripe)
- Campaign-branded forms

### Phase 2: Enhanced (v1.1)
- Tribute donations with e-cards
- Multiple payment processors (Adyen, PayPal)
- Advanced recurring management
- A/B testing framework
- Full CRM sync

### Phase 3: Optimization (v1.2)
- Apple Pay / Google Pay
- Form builder UI
- Impact widgets (thermometer, leaderboards)
- Advanced analytics dashboard

---

## Dependencies

- Prisma schema for Donor, Gift, RecurringPlan, Campaign, Form, Receipt, Ecard, Audit
- tRPC routers for donation operations
- NextAuth.js for authentication
- Payment processor accounts (Stripe test mode initially)
- Email service provider (SendGrid/Mailchimp)
- AWS infrastructure (Secrets Manager, S3 for receipts)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment processor downtime | High | Fallback to secondary processor |
| Poor mobile conversion | High | Extensive mobile UX testing, A/B tests |
| PCI compliance gaps | Critical | Third-party audit, hosted fields only |
| Accessibility failures | High | Early a11y review, automated testing |
| Performance degradation | Medium | Performance budgets, monitoring alerts |

---

## Approval

**Product Owner**: _________________
**Engineering Lead**: _________________
**Conductor Sign-off**: _________________ (Required to proceed)

---

**Next Steps After Approval**:
1. UX specs and wireframes (ux-architect-donations)
2. A11y review of UX specs
3. Conductor sign-off on UX
4. Parallel implementation (FE/BE/Payments/Auth)
5. QA full suite
6. Compliance/Security approvals
7. Conductor release decision
