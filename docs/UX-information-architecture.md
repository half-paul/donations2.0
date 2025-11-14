# Information Architecture & User Flows
**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-11-13

---

## Executive Summary

This document maps the complete donation experience information architecture, including all user flows, decision trees, navigation patterns, and interaction sequences. Designed for minimal friction and maximum conversion.

---

## Site Structure

```
/donate/[campaign-slug]
  ├── Landing View (Amount Selection)
  ├── Donor Information Step
  ├── Payment Step
  ├── Processing State
  └── Confirmation Page

/account/recurring
  ├── Recurring Plans List
  ├── Plan Detail View
  ├── Update Payment Method
  ├── Update Amount
  └── Cancel/Pause Flow

/receipt/[receipt-id]
  └── Receipt Detail (Printable)
```

---

## Primary User Flow: One-Time Donation

```
┌─────────────────────────────────────────────────────────────────┐
│                   ENTRY POINTS                                   │
├─────────────────────────────────────────────────────────────────┤
│ • Marketing email link                                           │
│ • Social media post                                              │
│ • Website donate button                                          │
│ • Campaign landing page                                          │
│ • QR code scan                                                   │
│ • Direct URL (/donate/[campaign-slug])                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 SCREEN 1: AMOUNT SELECTION                       │
├─────────────────────────────────────────────────────────────────┤
│ URL: /donate/[campaign-slug]                                     │
│                                                                  │
│ Components Visible:                                              │
│ • Campaign hero (name, image, description)                       │
│ • Gift type toggle: [One-Time] [Monthly]                        │
│ • Preset amount buttons (3-5 options)                            │
│ • Custom amount input field                                      │
│ • Impact messaging (optional)                                    │
│ • Goal thermometer (optional)                                    │
│ • Trust indicators (secure badge, charity rating)                │
│                                                                  │
│ User Actions:                                                    │
│ 1. Select preset amount OR enter custom amount                   │
│ 2. Optionally toggle to recurring                                │
│ 3. Click "Continue" CTA                                          │
│                                                                  │
│ Validation:                                                      │
│ • Amount >= $1 and <= $100,000                                   │
│ • Custom amount is valid number                                  │
│ • Amount selected before continuing                              │
│                                                                  │
│ State Management:                                                │
│ • Selected amount stored in client state                         │
│ • Gift type (one-time/recurring) stored                          │
│ • User can navigate back to edit                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  [Continue Button Clicked]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              SCREEN 2: DONOR INFORMATION                         │
├─────────────────────────────────────────────────────────────────┤
│ URL: /donate/[campaign-slug]#donor-info                          │
│                                                                  │
│ Progress Indicator: Step 1 of 2 (or 2/3 if tribute shown)       │
│                                                                  │
│ Components Visible:                                              │
│ • Amount summary (editable link)                                 │
│ • Form fields:                                                   │
│   - First Name * (required)                                      │
│   - Last Name * (required)                                       │
│   - Email * (required)                                           │
│   - Phone (optional)                                             │
│ • Email opt-in checkbox (unchecked by default)                   │
│   Label: "Yes, send me updates about your work"                  │
│ • Privacy notice link                                            │
│ • Expandable section: "Make this a tribute gift" (collapsed)     │
│ • Back button to edit amount                                     │
│ • Continue CTA                                                   │
│                                                                  │
│ User Actions:                                                    │
│ 1. Fill required fields                                          │
│ 2. Optionally fill phone                                         │
│ 3. Optionally check email opt-in                                 │
│ 4. Optionally expand tribute section (see branch below)          │
│ 5. Click "Continue to payment"                                   │
│                                                                  │
│ Validation:                                                      │
│ • Inline validation on blur                                      │
│ • Email format check (RFC 5322 compliant)                        │
│ • Names: non-empty, max 100 chars                                │
│ • Phone: optional, E.164 format if provided                      │
│ • Block submission if validation errors                          │
│                                                                  │
│ Accessibility:                                                   │
│ • Labels always visible (no placeholder-only)                    │
│ • Required fields have aria-required="true"                      │
│ • Error messages linked via aria-describedby                     │
│ • Fieldset grouping for contact info                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
          ┌─────────────────┴──────────────────┐
          │                                    │
    [Tribute Expanded?]              [Tribute Not Expanded]
          │                                    │
          ↓                                    ↓
┌──────────────────────────┐     ┌──────────────────────────────┐
│   TRIBUTE SUB-FLOW       │     │   SKIP TRIBUTE              │
├──────────────────────────┤     │   (Continue directly)        │
│ Fields Shown:            │     └──────────────────────────────┘
│ • Tribute type radio:    │                  ↓
│   ○ In honour of         │     [Continue to Payment Clicked]
│   ○ In memory of         │                  ↓
│   ○ In celebration of    │                  │
│ • Honoree name *         │                  │
│ • Tribute message        │                  │
│   (max 500 chars)        │                  │
│ • E-card checkbox:       │                  │
│   "Send e-card"          │                  │
│                          │                  │
│ If E-card checked:       │                  │
│ • Recipient name *       │                  │
│ • Recipient email *      │                  │
│ • E-card template select │                  │
│ • Personal message       │                  │
│   (max 250 chars)        │                  │
│ • Send date picker       │                  │
│                          │                  │
│ Validation:              │                  │
│ • Honoree name required  │                  │
│   if tribute selected    │                  │
│ • E-card fields required │                  │
│   if e-card checked      │                  │
│ • Send date >= today     │                  │
└──────────────────────────┘                  │
          │                                    │
          └────────────────┬───────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                 SCREEN 3: PAYMENT STEP                           │
├─────────────────────────────────────────────────────────────────┤
│ URL: /donate/[campaign-slug]#payment                             │
│                                                                  │
│ Progress Indicator: Step 2 of 2                                  │
│                                                                  │
│ Components Visible:                                              │
│ • Donation summary card (sticky on scroll):                      │
│   - Campaign name                                                │
│   - Amount: $XX.XX                                               │
│   - Gift type: One-time / Monthly                                │
│   - Donor name                                                   │
│   - Edit link (returns to previous step)                         │
│                                                                  │
│ • Donor-covers-fees checkbox:                                    │
│   □ "Cover processing fees ($X.XX) so 100% of my donation        │
│      goes to [org name]"                                         │
│   - Shows real-time fee calculation                              │
│   - Updates total when toggled                                   │
│   - Unchecked by default                                         │
│                                                                  │
│ • Total amount display:                                          │
│   Large, prominent: "Total: $XX.XX"                              │
│                                                                  │
│ • Payment method tabs:                                           │
│   [Credit/Debit Card] [PayPal] [Apple Pay] [Google Pay]         │
│   (Only show available processors)                               │
│                                                                  │
│ • Hosted payment fields (Stripe/Adyen):                          │
│   - Card number * (iframe)                                       │
│   - Expiry date * (iframe)                                       │
│   - CVC * (iframe)                                               │
│   - Billing postal code * (iframe)                               │
│   - Security badge: "Secure payment via [processor]"             │
│                                                                  │
│ • Back button                                                    │
│ • Submit CTA: "Donate $XX.XX" (primary, prominent)               │
│                                                                  │
│ User Actions:                                                    │
│ 1. Review donation summary                                       │
│ 2. Optionally check "cover fees"                                 │
│ 3. Select payment method tab                                     │
│ 4. Enter payment details in hosted fields                        │
│ 5. Click "Donate $XX.XX"                                         │
│                                                                  │
│ Validation:                                                      │
│ • Real-time card validation via processor                        │
│ • CVC format check                                               │
│ • Expiry date not in past                                        │
│ • Postal code format (by country)                                │
│ • All fields required                                            │
│                                                                  │
│ Security:                                                        │
│ • Hosted fields (PCI SAQ-A-EP compliant)                         │
│ • No card data touches application server                        │
│ • SSL/TLS encryption                                             │
│ • CSRF token validation                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  [Donate Button Clicked]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│               PROCESSING STATE (Full-Screen)                     │
├─────────────────────────────────────────────────────────────────┤
│ Display:                                                         │
│ • Large spinner animation                                        │
│ • Message: "Processing your donation..."                         │
│ • Sub-message: "Please don't close this window"                  │
│ • Disable all interactions                                       │
│                                                                  │
│ Backend Operations:                                              │
│ 1. Create idempotency key (client-generated UUID)                │
│ 2. Submit payment to processor API                               │
│ 3. Await payment confirmation                                    │
│ 4. Create Gift record in database                                │
│ 5. Create Donor record (or link existing)                        │
│ 6. Generate receipt PDF                                          │
│ 7. Queue confirmation email                                      │
│ 8. If recurring: Create RecurringPlan record                     │
│ 9. Emit analytics event: donation_completed                      │
│ 10. Log audit trail                                              │
│                                                                  │
│ Error Handling:                                                  │
│ • Payment declined → Show error screen (see below)               │
│ • Network timeout → Retry with same idempotency key              │
│ • Server error → Show error screen with retry option             │
│ • Duplicate idempotency key → Return existing transaction        │
│                                                                  │
│ Timeout: 30 seconds max, then show error                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    │                │
              [Success]        [Failure]
                    │                │
                    ↓                ↓
┌─────────────────────────┐  ┌─────────────────────────┐
│   CONFIRMATION PAGE     │  │    ERROR SCREEN         │
│                         │  │                         │
│ URL: /donate/[campaign- │  │ Display:                │
│      slug]/confirmation │  │ • Error icon (red)      │
│      ?gift=[gift-id]    │  │ • Heading: "Payment     │
│                         │  │   could not be          │
│ Display:                │  │   processed"            │
│ • Success icon (green)  │  │ • Error details:        │
│ • Heading: "Thank you!" │  │   - Card declined       │
│ • Donor name            │  │   - Insufficient funds  │
│ • Gift summary:         │  │   - Invalid card        │
│   - Amount donated      │  │   - Network error       │
│   - Date/time           │  │ • Actionable message:   │
│   - Receipt number      │  │   "Please try again     │
│   - Campaign name       │  │   with a different      │
│   - Tax receipt status  │  │   payment method"       │
│                         │  │ • CTA: "Try again"      │
│ • If recurring:         │  │   (returns to payment)  │
│   - Next charge date    │  │ • Secondary: "Contact   │
│   - Frequency           │  │   support"              │
│   - Manage link         │  │                         │
│                         │  │ Error Logged:           │
│ • Impact message:       │  │ • Gift status: failed   │
│   "Your $XX will..."    │  │ • Error code stored     │
│                         │  │ • Analytics event:      │
│ • Email sent notice:    │  │   donation_failed       │
│   "Receipt sent to      │  │ • User can retry with   │
│   [email]"              │  │   preserved form data   │
│                         │  └─────────────────────────┘
│ • Social sharing:       │
│   [Facebook] [Twitter]  │
│   [LinkedIn]            │
│   (Optional)            │
│                         │
│ • Next steps:           │
│   - "View receipt" link │
│   - "Make another gift" │
│   - "Tell friends"      │
│                         │
│ • If recurring:         │
│   CTA: "Manage your     │
│   monthly gift"         │
│   → /account/recurring  │
│                         │
│ Email Sent:             │
│ • Immediate receipt     │
│ • PDF attachment        │
│ • If recurring: terms   │
│ • Thank you message     │
│ • Impact info           │
└─────────────────────────┘
```

