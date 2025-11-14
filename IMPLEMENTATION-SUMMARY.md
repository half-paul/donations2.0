# Next.js Frontend Implementation Summary

## Overview
This document outlines the implementation of the Raisin Next donation pages using Next.js App Router, following the PRD and UX specifications.

## File Structure

```
/Users/paul/Documents/development/donations2.0/
├── app/
│   ├── layout.tsx                    # Root layout with TRPCReactProvider
│   ├── globals.css                   # Global styles with Tailwind
│   └── donate/
│       └── [slug]/
│           ├── page.tsx              # Main donation page (SSR)
│           ├── loading.tsx           # Loading state (to be created)
│           ├── error.tsx             # Error boundary (to be created)
│           └── thank-you/
│               └── page.tsx          # Thank you page (to be created)
├── src/
│   ├── components/
│   │   ├── donation/
│   │   │   ├── DonationFlow.tsx      # Main flow orchestrator ✅
│   │   │   ├── CampaignHero.tsx      # To be created
│   │   │   ├── AmountSelector.tsx    # To be created
│   │   │   ├── DonorInformationForm.tsx # To be created
│   │   │   ├── TributeSection.tsx    # To be created
│   │   │   ├── PaymentStep.tsx       # To be created
│   │   │   ├── FeeCoverageCheckbox.tsx # To be created
│   │   │   ├── PaymentFieldsWrapper.tsx # To be created
│   │   │   ├── DonationSummaryCard.tsx # To be created
│   │   │   ├── RecurringToggle.tsx   # To be created
│   │   │   └── ProgressIndicator.tsx # To be created
│   │   └── ui/
│   │       ├── LoadingState.tsx      # To be created
│   │       ├── ErrorMessage.tsx      # To be created
│   │       ├── Button.tsx            # To be created
│   │       ├── TextField.tsx         # To be created
│   │       ├── Checkbox.tsx          # To be created
│   │       └── RadioGroup.tsx        # To be created
│   ├── lib/
│   │   └── utils.ts                  # Utility functions ✅
│   ├── types/
│   │   └── donation.ts               # Type definitions ✅
│   └── trpc/
│       ├── react.tsx                 # Client tRPC provider ✅
│       └── server.ts                 # Server tRPC caller ✅
├── next.config.js                    # Next.js configuration ✅
├── tailwind.config.ts                # Tailwind with design tokens ✅
└── tsconfig.json                     # TypeScript config (existing)
```

## Completed Components

### 1. **App Layout** (`/app/layout.tsx`)
- Root layout with Inter font
- TRPCReactProvider integration
- Security headers
- Accessibility meta tags
- Preconnect to fonts

### 2. **Global Styles** (`/app/globals.css`)
- Tailwind CSS integration
- Design system tokens as CSS variables
- Accessibility focus states
- Reduced motion support
- Loading/skeleton animations
- Print styles

### 3. **Tailwind Configuration** (`/tailwind.config.ts`)
- Complete design token implementation from UX spec
- Custom color palette (primary, success, error, warning, gray scale)
- Typography scale with mobile variants
- 8px grid spacing system
- Border radius scale
- Shadow elevation system
- Transition timing functions
- Responsive breakpoints (xs, sm, md, lg, xl)

### 4. **Next.js Configuration** (`/next.config.js`)
- App Router enabled
- Image optimization (WebP, AVIF)
- Security headers (HSTS, X-Frame-Options, CSP)
- Performance optimizations
- Console log removal in production

### 5. **tRPC Client Setup** (`/src/trpc/react.tsx`)
- React Query integration
- SuperJSON transformer
- HTTP batch link
- Error logging
- Client-side query client singleton

### 6. **tRPC Server Setup** (`/src/trpc/server.ts`)
- Server-side tRPC caller
- Context creation for RSC
- Type-safe server calls

### 7. **Type Definitions** (`/src/types/donation.ts`)
- Complete TypeScript interfaces for:
  - Currency, GiftType, Frequency, TributeType
  - Campaign, DonorInfo, TributeInfo, PaymentInfo
  - DonationFormData (complete form state)
  - Gift, Receipt, RecurringPlan
  - Validation error types

