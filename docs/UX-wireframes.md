# Wireframes & Screen Specifications
**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-11-13

---

## Executive Summary

This document provides detailed wireframes for all screens in the donation experience, with complete annotations for layout, behavior, content, accessibility, and responsive design. Each wireframe includes specifications for mobile (320px+), tablet (768px+), and desktop (1024px+) viewports.

---

## Screen 1: Amount Selection & Campaign Landing

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  [Organization Logo]                    [Trust Badge: Secure ●]     │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────┐ │
│  │                                     │  │                             │ │
│  │   [Campaign Hero Image]             │  │  Support Our Mission        │ │
│  │   Max height: 400px                 │  │  ─────────────────────      │ │
│  │   Aspect ratio: 16:9                │  │                             │ │
│  │   Format: WebP with JPEG fallback   │  │  Your donation helps us     │ │
│  │   Alt text: [Campaign description]  │  │  provide vital services...  │ │
│  │                                     │  │  [2-3 lines max]            │ │
│  │                                     │  │                             │ │
│  │                                     │  │  ┌───────────────────────┐  │ │
│  │                                     │  │  │  Goal: $50,000        │  │ │
│  │                                     │  │  │  [████████────] 65%   │  │ │
│  │                                     │  │  │  $32,500 raised       │  │ │
│  │                                     │  │  └───────────────────────┘  │ │
│  │                                     │  │  (Optional thermometer)     │ │
│  │                                     │  │                             │ │
│  └─────────────────────────────────────┘  │  ┌───────────────────────┐  │ │
│                                            │  │ 1,234 supporters      │  │ │
│                                            │  └───────────────────────┘  │ │
│                                            └─────────────────────────────┘ │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│                     Choose Your Donation Amount                            │
│                     ──────────────────────────────────                     │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │   [ One-Time ]     [ Monthly ]                                       │ │
│  │   ──────────                                                         │ │
│  │   (Toggle buttons - default: One-Time selected)                      │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │ │
│  │  │           │  │           │  │           │  │           │        │ │
│  │  │   $25     │  │   $50     │  │   $100    │  │   $250    │        │ │
│  │  │           │  │           │  │           │  │           │        │ │
│  │  │  Provides │  │  Provides │  │  Provides │  │  Provides │        │ │
│  │  │  [impact] │  │  [impact] │  │  [impact] │  │  [impact] │        │ │
│  │  │           │  │           │  │           │  │           │        │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │ │
│  │                                                                      │ │
│  │  ┌───────────┐  ┌────────────────────────────────────────┐          │ │
│  │  │           │  │                                        │          │ │
│  │  │   Other   │  │  Custom Amount                         │          │ │
│  │  │   Amount  │  │  ┌──────────────────────────────────┐ │          │ │
│  │  │           │  │  │  $  [            ]               │ │          │ │
│  │  └───────────┘  │  └──────────────────────────────────┘ │          │ │
│  │                 │  Min: $1  Max: $100,000              │          │ │
│  │                 └────────────────────────────────────────┘          │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                                                                            │
│                    ┌────────────────────────────┐                          │
│                    │                            │                          │
│                    │    Continue  →             │                          │
│                    │    (Primary Button)        │                          │
│                    │                            │                          │
│                    └────────────────────────────┘                          │
│                                                                            │
│  ──────────────────────────────────────────────────────────────────────   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  🔒 Secure donation powered by [Stripe/Adyen]                        │ │
│  │  Tax receipts issued for all donations                               │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)

```
┌────────────────────────────────┐
│                                │
│  [Logo]      [Trust Badge ●]   │
│                                │
├────────────────────────────────┤
│                                │
│  [Campaign Hero Image]         │
│  Max height: 200px             │
│  Full width                    │
│  Aspect ratio: 16:9            │
│                                │
├────────────────────────────────┤
│                                │
│  Support Our Mission           │
│  ───────────────────           │
│                                │
│  Your donation helps us        │
│  provide vital services...     │
│  [2 lines max on mobile]       │
│                                │
│  ┌──────────────────────────┐  │
│  │ Goal: $50,000            │  │
│  │ [████████────] 65%       │  │
│  │ $32,500 raised           │  │
│  └──────────────────────────┘  │
│                                │
│  1,234 supporters              │
│                                │
├────────────────────────────────┤
│                                │
│  Choose Your Amount            │
│  ──────────────────            │
│                                │
│  [ One-Time ]  [ Monthly ]     │
│  ──────────                    │
│                                │
│  ┌────────────┐ ┌────────────┐ │
│  │   $25      │ │   $50      │ │
│  │  Provides  │ │  Provides  │ │
│  │  [impact]  │ │  [impact]  │ │
│  └────────────┘ └────────────┘ │
│                                │
│  ┌────────────┐ ┌────────────┐ │
│  │   $100     │ │   $250     │ │
│  │  Provides  │ │  Provides  │ │
│  │  [impact]  │ │  [impact]  │ │
│  └────────────┘ └────────────┘ │
│                                │
│  ┌────────────┐ ┌────────────┐ │
│  │  Other     │ │            │ │
│  │  Amount    │ │            │ │
│  └────────────┘ └────────────┘ │
│                                │
│  Custom Amount                 │
│  ┌──────────────────────────┐  │
│  │ $  [                  ]  │  │
│  └──────────────────────────┘  │
│  Min: $1  Max: $100,000        │
│                                │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │     Continue  →          │  │
│  │     (Full width)         │  │
│  └──────────────────────────┘  │
│                                │
│  🔒 Secure & tax-deductible    │
│                                │
└────────────────────────────────┘
```

### Annotations

**1. Header Section**
- Component: SiteHeader
- Height: 64px (desktop), 56px (mobile)
- Background: White with bottom border (1px, Gray 300)
- Logo: Max height 40px, linked to organization homepage
- Trust Badge: "Secure" text with lock icon, Primary Blue
- Sticky on scroll (z-index: 100)

**2. Campaign Hero**
- Component: CampaignHero
- Desktop: 2-column layout (60% image, 40% content)
- Mobile: Stacked (image on top, content below)
- Image: Lazy-loaded, responsive srcset
- Heading: H1, Display Large, Gray 900
- Description: Body Large, Gray 700, max 3 lines
- Goal Thermometer (optional):
  - Progress bar: 8px height, rounded, Primary Blue fill
  - Text: Body Small, Gray 700
  - Updated in real-time via WebSocket or polling

**3. Gift Type Toggle**
- Component: SegmentedControl
- Options: "One-Time" (default), "Monthly"
- Width: Auto-fit content, centered
- Selected state:
  - Background: Primary Blue
  - Text: White, Label font
- Unselected state:
  - Background: White
  - Border: 2px Gray 300
  - Text: Gray 700
- Keyboard: Arrow keys to switch, Enter to select
- ARIA: role="radiogroup", aria-orientation="horizontal"

