# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Raisin Next** is a next-generation nonprofit fundraising platform built on the **T3 stack** (Next.js, tRPC, Prisma, NextAuth.js, Tailwind, TypeScript). This repository serves as a comprehensive functional requirements guide and multi-agent orchestration system for coordinating AI-assisted development across all aspects of the platform.

**Critical Context**: This is NOT a traditional codebase with implementation. This is a master blueprint that defines 14 specialized agent roles (in `.claude/agents/`) to coordinate development, from product strategy through deployment.

## Development Governance and Workflow

### Global Inputs

**PRD and Requirements Sources**:
- Online Donations overview: https://raisinsoftware.org/raisin-fundraising-solutions/online-donations/
- Suite overview: https://www.akaraisin.com/Fundraising-Solutions

**Shared Ontology**:
- **Entities**: Donor, Gift, RecurringPlan, Campaign, Form, Receipt, Ecard, Audit
- **Metrics**: conversion rate, average gift, abandonment, recurring uptake, fee-cover uplift
- **Centralized Types**: Status enums and error model are centralized in `/packages/types`

### Work Phases and Gates

All work follows this structured workflow with mandatory gates:

1. **Product PRD vNext** → Conductor sign-off
2. **UX specs** → a11y review → Conductor sign-off
3. **Parallel Implementation** (FE/BE/Payments/CRM) behind feature flags
4. **QA full suite** (functional, perf, a11y, security) → fail closes the loop to the owner
5. **Compliance/Security approvals**
6. **Conductor release decision**

### Handoffs & Artifacts

Every story produces the following artifacts:
- **Code**: Implementation with proper type safety
- **Tests**: Unit, component, and E2E tests as appropriate
- **Docs fragment**: Documentation updates
- **Changelog entry**: User-facing changes documented

**No artifact is "done" without QA pass and documentation.**

### Guardrails (Non-Negotiable Constraints)

**PCI Compliance**:
- PCI scope: hosted fields/redirect only
- Adapters only handle tokens, never raw card data

**Performance Requirements**:
- WCAG 2.2 AA compliance mandatory
- LCP < 2.5s (Largest Contentful Paint)
- p95 donation flow < 8 seconds end-to-end
- 99.95% monthly uptime SLO

**Privacy & Data Protection**:
- PII minimization principles enforced
- Consent propagation across CRM/ESP integrations
- GDPR/CCPA compliance maintained

### Definition of Done (Per Story)

A story is complete when ALL of the following are true:
- ✅ Acceptance criteria met
- ✅ All tests pass (unit, component, E2E)
- ✅ Accessibility checks pass (WCAG 2.2 AA)
- ✅ Threat model note updated (if security-relevant)
- ✅ Documentation updated
- ✅ Telemetry/instrumentation added
- ✅ QA sign-off received
- ✅ Code review approved

## Technology Stack

- **Frontend**: Next.js (App Router), Tailwind CSS, React Query
- **API**: tRPC (type-safe RPC framework)
- **Database**: Prisma ORM + PostgreSQL
- **Authentication**: NextAuth.js (OAuth, SAML, magic links)
- **Payments**: Adyen, Stripe, PayPal (adapter pattern)
- **Infrastructure**: AWS/Vercel, Turbo monorepo (PNPM)
- **Observability**: OpenTelemetry, CloudWatch/DataDog

## Core Architecture Patterns

### T3 Stack Conventions

**Frontend (Next.js App Router)**:
- Server Components by default; Client Components only when necessary (`use client`)
- SSR for personalized/real-time data, ISR for frequently changing cacheable content, Static for unchanging content
- Edge-safe code where applicable

**API (tRPC)**:
- End-to-end type safety between frontend and backend
- Input validation with Zod schemas
- Middleware for auth, RBAC, and audit logging
- Discriminated unions for complex state management
- Typed error handling with TRPCError

**Database (Prisma)**:
- Normalized schemas balancing performance with integrity
- Soft deletes with `deletedAt` timestamps for audit trails
- Strategic indexing for common query patterns
- Prisma enums for fixed value sets
- Proper cascading delete/update rules