### 8. **Utility Functions** (`/src/lib/utils.ts`)
- `cn()` - Class name merging with Tailwind
- `formatCurrency()` - Locale-aware currency formatting
- `parseCurrency()` - Parse formatted currency strings
- `calculateFee()` - Processing fee calculation
- `formatDate()` / `formatDateShort()` - Date formatting
- `isValidEmail()` / `isValidPhone()` - Validation helpers
- `debounce()` - Debounce function execution
- `generateUUID()` - UUID v4 generation for idempotency
- `calculateProgress()` - Safe progress percentage
- Error handling utilities

### 9. **Donation Page** (`/app/donate/[slug]/page.tsx`)
- Server-side data fetching with tRPC
- Dynamic metadata generation
- ISR with 1-hour revalidation
- Static params generation
- Error handling with notFound()
- Suspense boundary for loading states

### 10. **Donation Flow Component** (`/src/components/donation/DonationFlow.tsx`)
- Multi-step form orchestration
- State management for donation data
- Step navigation (amount → donor-info → payment)
- Form data persistence across steps
- tRPC mutation for donation creation
- Error handling and loading states
- Responsive layout (sidebar summary on desktop)
- Progress indicator integration
- Back navigation

## Components To Be Created

### High Priority (Required for MVP)

1. **AmountSelector** (`/src/components/donation/AmountSelector.tsx`)
   - Preset amount buttons with impact messages
   - Custom amount input
   - One-time vs. recurring toggle
   - Min/max validation
   - Mobile-optimized layout (2-column grid)
   - Keyboard navigation (arrow keys)
   - ARIA radiogroup implementation

2. **DonorInformationForm** (`/src/components/donation/DonorInformationForm.tsx`)
   - First name, last name, email, phone fields
   - Email opt-in checkbox
   - Tribute section (expandable disclosure)
   - Client-side validation with Zod
   - Error display
   - Autocomplete attributes

3. **PaymentStep** (`/src/components/donation/PaymentStep.tsx`)
   - Hosted payment fields integration (Stripe)
   - Fee coverage checkbox
   - Terms agreement
   - Payment processor tabs (Card/PayPal/Apple Pay)
   - Submit button with loading state

4. **DonationSummaryCard** (`/src/components/donation/DonationSummaryCard.tsx`)
   - Campaign name and gift type display
   - Donor information summary
   - Amount breakdown (donation + fee = total)
   - Edit button to previous steps
   - Sticky positioning on desktop
   - Collapsible on mobile

5. **ProgressIndicator** (`/src/components/donation/ProgressIndicator.tsx`)
   - Desktop: Visual stepper with connecting lines
   - Mobile: "Step X of Y" text
   - Completed/current/upcoming states
   - Accessibility (aria-label with progress description)

6. **LoadingState** (`/src/components/ui/LoadingState.tsx`)
   - Full-screen overlay option
   - Centered spinner with message
   - "Processing donation..." text
   - Prevent interactions during loading

7. **ErrorMessage** (`/src/components/ui/ErrorMessage.tsx`)
   - Alert banner with error icon
   - Dismissible option
   - ARIA role="alert"
   - Error Red styling

### Supporting UI Components

8. **Button** (`/src/components/ui/Button.tsx`)
   - Variants: primary, secondary, tertiary, danger
   - Sizes: small, medium, large
   - States: default, hover, focus, active, disabled, loading
   - Icon support (leading/trailing)
   - Full-width option

9. **TextField** (`/src/components/ui/TextField.tsx`)
   - Label, input, helper text, error message
   - States: default, hover, focus, filled, error, disabled
   - Autocomplete support
   - Max length with character counter
   - Type variants (text, email, tel, url)

10. **Checkbox** (`/src/components/ui/Checkbox.tsx`)
    - Custom styled checkbox
    - States: unchecked, checked, indeterminate, disabled
    - Label support (string or ReactNode)
    - Keyboard navigation (Space to toggle)