---

## Alternate Flow: Recurring Donation Setup

```
┌─────────────────────────────────────────────────────────────────┐
│              AMOUNT SELECTION (Recurring Toggle)                 │
├─────────────────────────────────────────────────────────────────┤
│ User Action: Toggle from [One-Time] to [Monthly]                 │
│                                                                  │
│ Interface Changes:                                               │
│ • Frequency selector appears:                                    │
│   ○ Monthly (default)                                            │
│   ○ Quarterly                                                    │
│   ○ Annually                                                     │
│                                                                  │
│ • Preset amounts adjust to recurring context:                    │
│   Example: Instead of "$50", show "$50/month"                    │
│                                                                  │
│ • Impact messaging updates:                                      │
│   "$50/month provides..."                                        │
│   "Your monthly gift makes a lasting impact"                     │
│                                                                  │
│ • First charge date displayed:                                   │
│   "First charge: Today"                                          │
│   "Next charge: [date calculated based on frequency]"            │
│                                                                  │
│ • Recurring terms link:                                          │
│   "Learn about recurring gifts" → Modal with:                    │
│   - When charged                                                 │
│   - How to cancel                                                │
│   - How to update amount/payment method                          │
│   - Tax receipt timing                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
              [Rest of flow identical to one-time]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│           PAYMENT STEP (Recurring Additions)                     │
├─────────────────────────────────────────────────────────────────┤
│ Additional Display Elements:                                     │
│                                                                  │
│ • Recurring summary callout (highlighted):                       │
│   ┌───────────────────────────────────────────┐                 │
│   │ Monthly Recurring Gift                    │                 │
│   │ $XX.XX charged on [day] of each month     │                 │
│   │ First charge: Today                       │                 │
│   │ Next charge: [calculated date]            │                 │
│   └───────────────────────────────────────────┘                 │
│                                                                  │
│ • Recurring agreement checkbox (required):                       │
│   ☑ "I authorize [org name] to charge my payment method         │
│       $XX.XX [frequency] until I cancel. I understand I can      │
│       modify or cancel anytime."                                 │
│   - Checkbox must be checked to submit                           │
│   - Link to full terms in modal                                  │
│                                                                  │
│ • Submit button text changes:                                    │
│   "Start monthly gift of $XX.XX"                                 │
│   (Instead of "Donate $XX.XX")                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  [Submit Button Clicked]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│           PROCESSING (Recurring Additions)                       │
├─────────────────────────────────────────────────────────────────┤
│ Additional Backend Operations:                                   │
│ 1-6. [Same as one-time]                                          │
│ 7. Create payment method token with processor                    │
│ 8. Create subscription/mandate with processor                    │
│ 9. Create RecurringPlan record:                                  │
│    - status: active                                              │
│    - amount, currency, frequency                                 │
│    - nextChargeDate (calculated)                                 │
│    - paymentMethodId (tokenized)                                 │
│    - donorId linkage                                             │
│ 10. Queue recurring confirmation email                           │
│ 11. Set up webhook listener for future charges                   │
│ 12. Emit analytics: recurring_plan_created                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         CONFIRMATION PAGE (Recurring Additions)                  │
├─────────────────────────────────────────────────────────────────┤
│ Additional Display:                                              │
│ • Recurring confirmation callout:                                │
│   "Your monthly gift is now active!"                             │
│                                                                  │
│ • Recurring details box:                                         │
│   - Frequency: Monthly                                           │
│   - Amount: $XX.XX                                               │
│   - First charge: [today's date]                                 │
│   - Next charge: [calculated date]                               │
│   - Payment method: •••• 1234 (masked)                           │
│                                                                  │
│ • Management CTA:                                                │
│   "Manage your recurring gift" button                            │
│   → Links to /account/recurring/[plan-id]                        │
│                                                                  │
│ • Email confirmation details:                                    │
│   "You'll receive monthly receipts after each charge"            │
│   "Confirmation email sent with full details"                    │
│                                                                  │
│ • Cancellation transparency:                                     │
│   "You can modify or cancel anytime from your account"           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recurring Plan Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ENTRY: AUTHENTICATED DONOR PORTAL                   │
├─────────────────────────────────────────────────────────────────┤
│ URL: /account/recurring                                          │
│                                                                  │
│ Authentication Required:                                         │
│ • If not authenticated: Redirect to login                        │
│ • Magic link login via email                                     │
│ • Or OAuth (Google, Facebook)                                    │
│ • Session persists 30 days                                       │
│                                                                  │
│ Display:                                                         │
│ • Page heading: "Your Recurring Gifts"                           │
│ • List of all recurring plans (active, paused, cancelled)        │
│                                                                  │
│ Each Plan Card Shows:                                            │
│ ┌─────────────────────────────────────────────────┐             │
│ │ [Org Name / Campaign]                           │             │
│ │ $XX.XX per [frequency]                          │             │
│ │ Status: ● Active / ⏸ Paused / ✕ Cancelled      │             │
│ │ Next charge: [date]                             │             │
│ │ Payment method: •••• 1234                       │             │
│ │                                                 │             │
│ │ [Manage Plan →]                                 │             │
│ └─────────────────────────────────────────────────┘             │
│                                                                  │
│ Empty State (if no plans):                                       │
│ • Icon: Heart outline                                            │
│ • Heading: "No recurring gifts yet"                              │
│ • Body: "Set up a monthly gift to make a lasting impact"         │
│ • CTA: "Start a monthly gift"                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  [Manage Plan Clicked]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                PLAN DETAIL / MANAGEMENT VIEW                     │
├─────────────────────────────────────────────────────────────────┤
│ URL: /account/recurring/[plan-id]                                │
│                                                                  │
│ Display:                                                         │
│ • Breadcrumb: Recurring Gifts > [Campaign Name]                  │
│ • Plan summary card (prominent):                                 │
│   - Campaign/org name                                            │
│   - Amount: $XX.XX                                               │
│   - Frequency: Monthly/Quarterly/Annually                        │
│   - Status badge: Active/Paused/Cancelled                        │
│   - Start date                                                   │
│   - Next charge date (if active)                                 │
│   - Total donated to date: $XXX.XX                               │
│                                                                  │
│ • Management Actions (buttons/links):                            │
│   ┌─────────────────────────────────────────────┐               │
│   │ [Update Amount]                             │               │
│   │ [Update Payment Method]                     │               │
│   │ [Pause Plan]  (if active)                   │               │
│   │ [Resume Plan] (if paused)                   │               │
│   │ [Cancel Plan]                               │               │
│   └─────────────────────────────────────────────┘               │
│                                                                  │
│ • Charge history table:                                          │
│   | Date       | Amount  | Status   | Receipt      |            │
│   |------------|---------|----------|--------------|            │
│   | 2025-10-13 | $50.00  | Success  | [View PDF]   |            │
│   | 2025-09-13 | $50.00  | Success  | [View PDF]   |            │
│   | 2025-08-13 | $50.00  | Failed   | [Retry]      |            │
│                                                                  │
│ • Back link to recurring gifts list                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                ┌───────────┴────────────┐
                │                        │
        [Update Amount]          [Update Payment]
                │                        │
                ↓                        ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│  UPDATE AMOUNT FLOW      │  │ UPDATE PAYMENT FLOW      │
├──────────────────────────┤  ├──────────────────────────┤
│ Modal Dialog:            │  │ Modal Dialog:            │
│ • Current: $XX.XX/month  │  │ • Current payment:       │
│ • Input: New amount      │  │   •••• 1234              │
│ • Validation: $1-$100k   │  │ • Hosted payment fields: │
│ • Fee recalculation      │  │   - New card number      │
│   (if fees covered)      │  │   - Expiry               │
│ • Preview new total      │  │   - CVC                  │
│ • Effective: Immediately │  │   - Postal code          │
│   or next cycle          │  │ • Effective: Next charge │
│ • Checkbox: "Apply to    │  │ • Security: Tokenized    │
│   next charge"           │  │   via processor          │
│                          │  │                          │
│ Actions:                 │  │ Actions:                 │
│ [Cancel] [Save Changes]  │  │ [Cancel] [Update Card]   │
│                          │  │                          │
│ Backend:                 │  │ Backend:                 │
│ • Update RecurringPlan   │  │ • Create new payment     │
│   amount field           │  │   token with processor   │
│ • Send confirmation      │  │ • Update RecurringPlan   │
│   email                  │  │   paymentMethodId        │
│ • Audit log entry        │  │ • Send confirmation      │
│ • Analytics event:       │  │   email                  │
│   recurring_updated      │  │ • Audit log entry        │
└──────────────────────────┘  └──────────────────────────┘
                │                        │
                └───────────┬────────────┘
                            ↓
                  [Return to Plan Detail]
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PAUSE / CANCEL FLOWS                           │
├─────────────────────────────────────────────────────────────────┤
│ PAUSE PLAN:                                                      │
│ • Modal confirmation:                                            │
│   "Pause your monthly gift?"                                     │
│   - Explain: "You won't be charged while paused"                 │
│   - Option: "Resume anytime from your account"                   │
│   - Actions: [Go Back] [Pause Gift]                              │
│                                                                  │
│ • Backend:                                                       │
│   - Update status: paused                                        │
│   - Clear nextChargeDate                                         │
│   - Pause processor subscription                                 │
│   - Send confirmation email                                      │
│   - Audit log: recurring_paused                                  │
│                                                                  │
│ • Display after pause:                                           │
│   Status badge: "⏸ Paused"                                       │
│   CTA: "Resume your gift"                                        │
│                                                                  │
│ ─────────────────────────────────────────────────────────────   │
│                                                                  │
│ CANCEL PLAN:                                                     │
│ • Modal confirmation (multi-step):                               │
│   Step 1: "Cancel your monthly gift?"                            │
│   - Impact message: "Your support makes a difference"            │
│   - Option to pause instead: "Pause temporarily instead?"        │
│   - Actions: [Keep Gift Active] [Continue to Cancel]             │
│                                                                  │
│   Step 2 (if Continue clicked): "We're sorry to see you go"      │
│   - Optional feedback: Why are you cancelling?                   │
│     ○ Financial reasons                                          │
│     ○ No longer interested                                       │
│     ○ Switching to one-time gifts                                │
│     ○ Other                                                      │
│   - Effective date options:                                      │
│     ○ Cancel immediately (no future charges)                     │
│     ○ Cancel after next charge                                   │
│   - Final confirmation: [Go Back] [Cancel Gift]                  │
│                                                                  │
│ • Backend:                                                       │
│   - Update status: cancelled                                     │
│   - Cancel processor subscription                                │
│   - Set cancelledAt timestamp                                    │
│   - Store cancellation reason (if provided)                      │
│   - Send confirmation email                                      │
│   - Audit log: recurring_cancelled                               │
│   - Analytics event: recurring_cancelled + reason                │
│                                                                  │
│ • Display after cancellation:                                    │
│   Status badge: "✕ Cancelled"                                    │
│   Message: "Your monthly gift has been cancelled"                │
│   CTA: "Start a new monthly gift"                                │
│   - Keep charge history visible for records                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Patterns

### Primary Navigation (Donation Flow)
```
Linear progression with back-navigation:
1. Amount Selection → 2. Donor Info → 3. Payment → 4. Confirmation