### Key Design Patterns

**Payment Processing (Adapter Pattern)**:
- Pluggable adapter interface abstracting processor-specific implementations
- Hosted fields/tokenization to minimize PCI scope (SAQ-A-EP)
- Idempotency keys for payment creation requests
- Webhook-driven state management with HMAC signature verification
- No storage of full PANs or CVVs

**Authentication & Authorization (RBAC)**:
- NextAuth.js for multi-provider authentication
- Server-side and client-side authorization checks
- Least privilege principle enforcement
- Comprehensive audit logging of security events (12-month retention)
- Rate limiting and account lockout protection

**Data Integration (CRM/ESP Sync)**:
- Bidirectional synchronization with field mapping
- Sophisticated deduplication rules
- Push (webhook-driven) and pull (scheduled) patterns
- Incremental sync for changed records
- Dead-letter queues for failed records
- Consent flag propagation across systems

## User Roles and Permissions

- **Anonymous Supporter**: Submit donations, view impact
- **Authenticated Donor**: Manage recurring gifts, view receipts, update preferences
- **Org Admin**: Create forms, manage campaigns, configure branding
- **Finance/Admin**: Refunds, adjustments, reconciliation exports
- **Support Agent**: Search donors, resend receipts, restore soft-deleted items
- **Platform Admin**: System-wide configuration, user management

RBAC enforced via NextAuth session + tRPC middleware + Prisma row-level patterns.

## Core Data Models

**Donor**: `id`, `emails[]`, `consents[]`, `externalIds[]`, name, phone, address, preferences, timestamps
**Gift**: `amount`, `currency`, `status`, `processorRef`, `receiptId`, tribute details, fees, timestamps
**RecurringPlan**: `amount`, `frequency`, `status`, `nextChargeDate`, `mandateId`, dunning config
**Campaign**: `slug`, `name`, `themeId`, goals (`targetAmount`, `donorTarget`), dates, status
**Form**: `schemaJSON`, `variants[]` (A/B testing), `version`, `publishedAt`, `cssOverrides`
**Receipt**: `number`, `pdfUrl`, tax deductibility, regional compliance data, delivery audit trail
**Ecard**: `designId`, `message`, `tributeType`, `scheduleAt`, engagement tracking
**Audit**: `actor`, `action`, `resource`, `diffs`, `ipAddress`, immutable append-only

## API Structure (tRPC Routers)

Expected router organization:
```typescript
router.donation.{create, getById, list, update}
router.recurring.{create, update, cancel, list}
router.tribute.{create, get, delete}
router.receipt.{getById, regenerate, export}
router.campaign.{create, update, getById, list}
router.forms.{create, update, publish, getVariants}
router.exports.{financial, donor, campaign}
router.audit.{log, getByResource, getChanges}
router.settings.{get, update}
router.users.{list, updateRole}
```

**Input Validation Pattern**:
```typescript
const createGiftSchema = z.object({
  donorEmail: z.string().email().max(255),
  amount: z.number().positive().multipleOf(0.01),
  currency: z.enum(['USD', 'CAD', 'EUR']),
  tribute: z.object({
    type: z.enum(['honour', 'memory', 'celebration']),
    honoree: z.string().optional()
  }).optional(),
  coverFee: z.boolean().default(false)
});
```

**Authorization**: Middleware chain → Authentication → RBAC Check → Resource-level Auth (fail-secure, deny by default)

## Development Commands

```bash
# Dependency Management
npm install                 # Install dependencies
pnpm install               # (Preferred for monorepo)

# Development
npm run dev                # Start development server
npm run build              # Production build
npm run type-check         # TypeScript validation

# Database
prisma migrate dev         # Create and apply migrations
prisma migrate deploy      # Apply migrations (production)
prisma seed                # Run seed scripts
prisma studio              # Open database GUI

# Testing
npm test                   # Run unit tests (Vitest)
npm run test:e2e          # Run E2E tests (Playwright)
npm run test:coverage     # Generate coverage report (>80% target)

# Code Quality
npm run lint               # Run ESLint
npm run format             # Run Prettier
```