11. **RadioGroup** (`/src/components/ui/RadioGroup.tsx`)
    - Fieldset with legend
    - Radio button options
    - Vertical/horizontal orientation
    - Keyboard navigation (arrow keys)

## Additional Pages

### Thank You Page (`/app/donate/[slug]/thank-you/page.tsx`)
- Success icon and personalized heading
- Donation details card
- Receipt download link
- Impact messaging
- Social sharing buttons
- "Make Another Donation" CTA
- Recurring plan management link (if applicable)

### Recurring Plan Management (`/app/account/recurring/page.tsx`)
- Authentication required
- List of active/paused/cancelled plans
- Plan details card
- Update amount modal
- Update payment method modal
- Pause/resume/cancel actions
- Charge history table
- Empty state

## Design System Implementation

### Colors
All colors from UX spec implemented in Tailwind config:
- Primary: `#0066CC` (with hover, active, disabled variants)
- Success: `#0D7A4D`
- Warning: `#D97706`
- Error: `#C81E1E`
- Info: `#1E40AF`
- Impact: `#7C3AED`
- Gray scale: 900, 700, 600, 500, 300, 200, 100

### Typography
- Font: Inter (preloaded weights: 400, 500, 600, 700)
- Scale: display-lg, h2, h3, body-lg, body, body-sm, caption, label
- Mobile variants for responsive text

### Spacing
8px grid system: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px), 20 (80px)

### Border Radius
- sm: 4px (inputs)
- md: 8px (buttons, cards)
- lg: 12px (modals)
- xl: 16px (hero cards)
- full: 9999px (pills, badges)

### Shadows
- sm: Elevation 1 (inputs on focus)
- md: Elevation 2 (buttons on hover)
- lg: Elevation 3 (modals)
- xl: Elevation 4 (sticky headers)

### Transitions
- fast: 100ms (hover states)
- default: 150ms (button interactions)
- medium: 250ms (dropdowns)
- slow: 300ms (page transitions)
- delayed: 500ms (confirmations)

## Accessibility Compliance

All components follow WCAG 2.2 AA standards:
- Color contrast: 4.5:1 minimum for text
- Keyboard navigation: Tab order, arrow keys, Enter/Space
- Screen reader support: Semantic HTML, ARIA labels, live regions
- Focus indicators: 3px Primary Blue outline with 2px offset
- Touch targets: 44×44px minimum
- No time limits on donation flow
- Respect `prefers-reduced-motion`
- Form validation with descriptive error messages

## Performance Optimizations

### Image Optimization
- Next.js Image component with responsive srcset
- WebP and AVIF formats
- Lazy loading below-the-fold
- Device sizes: 320px to 3840px

### Code Splitting
- Dynamic imports for non-critical features
- Route-based splitting (automatic with App Router)
- Lazy load payment processor SDKs on payment step

### ISR Configuration
- Campaign pages: Revalidate every 1 hour
- Static generation at build time for top campaigns
- On-demand revalidation for campaign updates

### Bundle Size
- Target: <200KB gzipped
- Tree-shaking enabled
- Remove console logs in production
- Minimize client-side JavaScript

## Security Implementation

### PCI Compliance (SAQ-A-EP)
- No card data storage
- Hosted fields from Stripe/Adyen
- Tokenization before server transmission
- HTTPS only (automatic redirect)

### Headers
- HSTS with preload
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### CSRF Protection
- tRPC handles CSRF tokens automatically
- SameSite cookies

### Input Validation
- Client-side with Zod schemas
- Server-side validation in tRPC procedures
- Sanitization of user inputs

## Testing Strategy

### Unit Tests (Vitest)
- Utility functions in `/src/lib/utils.ts`
- Fee calculation logic
- Currency formatting
- Validation helpers
- Target: >80% coverage

### Component Tests (Vitest)
- Form components with user interactions
- Validation behavior
- Accessibility assertions (axe-core)
- Target: >80% coverage