**4. Preset Amount Buttons**
- Component: AmountButton
- Desktop: 4 buttons per row
- Mobile: 2 buttons per row (2×2 grid)
- Size: 140px × 120px (desktop), full-width minus gap (mobile)
- Gap: 16px between buttons
- Border: 2px solid Gray 300 (default)
- Background: White (default)
- Hover: Border → Primary Blue, Shadow Medium
- Selected:
  - Border: 3px solid Primary Blue
  - Background: Primary Blue tint (#E6F2FF)
  - Checkmark icon in top-right corner
- Amount: Heading 2, Gray 900
- Impact text: Caption, Gray 600, max 2 lines, ellipsis overflow
- Touch target: Full button area, min 44×44px
- Keyboard: Tab to focus, Enter/Space to select
- ARIA: role="radio", aria-checked="true/false"

**5. Custom Amount Input**
- Component: CurrencyInput
- Label: "Custom Amount" (Body Regular, Gray 700)
- Input:
  - Width: 300px (desktop), full-width (mobile)
  - Height: 48px
  - Padding: 12px 16px 12px 40px (space for $ symbol)
  - Border: 2px solid Gray 300
  - Font: Heading 3, Gray 900
  - Placeholder: "100"
- Currency symbol: "$" positioned absolute left, Gray 500
- Helper text: "Min: $1  Max: $100,000" (Caption, Gray 600)
- Validation:
  - On blur: Check min/max range
  - On input: Remove non-numeric characters
  - Format with commas for thousands
- Error state: Border → Error Red, error message below
- Focus: Border → Primary Blue, Shadow Small
- Keyboard: inputmode="decimal" for mobile numeric keyboard
- ARIA: aria-label="Custom donation amount in dollars"

**6. Continue Button**
- Component: PrimaryButton
- Text: "Continue" with right arrow icon
- Width: 320px (desktop centered), full-width (mobile)
- Height: 56px
- Background: Primary Blue
- Text: White, Label font
- Border radius: Medium (8px)
- Disabled state:
  - When no amount selected
  - Background: Gray 200
  - Text: Gray 500
  - Cursor: not-allowed
- Click behavior:
  - Validate amount selection
  - Store state in context
  - Scroll to donor info section (desktop) or navigate to new screen (mobile)
- Keyboard: Enter key submits when focused
- ARIA: aria-label="Continue to donor information"

**7. Trust Indicators**
- Component: TrustBadge
- Display: Lock icon + text, centered
- Font: Body Small, Gray 600
- Icons: 16px, Gray 500
- Optional: Charity Navigator rating, BBB logo

**Responsive Behavior:**
- Desktop (1024px+): 2-column hero, 4 amount buttons per row
- Tablet (768px-1023px): 2-column hero, 3 amount buttons per row
- Mobile (320px-767px): Stacked hero, 2 amount buttons per row

**Performance:**
- Above-the-fold: Hero image, amount buttons, continue CTA
- Below-the-fold: Lazy-load additional content
- LCP target: Hero image loads in <1.5s
- Preload: Hero image, critical fonts

**Accessibility:**
- Heading hierarchy: H1 (campaign name), H2 (section headings)
- Color contrast: All text meets 4.5:1 minimum
- Keyboard navigation: Logical tab order (toggle → amounts → custom input → continue)
- Screen reader: Amount buttons announce amount + impact message
- Focus indicators: 3px Primary Blue outline with 2px offset

**Content Model:**
```typescript
{
  campaign: {
    name: string; // max 100 chars
    description: string; // max 250 chars
    heroImage: {
      url: string;
      alt: string; // required for a11y
      width: number;
      height: number;
    };
    goal?: {
      target: number;
      current: number;
      supporterCount: number;
    };
  };
  presetAmounts: {
    value: number;
    impactMessage: string; // max 50 chars
  }[];
  currency: "USD" | "CAD" | "EUR";
  minAmount: number; // default: 1
  maxAmount: number; // default: 100000
}
```

**API Requirements:**
- GET /api/campaigns/[slug] - Fetch campaign data
- Polling (optional): GET /api/campaigns/[slug]/progress - Update thermometer every 30s

**State Management:**
```javascript
{
  amount: number | null,
  giftType: "one-time" | "recurring",
  frequency: "monthly" | "quarterly" | "annually" | null,
  currency: "USD" | "CAD" | "EUR",
}
```

---

## Screen 2: Donor Information

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [Logo]                                            [Trust Badge: Secure ●] │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  ← Back to amount                                                          │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ●──────────────●──────────────○                                     │ │
│  │  Amount      Donor Info     Payment                                  │ │
│  │  (Progress indicator)                                                │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────┐ │
│  │                                     │  │                             │ │
│  │  Your Information                   │  │  Donation Summary           │ │
│  │  ────────────────                   │  │  ────────────────           │ │
│  │                                     │  │                             │ │
│  │  First Name *                       │  │  Spring Campaign            │ │
│  │  ┌───────────────────────────────┐  │  │                             │ │
│  │  │                               │  │  │  One-time donation          │ │
│  │  └───────────────────────────────┘  │  │  $100.00                    │ │
│  │                                     │  │                             │ │
│  │  Last Name *                        │  │  [Edit amount]              │ │
│  │  ┌───────────────────────────────┐  │  │                             │ │
│  │  │                               │  │  └─────────────────────────────┘ │
│  │  └───────────────────────────────┘  │  (Sticky on scroll)             │
│  │                                     │                                  │
│  │  Email Address *                    │                                  │
│  │  ┌───────────────────────────────┐  │                                  │
│  │  │                               │  │                                  │
│  │  └───────────────────────────────┘  │                                  │
│  │  We'll send your receipt here       │                                  │
│  │                                     │                                  │
│  │  Phone Number (optional)            │                                  │
│  │  ┌───────────────────────────────┐  │                                  │
│  │  │                               │  │                                  │
│  │  └───────────────────────────────┘  │                                  │
│  │  We won't share your number         │                                  │
│  │                                     │                                  │
│  │  □ Yes, send me updates about your  │                                  │
│  │    work (unchecked by default)      │                                  │
│  │                                     │                                  │
│  │  ─────────────────────────────────  │                                  │
│  │                                     │                                  │
│  │  ▸ Make this a tribute gift         │                                  │
│  │    (Expandable section - collapsed) │                                  │
│  │                                     │                                  │
│  │  ─────────────────────────────────  │                                  │
│  │                                     │                                  │
│  │  Your information is secure and     │                                  │
│  │  private. [Privacy Policy]          │                                  │
│  │                                     │                                  │
│  │                                     │                                  │
│  │  ┌────────────────────────────────┐ │                                  │
│  │  │  Continue to Payment  →        │ │                                  │
│  │  └────────────────────────────────┘ │                                  │
│  │                                     │                                  │
│  └─────────────────────────────────────┘                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)

```
┌────────────────────────────────┐
│                                │
│  [Logo]     [Trust Badge ●]    │
│                                │
│  ← Back                        │
│                                │
│  Step 1 of 2                   │
│                                │
├────────────────────────────────┤
│                                │
│  Donation Summary              │
│  ▾ Spring Campaign             │
│     One-time: $100.00          │
│     [Edit]                     │
│  (Collapsible card)            │
│                                │
├────────────────────────────────┤
│                                │
│  Your Information              │
│  ────────────────              │
│                                │
│  First Name *                  │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  Last Name *                   │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  Email Address *               │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
│  We'll send your receipt here  │
│                                │
│  Phone (optional)              │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  └──────────────────────────┘  │
│  We won't share your number    │
│                                │
│  □ Send me email updates       │
│                                │
│  ──────────────────────────    │
│                                │
│  ▸ Make this a tribute gift    │
│    (Tap to expand)             │
│                                │
│  ──────────────────────────    │
│                                │
│  Your info is secure.          │
│  [Privacy Policy]              │
│                                │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │  Continue to Payment  →  │  │
│  │  (Sticky bottom)         │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

### Tribute Section (Expanded)

```
┌─────────────────────────────────────────┐
│                                         │
│  ▾ Make this a tribute gift             │
│                                         │
│  This gift is: *                        │
│  ○ In honour of                         │
│  ○ In memory of                         │
│  ○ In celebration of                    │
│                                         │
│  Honoree Name *                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Tribute Message (optional)             │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  0 / 500 characters                     │
│                                         │
│  □ Send an e-card notification          │
│                                         │
│  [If e-card checked, show:]             │
│  ┌─────────────────────────────────────┐│
│  │  E-Card Notification                ││
│  │                                     ││
│  │  Recipient Name *                   ││
│  │  ┌───────────────────────────────┐  ││
│  │  │                               │  ││
│  │  └───────────────────────────────┘  ││
│  │                                     ││
│  │  Recipient Email *                  ││
│  │  ┌───────────────────────────────┐  ││
│  │  │                               │  ││
│  │  └───────────────────────────────┘  ││
│  │                                     ││
│  │  Choose a Design                    ││
│  │  [Preview 1] [Preview 2] [Preview 3]││
│  │                                     ││
│  │  Personal Message (optional)        ││
│  │  ┌───────────────────────────────┐  ││
│  │  │                               │  ││
│  │  └───────────────────────────────┘  ││
│  │  0 / 250 characters                 ││
│  │                                     ││
│  │  Send Date                          ││
│  │  ○ Send immediately                 ││
│  │  ○ Send on specific date:           ││
│  │    [Date picker]                    ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