## CI/CD Pipeline Stages

1. Build artifacts and container images
2. Security scans (SAST/DAST)
3. Unit and component tests
4. E2E tests in staging
5. Accessibility validation (WCAG 2.1/2.2 AA)
6. Performance regression detection
7. Security scanning and vulnerability checks
8. Deploy staging with approval gate
9. Blue-green deployment to production
10. Health checks and monitoring

## Multi-Agent Orchestration System

This repository defines 14 specialized agents in `.claude/agents/`. When working in this codebase, you should leverage these agents based on the task:

**Development Workflow**:
1. **product-strategist** → Creates PRD with user stories and acceptance criteria
2. **ux-architect-donations** → Designs wireframes, components, accessibility specs
3. **nextjs-frontend-engineer** (parallel) → Implements pages, components, tests
4. **trpc-prisma-backend** (parallel) → Implements APIs, database schema
5. **auth-security-engineer** (parallel) → Auth, RBAC, audit logging
6. **payments-adapter-engineer** (parallel) → Payment processor integrations
7. **crm-esp-integration-engineer** (parallel) → CRM/ESP data sync
8. **qa-test-engineer** → Test plans, automation, validation
9. **compliance-privacy-guardian** → PCI, GDPR, CCPA compliance review
10. **data-analytics-engineer** → Event instrumentation, dashboards
11. **documentation-engineer** → ADRs, API docs, runbooks
12. **content-localization-specialist** → i18n, legal compliance
13. **devops-sre-platform** → CI/CD, infrastructure, monitoring
14. **project-orchestrator** → Workflow coordination, release gates

### Orchestrator Routing Rules

Use these routing rules to determine which agent should handle specific types of work:

- **Scope changes** → **product-strategist**
- **UI flows or labels** → **ux-architect-donations** → **content-localization-specialist**
- **RBAC or secrets** → **auth-security-engineer**
- **Payment flow, fees, recurring** → **payments-adapter-engineer** → **trpc-prisma-backend**
- **Data mapping, UTM, journeys** → **crm-esp-integration-engineer** → **data-analytics-engineer**
- **Performance, infrastructure, rollouts** → **devops-sre-platform**
- **Testing, quality gates** → **qa-test-engineer**
- **PII, retention, receipts** → **compliance-privacy-guardian**
- **Missing or incorrect docs** → **documentation-engineer**

**Release Quality Gates** (All Must Pass):
- QA sign-off: All tests pass, regression coverage complete
- Security review: Vulnerability scans clear, SAST/DAST passed
- Accessibility: WCAG 2.1/2.2 AA compliance verified
- Compliance: Regulatory requirements met, audit trails complete

## Security and Compliance Requirements

**PCI DSS SAQ-A-EP**:
- No storage of full card numbers or CVV
- Tokenization from payment processors
- TLS 1.2+ for all cardholder communications
- Hosted fields or redirect flows (not inline)
- Regular security assessments

**Data Privacy**:
- GDPR compliance: Right to access, rectification, erasure, portability
- CCPA compliance: Right to know, delete, opt-out of sale
- 12-month audit log retention
- Consent capture with granular options
- Data retention policies with automatic purging
- Privacy impact assessments for new data processing

**Security Hardening**:
- CSRF protection on all state-changing operations
- PKCE flow for OAuth security
- httpOnly, secure, SameSite cookie attributes
- Rate limiting on auth endpoints
- Account lockout after failed attempts
- Secrets in AWS Secrets Manager (never in code/env files)

## Performance and Availability Targets

- **Uptime SLO**: 99.95%
- **Peak Load**: 500 donations/minute
- **p95 Latency**: End-to-end donation < 8 seconds
- **LCP**: < 2.5s on mobile
- **ISR & Edge Caching**: For optimal performance
- **OpenTelemetry**: Distributed tracing for all critical paths

## Accessibility Requirements