### E2E Tests (Playwright)
- Complete donation flow (one-time)
- Recurring donation setup
- Error handling scenarios
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing

## API Integration

### tRPC Procedures Used
- `campaign.getBySlug` - Fetch campaign data (SSR)
- `donation.create` - Create donation (client mutation)
- `recurring.create` - Create recurring plan (to be implemented)
- `tribute.create` - Create tribute (if needed separately)

### Mutation Patterns
- Optimistic updates where appropriate
- Error handling with user-friendly messages
- Loading states during submission
- Success redirect to thank-you page

## Deployment Checklist

- [ ] Install dependencies: `pnpm install`
- [ ] Add @tailwindcss/forms: `pnpm add -D @tailwindcss/forms`
- [ ] Add clsx and tailwind-merge: `pnpm add clsx tailwind-merge`
- [ ] Set up environment variables (DATABASE_URL, NEXTAUTH_SECRET, etc.)
- [ ] Run database migrations: `pnpm db:migrate:deploy`
- [ ] Build production: `pnpm build`
- [ ] Run type check: `pnpm type-check`
- [ ] Run tests: `pnpm test`
- [ ] Configure Stripe/Adyen API keys
- [ ] Set up email service provider (SendGrid/Mailchimp)
- [ ] Configure AWS S3 for receipt PDFs
- [ ] Set up monitoring (DataDog/CloudWatch)
- [ ] Configure analytics (GA4, Segment)

## Next Steps

1. **Complete Component Implementation** (High Priority)
   - Create all donation flow components listed above
   - Implement Stripe hosted fields integration
   - Build thank-you page
   - Build recurring plan management page

2. **Testing**
   - Write unit tests for utilities
   - Write component tests
   - Write E2E tests for donation flow
   - Accessibility testing with screen readers

3. **Integration**
   - Connect to payment processors (Stripe/Adyen)
   - Set up receipt PDF generation
   - Configure email service
   - Integrate with CRM/ESP (if applicable)

4. **Performance Optimization**
   - Lighthouse audit (target: >90 Performance, >95 Accessibility)
   - Bundle size analysis
   - Image optimization verification
   - LCP optimization (<2.5s)

5. **Documentation**
   - Component Storybook
   - API documentation
   - Deployment runbook
   - Troubleshooting guide

## Notes

- All components use TypeScript with strict mode
- No `any` types allowed
- Mobile-first responsive design
- Server Components by default, Client Components only when necessary
- Tailwind utility classes preferred over custom CSS
- Feature flags to be implemented with `use-feature-flag` hook
- All monetary amounts use Decimal type in database, Number in TypeScript (with proper rounding)

## File Paths Reference

**Created Files:**
- `/Users/paul/Documents/development/donations2.0/app/layout.tsx`
- `/Users/paul/Documents/development/donations2.0/app/globals.css`
- `/Users/paul/Documents/development/donations2.0/app/donate/[slug]/page.tsx`
- `/Users/paul/Documents/development/donations2.0/src/components/donation/DonationFlow.tsx`
- `/Users/paul/Documents/development/donations2.0/src/types/donation.ts`
- `/Users/paul/Documents/development/donations2.0/src/lib/utils.ts`
- `/Users/paul/Documents/development/donations2.0/src/trpc/react.tsx`
- `/Users/paul/Documents/development/donations2.0/src/trpc/server.ts`
- `/Users/paul/Documents/development/donations2.0/next.config.js`
- `/Users/paul/Documents/development/donations2.0/tailwind.config.ts`

**Existing Server Files:**
- `/Users/paul/Documents/development/donations2.0/src/server/api/routers/donation.ts`
- `/Users/paul/Documents/development/donations2.0/src/server/api/routers/campaign.ts`
- `/Users/paul/Documents/development/donations2.0/src/server/api/routers/recurring.ts`
- `/Users/paul/Documents/development/donations2.0/src/server/api/routers/tribute.ts`

This implementation provides a solid foundation for the donation pages. The remaining components should follow the same patterns and design system established here.