### Annotations

**1. Progress Indicator**
- Component: StepIndicator
- Desktop: Full visual with labels
- Mobile: Text only "Step 1 of 2"
- Steps: Amount (completed) → Donor Info (current) → Payment (pending)
- Current step: Primary Blue, bold
- Completed: Primary Blue with checkmark
- Pending: Gray 300
- ARIA: aria-label="Progress: Step 1 of 2, Donor Information"

**2. Back Button**
- Component: BackButton
- Desktop: Top-left, text + left arrow icon
- Mobile: Header left, icon only
- Behavior: Return to amount selection, preserve form data
- Keyboard: Tab accessible, Enter to activate
- ARIA: aria-label="Go back to amount selection"

**3. Donation Summary Card**
- Component: DonationSummary
- Desktop: Right sidebar, sticky on scroll (top: 80px)
- Mobile: Collapsible accordion at top
- Content:
  - Campaign name (Body Regular, Gray 700)
  - Gift type: "One-time" or "Monthly" (Body Small, Gray 600)
  - Amount: Large, Heading 2, Gray 900
  - Edit link: Opens modal to change amount
- Border: 1px Gray 300, Border radius: Medium
- Background: Gray 100
- Padding: Space 6 (24px)

**4. Form Fields**
- Component: TextField
- Field structure:
  - Label: Above input, Label font, Gray 900
  - Asterisk for required: Error Red
  - Input: Height 48px, padding 12px 16px
  - Border: 2px Gray 300 (default)
  - Font: Body Regular, Gray 900
  - Helper text: Below input, Caption, Gray 600
- States:
  - Default: Border Gray 300
  - Hover: Border Gray 500
  - Focus: Border Primary Blue (2px), box-shadow
  - Filled (valid): Border Gray 300, checkmark icon in input
  - Error: Border Error Red (2px), background Error tint, error message below
  - Disabled: Background Gray 200, text Gray 500
- Autocomplete attributes:
  - First name: autocomplete="given-name"
  - Last name: autocomplete="family-name"
  - Email: autocomplete="email", type="email"
  - Phone: autocomplete="tel", type="tel"
- Validation:
  - Inline validation on blur
  - Real-time for email format
  - Error messages: Conversational tone
- ARIA:
  - aria-required="true" for required fields
  - aria-describedby for helper text
  - aria-invalid="true" + aria-describedby for errors

**5. Email Opt-In Checkbox**
- Component: Checkbox
- Label: "Yes, send me updates about your work"
- Default: Unchecked (GDPR compliant)
- Size: 20×20px
- Border: 2px Gray 300
- Checked: Background Primary Blue, white checkmark
- Keyboard: Space to toggle
- ARIA: role="checkbox", aria-checked="false/true"

**6. Tribute Expandable Section**
- Component: Disclosure (Headless UI)
- Trigger button:
  - Text: "Make this a tribute gift"
  - Icon: Right-facing chevron (collapsed), down-facing (expanded)
  - Width: Full-width
  - Padding: Space 4
  - Border: 1px dashed Gray 300 (top and bottom)
  - Hover: Background Gray 100
- Expanded content:
  - Animate: Slide down, 250ms ease-out
  - Padding: Space 4
  - Border: 1px solid Gray 300, border radius Medium
  - Background: White
- ARIA:
  - Button: aria-expanded="false/true", aria-controls="tribute-content"
  - Content: id="tribute-content", role="region", aria-labelledby="tribute-button"

**7. Tribute Form Fields**
- Radio buttons (Tribute type):
  - Options: "In honour of", "In memory of", "In celebration of"
  - Required if section expanded
  - Vertical stack, spacing 12px
- Honoree name: Required if tribute selected
- Tribute message: Textarea, max 500 chars, character counter
- E-card checkbox: Reveals e-card form when checked
- E-card template selector: 3 visual previews, radio selection
- Date picker: Native HTML5 date input or custom calendar
- Validation: All e-card fields required if checkbox checked

**8. Privacy Notice**
- Component: InlineLink
- Text: "Your information is secure and private. Privacy Policy"
- Font: Body Small, Gray 600
- Link: Underlined, Primary Blue
- Opens in new tab (target="_blank", rel="noopener noreferrer")
- ARIA: aria-label="Opens privacy policy in new tab"

**9. Continue Button**
- Component: PrimaryButton
- Text: "Continue to Payment" with right arrow
- Desktop: Width 100%, max 400px
- Mobile: Sticky at bottom, full-width, above safe area
- Height: 56px
- Disabled when:
  - Required fields empty
  - Validation errors present
  - If tribute expanded: Tribute fields incomplete
- Click behavior:
  - Validate all fields
  - Display inline errors if validation fails
  - Focus first error field
  - If valid: Store state, navigate to payment step
- Loading state: Spinner replaces arrow, "Saving..." text
- Keyboard: Enter submits form when not on specific field
- ARIA: aria-label="Continue to payment step"

**Validation Rules:**
```javascript
{
  firstName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: "Please enter your first name"
  },
  lastName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: "Please enter your last name"
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address"
  },
  phone: {
    required: false,
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: "Please enter a valid phone number"
  },
  tributeType: {
    required: "if tribute expanded",
    message: "Please select a tribute type"
  },
  honoreeName: {
    required: "if tribute expanded",
    maxLength: 100,
    message: "Please enter the honoree's name"
  },
  tributeMessage: {
    required: false,
    maxLength: 500
  },
  ecardRecipientName: {
    required: "if e-card checked",
    maxLength: 100,
    message: "Please enter the recipient's name"
  },
  ecardRecipientEmail: {
    required: "if e-card checked",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email for the recipient"
  },
  ecardTemplate: {
    required: "if e-card checked",
    message: "Please select an e-card design"
  }
}
```

**Error Display:**
- Position: Below field, adjacent to input
- Icon: Exclamation circle, Error Red
- Text: Caption font, Error Red
- Animation: Fade in, 150ms
- Example: "⚠ Please enter a valid email address"

**Accessibility:**
- Fieldset: Group related inputs (contact info, tribute fields)
- Legend: Section headings as fieldset legends
- Error summary: If form submission fails, focus moves to error summary at top
- Screen reader announcements: "3 errors found. First error: Email is required"
- Keyboard navigation: Tab through inputs, Space/Enter for checkboxes/radio
- Focus management: After expanding tribute, focus moves to first field

**Performance:**
- No validation on every keystroke (debounce 500ms)
- Validate on blur for individual fields
- Comprehensive validation on submit
- Optimistic UI: Assume success, show errors if needed

**Content Model:**
```typescript
{
  donor: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    emailOptIn: boolean;
  };
  tribute?: {
    type: "honour" | "memory" | "celebration";
    honoreeName: string;
    message?: string;
    ecard?: {
      recipientName: string;
      recipientEmail: string;
      templateId: string;
      personalMessage?: string;
      sendDate: Date;
    };
  };
}
```

---