- **WCAG 2.1/2.2 AA** compliance mandatory
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Sufficient color contrast ratios
- Focus indicators on all focusable elements
- No time-based session expiry during donation flow
- Form validation with clear error messages

## Internationalization (i18n)

- JSON locale catalogs for all user-facing strings
- RTL (right-to-left) support for Arabic, Hebrew
- Multi-language forms with proper locale detection
- Currency formatting per locale
- Date/time formatting per locale
- Translatable receipt templates

## Testing Strategy

**Unit Tests** (Vitest):
- Business logic functions
- Utility functions
- Validation schemas
- Target: >80% coverage

**Component Tests** (Vitest):
- React components
- Accessibility assertions (axe-core)
- User interaction flows
- Target: >80% coverage

**E2E Tests** (Playwright):
- Critical user journeys (donation flow, recurring setup, receipt access)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing
- Payment processor webhooks

**Security Tests**:
- OWASP Top 10 vulnerability scanning
- SAST/DAST in CI/CD pipeline
- Dependency vulnerability scanning
- Regular penetration testing

## Common Development Patterns

**Creating a New tRPC Procedure**:
```typescript
// server/api/routers/donation.ts
export const donationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createGiftSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate authorization
      if (!ctx.session.user.can('gifts.create')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Create gift in transaction
      const gift = await ctx.db.gift.create({
        data: {
          ...input,
          donorId: ctx.session.user.donorId,
        },
      });

      // Audit log
      await ctx.db.audit.create({
        data: {
          actor: ctx.session.user.id,
          action: 'CREATE',
          resource: `gift:${gift.id}`,
        },
      });

      return gift;
    }),
});
```

**Creating a New Next.js Page** (App Router):
```typescript
// app/donate/[slug]/page.tsx
import { api } from '~/trpc/server';

export default async function DonatePage({
  params
}: {
  params: { slug: string }
}) {
  // Server-side data fetching
  const campaign = await api.campaign.getBySlug({ slug: params.slug });

  return (
    <div>
      <DonationForm campaign={campaign} />
    </div>
  );
}
```

**Implementing Authorization Middleware**:
```typescript
// server/api/trpc.ts
const enforceRole = (requiredRole: Role) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    if (ctx.session.user.role !== requiredRole) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({ ctx });
  });

export const adminProcedure = t.procedure.use(enforceRole('ADMIN'));
```

## Critical Implementation Notes

1. **Never store sensitive payment data**: Always use tokenization
2. **Always validate on server**: Client validation is UX only, never trust client input
3. **Audit security-sensitive actions**: All CREATE/UPDATE/DELETE on sensitive resources
4. **Use transactions for multi-step operations**: Ensure atomicity
5. **Implement idempotency**: Use idempotency keys for payment operations
6. **Verify webhook signatures**: Always validate HMAC signatures from payment processors
7. **Log without PII**: Exclude sensitive data from logs and traces
8. **Fail securely**: Deny by default, explicitly grant permissions
9. **Use connection pooling**: Configure Prisma connection pool appropriately
10. **Implement retry logic**: With exponential backoff for external API calls

## Observability and Monitoring

**OpenTelemetry Instrumentation**:
- All tRPC procedures automatically traced
- Custom spans for critical business operations
- Correlation IDs across service boundaries
- PII exclusion from traces

**Logging**:
- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- PII redaction in logs
- CloudWatch/DataDog integration

**Metrics**:
- Real-time donation metrics
- Conversion funnel analytics
- Payment processor health
- API latency and error rates
- Database connection pool utilization

**Alerts**:
- Error rate spikes
- Latency degradation
- Failed payment webhook processing
- Database connection exhaustion
- Security anomalies

## Project Reference

This repository documents requirements from:
- https://raisinsoftware.org/raisin-fundraising-solutions/online-donations/
- https://www.akaraisin.com/Fundraising-Solutions

## Out of Scope (v1)

- Full P2P (peer-to-peer) events
- Full ticketing flow
- Deep CRM write-back beyond essential fields

These features are designed to be future-ready but not implemented in v1.
