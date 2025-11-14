# Component Specifications
**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-11-13

---

## Executive Summary

This document provides complete specifications for all UI components in the donation experience, including anatomy, props, states, behaviors, accessibility requirements, and implementation guidelines. Each component is designed for reusability, accessibility, and performance.

---

## Table of Contents

1. [Form Components](#form-components)
   - AmountSelector
   - TextField
   - CurrencyInput
   - Checkbox
   - RadioGroup
   - Textarea
2. [Button Components](#button-components)
   - PrimaryButton
   - SecondaryButton
   - TertiaryButton
   - IconButton
3. [Layout Components](#layout-components)
   - ProgressIndicator
   - DonationSummaryCard
   - DetailCard
4. [Interactive Components](#interactive-components)
   - SegmentedControl
   - Disclosure (Expandable Section)
   - Modal/Dialog
   - Tabs
5. [Feedback Components](#feedback-components)
   - LoadingSpinner
   - SkeletonLoader
   - Toast/Alert
   - ErrorMessage
6. [Payment Components](#payment-components)
   - HostedPaymentFields
   - FeeCoverageCheckbox
7. [Specialized Components](#specialized-components)
   - GoalThermometer
   - SocialShare
   - ReceiptDisplay

---

## Form Components

### AmountSelector

**Purpose**: Allow users to select or enter a donation amount with preset options and custom input.

**Anatomy**:
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  $25     │  │  $50     │  │  $100    │  ...     │
│  │          │  │          │  │          │          │
│  │ Provides │  │ Provides │  │ Provides │          │
│  │ [impact] │  │ [impact] │  │ [impact] │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  Custom Amount:                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ $ [                                      ]  │    │
│  └─────────────────────────────────────────────┘    │
│  Min: $1  Max: $100,000                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Props**:
```typescript
interface AmountSelectorProps {
  presetAmounts: {
    value: number;
    impactMessage: string;
  }[];
  currency: "USD" | "CAD" | "EUR";
  minAmount: number; // default: 1
  maxAmount: number; // default: 100000
  selectedAmount: number | null;
  onAmountChange: (amount: number) => void;
  giftType: "one-time" | "recurring"; // affects display
}
```

**States**:
- **Default**: No amount selected, all buttons default state
- **Amount Selected**: One preset button active, others inactive
- **Custom Amount Active**: Custom input focused, preset buttons inactive
- **Invalid**: Custom amount outside min/max range, error displayed
- **Disabled**: All inputs disabled (rare, during processing)

**Behavior**:
- Clicking preset button:
  - Sets selectedAmount to button value
  - Deselects other buttons
  - Clears custom input
  - Triggers onAmountChange callback
- Entering custom amount:
  - Deselects all preset buttons
  - Format with commas (1,000)
  - Remove non-numeric characters on input
  - Validate on blur
  - Trigger onAmountChange on valid blur
- Keyboard:
  - Tab order: Preset buttons left-to-right, then custom input
  - Arrow keys: Navigate between preset buttons
  - Enter/Space: Select focused button
  - Number keys: Auto-focus custom input and enter digit

**Visual States (Preset Buttons)**:
```css
/* Default */
border: 2px solid #CBD5E0; /* Gray 300 */
background: #FFFFFF;
box-shadow: none;

/* Hover */
border: 2px solid #0066CC; /* Primary Blue */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
cursor: pointer;
transition: all 150ms ease;

/* Selected */
border: 3px solid #0066CC;
background: #E6F2FF; /* Primary Blue tint */
box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.2);
/* Add checkmark icon in top-right corner */

/* Focus (keyboard) */
outline: 3px solid #0066CC;
outline-offset: 2px;

/* Disabled */
border: 2px solid #E2E8F0; /* Gray 200 */
background: #F7FAFC; /* Gray 100 */
color: #718096; /* Gray 500 */
cursor: not-allowed;
opacity: 0.6;
```

**Accessibility**:
- ARIA:
  - Container: `role="radiogroup"`, `aria-labelledby="amount-heading"`
  - Preset buttons: `role="radio"`, `aria-checked="true/false"`
  - Custom input: `role="textbox"`, `aria-label="Custom donation amount in dollars"`, `inputmode="decimal"`
- Labels:
  - Section heading: "Choose Your Donation Amount" (H2)
  - Preset buttons: Announce "$25, provides meals for 5 families"
  - Custom input: Visible label "Custom Amount"
- Error handling:
  - Invalid amount: `aria-invalid="true"`, `aria-describedby="amount-error"`
  - Error message: `id="amount-error"`, announced by screen reader
- Focus management:
  - First preset button receives focus on page load (optional)
  - Focus outline visible on all interactive elements

**Performance**:
- Render optimization: Memoize preset buttons if amounts don't change
- Validation: Debounce custom input validation (300ms)
- No re-renders on every keystroke (controlled input with debounce)

**Implementation Notes**:
```typescript
// Example usage
<AmountSelector
  presetAmounts={[
    { value: 25, impactMessage: "Provides meals for 5 families" },
    { value: 50, impactMessage: "Supplies hygiene kits for 10 people" },
    { value: 100, impactMessage: "Funds after-school programs for a week" },
    { value: 250, impactMessage: "Covers housing support for a family" },
  ]}
  currency="USD"
  minAmount={1}
  maxAmount={100000}
  selectedAmount={selectedAmount}
  onAmountChange={(amount) => setSelectedAmount(amount)}
  giftType="one-time"
/>
```

**Testing Scenarios**:
- [ ] Selecting preset amount updates state correctly
- [ ] Entering custom amount deselects presets
- [ ] Validation triggers on blur for custom input
- [ ] Error displays for amounts outside min/max range
- [ ] Keyboard navigation works through all buttons
- [ ] Screen reader announces selected amount
- [ ] Currency formatting applies correctly ($1,000.00)

---

### TextField

**Purpose**: Standard text input for donor information (name, email, phone).

**Anatomy**:
```
Label *
┌─────────────────────────────────────────┐
│ [Input text]                            │
└─────────────────────────────────────────┘
Helper text (optional)
⚠ Error message (if error state)
```

**Props**:
```typescript
interface TextFieldProps {
  label: string;
  name: string;
  type: "text" | "email" | "tel" | "url";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  errorMessage?: string;
  autoComplete?: string; // e.g., "given-name", "email"
  maxLength?: number;
}
```

**States**:
- **Default**: Empty, border Gray 300
- **Hover**: Border Gray 500
- **Focus**: Border Primary Blue (2px), box-shadow
- **Filled (Valid)**: Value present, border Gray 300, checkmark icon (optional)
- **Error**: Border Error Red (2px), background Error tint, error message displayed
- **Disabled**: Background Gray 200, text Gray 500, cursor not-allowed

**Visual States**:
```css
/* Default */
height: 48px;
padding: 12px 16px;
border: 2px solid #CBD5E0; /* Gray 300 */
border-radius: 4px;
font-size: 16px;
font-weight: 400;
color: #1A202C; /* Gray 900 */
background: #FFFFFF;

/* Hover */
border-color: #718096; /* Gray 500 */

/* Focus */
border: 2px solid #0066CC; /* Primary Blue */
box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
outline: none;

/* Error */
border: 2px solid #C81E1E; /* Error Red */
background: #FDEAEA; /* Error tint */

/* Disabled */
background: #E2E8F0; /* Gray 200 */
color: #718096; /* Gray 500 */
cursor: not-allowed;
```

**Behavior**:
- onChange: Triggered on every keystroke
- onBlur: Triggered when input loses focus (use for validation)
- Validation: Client-side rules (email format, required field, max length)
- Error display: Show error message below input on blur if invalid
- Clear error: When user starts typing in error field

**Accessibility**:
- Label: Always visible, `htmlFor` matches input `id`
- Required indicator: Asterisk (*) in label, `aria-required="true"` on input
- Helper text: `aria-describedby` links input to helper text id
- Error message: `aria-invalid="true"`, `aria-describedby` links to error id
- Placeholder: Never replaces label, use sparingly
- Autocomplete: Use appropriate values for autofill

**Validation Rules**:
```typescript
const validationRules = {
  text: {
    required: (value) => value.trim().length > 0,
    minLength: (value, min) => value.length >= min,
    maxLength: (value, max) => value.length <= max,
  },
  email: {
    required: (value) => value.trim().length > 0,
    format: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  },
  tel: {
    format: (value) => /^\+?[1-9]\d{1,14}$/.test(value), // E.164 format
  },
};
```

**Implementation Example**:
```typescript
<TextField
  label="First Name"
  name="firstName"
  type="text"
  value={firstName}
  onChange={(value) => setFirstName(value)}
  onBlur={() => validateFirstName()}
  required={true}
  autoComplete="given-name"
  maxLength={100}
  errorMessage={errors.firstName}
/>
```

---

### CurrencyInput

**Purpose**: Specialized input for monetary amounts with currency symbol and formatting.

**Anatomy**:
```
Label
┌─────────────────────────────────────────┐
│ $ [1,000.00]                            │
└─────────────────────────────────────────┘
Helper text
```

**Props**:
```typescript
interface CurrencyInputProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  currency: "USD" | "CAD" | "EUR";
  min?: number;
  max?: number;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
}
```

**States**: Same as TextField

**Behavior**:
- Display currency symbol ($, €, CAD$) to left of input
- Format value with commas on blur: 1000 → 1,000
- Allow decimals: 100.50
- Remove non-numeric characters except decimal point
- Validate min/max range on blur
- Parse formatted string to number for onChange callback

**Formatting Logic**:
```typescript
const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
};

const parseCurrency = (value: string): number | null => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};
```

**Accessibility**: Same as TextField, plus:
- aria-label: "Donation amount in dollars"
- inputmode: "decimal" for mobile numeric keyboard

---

### Checkbox

**Purpose**: Binary selection for opt-ins, fee coverage, tribute options.

**Anatomy**:
```
□ Label text that may span multiple lines
  and include additional context
```

**Props**:
```typescript
interface CheckboxProps {
  label: string | React.ReactNode; // Allow rich text
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
}
```

**States**:
- **Unchecked (Default)**: Empty box, border Gray 300
- **Unchecked (Hover)**: Border Primary Blue
- **Checked**: Background Primary Blue, white checkmark
- **Focus**: Outline Primary Blue with offset
- **Disabled (Unchecked)**: Border Gray 300, background Gray 100
- **Disabled (Checked)**: Background Gray 300, gray checkmark

**Visual States**:
```css
/* Checkbox box */
width: 20px;
height: 20px;
border: 2px solid #CBD5E0; /* Gray 300 */
border-radius: 4px;
background: #FFFFFF;

/* Unchecked Hover */
border-color: #0066CC;

/* Checked */
background: #0066CC; /* Primary Blue */
border-color: #0066CC;
/* White checkmark SVG icon */

/* Focus (keyboard) */
outline: 3px solid rgba(0, 102, 204, 0.3);
outline-offset: 2px;

/* Disabled */
background: #E2E8F0; /* Gray 200 */
border-color: #CBD5E0;
cursor: not-allowed;
opacity: 0.6;
```

**Behavior**:
- Click label or box to toggle
- Keyboard: Space to toggle when focused
- onChange callback fires with new checked state

**Accessibility**:
- Semantic HTML: `<input type="checkbox">`
- Label: `<label>` wraps checkbox and text, or uses `htmlFor`
- ARIA: `role="checkbox"` (implicit), `aria-checked="true/false"`
- Keyboard: Tab to focus, Space to toggle
- Focus indicator: Visible outline

**Implementation**:
```typescript
<Checkbox
  label="Cover the $3.20 processing fee so 100% goes to the cause"
  checked={coversFees}
  onChange={(checked) => setCoversFees(checked)}
/>
```

---

### RadioGroup

**Purpose**: Mutually exclusive selection (e.g., tribute type, frequency).

**Anatomy**:
```
Label *
○ Option 1
○ Option 2
○ Option 3 (selected: ◉)
```

**Props**:
```typescript
interface RadioGroupProps {
  label: string;
  name: string;
  options: {
    value: string;
    label: string;
    description?: string; // Optional helper text
  }[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  required?: boolean;
  orientation?: "vertical" | "horizontal";
}
```

**States**:
- **Unselected**: Empty circle, border Gray 300
- **Selected**: Filled circle (dot), border and dot Primary Blue
- **Hover**: Border Primary Blue
- **Focus**: Outline Primary Blue
- **Disabled**: Gray appearance, cursor not-allowed

**Visual States**:
```css
/* Radio button */
width: 20px;
height: 20px;
border: 2px solid #CBD5E0;
border-radius: 50%; /* Circle */
background: #FFFFFF;

/* Selected */
border-color: #0066CC;
background: radial-gradient(
  circle,
  #0066CC 0%,
  #0066CC 40%,
  #FFFFFF 40%,
  #FFFFFF 100%
); /* Filled dot */

/* Focus */
outline: 3px solid rgba(0, 102, 204, 0.3);
outline-offset: 2px;
```

**Behavior**:
- Click label or radio to select
- Only one option selected at a time
- Keyboard: Arrow keys to navigate, Space/Enter to select
- onChange callback with selected value

**Accessibility**:
- Semantic HTML: `<input type="radio">` with same `name`
- Fieldset: Wrap group in `<fieldset>`, use `<legend>` for label
- ARIA: `role="radiogroup"` on container, `aria-checked` on inputs
- Keyboard: Tab to group, arrow keys between options

**Implementation**:
```typescript
<RadioGroup
  label="This gift is:"
  name="tributeType"
  options={[
    { value: "honour", label: "In honour of" },
    { value: "memory", label: "In memory of" },
    { value: "celebration", label: "In celebration of" },
  ]}
  selectedValue={tributeType}
  onChange={(value) => setTributeType(value)}
  required={true}
  orientation="vertical"
/>
```

---

### Textarea

**Purpose**: Multi-line text input for messages (tribute message, personal message).

**Anatomy**:
```
Label
┌─────────────────────────────────────────┐
│                                         │
│ [Multi-line text]                       │
│                                         │
│                                         │
└─────────────────────────────────────────┘
0 / 500 characters
```

**Props**:
```typescript
interface TextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number; // default: 4
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
}
```

**States**: Same as TextField

**Visual States**: Same as TextField, with:
- Min-height: 96px (4 rows)
- Resize: vertical (allow user to expand)
- Padding: 12px 16px

**Behavior**:
- Character counter: Display "[current] / [max] characters" below
- Update counter on every keystroke
- Prevent input beyond maxLength
- Auto-resize: Optionally expand height as user types

**Accessibility**:
- aria-label or visible label
- aria-describedby: Link to character counter
- aria-invalid: If error state

**Implementation**:
```typescript
<Textarea
  label="Tribute Message (optional)"
  value={tributeMessage}
  onChange={(value) => setTributeMessage(value)}
  maxLength={500}
  rows={4}
  placeholder="Share your thoughts..."
/>
```

---

## Button Components

### PrimaryButton

**Purpose**: Main call-to-action (Continue, Donate, Submit).

**Anatomy**:
```
┌─────────────────────────────┐
│  [Icon] Button Text  →      │
└─────────────────────────────┘
```

**Props**:
```typescript
interface PrimaryButtonProps {
  children: React.ReactNode; // Button text
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode; // Optional leading icon
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
}
```

**States**:
- **Default**: Primary Blue background, white text
- **Hover**: Darker blue, shadow medium
- **Focus**: Outline visible, darker blue background
- **Active**: Darkest blue, shadow small, translateY(1px)
- **Disabled**: Gray 200 background, gray text, no interaction
- **Loading**: Spinner replaces icon, "Processing..." text, disabled interaction

**Visual States**:
```css
/* Default */
height: 56px; /* large size */
padding: 16px 24px;
background: #0066CC; /* Primary Blue */
color: #FFFFFF;
font-size: 16px;
font-weight: 500;
border: none;
border-radius: 8px;
box-shadow: none;
cursor: pointer;
transition: all 150ms ease;

/* Hover */
background: #0052A3;
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Focus (keyboard) */
background: #0052A3;
outline: 3px solid #0066CC;
outline-offset: 2px;

/* Active (click) */
background: #003D7A;
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
transform: translateY(1px);

/* Disabled */
background: #E2E8F0; /* Gray 200 */
color: #718096; /* Gray 500 */
cursor: not-allowed;
opacity: 0.6;

/* Loading */
background: #0066CC;
color: #FFFFFF;
cursor: wait;
pointer-events: none;
/* Spinner animation inside */
```

**Behavior**:
- onClick: Fires when clicked (if not disabled or loading)
- type="submit": Submits form when clicked
- Loading state: Show spinner, disable interaction, change text to "Processing..."
- Full width: Button expands to container width (mobile)

**Accessibility**:
- Semantic HTML: `<button>`
- aria-label: If button has icon only, no text
- aria-disabled="true": When disabled
- aria-busy="true": When loading
- Keyboard: Enter/Space triggers onClick
- Focus indicator: Visible outline

**Sizes**:
```css
/* Small */
height: 40px;
padding: 8px 16px;
font-size: 14px;

/* Medium */
height: 48px;
padding: 12px 20px;
font-size: 16px;

/* Large (default) */
height: 56px;
padding: 16px 24px;
font-size: 16px;
```

**Implementation**:
```typescript
<PrimaryButton
  onClick={handleContinue}
  disabled={!isValid}
  loading={isSubmitting}
  type="button"
  fullWidth={isMobile}
  size="large"
>
  Continue to Payment →
</PrimaryButton>
```

---

### SecondaryButton

**Purpose**: Alternative actions (Edit, Cancel, Go Back).

**Anatomy**: Same as PrimaryButton

**Props**: Same as PrimaryButton

**Visual States**:
```css
/* Default */
background: #FFFFFF;
color: #0066CC; /* Primary Blue */
border: 2px solid #0066CC;

/* Hover */
background: #E6F2FF; /* Primary Blue tint */
border-color: #0052A3;
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Focus */
background: #E6F2FF;
outline: 3px solid rgba(0, 102, 204, 0.3);
outline-offset: 2px;

/* Active */
background: #CCE0FF;
border-color: #003D7A;

/* Disabled */
background: #FFFFFF;
border: 2px solid #E2E8F0;
color: #718096;
cursor: not-allowed;
opacity: 0.6;
```

**Behavior**: Same as PrimaryButton

**Accessibility**: Same as PrimaryButton

---

### TertiaryButton

**Purpose**: Tertiary actions (text links styled as buttons).

**Visual States**:
```css
/* Default */
background: transparent;
color: #0066CC;
border: none;
text-decoration: underline;
padding: 8px 16px;

/* Hover */
color: #0052A3;
text-decoration: underline;

/* Focus */
outline: 3px solid rgba(0, 102, 204, 0.3);
outline-offset: 2px;
```

---

### IconButton

**Purpose**: Button with icon only (close, menu, back).

**Props**:
```typescript
interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  ariaLabel: string; // Required for accessibility
  disabled?: boolean;
  variant?: "default" | "ghost" | "danger";
}
```

**Visual States**:
```css
/* Default */
width: 40px;
height: 40px;
padding: 8px;
background: transparent;
border: none;
border-radius: 8px;
cursor: pointer;

/* Hover */
background: #F7FAFC; /* Gray 100 */

/* Focus */
outline: 3px solid rgba(0, 102, 204, 0.3);
outline-offset: 2px;
```

**Accessibility**:
- aria-label: Required, describes action (e.g., "Close modal", "Go back")
- role="button": Implicit from `<button>`

---

## Layout Components

### ProgressIndicator

**Purpose**: Show user's position in multi-step flow.

**Desktop Anatomy**:
```
●──────────────●──────────────○
Amount      Donor Info     Payment
(Step 1)     (Step 2)      (Step 3)
```

**Mobile Anatomy**:
```
Step 1 of 3
```

**Props**:
```typescript
interface ProgressIndicatorProps {
  steps: {
    label: string;
    status: "completed" | "current" | "upcoming";
  }[];
  variant: "desktop" | "mobile";
}
```

**Visual States**:
- **Completed Step**: Filled circle (●), Primary Blue, connecting line solid
- **Current Step**: Outlined circle (◉), Primary Blue, bold label
- **Upcoming Step**: Empty circle (○), Gray 300, connecting line dashed

**Behavior**:
- Read-only, no interaction
- Updates automatically as user progresses

**Accessibility**:
- aria-label: "Progress: Step 2 of 3, Donor Information"
- role="progressbar" or descriptive text

---

### DonationSummaryCard

**Purpose**: Display donation details in sidebar or collapsible card.

**Anatomy**:
```
┌─────────────────────────────────────┐
│  Donation Summary                   │
│  ────────────────                   │
│                                     │
│  Spring Campaign                    │
│  One-time donation                  │
│                                     │
│  John Smith                         │
│  john@example.com                   │
│  [Edit]                             │
│                                     │
│  ─────────────────                  │
│                                     │
│  Amount: $100.00                    │
│  Fee: $3.20                         │
│  ─────────────────                  │
│  Total: $103.20                     │
│  ═════════════                      │
│                                     │
│  🔒 Secure payment                  │
│                                     │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface DonationSummaryCardProps {
  campaign: string;
  giftType: "one-time" | "recurring";
  frequency?: string; // If recurring
  donor?: {
    name: string;
    email: string;
  };
  amount: number;
  feeAmount: number;
  totalAmount: number;
  onEdit?: () => void;
  variant: "sidebar" | "collapsible";
}
```

**Visual States**:
- Border: 1px Gray 300
- Border radius: Medium (8px)
- Padding: Space 6 (24px)
- Background: White or Gray 100
- Shadow: Small elevation (optional)

**Behavior**:
- Sidebar variant: Sticky on scroll (position: sticky, top: 80px)
- Collapsible variant (mobile): Accordion that expands/collapses
- Edit link: Opens modal to previous step or inline edit

**Accessibility**:
- Heading: "Donation Summary" (H2 or aria-labelledby)
- Edit button: aria-label="Edit donation details"
- If collapsible: aria-expanded="true/false"

---

### DetailCard

**Purpose**: Display key-value pairs (receipt, plan details).

**Anatomy**:
```
┌─────────────────────────────────────┐
│  Label:          Value               │
│  Label:          Value               │
│  ─────────────────────               │
│  Label:          Value               │
│  Label:          Value               │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface DetailCardProps {
  items: {
    label: string;
    value: string | React.ReactNode;
  }[];
  title?: string;
}
```

**Visual States**:
- Label: Body Small, Gray 600, left-aligned
- Value: Body Regular, Gray 900, right-aligned or below label (mobile)
- Spacing: Space 3 (12px) between rows
- Divider: 1px Gray 200 (optional, between sections)

---

## Interactive Components

### SegmentedControl

**Purpose**: Toggle between mutually exclusive options (One-Time / Monthly).

**Anatomy**:
```
┌────────────────────────────────────┐
│  [One-Time]     [Monthly]          │
│  ──────────                        │
└────────────────────────────────────┘
```

**Props**:
```typescript
interface SegmentedControlProps {
  options: {
    value: string;
    label: string;
  }[];
  selectedValue: string;
  onChange: (value: string) => void;
}
```

**Visual States**:
- Container: Border 2px Gray 300, border radius Medium
- Selected option:
  - Background: Primary Blue
  - Text: White, Label font
  - Border radius: Medium (inner)
- Unselected option:
  - Background: White
  - Text: Gray 700
  - Hover: Background Gray 100

**Behavior**:
- Click option to select
- Keyboard: Arrow keys to navigate, Enter to select
- Smooth transition between selections (150ms)

**Accessibility**:
- role="radiogroup"
- Options: role="radio", aria-checked
- Keyboard navigation with arrow keys

---

### Disclosure (Expandable Section)

**Purpose**: Hide/show optional content (tribute section).

**Anatomy**:
```
▸ Make this a tribute gift (collapsed)

OR

▾ Make this a tribute gift (expanded)
┌─────────────────────────────────────┐
│  [Tribute form fields]              │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface DisclosureProps {
  trigger: string; // Button text
  children: React.ReactNode; // Content to show/hide
  defaultOpen?: boolean;
}
```

**Visual States**:
- Trigger button:
  - Full-width, left-aligned text
  - Chevron icon (right → / down ▾)
  - Border: 1px dashed Gray 300 (top and bottom)
  - Hover: Background Gray 100
- Content:
  - Animate: Slide down (expand), slide up (collapse), 250ms ease-out
  - Padding: Space 4
  - Border: 1px solid Gray 300
  - Border radius: Medium

**Behavior**:
- Click trigger to toggle
- Keyboard: Enter/Space to toggle
- Focus: Move to first field in content when expanded (optional)

**Accessibility**:
- Button: aria-expanded="true/false", aria-controls="content-id"
- Content: id="content-id", role="region", aria-labelledby="button-id"
- Keyboard: Tab to button, Enter/Space to toggle

**Implementation**:
Use Headless UI Disclosure component for accessibility and behavior.

---

### Modal/Dialog

**Purpose**: Overlay for confirmations, edits, errors.

**Anatomy**:
```
[Backdrop: semi-transparent black]

┌─────────────────────────────────────┐
│  ✕ (Close button)                   │
│                                     │
│  Modal Title                        │
│  ═══════════                        │
│                                     │
│  [Modal content]                    │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  Cancel  │  │  Confirm │        │
│  └──────────┘  └──────────┘        │
│                                     │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode; // Action buttons
  size?: "small" | "medium" | "large";
}
```

**Visual States**:
- Backdrop: rgba(0, 0, 0, 0.5), z-index: 1000
- Modal: White, centered, max-width based on size, border radius Large
- Shadow: XL elevation
- Close button: Top-right, icon only

**Behavior**:
- Open: Fade in + scale up (250ms)
- Close: Fade out + scale down (250ms)
- Click backdrop or close button to dismiss
- Escape key to close
- Focus trap: Keep focus within modal

**Accessibility**:
- role="dialog", aria-modal="true"
- aria-labelledby: Link to title
- Focus management:
  - On open: Focus first focusable element (close button or first input)
  - On close: Return focus to trigger element
- Keyboard: Escape to close, Tab cycles within modal

**Implementation**:
Use Headless UI Dialog component for accessibility.

---

### Tabs

**Purpose**: Switch between payment methods or views.

**Anatomy**:
```
[Credit Card]  [PayPal]  [Apple Pay]
──────────
(Underline on selected tab)

[Tab Panel Content]
```

**Props**:
```typescript
interface TabsProps {
  tabs: {
    value: string;
    label: string;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
  onChange?: (value: string) => void;
}
```

**Visual States**:
- Tab (unselected):
  - Background: Transparent
  - Text: Gray 600, Label font
  - Border bottom: 3px transparent
  - Hover: Background Gray 100
- Tab (selected):
  - Text: Primary Blue, bold
  - Border bottom: 3px Primary Blue
- Tab panel:
  - Padding: Space 6
  - Border: 1px Gray 300 (optional)

**Behavior**:
- Click tab to select
- Keyboard: Arrow keys to navigate, Enter to select
- Smooth transition between panels (fade in/out)

**Accessibility**:
- role="tablist" on container
- role="tab" on buttons, aria-selected
- role="tabpanel" on content, aria-labelledby

**Implementation**:
Use Headless UI Tabs component.

---

## Feedback Components

### LoadingSpinner

**Purpose**: Indicate loading state.

**Anatomy**:
```
   ◌◌◌◌◌◌◌◌
   (Spinning circle)
```

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}
```

**Visual States**:
- Size: 20px (small), 32px (medium), 64px (large)
- Color: Primary Blue or white (on dark backgrounds)
- Animation: Rotate 360deg, 1s linear infinite

**Implementation**:
```tsx
<svg className="spinner" width={size} height={size} viewBox="0 0 50 50">
  <circle
    cx="25"
    cy="25"
    r="20"
    fill="none"
    stroke={color}
    strokeWidth="5"
    strokeDasharray="80 30"
    strokeLinecap="round"
  />
</svg>

/* CSS */
.spinner {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  100% { transform: rotate(360deg); }
}
```

**Accessibility**:
- aria-label="Loading"
- role="status"
- aria-live="polite" container

---

### SkeletonLoader

**Purpose**: Show placeholder during initial load.

**Anatomy**:
```
┌─────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    │
│  ▓▓▓▓▓▓▓                            │
└─────────────────────────────────────┘
(Animated shimmer effect)
```

**Visual States**:
- Background: Gray 200
- Shimmer: Animated gradient from Gray 200 → Gray 100 → Gray 200
- Animation: 1.5s linear infinite

**Implementation**:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #E2E8F0 0%,
    #F7FAFC 50%,
    #E2E8F0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### Toast/Alert

**Purpose**: Show success, error, or info messages.

**Anatomy**:
```
┌─────────────────────────────────────┐
│  [Icon]  Message text         [✕]   │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number; // Auto-dismiss after ms
  onClose?: () => void;
}
```

**Visual States**:
- Success: Background Success Green, white text, checkmark icon
- Error: Background Error Red, white text, X circle icon
- Warning: Background Warning Orange, white text, exclamation icon
- Info: Background Info Blue, white text, info icon

**Behavior**:
- Appear: Slide in from top or bottom
- Auto-dismiss: After duration (default 5000ms)
- Dismiss: Click close button or manually call onClose

**Accessibility**:
- role="alert" for errors, role="status" for success
- aria-live="assertive" for errors, "polite" for success

---

### ErrorMessage

**Purpose**: Display inline error messages.

**Anatomy**:
```
⚠ Error message text
```

**Props**:
```typescript
interface ErrorMessageProps {
  message: string;
  id?: string; // For aria-describedby
}
```

**Visual States**:
- Icon: Exclamation circle, Error Red, 16px
- Text: Caption font, Error Red
- Spacing: 4px top margin (below input)

**Accessibility**:
- id attribute: For aria-describedby linking
- role="alert" for dynamic errors

---

## Payment Components

### HostedPaymentFields

**Purpose**: Secure payment input via processor (Stripe/Adyen).

**Anatomy**:
```
Card Number *
┌─────────────────────────────────────┐
│ [Stripe Hosted Iframe]              │
│ 1234 5678 9012 3456                 │
└─────────────────────────────────────┘

Expiry *           CVC *
┌────────────────┐ ┌─────────────────┐
│ [Hosted Field] │ │ [Hosted Field]  │
│ MM / YY        │ │ 123             │
└────────────────┘ └─────────────────┘
```

**Props**:
```typescript
interface HostedPaymentFieldsProps {
  processor: "stripe" | "adyen" | "paypal";
  onTokenReceived: (token: string) => void;
  onError: (error: string) => void;
}
```

**Behavior**:
- Render processor SDK (Stripe.js, Adyen Drop-in)
- Style hosted fields to match design system
- Real-time validation by processor
- On valid submission: Return payment token via onTokenReceived
- On error: Return error message via onError

**Security**:
- PCI SAQ-A-EP compliant
- No card data touches application
- Tokenized payment methods only

**Accessibility**:
- Processor handles ARIA within iframes
- Ensure visible labels above each field
- Error messages displayed below fields

**Implementation**:
Use official SDKs:
- Stripe: `@stripe/stripe-js`, `@stripe/react-stripe-js`
- Adyen: `@adyen/adyen-web`

---

### FeeCoverageCheckbox

**Purpose**: Allow donor to cover processing fees.

**Anatomy**:
```
□ Cover the $3.20 processing fee so 100% of my
  $100.00 donation goes to [Organization Name]
  New total: $103.20
```

**Props**:
```typescript
interface FeeCoverageCheckboxProps {
  amount: number;
  feeAmount: number;
  organizationName: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
```

**Behavior**:
- Calculate fee in real-time based on processor rates
- Update feeAmount when amount changes
- Update total when checked/unchecked
- Display fee breakdown clearly

**Calculation**:
```typescript
const calculateFee = (amount: number, processor: string): number => {
  const rates = {
    stripe: { percentage: 0.029, fixed: 0.30 },
    adyen: { percentage: 0.025, fixed: 0.10 },
    paypal: { percentage: 0.0349, fixed: 0.49 },
  };
  const rate = rates[processor];
  return amount * rate.percentage + rate.fixed;
};
```

**Accessibility**:
- Label spans multiple lines, fully clickable
- Checkbox linked via aria-labelledby
- Announce total change to screen readers

---

## Specialized Components

### GoalThermometer

**Purpose**: Visualize fundraising progress.

**Anatomy**:
```
┌─────────────────────────────────────┐
│  Goal: $50,000                      │
│  [████████████────────] 65%         │
│  $32,500 raised                     │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface GoalThermometerProps {
  goal: number;
  current: number;
  currency: string;
}
```

**Visual States**:
- Progress bar: Height 8px, border radius Full (pill shape)
- Background: Gray 200
- Fill: Primary Blue or Impact Purple
- Text: Body Small, Gray 700
- Percentage: Bold, Gray 900

**Behavior**:
- Calculate percentage: (current / goal) * 100
- Animate fill on mount (300ms ease-out)
- Cap at 100% (even if exceeded)

**Accessibility**:
- aria-label="Fundraising progress: $32,500 raised of $50,000 goal, 65% complete"
- role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax

---

### SocialShare

**Purpose**: Allow sharing on social media.

**Anatomy**:
```
Share Your Support
────────────────
[Facebook] [Twitter] [LinkedIn] [Email]
```

**Props**:
```typescript
interface SocialShareProps {
  url: string;
  title: string;
  description: string;
}
```

**Behavior**:
- Click button: Open share dialog or native share API
- Pre-fill content:
  - Facebook: title + url
  - Twitter: description + url (under 280 chars)
  - LinkedIn: title + description + url
  - Email: Subject + body with url

**Implementation**:
```typescript
const shareFacebook = () => {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
};

const shareTwitter = () => {
  window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`);
};

const shareEmail = () => {
  window.location.href = `mailto:?subject=${title}&body=${description}%0A%0A${url}`;
};

// Or use Web Share API
if (navigator.share) {
  navigator.share({ title, text: description, url });
}
```

**Accessibility**:
- Each button: aria-label="Share on Facebook" (etc.)
- Keyboard accessible

---

### ReceiptDisplay

**Purpose**: Show donation receipt details.

**Anatomy**:
```
┌─────────────────────────────────────┐
│  Receipt #RCP-2025-001234           │
│  ═══════════════════════════         │
│                                     │
│  Amount:         $100.00            │
│  Date:           November 13, 2025  │
│  Campaign:       Spring Campaign    │
│  Payment:        •••• 4242          │
│                                     │
│  [View PDF ↗]  [Email Receipt]      │
│                                     │
└─────────────────────────────────────┘
```

**Props**:
```typescript
interface ReceiptDisplayProps {
  receiptNumber: string;
  amount: number;
  date: Date;
  campaign: string;
  paymentMethodLast4: string;
  pdfUrl: string;
  onEmailReceipt: () => void;
}
```

**Behavior**:
- View PDF: Open in new tab
- Email Receipt: Trigger API to resend receipt email
- Print-friendly styling (CSS @media print)

**Accessibility**:
- Heading: "Receipt Details" (H2)
- PDF link: aria-label="View receipt PDF, opens in new tab"
- Email button: aria-label="Resend receipt to email"

---

**End of Component Specifications Document**