## Screen 3: Payment Step

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [Logo]                                            [Trust Badge: Secure ●] │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  ← Back to donor info                                                      │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ●──────────────●──────────────●                                     │ │
│  │  Amount      Donor Info     Payment                                  │ │
│  │  (Progress indicator - final step)                                   │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────┐ │
│  │                                     │  │                             │ │
│  │  Payment Information                │  │  Donation Summary           │ │
│  │  ───────────────────                │  │  ────────────────           │ │
│  │                                     │  │                             │ │
│  │  [Credit Card] [PayPal] [Apple Pay] │  │  Spring Campaign            │ │
│  │  ─────────────                      │  │  One-time donation          │
│  │  (Tab navigation)                   │  │                             │ │
│  │                                     │  │  John Smith                 │ │
│  │  Card Number *                      │  │  john@example.com           │ │
│  │  ┌───────────────────────────────┐  │  │  [Edit]                     │ │
│  │  │ [Stripe/Adyen Hosted Field]   │  │  │                             │ │
│  │  │ 1234 5678 9012 3456           │  │  │  ─────────────────────      │ │
│  │  └───────────────────────────────┘  │  │                             │ │
│  │  Secure input via [Stripe]          │  │  Amount: $100.00            │ │
│  │                                     │  │                             │ │
│  │  ┌───────────────┐  ┌─────────────┐ │  │  □ Cover fees ($3.20)       │ │
│  │  │ Expiry *      │  │  CVC *      │ │  │    so 100% reaches the      │ │
│  │  │ [Hosted Field]│  │  [Hosted]   │ │  │    cause                    │ │
│  │  │ MM / YY       │  │  123        │ │  │                             │ │
│  │  └───────────────┘  └─────────────┘ │  │  ────────────────           │ │
│  │                                     │  │                             │ │
│  │  Billing Postal Code *              │  │  Total: $100.00             │ │
│  │  ┌───────────────────────────────┐  │  │  ═══════════════            │ │
│  │  │ [Hosted Field]                │  │  │  (Large, bold)              │ │
│  │  │ 12345                         │  │  │                             │ │
│  │  └───────────────────────────────┘  │  │  🔒 Secure payment          │ │
│  │                                     │  │     Your information is     │ │
│  │  ─────────────────────────────────  │  │     encrypted and safe      │ │
│  │                                     │  │                             │ │
│  │  □ Cover the $3.20 processing fee   │  └─────────────────────────────┘ │
│  │    so 100% of my $100.00 donation   │  (Sticky sidebar)               │
│  │    goes to [Organization Name]      │                                  │
│  │    New total: $103.20               │                                  │
│  │                                     │                                  │
│  │  ─────────────────────────────────  │                                  │
│  │                                     │                                  │
│  │  By completing this donation, I     │                                  │
│  │  agree to the [Terms] and           │                                  │
│  │  [Refund Policy].                   │                                  │
│  │                                     │                                  │
│  │  ┌────────────────────────────────┐ │                                  │
│  │  │  Donate $100.00  🔒            │ │                                  │
│  │  │  (Large, prominent CTA)        │ │                                  │
│  │  └────────────────────────────────┘ │                                  │
│  │                                     │                                  │
│  │  🔒 Secured by [Stripe/Adyen]       │                                  │
│  │  PCI DSS compliant                  │                                  │
│  │                                     │                                  │
│  └─────────────────────────────────────┘                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)

```
┌────────────────────────────────┐
│                                │
│  [Logo]     [Trust Badge ●]    │
│                                │
│  ← Back                        │
│                                │
│  Step 2 of 2                   │
│                                │
├────────────────────────────────┤
│                                │
│  Donation Summary              │
│  ▾ $100.00 One-time            │
│     John Smith                 │
│     [Edit]                     │
│  (Collapsible)                 │
│                                │
├────────────────────────────────┤
│                                │
│  Payment Method                │
│  ──────────────                │
│                                │
│  [Card] [PayPal] [Apple Pay]   │
│  ─────                         │
│                                │
│  Card Number *                 │
│  ┌──────────────────────────┐  │
│  │ [Stripe Hosted Field]    │  │
│  │ 1234 5678 9012 3456      │  │
│  └──────────────────────────┘  │
│  Secure via Stripe             │
│                                │
│  Expiry *       CVC *          │
│  ┌───────────┐ ┌────────────┐  │
│  │ [Hosted]  │ │ [Hosted]   │  │
│  │ MM / YY   │ │ 123        │  │
│  └───────────┘ └────────────┘  │
│                                │
│  Postal Code *                 │
│  ┌──────────────────────────┐  │
│  │ [Hosted Field]           │  │
│  │ 12345                    │  │
│  └──────────────────────────┘  │
│                                │
│  ──────────────────────────    │
│                                │
│  □ Cover $3.20 fee so 100%     │
│    of my $100 donation goes    │
│    to [Org Name]               │
│    New total: $103.20          │
│                                │
│  ──────────────────────────    │
│                                │
│  Total: $100.00                │
│  ═══════════════               │
│  (Large, prominent)            │
│                                │
│  By donating, I agree to the   │
│  [Terms] and [Refund Policy].  │
│                                │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │  Donate $100.00  🔒      │  │
│  │  (Sticky bottom)         │  │
│  └──────────────────────────┘  │
│                                │
│  🔒 Secured by Stripe          │
│                                │
└────────────────────────────────┘
```

### Annotations

**1. Payment Method Tabs**
- Component: TabGroup (Headless UI)
- Tabs: Credit Card (default), PayPal, Apple Pay, Google Pay
- Display tabs based on:
  - Campaign configuration (enabled processors)
  - User device (Apple Pay only on Safari iOS/macOS)
  - User agent (Google Pay on Chrome Android)
- Tab appearance:
  - Width: Auto, padding 16px 24px
  - Border bottom: 3px solid (selected: Primary Blue, unselected: transparent)
  - Text: Label font, (selected: Primary Blue, unselected: Gray 600)
  - Hover: Background Gray 100
- Keyboard: Arrow keys to navigate, Enter to select
- ARIA: role="tablist", aria-selected="true/false"

**2. Hosted Payment Fields (Stripe/Adyen)**
- Component: Hosted iframes from payment processor
- Security: PCI SAQ-A-EP compliant (no card data touches server)
- Styling: Match application design system
  - Font: Body Regular, Gray 900
  - Padding: 12px 16px
  - Border: 2px Gray 300
  - Border radius: Small (4px)
  - Height: 48px
- Fields:
  - Card number: Full-width, auto-detects card type, shows brand icon
  - Expiry: Half-width, format MM/YY automatically
  - CVC: Half-width, tooltip explains CVC location
  - Postal code: Full-width or half-width based on country
- Real-time validation by processor:
  - Card number: Luhn check, brand detection
  - Expiry: Not in past
  - CVC: 3-4 digits based on card brand
- Error display:
  - Processor returns error messages
  - Display below field: Caption, Error Red
  - Border → Error Red
  - Example: "Your card number is incomplete"
- Security badge: "Secure input via Stripe" with lock icon
- ARIA: Processor handles aria-labels within iframes

**3. Fee Coverage Checkbox**
- Component: Checkbox with dynamic calculation
- Label: Multi-line, Body Small
  - "Cover the $X.XX processing fee so 100% of my $X.XX donation goes to [Org Name]"
  - "New total: $X.XX"
- Default: Unchecked
- Behavior:
  - Real-time fee calculation based on processor rates:
    - Stripe: (amount * 0.029) + 0.30
    - Adyen: (amount * 0.025) + 0.10
    - PayPal: (amount * 0.0349) + 0.49
  - When checked: Update total in summary card
  - Update CTA button text: "Donate $X.XX" reflects new total
- Design:
  - Checkbox: 20×20px
  - Border: 1px solid Gray 300
  - Padding: Space 4
  - Background: Gray 100 (slight highlight)
- Keyboard: Space to toggle
- ARIA: aria-label="Cover processing fee of $X.XX"

**4. Donation Summary Sidebar**
- Component: OrderSummary
- Desktop: Sticky sidebar (right), top: 80px
- Mobile: Collapsible accordion at top
- Content:
  - Campaign name (Body Regular, Gray 700)
  - Gift type (Body Small, Gray 600)
  - Donor name (Body Small, Gray 600)
  - Edit link (opens modal to previous steps)
  - Divider (1px, Gray 300)
  - Amount breakdown:
    - Donation: $100.00
    - If fee coverage: "+ Fee: $3.20" (Body Small, Gray 600)
  - Divider
  - Total: Large, Heading 2, Gray 900, bold
  - Security message: Lock icon + "Secure payment" (Caption, Gray 600)