User can:
• Click "Back" button to return to previous step (data preserved)
• Click "Edit amount" link from donor info or payment screens
• Use browser back button (with state preservation)

Navigation constraints:
• Cannot skip steps forward
• Cannot access payment step without valid donor info
• Cannot access confirmation without successful payment
```

### Progress Indicator
```
Visual representation at top of each step:
┌─────────────────────────────────────────────┐
│  ●──────────○──────────○                    │
│  Amount   Donor Info  Payment               │
└─────────────────────────────────────────────┘

States:
• Completed step: ● (filled circle, Primary Blue)
• Current step: ◉ (outlined circle, Primary Blue)
• Future step: ○ (empty circle, Gray 300)
• Connecting lines: Solid for completed, dashed for future

Mobile: Simplified to "Step 1 of 3" text
Desktop: Full visual with labels
```

### Breadcrumbs (Donor Portal)
```
Recurring Gifts > Plan Detail > Update Payment

Rules:
• Always show current location
• Clickable for navigation back
• Max 3 levels deep
• Truncate long campaign names with ellipsis
```

---

## Decision Trees

### Fee Coverage Decision
```
User sees "Cover fees" checkbox on payment step
│
├─[Checked]─────────────────────────────────────┐
│ • Calculate fee based on processor rates:     │
│   Stripe: 2.9% + $0.30                         │
│   Adyen: 2.5% + $0.10                          │
│   PayPal: 3.49% + $0.49                        │
│ • Add fee to total                             │
│ • Update CTA: "Donate $XX.XX (includes fee)"   │
│ • Store coversFees: true in Gift record        │
│ • Show fee breakdown in receipt                │
└─────────────────────────────────────────────────┘
│
├─[Unchecked]────────────────────────────────────┐
│ • Total = donation amount only                 │
│ • CTA: "Donate $XX.XX"                         │
│ • Store coversFees: false in Gift record       │
│ • Receipt shows donation amount only           │
└─────────────────────────────────────────────────┘
```

### Authentication Check (Recurring Management)
```
User clicks "Manage recurring gift" link
│
├─[Authenticated]────────────────────────────────┐
│ • Check JWT/session token validity             │
│ • Verify user owns the recurring plan          │
│ • Load /account/recurring/[plan-id]            │
└─────────────────────────────────────────────────┘
│
├─[Not Authenticated]─────────────────────────────┐
│ • Redirect to /login?redirect=/account/recurring│
│ • Show magic link login form:                   │
│   "Enter your email to manage recurring gifts"  │
│ • Send magic link to donor email                │
│ • Link expires in 15 minutes                    │
│ • After login: redirect to original destination │
└─────────────────────────────────────────────────┘
│
├─[Unauthorized]──────────────────────────────────┐
│ • User authenticated but doesn't own plan       │
│ • Show 403 error page                           │
│ • Message: "You don't have access to this plan" │
│ • CTA: "View your recurring gifts"              │
└─────────────────────────────────────────────────┘
```

### Payment Processor Selection
```
Campaign configuration determines available processors
│
├─[Stripe Enabled]────────────────────────────────┐
│ • Show credit/debit card tab (default)          │
│ • Show Apple Pay (if iOS Safari)                │
│ • Show Google Pay (if Android Chrome)           │
│ • Render Stripe.js hosted fields                │
└─────────────────────────────────────────────────┘
│
├─[Adyen Enabled]─────────────────────────────────┐
│ • Show credit/debit card tab                    │
│ • Additional local payment methods:             │
│   - iDEAL (Netherlands)                         │
│   - SEPA Direct Debit (EU)                      │
│   - Interac (Canada)                            │
│ • Render Adyen Drop-in component                │
└─────────────────────────────────────────────────┘
│
├─[PayPal Enabled]────────────────────────────────┐
│ • Show PayPal button                            │
│ • User redirected to PayPal checkout            │
│ • Return to donation flow after authorization   │
└─────────────────────────────────────────────────┘
│
└─[Multiple Enabled]──────────────────────────────┐
  • Show tabs for each processor                  │
  • Default: Primary processor from campaign      │
  • User can switch between tabs                  │
  • Form fields update based on selection         │
  └─────────────────────────────────────────────────┘
