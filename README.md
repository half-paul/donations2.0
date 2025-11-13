# Raisin Next – Functional Requirements Guide

A technical and functional blueprint for the next generation of Raisin’s fundraising platform, built on the **T3 stack** (Next.js, Prisma, NextAuth.js, tRPC, Tailwind, TypeScript).

This README is used as a master reference for engineering, product, and design teams.

---

## Table of Contents
- [1. Purpose and Scope](#1-purpose-and-scope)
- [2. Technology Stack](#2-technology-stack)
- [3. User Roles and Permissions](#3-user-roles-and-permissions)
- [4. Core Donation Experience](#4-core-donation-experience)
- [5. Integrations](#5-integrations)
- [6. Donor Account and Self-Service](#6-donor-account-and-self-service)
- [7. Campaign and Content Management](#7-campaign-and-content-management)
- [8. Ticketing & P2P (Future-Ready)](#8-ticketing--p2p-future-ready)
- [9. Receipting and Compliance](#9-receipting-and-compliance)
- [10. Analytics and Reporting](#10-analytics-and-reporting)
- [11. Accessibility and Internationalization](#11-accessibility-and-internationalization)
- [12. Security](#12-security)
- [13. Performance and Availability](#13-performance-and-availability)
- [14. Admin UX](#14-admin-ux)
- [15. Developer and Ops](#15-developer-and-ops)
- [16. Data Model Overview](#16-data-model-overview)
- [17. Notifications](#17-notifications)
- [18. Acceptance Criteria Examples](#18-acceptance-criteria-examples)
- [19. Out of Scope (v1)](#19-out-of-scope-v1)
- [20. Deliverables](#20-deliverables)

---

## 1. Purpose and Scope
Raisin Next modernizes the full online fundraising experience—donations, recurring giving, tributes, donor self-service, CRM sync, and more.

Reference:
- https://raisinsoftware.org/raisin-fundraising-solutions/online-donations/
- https://www.akaraisin.com/Fundraising-Solutions

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) |
| API | tRPC |
| ORM | Prisma + PostgreSQL |
| UI | Tailwind CSS |
| Auth | NextAuth.js (OAuth, SAML, magic links) |
| State | React Query |
| Monorepo | Turbo, PNPM |
| Infra | AWS / Vercel |
| Payments | Adyen, Stripe, PayPal (adapter pattern) |

---

## 3. User Roles and Permissions

### Anonymous Supporter
- Can submit donations
- Can access tribute/e-card flows

### Authenticated Donor
- Manage recurring gifts
- Download receipts
- Update payment methods
- Manage consent & preferences

### Org Admin
- Create/edit donation forms
- Configure branding and themes
- Manage campaigns and receipts

### Finance/Admin
- Refunds, adjustments
- Reconciliation exports

### Support Agent
- Search donors
- Resend receipts
- Restore soft-deleted items

RBAC enforced via NextAuth session + Prisma.

---

## 4. Core Donation Experience

### 4.1 Donation Form Types
- One-time & recurring donations
- Campaign-branded form pages
- Tribute donations (in honour/in memory)
- Donor-covers-fees option
- Matching gift prompts
- Mobile-first conversion-focused UX

### 4.2 Form Builder (Admin)
- Drag-and-drop configuration
- Themes & branding controls
- A/B testing & form variants
- Version control & rollback
- Live preview

### 4.3 Amounts, Currencies, Taxes
- Multi-currency
- Preset + custom amounts
- Localized tax rules

### 4.4 Recurring Programs
- Monthly/annual frequencies
- Donor self-service
- Dunning workflows
- Card expiry detection

### 4.5 Tributes & e-Cards
- Tribute types: honour, memory, celebration
- E-card gallery & scheduling
- Accessible HTML and plain-text fallback

### 4.6 Conversion Optimization
- Simple path: amount → details → payment → thank-you
- Apple Pay/Google Pay support
- Edge-optimized performance

### 4.7 Thank-You & Stewardship
- Personalized post-donation page
- Follow-up journey emails
- Recurring upsell prompts

---

## 5. Integrations

### 5.1 Payment Processors
- Adyen, Stripe, PayPal
- ACH/direct debit where supported
- Wallets (Apple Pay/Google Pay)
- Webhook ingestion with idempotency
- PCI minimized via hosted tokenization fields

### 5.2 CRM & Email
- Salesforce NPSP / Raiser’s Edge connectors
- ESP connectors for journeys
- UTM/source tracking

---

## 6. Donor Account and Self-Service
- Magic-link or OAuth login
- Donation & receipt history
- Recurring gift management
- GDPR/CCPA export & deletion tools

---

## 7. Campaign and Content Management
- Campaign hierarchy (Org → Campaign → Forms)
- Theme & branding tools
- Impact widgets: thermometer, supporter wall, leaderboards
- Moderation & versioning

---

## 8. Ticketing & P2P (Future-Ready)
- Shared donor and payment tokens
- QR-coded tickets
- P2P profiles, teams, leaderboards (Phase 2)

---

## 9. Receipting and Compliance
- Customizable PDF templates
- Unique receipt numbers
- Corrected receipts tracking
- Automated delivery & audit logs

---

## 10. Analytics and Reporting
- Real-time donation analytics
- Conversion & abandonment reporting
- Finance reconciliation exports
- A/B test reporting and autopromote

---

## 11. Accessibility and Internationalization
- WCAG 2.2 AA compliance
- Keyboard and screen-reader support
- i18n: JSON locale catalogs
- RTL + multi-language forms

---

## 12. Security
- CSRF and PKCE enforcement
- Encrypted sessions
- Secrets in AWS Secret Manager
- Rate limiting and bot protection
- HMAC-signed webhooks
- PCI SAQ-A-EP alignment

---

## 13. Performance and Availability
- ISR & edge caching
- 99.95% uptime target
- Peak: 500 donations/minute
- p95 end-to-end donation < 8s
- LCP < 2.5s (mobile)

---

## 14. Admin UX
- Advanced search & filters
- Bulk actions
- Guided campaign setup
- Audit viewer with diffs

---

## 15. Developer and Ops
- Monorepo: apps/web, apps/admin, packages/*
- Prisma migrations + seed data
- Preview deploys on PR
- OpenTelemetry tracing
- CloudWatch/DataDog logging
- Feature flags & remote config
- Automated backups + PITR

---

## 16. Data Model Overview

### Donor
- id, emails[], consents, extIds

### Gift
- amount, currency, tribute, processorRef, receiptId

### RecurringPlan
- amount, frequency, nextCharge, status

### Campaign
- slug, themeId, goals, dates

### Form
- schemaJSON, variants, version

### Receipt
- number, pdfUrl, correctedFrom?

### Ecard
- designId, message, scheduleAt

### Audit
- actor, action, diffs

---

## 17. Notifications
- Email: receipts, failed payments, impact stories, e-cards
- SMS (optional): confirmations, reminders
- Webhooks: donation_created, recurring_failed, receipt_issued

---

## 18. Acceptance Criteria Examples

### One-time Donation with Donor-Covers-Fees
- Total includes additional fee amount
- Payment processor receives correct total
- Receipt shows donation + covered fee split

### Recurring Plan Management
- Donor can modify/pause plan
- Next charge uses updated amount
- Audit and email confirmation generated

### Tribute e-Card Scheduling
- E-card is delivered on scheduled date/time
- Accessible HTML + plain-text fallback

### A/B Variant Testing
- Conversion analytics per variant
- Ability to promote winning version automatically

---

## 19. Out of Scope (v1)
- Full P2P events
- Full ticketing flow
- Deep CRM write-back beyond essential fields

---

## 20. Deliverables
- Product requirements document
- UX wireframes
- API/tRPC schema contract
- Prisma ERD
- Admin MVP (forms, campaigns, receipts)
- CRM, ESP, payment integrations

---

**End of README.**