- Styling:
  - Border: 1px Gray 300
  - Border radius: Medium
  - Padding: Space 6
  - Background: White
  - Shadow: Small elevation

**5. Terms Agreement**
- Component: InlineText with links
- Text: "By completing this donation, I agree to the Terms and Refund Policy."
- Font: Body Small, Gray 600
- Links: Underlined, Primary Blue, open in modal or new tab
- Position: Above submit button
- Required: Implied consent (no checkbox per best practices)
- ARIA: Links have descriptive aria-labels

**6. Submit Button (Donate CTA)**
- Component: PrimaryButton (large variant)
- Text: "Donate $X.XX" (dynamic amount) with lock icon
- Desktop: Width 100%, max 500px
- Mobile: Sticky bottom, full-width, 64px height
- Background: Success Green (#0D7A4D) - use green for final action
- Hover: Darken to #0A6340
- States:
  - Default: Enabled when all fields valid
  - Disabled: Gray 200 background, Gray 500 text, if validation fails
  - Loading:
    - Spinner animation
    - Text: "Processing donation..."
    - Disable all interactions
    - Show for minimum 500ms even if fast response
- Click behavior:
  - Validate all payment fields
  - Generate idempotency key (UUID v4)
  - Submit to payment processor
  - Create Gift record
  - Navigate to processing screen
- Keyboard: Enter submits form when focused
- ARIA: aria-label="Complete donation of $X.XX"

**7. Security Indicators**
- Component: TrustBadge
- Positions:
  - Header: "Secure" badge
  - Above payment fields: "Secure input via Stripe"
  - Below submit button: "Secured by Stripe, PCI DSS compliant"
- Icons: Lock (closed padlock), 16px, Gray 600
- Text: Caption, Gray 600
- Optional: Display payment processor logo (Stripe, Adyen)

**8. Back Button**
- Same as donor info step
- Behavior: Return to donor info, preserve payment form data (except sensitive card info)

**Validation Flow:**
1. User fills payment fields → Real-time validation by processor
2. User checks/unchecks fee coverage → Recalculate total
3. User clicks Donate button:
   - Client validates: All fields complete?
   - If invalid: Display errors, focus first error
   - If valid: Show loading state, submit to processor
4. Processor response:
   - Success → Navigate to processing screen → Confirmation
   - Decline → Display error, allow retry
   - Error → Display error with retry or support contact

**Error Handling:**
```javascript
// Common error scenarios
{
  card_declined: {
    message: "Your card was declined. Please try a different payment method.",
    action: "retry",
  },
  insufficient_funds: {
    message: "Your card has insufficient funds. Please try a different card.",
    action: "retry",
  },
  invalid_card: {
    message: "This card number is invalid. Please check and try again.",
    action: "retry",
    focus: "cardNumber",
  },
  expired_card: {
    message: "This card has expired. Please use a different card.",
    action: "retry",
    focus: "expiry",
  },
  incorrect_cvc: {
    message: "The CVC code is incorrect. Please check and try again.",
    action: "retry",
    focus: "cvc",
  },
  processing_error: {
    message: "We couldn't process your payment. Please try again or contact support.",
    action: "retry_or_support",
  },
  network_error: {
    message: "Connection lost. Please check your internet and try again.",
    action: "retry",
  },
}
```

**Accessibility:**
- Payment fields: Processor handles ARIA within iframes
- Keyboard navigation: Tab order: Tabs → Card fields → Fee checkbox → Donate button
- Error announcements: aria-live="polite" region for error messages
- Focus management: After error, focus moves to first invalid field
- Screen reader: "Payment step, 2 of 2. Enter your payment information."

**Performance:**
- Load processor SDK asynchronously when payment step visible
- Defer non-critical scripts (analytics)
- Optimize summary sidebar images
- Prefetch confirmation page assets

**Security:**
- HTTPS only (redirect HTTP → HTTPS)
- CSRF token validation on submit
- Rate limiting: Max 5 attempts per 15 minutes per IP
- No PAN/CVV storage (PCI SAQ-A-EP)
- Idempotency: Prevent duplicate charges with client-generated UUID
- HMAC signature verification for processor webhooks

**Content Model:**
```typescript
{
  payment: {
    processor: "stripe" | "adyen" | "paypal";
    paymentMethodId: string; // Token from processor
  };
  coversFees: boolean;
  feeAmount: number;
  totalAmount: number;
  idempotencyKey: string;
  termsAgreed: boolean; // Implied by submission
}
```

**API Requirements:**
- POST /api/donations/create
  - Body: Complete donation data (donor, amount, payment token, campaign, tribute, etc.)
  - Headers: Idempotency-Key, CSRF-Token
  - Response:
    - 201 Created: { giftId, receiptId, status: "success" }
    - 402 Payment Required: { error, code, message }
    - 500 Server Error: { error, code, message }
- Webhook listener:
  - POST /api/webhooks/stripe
  - Verify HMAC signature
  - Handle events: payment.succeeded, payment.failed, charge.refunded

---

## Screen 4: Processing State

### Full-Screen Overlay

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
│                     ┌──────────────────┐                       │
│                     │                  │                       │
│                     │   ◌◌◌◌◌◌◌◌◌◌   │                       │
│                     │   (Spinner)      │                       │
│                     │                  │                       │
│                     └──────────────────┘                       │
│                                                                │
│                                                                │
│               Processing your donation...                      │
│                                                                │
│             Please don't close this window                     │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Annotations

**1. Full-Screen Overlay**
- Component: LoadingScreen
- Background: White (or rgba(255, 255, 255, 0.98))
- z-index: 9999
- Disable all interactions: pointer-events: none on body
- Prevent navigation: Confirm dialog on browser close attempt

**2. Spinner**
- Component: Spinner (large variant)
- Size: 64px diameter
- Color: Primary Blue
- Animation: Rotate 360deg, 1s linear infinite
- Centered: position absolute, top 50%, left 50%, transform translate(-50%, -50%)

**3. Status Messages**
- Heading: "Processing your donation..." (Heading 3, Gray 900)
- Sub-message: "Please don't close this window" (Body Regular, Gray 600)
- Centered, spacing: 24px between heading and sub-message

**4. Timeout Handling**
- Max duration: 30 seconds
- After 30s: Display error screen with "retry" option
- Backend: Retry logic with same idempotency key (prevents duplicate charge)

**5. Accessibility**
- ARIA live region: aria-live="polite", aria-busy="true"
- Screen reader: "Processing your donation. Please wait."
- Prevent focus: tabindex="-1" on overlay

**Backend Processing Steps:**
1. Receive payment token from processor
2. Validate idempotency key (check for existing transaction)
3. Create or retrieve existing Gift record (if duplicate)
4. Charge payment method via processor API
5. On success:
   - Update Gift status: "success"
   - Create/update Donor record
   - Create RecurringPlan if applicable
   - Generate receipt PDF
   - Queue confirmation email
   - Emit analytics event: donation_completed
   - Log audit trail
6. On failure:
   - Update Gift status: "failed"
   - Log error details
   - Emit analytics event: donation_failed
7. Return response to client
8. Client navigates to confirmation or error screen

**Error Scenarios:**
- Payment declined → Error screen with retry
- Network timeout → Retry with same idempotency key
- Server error → Error screen with support contact
- Duplicate request (same idempotency key) → Return existing transaction

---

## Screen 5: Confirmation / Thank You Page

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [Logo]                                                                    │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│                         ┌──────────────────┐                               │
│                         │                  │                               │
│                         │   ✓ (Checkmark)  │                               │
│                         │   (Large, green) │                               │
│                         │                  │                               │
│                         └──────────────────┘                               │
│                                                                            │
│                                                                            │
│                        Thank You, John!                                    │
│                        ═══════════════════                                 │
│                        (Display Large, Gray 900)                           │
│                                                                            │
│              Your donation of $100.00 is complete.                         │
│              We've sent your receipt to john@example.com                   │
│              ──────────────────────────────────────────                    │
│              (Body Large, Gray 700)                                        │
│                                                                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  Donation Details                                                    │ │
│  │  ────────────────────                                                │ │
│  │                                                                      │ │
│  │  Amount:           $100.00                                           │ │
│  │  Processing Fee:   $0.00 (You chose not to cover fees)              │ │
│  │  Total Charged:    $100.00                                           │ │
│  │                                                                      │ │
│  │  ──────────────────────────────────────────────────────────────      │ │
│  │                                                                      │ │
│  │  Date:             November 13, 2025                                 │ │
│  │  Campaign:         Spring Campaign                                   │ │
│  │  Receipt Number:   RCP-2025-001234                                   │ │
│  │  Payment Method:   •••• 4242                                         │ │
│  │                                                                      │ │
│  │  ──────────────────────────────────────────────────────────────      │ │
│  │                                                                      │ │
│  │  Tax Receipt:      Will be emailed within 24 hours                   │ │
│  │                                                                      │ │
│  │                    ┌────────────────────────┐                        │ │
│  │                    │  View Receipt (PDF) ↗  │                        │ │
│  │                    └────────────────────────┘                        │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  Your Impact                                                         │ │
│  │  ───────────                                                         │ │
│  │                                                                      │ │
│  │  Your $100 donation will provide meals for 10 families in need.     │ │
│  │  Thank you for making a difference!                                  │ │
│  │                                                                      │ │
│  │  [Learn more about our work →]                                       │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  Share Your Support                                                  │ │
│  │  ──────────────────                                                  │ │
│  │                                                                      │ │
│  │  [Facebook]  [Twitter]  [LinkedIn]  [Email]                          │ │
│  │  (Social sharing buttons)                                            │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                                                                            │
│                    ┌────────────────────────────┐                          │
│                    │  Make Another Donation     │                          │
│                    └────────────────────────────┘                          │
│                    (Secondary button)                                      │
│                                                                            │
│                    ┌────────────────────────────┐                          │
│                    │  Return to Website         │                          │
│                    └────────────────────────────┘                          │
│                    (Tertiary link)                                         │
│                                                                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)