```

---

## Exit Points & Abandonment Recovery

### Abandonment Triggers
```
User abandons if:
1. Browser close/tab close at any step
2. Idle timeout (15 minutes of inactivity)
3. Payment failure without retry
4. Click "Cancel" or "Back" repeatedly

Abandonment Recovery Strategy:
• Store partial form data in localStorage (PII-safe)
• Cookie: donationInProgress = true
• Do not store payment info (PCI violation)
• Email reminder if email captured (24 hours later):
  "Complete your donation to [campaign]"
  Link returns to saved state
```

### Exit Links
```
Donation flow screens intentionally have minimal exit points:
• Campaign pages: "Learn more about our work" link
• Donor info: "Privacy policy" link (opens new tab)
• Payment: "Secure payment info" link (modal, not exit)
• Confirmation: "Back to website" link

Avoid:
• Top navigation during donation flow
• External links in flow
• Distracting content or ads
```

---

## Mobile-Specific Flow Adjustments

### Mobile Optimizations
```
Screen Size: 320px - 767px

Layout Changes:
• Single column, full-width components
• Amount buttons in 2-column grid (max 3×2 layout)
• Form fields stacked vertically
• Payment summary collapses into expandable card
• Progress indicator: Text only ("Step 1 of 3")
• Sticky CTAs at bottom of viewport

