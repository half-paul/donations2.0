# Edge Cases, Error States & Implementation Handoff
**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-11-13

---

## Executive Summary

This document covers comprehensive edge case handling, error state designs, empty states, and provides a complete handoff checklist for frontend engineers. Every possible user scenario, error condition, and edge case is addressed to ensure a robust, production-ready implementation.

---

## Table of Contents

1. [Edge Cases & Error States](#edge-cases--error-states)
2. [Empty States](#empty-states)
3. [Loading States](#loading-states)
4. [Validation Rules](#validation-rules)
5. [Implementation Handoff](#implementation-handoff)

---

## Edge Cases & Error States

### Amount Selection Edge Cases

#### 1. No Amount Selected
**Scenario**: User clicks "Continue" without selecting amount

**Behavior**:
- Disable "Continue" button (gray background, no cursor)
- Or show inline error: "Please select or enter a donation amount"
- Focus remains on amount section

**Visual**:
```
┌─────────────────────────────────────┐
│  ⚠ Please select a donation amount  │
│  (Error message, Error Red)         │
└─────────────────────────────────────┘
```

---

#### 2. Custom Amount Below Minimum
**Scenario**: User enters $0.50 (min is $1)

**Behavior**:
- On blur: Show error below input
- Border → Error Red
- Error message: "Donation must be at least $1.00"
- Disable "Continue" button

**Visual**:
```
Custom Amount
┌─────────────────────────────────────┐
│ $ 0.50                              │ (Red border)
└─────────────────────────────────────┘
⚠ Donation must be at least $1.00
```

---

#### 3. Custom Amount Above Maximum
**Scenario**: User enters $150,000 (max is $100,000)

**Behavior**:
- On blur: Show error
- Error message: "For donations over $100,000, please contact us at donations@example.org or call 1-800-123-4567"
- Provide alternative contact method

**Visual**:
```
⚠ For donations over $100,000, please contact us at:
  donations@example.org or 1-800-123-4567
```

---

#### 4. Invalid Custom Amount (Non-Numeric)
**Scenario**: User enters "abc" or "ten dollars"

**Behavior**:
- Strip non-numeric characters on input (except decimal point)
- If all characters removed: Show error "Please enter a valid amount"

---

#### 5. Custom Amount with Too Many Decimals
**Scenario**: User enters $100.567

**Behavior**:
- Round to 2 decimal places on blur: $100.57
- Display formatted value with commas: $1,234.56

---

### Donor Information Edge Cases

#### 6. Invalid Email Format
**Scenario**: User enters "john@" or "john.com"

**Behavior**:
- On blur: Validate email format
- Error message: "Please enter a valid email address (e.g., john@example.com)"
- Red border, error icon

**Visual**:
```
Email Address *
┌─────────────────────────────────────┐
│ john@                               │ (Red border, Error tint)
└─────────────────────────────────────┘
⚠ Please enter a valid email address (e.g., john@example.com)
```

---

#### 7. Name with Special Characters
**Scenario**: User enters "John<script>" or "Mary123"

**Behavior**:
- Allow: Letters, spaces, hyphens, apostrophes (e.g., "O'Brien", "Mary-Jane")
- Disallow: Numbers, special characters (<, >, &, etc.)
- Sanitize on backend to prevent XSS
- On blur: Show error if invalid characters
- Error message: "Please enter a valid name using only letters, spaces, hyphens, and apostrophes"

---

#### 8. Empty Required Fields on Submit
**Scenario**: User clicks "Continue" with empty first name, last name, or email

**Behavior**:
- Show error message below each empty field
- Error summary at top: "Please correct 3 errors below"
- Focus first error field
- Disable "Continue" button or allow click with validation

**Visual**:
```
┌─────────────────────────────────────┐
│ ⚠ Please correct 3 errors below:    │
│   • First name is required          │
│   • Last name is required           │
│   • Email address is required       │
└─────────────────────────────────────┘

First Name *
┌─────────────────────────────────────┐
│                                     │ (Red border)
└─────────────────────────────────────┘
⚠ First name is required
```

---

#### 9. Phone Number Invalid Format
**Scenario**: User enters "123" or "(555) 1234"

**Behavior**:
- Phone is optional, so no error if empty
- If entered: Validate E.164 format (e.g., +12025551234)
- Allow formatting: (202) 555-1234, 202-555-1234
- Strip formatting and validate on blur
- Error message: "Please enter a valid phone number (e.g., (202) 555-1234)"

---

#### 10. Email Opt-In Unchecked (Default)
**Scenario**: User leaves checkbox unchecked

**Behavior**:
- This is the default and compliant with GDPR
- No error, user has opted out
- Store emailOptIn: false in database
- Do not send marketing emails (only transactional receipts)

---

### Tribute Gift Edge Cases

#### 11. Tribute Expanded but Honoree Name Empty
**Scenario**: User expands tribute section but doesn't fill honoree name

**Behavior**:
- On submit: Show error below honoree name field
- Error message: "Please enter the honoree's name, or collapse this section if not making a tribute gift"
- Or auto-collapse section if all fields empty

---

#### 12. E-Card Checked but Recipient Info Missing
**Scenario**: User checks "Send e-card" but doesn't enter recipient email

**Behavior**:
- On submit: Show error
- Error message: "Please enter the recipient's email address, or uncheck 'Send e-card'"

---

#### 13. E-Card Send Date in Past
**Scenario**: User selects yesterday's date for e-card delivery

**Behavior**:
- Date picker: Disable past dates (min date = today)
- If somehow selected: Show error "E-card send date must be today or in the future"

---

#### 14. Tribute Message Exceeds 500 Characters
**Scenario**: User types 550 characters

**Behavior**:
- Prevent input beyond 500 characters (maxlength attribute)
- Character counter updates in real-time: "500 / 500 characters"
- Do not allow additional input

---

### Payment Step Edge Cases

#### 15. Hosted Field Validation Errors
**Scenario**: User enters invalid card number, expired card, or incorrect CVC

**Behavior**:
- Processor (Stripe/Adyen) returns error in real-time
- Display error below respective field
- Common errors:
  - "Your card number is incomplete"
  - "Your card's expiration date is in the past"
  - "Your card's security code is incomplete"
  - "Your postal code is incomplete"
- Red border on field, error icon

**Visual**:
```
Card Number *
┌─────────────────────────────────────┐
│ 1234 5678                           │ (Red border)
└─────────────────────────────────────┘
⚠ Your card number is incomplete
```

---

#### 16. Payment Declined by Bank
**Scenario**: User submits, processor returns "card_declined"

**Behavior**:
- Show error screen (full-page or modal)
- Heading: "Payment Could Not Be Processed"
- Error message: "Your card was declined. Please try again with a different payment method or contact your bank."
- CTA: "Try Again" button (returns to payment step, preserves form data)
- Secondary CTA: "Contact Support"
- Log error in database (Gift status: failed)
- Analytics: donation_failed event

**Visual**:
```
┌─────────────────────────────────────┐
│                                     │
│         ✕ (Red X icon)              │
│                                     │
│  Payment Could Not Be Processed     │
│  ═══════════════════════════        │
│                                     │
│  Your card was declined. Please try │
│  again with a different payment     │
│  method or contact your bank.       │
│                                     │
│  Common reasons:                    │
│  • Insufficient funds               │
│  • Incorrect card details           │
│  • Card expired                     │
│  • Fraud prevention hold            │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Try Again                   │   │
│  │  (Primary button)            │   │
│  └──────────────────────────────┘   │
│                                     │
│  [Contact Support]                  │
│  (Tertiary link)                    │
│                                     │
└─────────────────────────────────────┘
```

---

#### 17. Insufficient Funds
**Scenario**: Processor returns "insufficient_funds"

**Behavior**:
- Error screen similar to declined card
- Error message: "Your card has insufficient funds. Please try a different payment method."
- Suggest alternative: "Consider reducing your donation amount or using a different card."

---

#### 18. Network Error During Submission
**Scenario**: Internet connection lost while processing

**Behavior**:
- Show error after timeout (30 seconds)
- Error message: "Connection lost. Please check your internet and try again."
- CTA: "Try Again" (uses same idempotency key to prevent duplicate charge)
- User data preserved (donor info, amount, tribute)

**Visual**:
```
┌─────────────────────────────────────┐
│  ⚠ Connection Lost                  │
│                                     │
│  Please check your internet         │
│  connection and try again.          │
│                                     │
│  Your information has been saved    │
│  and you won't be charged twice.    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Try Again                   │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

#### 19. Server Error (500)
**Scenario**: Backend crashes during donation processing

**Behavior**:
- Error screen: "Something went wrong on our end"
- Error message: "We're experiencing technical difficulties. Your card has not been charged. Please try again in a few minutes or contact support."
- CTA: "Try Again" or "Contact Support"
- Log error with stack trace
- Alert engineering team (PagerDuty, Sentry)

**Visual**:
```
┌─────────────────────────────────────┐
│  ⚠ Something Went Wrong             │
│                                     │
│  We're experiencing technical       │
│  difficulties. Your card has not    │
│  been charged.                      │
│                                     │
│  Please try again in a few minutes  │
│  or contact our support team:       │
│  support@example.org                │
│  1-800-123-4567                     │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Try Again                   │   │
│  └──────────────────────────────┘   │
│                                     │
│  [Contact Support]                  │
│                                     │
└─────────────────────────────────────┘
```

---

#### 20. Duplicate Submission (Idempotency)
**Scenario**: User double-clicks "Donate" button or clicks back and retries

**Behavior**:
- Generate idempotency key (UUID) on client before first submission
- Send with request header: `Idempotency-Key: [uuid]`
- Backend checks: If key exists, return existing transaction (don't charge twice)
- User sees confirmation screen for existing donation
- No new charge created

---

#### 21. Session Timeout
**Scenario**: User idle for 30+ minutes, session expired

**Behavior**:
- Detect session expiration on submit
- Show modal: "Your session has expired for security reasons"
- CTA: "Refresh Page" (reloads page, clears state)
- Or auto-save state to localStorage and restore after refresh

**Visual**:
```
┌─────────────────────────────────────┐
│  Your Session Has Expired           │
│  ═══════════════════════             │
│                                     │
│  For your security, your session    │
│  has expired after 30 minutes of    │
│  inactivity.                        │
│                                     │
│  Please refresh the page to start   │
│  a new donation.                    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Refresh Page                │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

#### 22. Fee Coverage Calculation Error
**Scenario**: Fee amount calculated incorrectly or cannot be determined

**Behavior**:
- Fallback: Disable fee coverage option
- Show message: "Fee coverage is temporarily unavailable"
- Allow donation to proceed without fee coverage

---

### Recurring Donation Edge Cases

#### 23. First Charge Fails on Recurring Setup
**Scenario**: User sets up monthly gift, but first charge declined

**Behavior**:
- Show error screen immediately (same as one-time failure)
- RecurringPlan not created (or created with status: failed)
- User can retry with different payment method
- Do not create mandate/subscription until first charge succeeds

---

#### 24. Subsequent Recurring Charge Fails
**Scenario**: Monthly charge fails after initial success (e.g., expired card)

**Behavior**:
- Processor webhook notifies backend of failure
- Email sent to donor: "We couldn't process your monthly gift"
- Email includes link to update payment method
- Recurring plan status: paused (or failed_charge)
- Donor portal shows alert: "Action required: Update payment method"

**Email Template**:
```
Subject: Action Required: Update Your Monthly Gift Payment Method

Hi [FirstName],

We couldn't process your monthly gift of $50.00 to [Org Name] on [Date].

Reason: [Card expired / Insufficient funds / Card declined]

To continue your monthly support:
1. Update your payment method at: [link]
2. We'll automatically retry your donation

Thank you for your continued support!

[Org Name] Team
```

---

#### 25. Update Payment Method Fails
**Scenario**: New card entered in recurring portal fails validation

**Behavior**:
- Show inline error below card field (same as donation payment step)
- Do not update RecurringPlan paymentMethodId
- Keep old payment method active
- User can retry

---

#### 26. Cancel Recurring Plan While Charge Pending
**Scenario**: User cancels plan the same day as scheduled charge

**Behavior**:
- Options:
  - Cancel immediately: Attempt to stop charge, may process if already submitted
  - Cancel after next charge: Next charge processes, then plan cancelled
- Clearly communicate: "Your next charge will process on [Date], then your gift will be cancelled"
- Send confirmation email

---

### Donor Portal Edge Cases

#### 27. Unauthenticated Access to Recurring Management
**Scenario**: User clicks "Manage recurring gift" link but not logged in

**Behavior**:
- Redirect to /login?redirect=/account/recurring/[plan-id]
- Show login form: "Sign in to manage your recurring gift"
- Magic link login: Send link to donor's email
- After login: Redirect back to plan detail page

---

#### 28. Authenticated User Tries to Access Another User's Plan
**Scenario**: User A tries to access /account/recurring/[user-b-plan-id]

**Behavior**:
- Backend: Check if user ID matches plan owner
- If mismatch: Return 403 Forbidden
- Show error page: "You don't have access to this recurring plan"
- CTA: "View Your Recurring Gifts" (links to user's own plans)

---

#### 29. Plan Already Cancelled
**Scenario**: User clicks "Cancel Plan" on already-cancelled plan

**Behavior**:
- Disable "Cancel Plan" button (or hide it)
- Show status badge: "Cancelled"
- Display message: "This gift was cancelled on [Date]"
- CTA: "Start a New Monthly Gift"

---

#### 30. No Active Recurring Plans
**Scenario**: User accesses /account/recurring with no active plans

**Behavior**:
- Show empty state (see Empty States section below)

---

### Confirmation Page Edge Cases

#### 31. Receipt PDF Generation Fails
**Scenario**: Backend fails to generate PDF

**Behavior**:
- Confirmation page still shows (donation was successful)
- Instead of "View PDF" button: "Receipt pending"
- Message: "Your receipt will be emailed within 24 hours"
- Fallback: HTML receipt embedded in email

---

#### 32. Confirmation Email Fails to Send
**Scenario**: Email service down, email not delivered

**Behavior**:
- Donation still successful
- Show message: "Your receipt will be sent shortly to [email]"
- Backend retries email send (exponential backoff)
- If retries fail: Queue for manual send
- User can always view receipt in donor portal

---

#### 33. Social Sharing Fails
**Scenario**: Facebook API down, share dialog doesn't open

**Behavior**:
- Graceful degradation: Copy link to clipboard
- Show toast: "Link copied to clipboard! Share it with your friends."
- Or fallback to mailto: email link

---

### General Edge Cases

#### 34. JavaScript Disabled
**Scenario**: User has JavaScript disabled or blocked

**Behavior**:
- Core donation flow still works (progressive enhancement)
- Form submits to server (traditional POST)
- Validation on server side
- Page reloads show errors
- Payment processor may require JavaScript (graceful error)

---

#### 35. Old Browser (IE11)
**Scenario**: User on Internet Explorer 11 or other unsupported browser

**Behavior**:
- Show banner: "For the best experience, please use a modern browser like Chrome, Firefox, Safari, or Edge"
- Allow user to proceed (progressive enhancement)
- Or block completely if payment processor doesn't support old browsers

---

#### 36. Ad Blocker Blocks Payment Processor
**Scenario**: uBlock Origin blocks Stripe.js script

**Behavior**:
- Detect script loading failure
- Show error: "Payment processor blocked. Please disable your ad blocker for this site to complete your donation."
- Provide instructions or alternative contact method

---

#### 37. Mobile Safari Private Mode Storage Issues
**Scenario**: localStorage unavailable in private mode

**Behavior**:
- Detect storage unavailable
- Fallback to session storage or no storage
- Do not store sensitive data (only form progress)
- User may need to re-enter info if they navigate away

---

#### 38. Very Long Names or Messages
**Scenario**: User enters 200-character first name or 5000-character message (beyond max)

**Behavior**:
- Enforce maxlength attribute on inputs (hard limit)
- If backend receives oversized input: Truncate and log warning
- Validation message: "First name cannot exceed 100 characters"

---

#### 39. Currency Mismatch
**Scenario**: Campaign configured for CAD, but user's browser/location suggests USD

**Behavior**:
- Always use campaign's configured currency
- Display currency clearly: "CAD $100.00" or "$100.00 CAD"
- No automatic currency conversion (too complex)

---

#### 40. Multiple Tabs Open
**Scenario**: User opens donation page in multiple tabs, starts donation in both

**Behavior**:
- Each tab has independent state (don't sync across tabs)
- Both donations allowed (user intent unclear)
- Or use BroadcastChannel API to warn: "You have another donation in progress in another tab"

---

## Empty States

### No Recurring Plans
**Context**: User accesses /account/recurring with no recurring plans

**Visual**:
```
┌─────────────────────────────────────┐
│                                     │
│         [Heart Icon]                │
│         (64px, Gray 400)            │
│                                     │
│    No recurring gifts yet           │
│    ───────────────────              │
│    (Heading 3, Gray 700)            │
│                                     │
│    Set up a monthly gift to make a  │
│    lasting impact on our mission.   │
│    (Body Regular, Gray 600)         │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  Start a Monthly Gift       │  │
│    │  (Primary button)           │  │
│    └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Content**:
- Icon: Heart (outline, 64px, Gray 400)
- Heading: "No recurring gifts yet"
- Body: Encourage action, explain benefit
- CTA: "Start a Monthly Gift" → links to /donate/[campaign]?type=recurring

---

### No Charge History
**Context**: Recurring plan exists, but no charges yet (brand new plan)

**Visual**:
```
┌─────────────────────────────────────┐
│  Charge History                     │
│  ──────────────                     │
│                                     │
│  Your first charge is scheduled for │
│  December 13, 2025.                 │
│                                     │
│  You'll see your charge history     │
│  here after your first donation.    │
│                                     │
└─────────────────────────────────────┘
```

---

### Campaign Has No Goal (Thermometer)
**Context**: Campaign exists but no fundraising goal set

**Visual**:
- Hide thermometer entirely
- Or show message: "Support our mission with your gift today"
- Do not show "0% of goal"

---

### No Tribute (Default State)
**Context**: Tribute section collapsed by default

**Visual**:
```
▸ Make this a tribute gift
  (Disclosure button, collapsed)
```

---

### No E-Card (Default State)
**Context**: E-card checkbox unchecked

**Visual**:
```
□ Send an e-card notification
  (Checkbox, unchecked)
```

---

## Loading States

### Page Load (Initial)
**Visual**: Skeleton screens matching layout

**Amount Selection Skeleton**:
```
┌─────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓ (Campaign name)         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (Description)      │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │▓▓▓▓│ │▓▓▓▓│ │▓▓▓▓│ │▓▓▓▓│       │
│  └────┘ └────┘ └────┘ └────┘       │
│  (Amount buttons)                   │
└─────────────────────────────────────┘
```

**Animation**: Shimmer effect (1.5s loop)

---

### Button Loading (Submit, Save)
**Visual**: Spinner inside button

**Before**:
```
┌──────────────────────────────┐
│  Donate $100.00  →           │
└──────────────────────────────┘
```

**During**:
```
┌──────────────────────────────┐
│  ◌◌◌ Processing donation...  │
│  (Spinner + text)            │
└──────────────────────────────┘
(Button disabled, cursor: wait)
```

**Spinner**: 20px, white color (on primary button), rotates 1s linear infinite

---

### Inline Loading (Fee Calculation)
**Visual**: Small spinner next to updating value

```
Total: ◌◌◌ Calculating...
       (16px spinner)
```

Or instant update (no spinner needed if fast)

---

### Full-Screen Processing (Payment Submission)
**Visual**: Modal overlay with large spinner (see Processing State wireframe)

```
┌─────────────────────────────────────┐
│                                     │
│         ◌◌◌◌◌◌◌◌◌                   │
│         (64px spinner)              │
│                                     │
│    Processing your donation...      │
│                                     │
│    Please don't close this window   │
│                                     │
└─────────────────────────────────────┘
```

**Backdrop**: Semi-transparent white or black
**Duration**: Until response received (max 30s timeout)

---

### Lazy Loading (Images, Charge History)
**Visual**: Skeleton placeholder until content loads

**Image**:
```
┌─────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  (Shimmer animation)                │
└─────────────────────────────────────┘
```

**Charge History (Pagination)**:
```
[Load More] button:
┌──────────────────────────────┐
│  ◌◌◌ Loading...              │
└──────────────────────────────┘
```

---

## Validation Rules

### Client-Side Validation

**Amount**:
- Min: $1.00
- Max: $100,000.00
- Regex: `/^\d{1,6}(\.\d{0,2})?$/` (up to 6 digits, optional 2 decimals)
- Invalid: Negative numbers, letters, special characters

**First Name / Last Name**:
- Required: Yes
- Min length: 1
- Max length: 100
- Regex: `/^[a-zA-Z\s'\-]+$/` (letters, spaces, apostrophes, hyphens)
- Examples: "Mary", "O'Brien", "Mary-Jane", "José García"
- Invalid: Numbers, special characters (<, >, &, etc.)

**Email**:
- Required: Yes
- Max length: 254 (per RFC 5321)
- Regex (basic): `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Better: Use email validation library (e.g., validator.js)
- Examples: "john@example.com", "mary.smith+donations@gmail.com"
- Invalid: "john@", "@example.com", "john.com"

**Phone**:
- Required: No (optional field)
- Format: E.164 (e.g., +12025551234)
- Allow formats: (202) 555-1234, 202-555-1234, +1-202-555-1234
- Strip formatting before validation
- Regex: `/^\+?[1-9]\d{1,14}$/`
- Invalid: Too short (< 7 digits), too long (> 15 digits)

**Honoree Name** (if tribute):
- Required: Yes (if tribute section expanded)
- Min length: 1
- Max length: 100
- Same regex as First Name

**Tribute Message**:
- Required: No
- Max length: 500
- Allow: Letters, numbers, punctuation, emojis
- Sanitize on backend (prevent XSS)

**E-Card Recipient Email** (if e-card selected):
- Required: Yes (if e-card checkbox checked)
- Same validation as donor email

**E-Card Personal Message**:
- Required: No
- Max length: 250

**Card Number** (hosted field):
- Validation by payment processor
- Luhn algorithm check
- Card brand detection (Visa, Mastercard, Amex, etc.)

**Expiry**:
- Format: MM/YY
- Validation: Not in past
- Processor handles validation

**CVC**:
- Length: 3 digits (Visa, MC, Discover), 4 digits (Amex)
- Processor handles validation

**Postal Code**:
- Format varies by country
- US: 5 digits (12345) or 9 digits (12345-6789)
- Canada: A1A 1A1
- Processor handles validation

---

### Server-Side Validation

**All client-side validations repeated on server** (never trust client)

**Additional server-side checks**:
- CSRF token validation
- Rate limiting (max 5 donation attempts per 15 min per IP)
- Idempotency key uniqueness
- Campaign exists and is active
- Payment processor account valid
- Donor email not on blocklist (spam prevention)
- Amount within processor limits (Stripe: $0.50 - $999,999.99)
- Sanitize all text inputs (XSS prevention)
- No SQL injection (use parameterized queries)

---

### Validation Error Messages

**Tone**: Friendly, helpful, actionable

**Examples**:
- Good: "Please enter your email address so we can send your receipt."
- Bad: "Email required"

- Good: "Please enter a valid email address (e.g., john@example.com)"
- Bad: "Invalid email format"

- Good: "Your card number is incomplete. Please check and try again."
- Bad: "Error: card_incomplete"

- Good: "Donation must be at least $1.00"
- Bad: "Minimum amount: 1"

---

## Implementation Handoff

### Deliverables Checklist

#### For Frontend Engineers

**Documents Provided**:
- [x] Design System & Brand Tokens (`UX-design-system.md`)
- [x] Information Architecture & User Flows (`UX-information-architecture.md`)
- [x] Wireframes & Screen Specifications (`UX-wireframes.md`)
- [x] Component Specifications (`UX-component-specifications.md`)
- [x] Accessibility Guide (`UX-accessibility-guide.md`)
- [x] Edge Cases & Error States (this document)

**Design Assets** (if applicable):
- [ ] High-fidelity mockups (Figma, Sketch, Adobe XD)
- [ ] Icon SVG files (exported from design tool)
- [ ] Campaign hero images (optimized WebP + JPEG fallbacks)
- [ ] Social sharing preview images (OG images)

**Design Tokens**:
- [ ] Colors (hex values, CSS custom properties)
- [ ] Typography (font family, sizes, weights, line heights)
- [ ] Spacing scale (8px grid system)
- [ ] Border radius values
- [ ] Shadow values (box-shadow CSS)
- [ ] Breakpoints (mobile, tablet, desktop)

---

### Development Environment Setup

**Required Tools**:
1. Node.js 18+ (check with `node -v`)
2. Package manager (npm, yarn, pnpm)
3. Git (for version control)
4. Code editor (VS Code recommended)
5. Browser DevTools (Chrome, Firefox)

**Recommended Extensions (VS Code)**:
- ESLint (code linting)
- Prettier (code formatting)
- Tailwind CSS IntelliSense (if using Tailwind)
- Axe Accessibility Linter (a11y checks)
- Error Lens (inline error messages)

---

### Tech Stack Recommendations

**Frontend Framework**:
- React 18+ (with Next.js 14+ for SSR/SSG)
- Or Vue 3 / Svelte (per project requirements)

**Styling**:
- TailwindCSS (utility-first, matches design tokens)
- Or CSS Modules (scoped styles)
- Or Styled Components (CSS-in-JS)

**Form Management**:
- React Hook Form (performance, validation)
- Or Formik (mature, feature-rich)

**State Management**:
- Zustand (lightweight, simple)
- Or React Context (built-in, sufficient for donation flow)
- Or Redux Toolkit (if global state needed)

**Payment Integration**:
- Stripe: `@stripe/stripe-js`, `@stripe/react-stripe-js`
- Adyen: `@adyen/adyen-web`
- PayPal: `@paypal/react-paypal-js`

**Accessibility**:
- Headless UI (accessible primitives: Dialog, Disclosure, Tabs)
- Or Radix UI (React primitives with a11y)
- Axe-core (automated a11y testing)

**Validation**:
- Zod (schema validation, TypeScript support)
- Or Yup (schema validation)
- validator.js (email, phone format validation)

**HTTP Client**:
- tRPC (type-safe API calls, recommended if using tRPC backend)
- Or Axios (traditional REST client)

**Analytics**:
- Google Analytics 4 (or Segment, Mixpanel)
- Custom event tracking (see analytics events in IA doc)

**Testing**:
- Jest (unit tests)
- React Testing Library (component tests)
- Playwright or Cypress (E2E tests)
- jest-axe (accessibility tests)

---

### Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- [ ] Set up project (Next.js, Tailwind, ESLint, Prettier)
- [ ] Implement design system:
  - [ ] Define color tokens (CSS custom properties or Tailwind config)
  - [ ] Define typography scale
  - [ ] Create base components (Button, TextField, Checkbox)
- [ ] Set up routing (Next.js pages or React Router)
- [ ] Configure payment processor SDK (Stripe/Adyen in test mode)
- [ ] Set up state management (Context or Zustand)

#### Phase 2: Core Donation Flow (Week 3-4)
- [ ] Screen 1: Amount Selection
  - [ ] AmountSelector component
  - [ ] Campaign hero display
  - [ ] Goal thermometer (if applicable)
  - [ ] Gift type toggle (one-time / recurring)
  - [ ] Navigation to donor info
- [ ] Screen 2: Donor Information
  - [ ] Form fields (name, email, phone)
  - [ ] Email opt-in checkbox
  - [ ] Tribute expandable section
  - [ ] E-card sub-form (if tribute)
  - [ ] Validation (client-side)
  - [ ] Navigation to payment
- [ ] Screen 3: Payment
  - [ ] Donation summary sidebar
  - [ ] Payment method tabs
  - [ ] Hosted payment fields integration
  - [ ] Fee coverage checkbox
  - [ ] Submit to processor API
  - [ ] Processing state (full-screen spinner)

#### Phase 3: Confirmation & Receipts (Week 5)
- [ ] Screen 4: Thank You / Confirmation
  - [ ] Success message
  - [ ] Donation details card
  - [ ] Impact message
  - [ ] Social sharing buttons
  - [ ] Receipt PDF generation (backend)
  - [ ] Email confirmation trigger
- [ ] Receipt display/download

#### Phase 4: Recurring Management (Week 6-7)
- [ ] Authentication (magic link or OAuth)
- [ ] Donor portal: Recurring plans list
- [ ] Plan detail page
- [ ] Update amount modal
- [ ] Update payment method modal
- [ ] Pause plan flow
- [ ] Cancel plan flow (multi-step retention)
- [ ] Charge history table

#### Phase 5: Error Handling & Edge Cases (Week 8)
- [ ] Implement all error states (see Edge Cases section)
- [ ] Empty states
- [ ] Loading states (skeletons, spinners)
- [ ] Validation error messages (all fields)
- [ ] Payment decline handling
- [ ] Network error handling
- [ ] Session timeout handling
- [ ] Idempotency (duplicate prevention)

#### Phase 6: Accessibility (Week 9)
- [ ] Keyboard navigation (complete flow without mouse)
- [ ] Focus management (modals, navigation)
- [ ] ARIA attributes (all components)
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Color contrast verification (all text and UI)
- [ ] Semantic HTML (landmarks, headings)
- [ ] Error announcements (aria-live regions)
- [ ] Run axe DevTools scan (fix all violations)

#### Phase 7: Testing & Optimization (Week 10)
- [ ] Unit tests (components, utilities)
- [ ] Integration tests (form submission, API calls)
- [ ] E2E tests (complete donation flow, Playwright/Cypress)
- [ ] Accessibility tests (jest-axe)
- [ ] Performance optimization:
  - [ ] Code splitting (route-based)
  - [ ] Lazy loading (images, non-critical components)
  - [ ] Image optimization (WebP, responsive sizes)
  - [ ] Bundle size analysis (webpack-bundle-analyzer)
  - [ ] Lighthouse audit (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Chrome Android)

#### Phase 8: Deployment Prep (Week 11)
- [ ] Environment configuration (dev, staging, production)
- [ ] Payment processor (switch to live mode)
- [ ] Analytics setup (Google Analytics, custom events)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Performance monitoring (Vercel Analytics, New Relic)
- [ ] Security review:
  - [ ] HTTPS enforced
  - [ ] CSRF protection
  - [ ] Rate limiting
  - [ ] Input sanitization
  - [ ] PCI compliance (SAQ-A-EP)
- [ ] Final QA (full regression testing)

---

### Code Organization

**Recommended Folder Structure**:
```
/donations2.0
├── /app (Next.js 14 app directory)
│   ├── /donate/[campaign]
│   │   ├── page.tsx (Amount selection)
│   │   ├── loading.tsx (Skeleton)
│   │   └── error.tsx (Error boundary)
│   ├── /account/recurring
│   │   ├── page.tsx (Plans list)
│   │   └── /[planId]/page.tsx (Plan detail)
│   └── /api (API routes)
│       ├── /donations/route.ts
│       ├── /webhooks/stripe/route.ts
│       └── /campaigns/[slug]/route.ts
├── /components
│   ├── /forms
│   │   ├── AmountSelector.tsx
│   │   ├── TextField.tsx
│   │   ├── Checkbox.tsx
│   │   └── RadioGroup.tsx
│   ├── /buttons
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   └── IconButton.tsx
│   ├── /layout
│   │   ├── ProgressIndicator.tsx
│   │   ├── DonationSummaryCard.tsx
│   │   └── Header.tsx
│   ├── /feedback
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── Toast.tsx
│   └── /payment
│       ├── HostedPaymentFields.tsx
│       └── FeeCoverageCheckbox.tsx
├── /lib
│   ├── /validation
│   │   ├── donorSchema.ts (Zod schemas)
│   │   └── amountSchema.ts
│   ├── /api
│   │   ├── donations.ts (API client)
│   │   └── payments.ts
│   └── /utils
│       ├── formatCurrency.ts
│       └── analytics.ts
├── /hooks
│   ├── useDonationFlow.ts (State management)
│   ├── usePaymentProcessor.ts
│   └── useValidation.ts
├── /styles
│   ├── globals.css (Tailwind imports, CSS custom properties)
│   └── tokens.css (Design tokens as CSS variables)
├── /public
│   ├── /images (Optimized campaign images)
│   └── /icons (SVG icons)
└── /tests
    ├── /unit (Component tests)
    ├── /integration (API tests)
    └── /e2e (Playwright tests)
```

---

### Component Implementation Priorities

**Critical Path (implement first)**:
1. AmountSelector
2. TextField
3. PrimaryButton
4. ProgressIndicator
5. HostedPaymentFields
6. DonationSummaryCard
7. LoadingSpinner
8. ErrorMessage

**Secondary**:
9. Checkbox
10. RadioGroup
11. Textarea
12. SecondaryButton
13. Modal/Dialog
14. Disclosure (expandable)
15. Tabs
16. Toast

**Nice-to-Have**:
17. SkeletonLoader
18. GoalThermometer
19. SocialShare
20. ReceiptDisplay

---

### Testing Strategy

#### Unit Tests (Jest + React Testing Library)
**Coverage target**: 80%+

**Test each component**:
- Rendering with props
- All states (default, hover, focus, error, disabled, loading)
- User interactions (click, type, focus, blur)
- Validation logic
- Accessibility (aria attributes, keyboard navigation)

**Example**:
```typescript
describe('AmountSelector', () => {
  it('renders preset amounts', () => {
    render(<AmountSelector presetAmounts={[25, 50, 100]} ... />);
    expect(screen.getByText('$25')).toBeInTheDocument();
  });

  it('selects amount on click', () => {
    const handleChange = jest.fn();
    render(<AmountSelector onAmountChange={handleChange} ... />);
    fireEvent.click(screen.getByText('$50'));
    expect(handleChange).toHaveBeenCalledWith(50);
  });

  it('validates custom amount', () => {
    render(<AmountSelector ... />);
    const input = screen.getByLabelText('Custom Amount');
    fireEvent.change(input, { target: { value: '0.50' } });
    fireEvent.blur(input);
    expect(screen.getByText(/at least \$1/i)).toBeInTheDocument();
  });
});
```

#### Accessibility Tests (jest-axe)
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('AmountSelector a11y', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<AmountSelector ... />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### Integration Tests
- Form submission (all steps)
- API calls (mock responses)
- State management (Context/Zustand)
- Payment processor integration (mock Stripe/Adyen)
- Error handling (mock error responses)

#### E2E Tests (Playwright)
**Critical user journeys**:
1. One-time donation (happy path)
2. Recurring donation setup
3. Tribute donation with e-card
4. Payment decline → retry
5. Network error → retry
6. Form validation errors
7. Recurring plan cancellation

**Example** (Playwright):
```typescript
test('complete one-time donation', async ({ page }) => {
  await page.goto('/donate/spring-campaign');

  // Select amount
  await page.click('text=$100');
  await page.click('text=Continue');

  // Enter donor info
  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('text=Continue to Payment');

  // Enter payment (using test card)
  await page.frameLocator('iframe[name*="card"]').fill('[name="cardNumber"]', '4242424242424242');
  await page.frameLocator('iframe[name*="exp"]').fill('[name="exp-date"]', '12/25');
  await page.frameLocator('iframe[name*="cvc"]').fill('[name="cvc"]', '123');
  await page.fill('[name="postal"]', '12345');

  // Submit
  await page.click('text=Donate $100.00');

  // Wait for confirmation
  await page.waitForURL('**/confirmation*');
  await expect(page.locator('text=Thank You')).toBeVisible();
});
```

---

### Performance Checklist

**Core Web Vitals Targets**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Optimization Techniques**:
- [ ] Code splitting (Next.js automatic, or React.lazy)
- [ ] Image optimization (Next.js Image component, WebP format)
- [ ] Lazy loading (below-the-fold content)
- [ ] Preload critical resources (fonts, hero image)
- [ ] Defer non-critical scripts (analytics, social sharing)
- [ ] Minimize bundle size (tree shaking, no unused deps)
- [ ] Server-side rendering (Next.js SSR/SSG)
- [ ] Edge caching (Vercel Edge, Cloudflare)
- [ ] Compression (Gzip, Brotli)
- [ ] Font optimization (subset, preload, font-display: swap)

**Lighthouse Audit**:
- Run audit in Chrome DevTools
- Target: 90+ score for Performance, Accessibility, Best Practices
- Fix flagged issues

---

### Security Checklist

**Client-Side**:
- [ ] No sensitive data in localStorage (only progress state)
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] CSRF token in all state-changing requests
- [ ] Input sanitization (prevent XSS)
- [ ] No inline scripts (CSP: script-src 'self')
- [ ] Subresource Integrity (SRI) for CDN scripts

**Payment Security**:
- [ ] PCI SAQ-A-EP compliance (hosted fields only)
- [ ] No card data touches application (tokenized only)
- [ ] Processor SDK loaded over HTTPS
- [ ] Idempotency keys (prevent duplicate charges)
- [ ] Rate limiting (prevent abuse)

**Backend**:
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Validate all inputs server-side (don't trust client)
- [ ] Secrets in environment variables (never commit)
- [ ] HMAC signature verification (webhooks)
- [ ] Audit logging (all state changes)
- [ ] Error handling (don't leak stack traces to client)

---

### Deployment Checklist

**Pre-Launch**:
- [ ] Code review (2+ approvals)
- [ ] All tests passing (unit, integration, E2E, a11y)
- [ ] Lighthouse audit (90+ scores)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS, Android)
- [ ] Accessibility testing (VoiceOver, NVDA)
- [ ] Security review (PCI compliance, OWASP top 10)
- [ ] Performance testing (load time, stress test)
- [ ] Staging deployment (full regression test)
- [ ] Payment processor in live mode (Stripe/Adyen)
- [ ] Analytics configured (GA4, custom events)
- [ ] Error tracking enabled (Sentry)
- [ ] Monitoring alerts (downtime, errors, performance)

**Launch**:
- [ ] Deploy to production (blue-green or canary release)
- [ ] Smoke test (critical paths)
- [ ] Monitor error rates (first 24 hours)
- [ ] Monitor analytics (donation_started, donation_completed)
- [ ] Monitor performance (Core Web Vitals)
- [ ] Test on production (real credit card test)

**Post-Launch**:
- [ ] User feedback (survey, support tickets)
- [ ] A/B testing (amount presets, fee messaging, button text)
- [ ] Iteration (fix bugs, optimize conversion)

---

### Communication & Support

**Questions During Implementation**:
- Contact: [UX Architect name/email]
- Response time: 24-48 hours
- Design clarifications: [Figma/Sketch link] with comments
- Slack channel: #donation-ux (if applicable)

**Design System Updates**:
- Version control: Design system versioned (1.0, 1.1, etc.)
- Breaking changes: Major version bump, migration guide provided
- Non-breaking additions: Minor version bump, backward compatible

**Handoff Meeting**:
- Schedule 90-minute walkthrough with frontend team
- Review all documents, answer questions
- Demo interactive prototype (if available)
- Clarify ambiguities, edge cases

---

## Success Criteria

**Launch Readiness**:
- [ ] All acceptance criteria from PRD met
- [ ] WCAG 2.2 AA compliance verified (axe scan clean)
- [ ] Core Web Vitals meet targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] All critical paths tested (E2E tests passing)
- [ ] Payment processor integration working (live mode)
- [ ] Error handling robust (all edge cases covered)
- [ ] Security review passed (PCI SAQ-A-EP, OWASP)

**Post-Launch Success**:
- [ ] Conversion rate: 35%+ (donation_completed / donation_started)
- [ ] Abandonment rate: < 30% (started but not completed)
- [ ] Fee-cover rate: 40%+ (users checking "cover fees")
- [ ] Recurring uptake: 25%+ (recurring donations / total donations)
- [ ] Page performance: 90+ Lighthouse score
- [ ] Accessibility: 0 critical axe violations
- [ ] Error rate: < 1% (donation_failed / donation_submitted)
- [ ] User satisfaction: 4.5/5 stars (post-donation survey)

---

**End of Document**

---

## Quick Reference Links

**Documentation**:
- Design System: `UX-design-system.md`
- Information Architecture: `UX-information-architecture.md`
- Wireframes: `UX-wireframes.md`
- Components: `UX-component-specifications.md`
- Accessibility: `UX-accessibility-guide.md`
- Edge Cases: `UX-edge-cases-and-handoff.md` (this doc)

**External Resources**:
- WCAG 2.2 Guidelines: https://www.w3.org/WAI/WCAG22/quickref/
- Headless UI: https://headlessui.com/
- Tailwind CSS: https://tailwindcss.com/
- Stripe Docs: https://stripe.com/docs
- Adyen Docs: https://docs.adyen.com/
- axe DevTools: https://www.deque.com/axe/devtools/

**Contact**:
- UX Architect: [Name/Email]
- Product Owner: [Name/Email]
- Engineering Lead: [Name/Email]