```
┌────────────────────────────────┐
│                                │
│  [Logo]                        │
│                                │
├────────────────────────────────┤
│                                │
│         ┌────────────┐         │
│         │     ✓      │         │
│         │  (Green)   │         │
│         └────────────┘         │
│                                │
│      Thank You, John!          │
│      ═══════════════           │
│                                │
│  Your $100.00 donation is      │
│  complete.                     │
│                                │
│  Receipt sent to:              │
│  john@example.com              │
│                                │
├────────────────────────────────┤
│                                │
│  Donation Details              │
│  ────────────────              │
│                                │
│  Amount: $100.00               │
│  Fee: $0.00                    │
│  Total: $100.00                │
│                                │
│  ──────────────────            │
│                                │
│  Date: Nov 13, 2025            │
│  Campaign: Spring Campaign     │
│  Receipt #: RCP-2025-001234    │
│  Payment: •••• 4242            │
│                                │
│  ──────────────────            │
│                                │
│  Tax Receipt: Emailed within   │
│  24 hours                      │
│                                │
│  ┌──────────────────────────┐  │
│  │  View Receipt (PDF) ↗    │  │
│  └──────────────────────────┘  │
│                                │
├────────────────────────────────┤
│                                │
│  Your Impact                   │
│  ───────────                   │
│                                │
│  Your $100 will provide meals  │
│  for 10 families. Thank you!   │
│                                │
│  [Learn more →]                │
│                                │
├────────────────────────────────┤
│                                │
│  Share Your Support            │
│  ──────────────────            │
│                                │
│  [FB] [TW] [IN] [Email]        │
│                                │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │  Make Another Donation   │  │
│  └──────────────────────────┘  │
│                                │
│  [Return to Website]           │
│                                │
└────────────────────────────────┘
```

### Recurring Donation Confirmation (Additional Elements)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Your Monthly Gift is Active!                                │
│  ═══════════════════════════════                             │
│  (Heading 2, Success Green)                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Recurring Gift Details                                │  │
│  │  ──────────────────────                                │  │
│  │                                                        │  │
│  │  Frequency:      Monthly                               │  │
│  │  Amount:         $50.00 per month                      │  │
│  │  First Charge:   Today (November 13, 2025)             │  │
│  │  Next Charge:    December 13, 2025                     │  │
│  │  Payment Method: •••• 4242                             │  │
│  │                                                        │  │
│  │  ────────────────────────────────────────────────      │  │
│  │                                                        │  │
│  │  You'll receive monthly receipts after each donation.  │  │
│  │  You can modify or cancel anytime from your account.   │  │
│  │                                                        │  │
│  │                ┌──────────────────────────┐            │  │
│  │                │  Manage Recurring Gift → │            │  │
│  │                └──────────────────────────┘            │  │
│  │                (Links to /account/recurring)           │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tribute Donation Confirmation (Additional Elements)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Tribute Details                                             │
│  ───────────────                                             │
│                                                              │
│  This gift was made in honour of Jane Doe.                   │
│                                                              │
│  Tribute Message:                                            │
│  "In recognition of your dedication to helping others."      │
│                                                              │
│  [If e-card sent:]                                           │
│  E-card notification sent to recipient@example.com           │
│  Delivery: Immediate (or: Scheduled for Nov 20, 2025)        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Annotations

**1. Success Icon**
- Component: Icon (large variant)
- Icon: Check circle (Heroicons)
- Size: 96px diameter (desktop), 64px (mobile)
- Color: Success Green
- Animation: Scale up + fade in, 300ms ease-out
- Centered on page

**2. Thank You Heading**
- Component: PageHeading
- Text: "Thank You, [FirstName]!" (personalized)
- Font: Display Large, Gray 900
- Centered, margin-bottom: Space 4

**3. Confirmation Message**
- Font: Body Large, Gray 700
- Text: "Your donation of $X.XX is complete."
- Sub-text: "We've sent your receipt to [email]"
- Centered, margin-bottom: Space 8

**4. Donation Details Card**
- Component: DetailCard
- Border: 1px Gray 300
- Border radius: Medium
- Padding: Space 6
- Background: White
- Max-width: 600px, centered
- Content: Key-value pairs
  - Label: Body Small, Gray 600
  - Value: Body Regular, Gray 900
  - Spacing: Space 3 between rows
- Dividers: 1px Gray 200 between sections
- Tax receipt note: Caption, Gray 600, italic
- View Receipt button:
  - Secondary button style
  - Opens PDF in new tab
  - Icon: External link arrow
  - ARIA: aria-label="View receipt PDF, opens in new tab"