Input Optimizations:
• Input type="number" for amount (numeric keyboard)
• Input type="email" for email (@ key visible)
• Input type="tel" for phone (dial pad)
• Autocomplete attributes for autofill
• Large touch targets (minimum 44×44px)
• Spacing between tappable elements (8px minimum)

Performance:
• Defer non-critical images
• Load payment processor script only when visible
• Reduce animation complexity
• Inline critical CSS
```

---

## State Management

### Client-Side State
```javascript
// Stored in React Context or Zustand store

{
  donationFlow: {
    currentStep: "amount" | "donorInfo" | "payment" | "confirmation",
    giftType: "one-time" | "recurring",

    amount: {
      value: number,
      currency: "USD" | "CAD" | "EUR",
    },

    frequency: "monthly" | "quarterly" | "annually" | null,

    donor: {
      firstName: string,
      lastName: string,
      email: string,
      phone: string | null,
      emailOptIn: boolean,
    },

    tribute: {
      enabled: boolean,
      type: "honour" | "memory" | "celebration" | null,
      honoreeName: string | null,
      message: string | null,
      ecard: {
        enabled: boolean,
        recipientName: string | null,
        recipientEmail: string | null,
        templateId: string | null,
        personalMessage: string | null,
        sendDate: Date | null,
      },
    },

    coversFees: boolean,
    feeAmount: number,
    totalAmount: number,

    campaign: {
      id: string,
      name: string,
      slug: string,
    },

    idempotencyKey: string, // UUID generated client-side
  },
}
```

### Server-Side State
```
Database entities created during flow:

1. Donor record (upserted by email)
2. Gift record (created on payment success)
3. RecurringPlan record (if recurring)
4. Tribute record (if tribute gift)
5. Ecard record (if e-card selected)
6. Receipt record (generated post-transaction)
7. AuditLog entries (all state changes)

Transaction consistency:
• Use database transactions for atomicity
• Rollback on any failure
• Idempotency key prevents duplicates
```

---

## Analytics Events

### Event Tracking
```
donation_started
  - campaign_id
  - source (utm_source)
  - device (mobile/tablet/desktop)

amount_selected
  - amount
  - gift_type (one-time/recurring)
  - preset_or_custom

donor_info_completed
  - email_opt_in (boolean)
  - tribute_added (boolean)

payment_method_selected
  - processor (stripe/adyen/paypal)
  - method (card/apple_pay/google_pay)

fee_coverage_toggled
  - covers_fees (boolean)
  - fee_amount

donation_submitted
  - total_amount
  - processing_time_start

donation_completed
  - gift_id
  - total_amount
  - covers_fees
  - recurring (boolean)
  - processing_time_ms
  - conversion_funnel_duration_s

donation_failed
  - error_code
  - error_message
  - step (payment)

recurring_plan_created
  - plan_id
  - amount
  - frequency

recurring_updated
  - plan_id
  - field_changed (amount/payment_method)

recurring_paused
  - plan_id
  - pause_reason

recurring_cancelled
  - plan_id
  - cancellation_reason
```

---

**End of Information Architecture Document**