**5. Impact Message Card**
- Component: ImpactCard
- Background: Primary Blue tint (#E6F2FF) or Impact Purple tint
- Border: None
- Border radius: Medium
- Padding: Space 6
- Icon: Heart or gift icon (24px, Primary Blue)
- Heading: "Your Impact" (Heading 3, Gray 900)
- Body: Personalized impact message based on amount
  - Example: "Your $100 donation will provide meals for 10 families in need."
- CTA link: "Learn more about our work" → opens campaign page or org website
- Font: Body Regular, Gray 800

**6. Social Sharing Section**
- Component: SocialShare
- Heading: "Share Your Support" (Heading 3, Gray 900)
- Buttons: Facebook, Twitter, LinkedIn, Email
- Button style:
  - Square, 48×48px
  - Brand colors or grayscale
  - Border: 1px Gray 300
  - Hover: Shadow Medium, scale 1.05
  - Icon: 24px brand icon
- Share text templates:
  - Facebook/Twitter: "I just supported [Org Name] with a donation to [Campaign]. Join me in making a difference! [URL]"
  - Email: Pre-filled subject + body
- Keyboard: Tab accessible, Enter to trigger
- ARIA: aria-label="Share on Facebook" (etc.)

**7. Call-to-Action Buttons**
- "Make Another Donation":
  - Component: SecondaryButton
  - Width: 320px (desktop), full-width (mobile)
  - Links to campaign page or general donation page
- "Return to Website":
  - Component: TertiaryButton (text link)
  - Links to organization homepage
  - Underlined on hover

**8. Recurring Management CTA**
- If recurring donation:
  - Component: PrimaryButton
  - Text: "Manage Recurring Gift" with right arrow
  - Links to /account/recurring/[plan-id]
  - Requires authentication (magic link if not logged in)

**9. Tribute Display**
- If tribute gift:
  - Show tribute type, honoree name, message
  - If e-card sent: Confirmation of delivery
  - Font: Body Regular, Gray 700
  - Border: 1px dashed Gray 300
  - Padding: Space 4
  - Background: Gray 100

**Accessibility:**
- Heading hierarchy: H1 (Thank you), H2 (section headings)
- Success announcement: aria-live="polite", screen reader announces "Donation successful"
- Keyboard navigation: Tab through links and buttons
- Focus indicators: All interactive elements have visible focus
- Alternative text: Success icon has alt="Success"
- Print-friendly: Receipt details styled for printing

**Performance:**
- Preload: Receipt PDF generation happens asynchronously
- Lazy load: Social sharing scripts
- Optimize: Impact card images

**Content Model:**
```typescript
{
  gift: {
    id: string;
    amount: number;
    currency: string;
    feeAmount: number;
    coversFees: boolean;
    totalCharged: number;
    date: Date;
    receiptNumber: string;
    receiptPdfUrl: string;
    campaignName: string;
    paymentMethodLast4: string;
  };
  donor: {
    firstName: string;
    email: string;
  };
  impact: {
    message: string; // Personalized based on amount
  };
  recurring?: {
    planId: string;
    frequency: string;
    nextChargeDate: Date;
  };
  tribute?: {
    type: string;
    honoreeName: string;
    message: string;
    ecardSent: boolean;
    ecardRecipientEmail?: string;
    ecardDeliveryDate?: Date;
  };
}
```

**API Requirements:**
- GET /api/gifts/[giftId] - Fetch gift details for confirmation page
- GET /api/receipts/[receiptId]/pdf - Download receipt PDF

**Analytics Events:**
- donation_completed: Fired on page load
- receipt_viewed: When PDF opened
- share_clicked: When social sharing button clicked
- recurring_manage_clicked: When manage CTA clicked

---

## Screen 6: Recurring Plan Management

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  [Logo]                                           [User Menu: John S. ▾]   │
│                                                                            │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  ← Back to Recurring Gifts                                                 │
│                                                                            │
│  Spring Campaign Monthly Gift                                              │
│  ═══════════════════════════════                                           │
│  (Heading 1)                                                               │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  Plan Details                                                        │ │
│  │  ────────────                                                        │ │
│  │                                                                      │ │
│  │  Status:           ● Active                                          │ │
│  │                    (Green badge)                                     │ │
│  │                                                                      │ │
│  │  Amount:           $50.00 per month                                  │ │
│  │  Frequency:        Monthly                                           │ │
│  │  Payment Method:   •••• 4242 (Visa)                                  │ │
│  │  Next Charge:      December 13, 2025                                 │ │
│  │  Start Date:       November 13, 2025                                 │ │
│  │  Total Donated:    $150.00 (3 payments)                              │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  Manage Your Gift                                                    │ │
│  │  ────────────────                                                    │ │
│  │                                                                      │ │
│  │  ┌────────────────────────┐  ┌────────────────────────┐             │ │
│  │  │  Update Amount         │  │  Update Payment Method │             │ │
│  │  └────────────────────────┘  └────────────────────────┘             │ │
│  │                                                                      │ │
│  │  ┌────────────────────────┐  ┌────────────────────────┐             │ │
│  │  │  Pause Plan            │  │  Cancel Plan           │             │ │
│  │  └────────────────────────┘  └────────────────────────┘             │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  Charge History                                                      │ │
│  │  ──────────────                                                      │ │
│  │                                                                      │ │
│  │  ┌────────────┬──────────┬──────────┬──────────────────────┐        │ │
│  │  │ Date       │ Amount   │ Status   │ Receipt              │        │ │
│  │  ├────────────┼──────────┼──────────┼──────────────────────┤        │ │
│  │  │ Nov 13,'25 │ $50.00   │ ● Success│ [View PDF] [Email]   │        │ │
│  │  │ Oct 13,'25 │ $50.00   │ ● Success│ [View PDF] [Email]   │        │ │
│  │  │ Sep 13,'25 │ $50.00   │ ● Success│ [View PDF] [Email]   │        │ │
│  │  │ Aug 13,'25 │ $50.00   │ ✕ Failed │ [Retry Payment]      │        │ │
│  │  └────────────┴──────────┴──────────┴──────────────────────┘        │ │
│  │                                                                      │ │
│  │  [Load More]                                                         │ │
│  │                                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (320px - 767px)

```
┌────────────────────────────────┐
│                                │
│  [Logo]         [User Menu ▾]  │
│                                │
│  ← Back                        │
│                                │
│  Spring Campaign               │
│  Monthly Gift                  │
│  ═══════════                   │
│                                │
├────────────────────────────────┤
│                                │
│  Plan Details                  │
│  ────────────                  │
│                                │
│  Status: ● Active              │
│                                │
│  Amount: $50.00/month          │
│  Frequency: Monthly            │
│  Payment: •••• 4242 (Visa)     │
│  Next Charge: Dec 13, 2025     │
│  Total Donated: $150.00        │
│                                │
├────────────────────────────────┤
│                                │
│  Manage Your Gift              │
│  ────────────────              │
│                                │
│  ┌──────────────────────────┐  │
│  │  Update Amount           │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  Update Payment Method   │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  Pause Plan              │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  Cancel Plan             │  │
│  └──────────────────────────┘  │
│                                │
├────────────────────────────────┤
│                                │
│  Charge History                │
│  ──────────────                │
│                                │
│  ┌──────────────────────────┐  │
│  │ Nov 13, 2025             │  │
│  │ $50.00                   │  │
│  │ ● Success                │  │
│  │ [View Receipt]           │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Oct 13, 2025             │  │
│  │ $50.00                   │  │
│  │ ● Success                │  │
│  │ [View Receipt]           │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Sep 13, 2025             │  │
│  │ $50.00                   │  │
│  │ ● Success                │  │
│  │ [View Receipt]           │  │
│  └──────────────────────────┘  │
│                                │
│  [Load More]                   │
│                                │
└────────────────────────────────┘
```

### Update Amount Modal

```
┌────────────────────────────────────────────┐
│  ✕ (Close button)                          │
│                                            │
│  Update Monthly Amount                     │
│  ═════════════════════                     │
│                                            │
│  Current Amount: $50.00 per month          │
│                                            │
│  New Amount *                              │
│  ┌──────────────────────────────────────┐  │
│  │ $  [                              ]  │  │
│  └──────────────────────────────────────┘  │
│  Min: $1  Max: $100,000                    │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  When should this change take effect?      │
│  ○ Starting with next charge (Dec 13)      │
│  ○ Effective immediately (charge today)    │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  New Total: $75.00 per month               │
│  (If amount increased)                     │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Cancel          │  │  Save Changes  │  │
│  │  (Secondary)     │  │  (Primary)     │  │
│  └──────────────────┘  └────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Update Payment Method Modal

```
┌────────────────────────────────────────────┐
│  ✕ (Close button)                          │
│                                            │
│  Update Payment Method                     │
│  ═════════════════════                     │
│                                            │
│  Current: •••• 4242 (Visa)                 │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  New Card Number *                         │
│  ┌──────────────────────────────────────┐  │
│  │ [Stripe Hosted Field]                │  │
│  │ 1234 5678 9012 3456                  │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Expiry *           CVC *                  │
│  ┌─────────────┐   ┌────────────────────┐  │
│  │ [Hosted]    │   │ [Hosted]           │  │
│  │ MM / YY     │   │ 123                │  │
│  └─────────────┘   └────────────────────┘  │
│                                            │
│  Postal Code *                             │
│  ┌──────────────────────────────────────┐  │
│  │ [Hosted Field]                       │  │
│  │ 12345                                │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  This will be used for all future charges. │
│  🔒 Secure payment via Stripe              │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Cancel          │  │  Update Card   │  │
│  │  (Secondary)     │  │  (Primary)     │  │
│  └──────────────────┘  └────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Cancel Plan Modal (Multi-Step)

**Step 1: Initial Confirmation**
```
┌────────────────────────────────────────────┐
│  ✕ (Close button)                          │
│                                            │
│  Cancel Your Monthly Gift?                 │
│  ═════════════════════════                 │
│                                            │
│  We'll miss your support!                  │
│                                            │
│  Your $50/month gift helps us provide      │
│  vital services to families in need.       │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  Instead of cancelling, would you like to: │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Pause temporarily instead           │  │
│  │  (You can resume anytime)            │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Reduce your monthly amount          │  │
│  │  (Lower to a manageable level)       │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Keep My Gift    │  │  Continue to   │  │
│  │  Active          │  │  Cancel        │  │
│  │  (Primary)       │  │  (Tertiary)    │  │
│  └──────────────────┘  └────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

**Step 2: Feedback & Final Confirmation**
```
┌────────────────────────────────────────────┐
│  ✕ (Close button)                          │
│                                            │
│  We're sorry to see you go                 │
│  ═════════════════════════                 │
│                                            │
│  Help us improve (optional):               │
│  Why are you cancelling?                   │
│                                            │
│  ○ Financial reasons                       │
│  ○ No longer interested in this cause      │
│  ○ Switching to one-time donations         │
│  ○ Technical issues with payments          │
│  ○ Other:                                  │
│    ┌──────────────────────────────────┐    │
│    │                                  │    │
│    └──────────────────────────────────┘    │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  When should your gift be cancelled?       │
│  ○ Immediately (no future charges)         │
│  ○ After next charge (Dec 13, 2025)        │
│                                            │
│  ──────────────────────────────────────    │
│                                            │
│  You will receive a confirmation email.    │
│  You can always set up a new gift later.   │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Go Back         │  │  Cancel Gift   │  │
│  │  (Secondary)     │  │  (Danger)      │  │
│  └──────────────────┘  └────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Annotations

**1. Plan Details Card**
- Component: DetailCard
- Content: Key-value pairs (same styling as confirmation page)
- Status badge:
  - Active: Green background, white text, "●" indicator
  - Paused: Orange background, "⏸" icon
  - Cancelled: Gray background, "✕" icon
- Total donated: Calculated sum of all successful charges

**2. Management Action Buttons**
- Component: SecondaryButton (grid layout)
- Desktop: 2×2 grid, 16px gap
- Mobile: Stacked, full-width
- Size: Height 56px, padding 16px 24px
- Icons: Left-aligned, 20px
- Text: Label font, Gray 900
- Hover: Shadow Medium, background Gray 100

**3. Charge History Table**
- Component: DataTable
- Desktop: Full table with columns
- Mobile: Card-based layout (each charge is a card)
- Columns:
  - Date: Body Regular, Gray 900
  - Amount: Body Regular, Gray 900
  - Status: Badge (Success: Green, Failed: Red)
  - Receipt: Links to PDF and re-send email
- Pagination: Load more button, 10 per page
- Empty state: "No charges yet"
- Failed charge: "Retry Payment" button → triggers new charge attempt

**4. Modal Dialogs**
- Component: Dialog (Headless UI)
- Backdrop: rgba(0, 0, 0, 0.5)
- Modal: White, centered, max-width 500px, border radius Medium
- Close button: Top-right, icon only, "✕"
- Heading: Heading 2, Gray 900
- Animation: Fade in + scale up, 250ms
- ARIA:
  - role="dialog"
  - aria-modal="true"
  - aria-labelledby="modal-title"
  - Focus trap within modal

**5. Update Amount Flow**
- Input: CurrencyInput (same as donation flow)
- Radio buttons: When to apply change
- Validation: Min $1, max $100,000
- Backend: Update RecurringPlan amount field
- Confirmation email sent
- Analytics: recurring_updated

**6. Update Payment Method Flow**
- Hosted fields: Same as donation payment step
- Security: Tokenized, PCI compliant
- Backend:
  - Create new payment token
  - Update RecurringPlan paymentMethodId
  - Test charge (optional, $1 verification)
- Confirmation email sent

**7. Pause Plan Flow**
- Simple confirmation modal
- Backend: Update status to "paused", clear nextChargeDate
- Processor: Pause subscription
- Email: Confirmation with resume instructions
- Analytics: recurring_paused

**8. Cancel Plan Flow**
- Multi-step retention attempt
- Step 1: Offer alternatives (pause, reduce amount)
- Step 2: Collect feedback + final confirmation
- Cancellation timing options:
  - Immediate: No future charges
  - After next charge: Final charge then cancel
- Backend:
  - Update status to "cancelled"
  - Set cancelledAt timestamp
  - Store cancellation reason
  - Cancel processor subscription
- Email: Confirmation with reactivation link
- Analytics: recurring_cancelled + reason
- Danger button styling: Error Red background

**9. Empty State (No Recurring Plans)**
```
┌─────────────────────────────────────┐
│                                     │
│         [Heart Icon]                │
│         (64px, Gray 400)            │
│                                     │
│    No recurring gifts yet           │
│    ────────────────────             │
│                                     │
│    Set up a monthly gift to make a  │
│    lasting impact on our mission.   │
│                                     │
│    ┌─────────────────────────────┐  │
│    │  Start a Monthly Gift       │  │
│    │  (Primary button)           │  │
│    └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Accessibility:**
- Authentication required: Redirect to login if not authenticated
- Keyboard navigation: All modals, buttons, tables navigable via keyboard
- Focus management: Focus moves into modal on open, returns to trigger on close
- Screen reader: Announce status changes ("Amount updated successfully")
- ARIA: Tables have proper headers, modals have labels

**Security:**
- Authentication: JWT or session-based
- Authorization: Verify user owns the plan
- CSRF protection on all mutations
- Rate limiting: Prevent abuse of update/cancel actions

**Performance:**
- Lazy load: Charge history (paginated)
- Optimize: Table rendering for large datasets
- Cache: Plan details, reduce API calls

**Content Model:**
```typescript
{
  plan: {
    id: string;
    status: "active" | "paused" | "cancelled";
    amount: number;
    currency: string;
    frequency: "monthly" | "quarterly" | "annually";
    nextChargeDate: Date | null;
    startDate: Date;
    totalDonated: number;
    chargeCount: number;
    paymentMethodLast4: string;
    paymentMethodBrand: string;
    campaignName: string;
  };
  charges: {
    id: string;
    date: Date;
    amount: number;
    status: "success" | "failed";
    receiptPdfUrl: string;
  }[];
}
```

**API Requirements:**
- GET /api/recurring-plans/[planId] - Fetch plan details
- PATCH /api/recurring-plans/[planId]/amount - Update amount
- PATCH /api/recurring-plans/[planId]/payment-method - Update card
- PATCH /api/recurring-plans/[planId]/pause - Pause plan
- PATCH /api/recurring-plans/[planId]/resume - Resume plan
- PATCH /api/recurring-plans/[planId]/cancel - Cancel plan
- GET /api/recurring-plans/[planId]/charges - Fetch charge history (paginated)
- POST /api/recurring-plans/[planId]/retry-charge - Retry failed charge

---

**End of Wireframes Document**
