# Accessibility Guide & WCAG 2.2 AA Compliance
**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-11-13

---

## Executive Summary

This document provides comprehensive accessibility requirements for the donation experience to ensure WCAG 2.2 Level AA compliance. All designs, components, and user flows must meet these standards to provide an equitable experience for all users, including those using assistive technologies.

---

## WCAG 2.2 AA Compliance Checklist

### Perceivable

#### 1.1 Text Alternatives

**Requirement**: Provide text alternatives for non-text content.

**Implementation**:
- [ ] All images have meaningful alt text
  - Decorative images: `alt=""` or `role="presentation"`
  - Informative images: Descriptive alt text
  - Campaign hero images: Alt describes campaign purpose
- [ ] Icons have accessible names via `aria-label` or visually hidden text
- [ ] Payment processor logos have alt text
- [ ] Social sharing icons have descriptive labels
- [ ] Form inputs have visible labels (no placeholder-only labels)
- [ ] Loading spinners have `aria-label="Loading"`

**Test Scenarios**:
- Turn on screen reader (VoiceOver, NVDA, JAWS)
- Navigate through all images
- Verify all images are announced with meaningful descriptions
- Verify icons without visible text are properly labeled

---

#### 1.3 Adaptable

**Requirement**: Create content that can be presented in different ways without losing information.

**Implementation**:
- [ ] Semantic HTML structure:
  - `<nav>` for navigation
  - `<main>` for primary content
  - `<section>` for distinct sections
  - `<article>` for self-contained content
  - `<aside>` for sidebars
  - `<footer>` for footer content
- [ ] Heading hierarchy (H1 → H2 → H3):
  - H1: Page title (e.g., "Support Our Mission")
  - H2: Section headings (e.g., "Choose Your Amount", "Your Information")
  - H3: Sub-sections (e.g., "Tribute Details", "Impact Message")
- [ ] Proper form structure:
  - `<form>` element wraps donation flow
  - `<label>` for every input (no implicit labels)
  - `<fieldset>` and `<legend>` for grouped inputs (e.g., contact info, tribute radio buttons)
- [ ] Data tables (charge history):
  - `<thead>`, `<tbody>`, `<th>` with `scope="col"`
  - Caption: `<caption>Charge History</caption>`
- [ ] Lists:
  - `<ul>` or `<ol>` for preset amounts (if not using radio pattern)
  - Social sharing buttons: `<ul>` list
- [ ] Responsive design:
  - Content reflows at 320px width without horizontal scroll
  - No loss of information or functionality at any breakpoint
  - Zoom to 200% without breaking layout

**Test Scenarios**:
- View page with CSS disabled (semantic HTML still makes sense)
- Zoom to 200% and verify all content is accessible
- Use browser reader mode (Safari, Firefox)
- Navigate with heading shortcuts in screen reader (H key in NVDA)

---

#### 1.4 Distinguishable

**Requirement**: Make it easier for users to see and hear content.

**1.4.3 Contrast (Minimum)**
- [ ] Text contrast ratios:
  - Normal text (< 18px): 4.5:1 minimum
  - Large text (≥ 18px or ≥ 14px bold): 3:1 minimum
  - Gray 900 on White: 15.8:1 ✓ (AAA)
  - Gray 700 on White: 9.73:1 ✓ (AAA)
  - Primary Blue on White: 4.72:1 ✓ (AA)
  - Error Red on White: 6.12:1 ✓ (AA)
  - Success Green on White: 4.58:1 ✓ (AA)
- [ ] UI component contrast:
  - Input borders: Gray 300 on White: 2.51:1 (may need adjustment for 3:1)
  - Button borders: Primary Blue on White: 4.72:1 ✓
  - Focus indicators: 3:1 minimum against background

**1.4.4 Resize Text**
- [ ] Text resizes to 200% without loss of content or functionality
- [ ] Layout does not break at 200% zoom
- [ ] No horizontal scrolling required at 200% zoom (up to 1280px wide)

**1.4.10 Reflow**
- [ ] Content reflows to single column at 320px width
- [ ] No horizontal scrolling at 320px width
- [ ] All functionality available at mobile breakpoints

**1.4.11 Non-text Contrast**
- [ ] UI components have 3:1 contrast:
  - Input field borders
  - Button borders
  - Focus indicators
  - Active/selected states
  - Graphical objects (icons, progress bars)

**1.4.12 Text Spacing**
- [ ] Allow user style sheet adjustments:
  - Line height (line spacing) at least 1.5 times font size
  - Spacing following paragraphs at least 2 times font size
  - Letter spacing at least 0.12 times font size
  - Word spacing at least 0.16 times font size
- [ ] No loss of content or functionality when spacing increased

**1.4.13 Content on Hover or Focus**
- [ ] Tooltips/popups are:
  - Dismissible: Esc key closes without moving focus
  - Hoverable: Mouse can move over tooltip without dismissing
  - Persistent: Remains visible until user dismisses or removes hover/focus

**Test Scenarios**:
- Use contrast checker (WebAIM, Stark plugin) on all text and UI elements
- Zoom browser to 200% and verify all content accessible
- Resize browser to 320px width and verify no horizontal scroll
- Apply custom CSS with increased text spacing (use bookmarklet)
- Hover over tooltips and verify they remain visible

---

### Operable

#### 2.1 Keyboard Accessible

**Requirement**: Make all functionality available from a keyboard.

**2.1.1 Keyboard**
- [ ] All interactive elements keyboard accessible:
  - Amount buttons: Tab to focus, Enter/Space to select
  - Form inputs: Tab to focus, type to enter
  - Checkboxes/radios: Tab to focus, Space to toggle
  - Buttons: Tab to focus, Enter/Space to activate
  - Links: Tab to focus, Enter to follow
  - Modals: Tab cycles within modal, Esc to close
  - Dropdowns: Arrow keys to navigate, Enter to select
  - Tabs: Arrow keys to navigate, Enter to select
  - Expandable sections: Enter/Space to expand
- [ ] No keyboard traps:
  - Focus never gets stuck in a component
  - Always able to navigate forward and backward with Tab/Shift+Tab
  - Modal focus trap allows Esc to close

**2.1.2 No Keyboard Trap**
- [ ] User can navigate away from any component using standard keyboard
- [ ] Modal/dialog allows Esc key to close and return focus

**2.1.4 Character Key Shortcuts** (if applicable)
- [ ] Single character shortcuts (if any) can be turned off, remapped, or only active when component has focus

**Test Scenarios**:
- Unplug mouse, navigate entire donation flow with keyboard only
- Tab through all interactive elements in logical order
- Verify no keyboard traps (can always Tab away)
- Test all interactive components with keyboard:
  - Amount selection: Arrow keys, Enter
  - Form fields: Tab, type, Shift+Tab
  - Modals: Esc to close
  - Expandable sections: Enter to expand/collapse

---

#### 2.2 Enough Time

**Requirement**: Provide users enough time to read and use content.

**2.2.1 Timing Adjustable**
- [ ] No time limits on donation flow
  - Session does not expire during donation (or warns and allows extension)
  - Processing state shows progress, does not timeout prematurely
- [ ] If timeout exists (e.g., 15 min idle):
  - User warned before timeout (e.g., 2 min warning)
  - User can extend session with simple action
  - At least 20 seconds to respond to warning

**2.2.2 Pause, Stop, Hide**
- [ ] No auto-updating content in donation flow
- [ ] Goal thermometer updates do not auto-refresh during user interaction
- [ ] No auto-playing videos or audio

**Test Scenarios**:
- Leave donation form idle for 15 minutes
- Verify timeout warning appears
- Verify ability to extend session
- Complete donation at slow pace, verify no interruptions

---

#### 2.3 Seizures and Physical Reactions

**Requirement**: Do not design content in a way that is known to cause seizures or physical reactions.

**2.3.1 Three Flashes or Below Threshold**
- [ ] No content flashes more than 3 times per second
- [ ] No rapid animations (loading spinners are safe at 1s per rotation)
- [ ] No strobe effects or rapidly changing colors

**Test Scenarios**:
- Review all animations for flash frequency
- Verify no flashing content

---

#### 2.4 Navigable

**Requirement**: Provide ways to help users navigate, find content, and determine where they are.

**2.4.1 Bypass Blocks**
- [ ] Skip link to main content:
  - "Skip to main content" link as first focusable element
  - Visible on focus
  - Jumps to `<main>` landmark
- [ ] Proper use of landmarks (nav, main, footer)

**2.4.2 Page Titled**
- [ ] Each page has descriptive `<title>`:
  - "Donate to Spring Campaign - [Org Name]"
  - "Donor Information - Donation - [Org Name]"
  - "Payment - Donation - [Org Name]"
  - "Thank You - Donation - [Org Name]"
  - "Manage Recurring Gift - [Org Name]"

**2.4.3 Focus Order**
- [ ] Focus order is logical and intuitive:
  - Top to bottom, left to right
  - Amount selection → Donor info → Payment
  - Within forms: Top field → Bottom field
  - Modal: Close button → First field → Action buttons
- [ ] Tab order matches visual order

**2.4.4 Link Purpose (In Context)**
- [ ] Link text describes destination:
  - "Edit amount" (not "Edit")
  - "View receipt PDF" (not "View PDF")
  - "Learn more about our work" (not "Learn more")
  - "Privacy Policy" (clear destination)
- [ ] "Edit" links include context via aria-label: "Edit donation amount"

**2.4.5 Multiple Ways** (if multi-page site)
- [ ] Multiple ways to find donation page:
  - Navigation menu
  - Site search
  - Homepage link
  - Breadcrumbs (in donor portal)

**2.4.6 Headings and Labels**
- [ ] Descriptive headings:
  - "Choose Your Donation Amount" (not "Amount")
  - "Your Information" (not "Info")
  - "Payment Information" (not "Payment")
- [ ] Descriptive labels:
  - "First Name" (not "Name")
  - "Email Address" (not "Email")

**2.4.7 Focus Visible**
- [ ] Focus indicator visible on all interactive elements:
  - Outline: 3px solid Primary Blue
  - Outline offset: 2px
  - Contrast: 3:1 against background
- [ ] Focus indicator not removed (no outline: none without custom indicator)
- [ ] Focus indicator visible on:
  - Buttons
  - Links
  - Form inputs
  - Checkboxes/radios
  - Modal close button
  - Expandable section triggers

**2.4.11 Focus Not Obscured (Minimum)** (WCAG 2.2)
- [ ] Focused element not completely hidden by sticky elements:
  - Sticky donation summary card does not cover focused input
  - Sticky CTA button does not cover focused elements
  - Modal does not cover focused element when opened

**Test Scenarios**:
- Tab through entire flow, verify logical focus order
- Verify focus indicator visible on all elements (never invisible)
- Use screen reader to navigate by headings (H key in NVDA)
- Verify all link text descriptive (read out of context)
- Tab to element near sticky element, verify not obscured

---

#### 2.5 Input Modalities

**Requirement**: Make it easier for users to operate functionality through various inputs.

**2.5.1 Pointer Gestures**
- [ ] No complex gestures required (no multi-point, path-based gestures)
- [ ] All interactions: Single tap/click only
- [ ] Expandable sections: Single tap to expand (not swipe)

**2.5.2 Pointer Cancellation**
- [ ] Button activation on mouse up (not mouse down)
- [ ] Allows user to move pointer away before releasing (cancels action)

**2.5.3 Label in Name**
- [ ] Visible label matches accessible name:
  - Button labeled "Continue" has aria-label "Continue" (or implicit)
  - "Donate $100" button has accessible name including "$100"
- [ ] Icon buttons: aria-label matches purpose (e.g., "Close modal")

**2.5.4 Motion Actuation**
- [ ] No device motion required for any functionality
- [ ] No shake, tilt, or motion gestures

**2.5.7 Dragging Movements** (WCAG 2.2)
- [ ] No drag-and-drop interactions (all interactions are tap/click)

**2.5.8 Target Size (Minimum)** (WCAG 2.2)
- [ ] Touch targets at least 24×24 CSS pixels (WCAG 2.2 Level AA)
- [ ] Better: 44×44px (WCAG 2.1 AAA recommendation)
- [ ] Applies to:
  - Buttons: 56px height (exceeds minimum) ✓
  - Checkboxes: 20×20px box + clickable label ✓
  - Radio buttons: 20×20px + clickable label ✓
  - Amount buttons: 140×120px (exceeds minimum) ✓
  - Links: Adequate padding around text ✓
- [ ] Spacing between targets: 8px minimum

**Test Scenarios**:
- Test on touch device (phone, tablet)
- Verify all buttons easily tappable with finger
- Verify no accidental adjacent taps
- Use pointer device at high zoom, verify targets large enough

---

### Understandable

#### 3.1 Readable

**Requirement**: Make text content readable and understandable.

**3.1.1 Language of Page**
- [ ] `<html lang="en">` attribute set correctly
- [ ] If multi-language: lang attribute on content that differs (e.g., `<span lang="fr">Merci</span>`)

**3.1.2 Language of Parts** (if applicable)
- [ ] Content in other languages has `lang` attribute

**Test Scenarios**:
- Verify HTML lang attribute in source
- Test with screen reader (should use correct language pronunciation)

---

#### 3.2 Predictable

**Requirement**: Make Web pages appear and operate in predictable ways.

**3.2.1 On Focus**
- [ ] Focusing an element does not initiate change of context:
  - Focusing input does not submit form
  - Focusing dropdown does not navigate away
  - Focusing link does not activate link (Enter required)

**3.2.2 On Input**
- [ ] Changing input does not automatically cause change of context:
  - Selecting amount does not advance to next step (Continue button required)
  - Typing in custom amount does not submit (Continue button required)
  - Checking fee coverage does not submit payment (Donate button required)
- [ ] Exception: Live updates are predictable (e.g., total recalculates when fee toggled)

**3.2.3 Consistent Navigation**
- [ ] Navigation elements in consistent location across pages
- [ ] Back button always in same location (top-left)
- [ ] Logo always top-left, links to homepage

**3.2.4 Consistent Identification**
- [ ] Components with same function have same name:
  - All "Continue" buttons labeled "Continue"
  - All "Edit" links labeled "Edit [thing]"
  - All close buttons use "×" icon or "Close"

**3.2.6 Consistent Help** (WCAG 2.2)
- [ ] Help mechanisms in consistent location:
  - Support contact link always in same location (footer or header)
  - Help tooltips appear in consistent position (below field or to right)

**Test Scenarios**:
- Tab through form, verify no automatic navigation
- Type in inputs, verify no auto-submission
- Verify back button in same location on all screens

---

#### 3.3 Input Assistance

**Requirement**: Help users avoid and correct mistakes.

**3.3.1 Error Identification**
- [ ] Errors identified in text:
  - "Email address is required"
  - "Card number is invalid"
  - Not just red border (color alone is insufficient)
- [ ] Error icon: ⚠ or similar visual indicator
- [ ] Error message: Specific, actionable
  - Good: "Please enter a valid email address (e.g., name@example.com)"
  - Bad: "Invalid input"

**3.3.2 Labels or Instructions**
- [ ] All inputs have labels:
  - Visible label always present (not placeholder-only)
  - Label describes purpose: "First Name", "Email Address"
  - Required fields indicated: Asterisk + aria-required
- [ ] Helper text for complex inputs:
  - "We'll send your receipt here" (below email)
  - "Optional - we won't share your number" (below phone)
  - "Min: $1  Max: $100,000" (below custom amount)

**3.3.3 Error Suggestion**
- [ ] Errors include suggestions:
  - "Email address is required. Please enter your email."
  - "Card number is incomplete. Please check and try again."
  - "Amount must be at least $1. Please enter a valid amount."

**3.3.4 Error Prevention (Legal, Financial, Data)**
- [ ] Payment confirmation:
  - Review screen before final submission (payment step shows full summary)
  - Confirm button clear: "Donate $100.00"
  - User can go back and edit
- [ ] Recurring agreement:
  - Checkbox required: "I authorize..."
  - Terms clearly stated: Amount, frequency, cancellation policy
- [ ] Idempotency: Prevent duplicate submissions

**3.3.7 Redundant Entry** (WCAG 2.2)
- [ ] Information previously entered is auto-filled or selectable:
  - Donor info pre-filled for authenticated users
  - Autocomplete attributes enable browser autofill
  - Payment summary shows entered info (no re-entry)

**3.3.8 Accessible Authentication** (WCAG 2.2)
- [ ] Login (for recurring management):
  - Magic link login (no password memory required)
  - Or social OAuth (Google, Facebook)
  - Or allow copy-paste into password field
  - No cognitive function test (no CAPTCHA unless accessible alternative)

**Test Scenarios**:
- Submit form with errors, verify error messages appear
- Verify error messages are specific and actionable
- Verify errors not conveyed by color alone (icon + text)
- Tab to input with error, verify error announced by screen reader
- Review payment summary before submission
- Verify recurring terms clearly stated

---

### Robust

#### 4.1 Compatible

**Requirement**: Maximize compatibility with current and future user agents, including assistive technologies.

**4.1.1 Parsing** (Deprecated in WCAG 2.2, but still good practice)
- [ ] Valid HTML:
  - No duplicate IDs
  - Properly nested elements
  - Required attributes present
- [ ] Use HTML validator (validator.w3.org)

**4.1.2 Name, Role, Value**
- [ ] All UI components have accessible names:
  - Buttons: Visible text or aria-label
  - Inputs: Label or aria-label
  - Icons: aria-label if no visible text
- [ ] Correct roles:
  - Buttons: `<button>` or role="button"
  - Links: `<a>` or role="link"
  - Checkboxes: `<input type="checkbox">` or role="checkbox"
  - Radios: `<input type="radio">` or role="radio"
  - Headings: `<h1>`, `<h2>`, etc.
  - Landmarks: `<nav>`, `<main>`, `<footer>`, etc.
- [ ] States communicated:
  - Checkboxes: aria-checked="true/false"
  - Expandable: aria-expanded="true/false"
  - Disabled: disabled attribute or aria-disabled
  - Invalid: aria-invalid="true"
  - Required: required attribute or aria-required

**4.1.3 Status Messages**
- [ ] Status messages announced by screen reader:
  - Success: "Donation successful" (aria-live="polite")
  - Error: "Payment failed" (aria-live="assertive")
  - Loading: "Processing donation" (aria-live="polite", aria-busy="true")
- [ ] Toast notifications: role="status" or role="alert"

**Test Scenarios**:
- Run HTML validator on all pages
- Use accessibility inspector (Chrome DevTools, Firefox Accessibility Inspector)
- Verify all elements have correct roles and states
- Trigger success/error states, verify announcements with screen reader

---

## ARIA Usage Guide

### When to Use ARIA

**First Rule of ARIA**: Don't use ARIA if native HTML semantics exist.

**Use ARIA when:**
- Enhancing semantic meaning (e.g., role="search" on search form)
- Communicating states (e.g., aria-expanded on disclosure)
- Describing relationships (e.g., aria-describedby for error messages)
- Creating custom widgets (e.g., tabs, modals)

**Don't use ARIA when:**
- Native HTML element exists (e.g., use `<button>`, not `<div role="button">`)
- ARIA doesn't add value (e.g., don't add role="button" to `<button>`)

---

### Common ARIA Patterns

#### Form Inputs
```html
<!-- Text Input -->
<label for="firstName">First Name *</label>
<input
  type="text"
  id="firstName"
  name="firstName"
  required
  aria-required="true"
  aria-describedby="firstName-helper"
  aria-invalid="false"
/>
<p id="firstName-helper">Enter your legal first name</p>

<!-- Error State -->
<input
  aria-invalid="true"
  aria-describedby="firstName-helper firstName-error"
/>
<p id="firstName-error" role="alert">Please enter your first name</p>
```

#### Checkbox
```html
<label>
  <input
    type="checkbox"
    aria-checked="false"
  />
  Cover processing fees
</label>
```

#### Radio Group
```html
<fieldset>
  <legend>This gift is:</legend>
  <div role="radiogroup" aria-labelledby="tribute-legend">
    <label>
      <input type="radio" name="tribute" value="honour" aria-checked="false" />
      In honour of
    </label>
    <label>
      <input type="radio" name="tribute" value="memory" aria-checked="false" />
      In memory of
    </label>
  </div>
</fieldset>
```

#### Button
```html
<!-- Text Button -->
<button type="button">Continue</button>

<!-- Icon Button -->
<button type="button" aria-label="Close modal">
  <svg>...</svg>
</button>

<!-- Loading State -->
<button type="button" aria-busy="true" disabled>
  <span role="status" aria-live="polite">Processing...</span>
</button>
```

#### Expandable Section (Disclosure)
```html
<button
  type="button"
  aria-expanded="false"
  aria-controls="tribute-content"
  id="tribute-button"
>
  Make this a tribute gift
</button>
<div
  id="tribute-content"
  role="region"
  aria-labelledby="tribute-button"
  hidden
>
  <!-- Tribute fields -->
</div>
```

#### Modal Dialog
```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Cancel Your Gift?</h2>
  <p id="modal-description">We'll miss your support!</p>
  <button aria-label="Close modal">×</button>
  <!-- Modal content -->
</div>
```

#### Tabs
```html
<div role="tablist" aria-label="Payment methods">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="card-panel"
    id="card-tab"
  >
    Credit Card
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="paypal-panel"
    id="paypal-tab"
  >
    PayPal
  </button>
</div>
<div
  role="tabpanel"
  id="card-panel"
  aria-labelledby="card-tab"
>
  <!-- Card fields -->
</div>
<div
  role="tabpanel"
  id="paypal-panel"
  aria-labelledby="paypal-tab"
  hidden
>
  <!-- PayPal button -->
</div>
```

#### Live Regions
```html
<!-- Polite (non-critical updates) -->
<div aria-live="polite" aria-atomic="true">
  Total: $103.20
</div>

<!-- Assertive (critical errors) -->
<div role="alert" aria-live="assertive">
  Payment failed. Please try again.
</div>

<!-- Status (success messages) -->
<div role="status" aria-live="polite">
  Donation successful!
</div>
```

#### Progress Indicator
```html
<div
  role="progressbar"
  aria-label="Donation flow progress"
  aria-valuenow="2"
  aria-valuemin="1"
  aria-valuemax="3"
>
  Step 2 of 3
</div>
```

---

## Screen Reader Testing Guide

### Testing Tools

**Desktop Screen Readers:**
- **Windows**: NVDA (free), JAWS (paid)
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca (free)

**Mobile Screen Readers:**
- **iOS**: VoiceOver (built-in)
- **Android**: TalkBack (built-in)

---

### VoiceOver (macOS) Testing

**Activate**: Cmd + F5

**Basic Commands**:
- **Navigate**: VO + Right Arrow (next item), VO + Left Arrow (previous item)
- **Interact**: VO + Space (activate button/link)
- **Rotor**: VO + U (open rotor menu to navigate by headings, links, form controls)
- **Headings**: VO + Cmd + H (next heading)
- **Forms**: VO + Cmd + J (next form control)
- **Read all**: VO + A

**Test Scenarios**:
1. Navigate entire flow with VO + arrows
2. Use rotor to jump between headings
3. Fill out form, verify labels announced
4. Trigger errors, verify error messages announced
5. Submit donation, verify success message announced

---

### NVDA (Windows) Testing

**Activate**: Ctrl + Alt + N

**Basic Commands**:
- **Navigate**: Down Arrow (next item), Up Arrow (previous item)
- **Interact**: Enter (activate link), Space (activate button/checkbox)
- **Headings**: H (next heading), 1-6 (heading level)
- **Forms**: F (next form field), E (next edit field), B (next button)
- **Read all**: Insert + Down Arrow
- **Stop reading**: Ctrl

**Test Scenarios**: Same as VoiceOver

---

### Testing Checklist

**Per Screen:**
- [ ] Page title announced on load
- [ ] Heading structure makes sense (H1 → H2 → H3)
- [ ] All form labels announced
- [ ] Required fields announced as "required"
- [ ] Helper text announced with field
- [ ] Error messages announced when triggered
- [ ] Buttons announce action (e.g., "Continue button")
- [ ] Links announce destination
- [ ] Checkboxes announce checked/unchecked state
- [ ] Radio buttons announce selected state
- [ ] Modal title and description announced on open
- [ ] Focus moves into modal on open
- [ ] Focus returns to trigger on modal close
- [ ] Loading states announced ("Processing donation")
- [ ] Success/error messages announced

**Interaction Testing:**
- [ ] Tab order is logical
- [ ] All interactive elements reachable via keyboard
- [ ] Focus indicator visible
- [ ] No keyboard traps
- [ ] Enter/Space activates buttons
- [ ] Esc closes modals
- [ ] Arrow keys work in radio groups, tabs

---

## Keyboard Navigation Flow

### Complete Keyboard Flow (One-Time Donation)

**Screen 1: Amount Selection**
1. Tab: Focus on first preset amount button ($25)
2. Arrow Right: Move to $50 button
3. Arrow Right: Move to $100 button
4. Enter: Select $100 button
5. Tab: Focus on custom amount input (if desired)
6. Type: Enter custom amount (e.g., 150)
7. Tab: Focus on "Continue" button
8. Enter: Advance to donor info

**Screen 2: Donor Information**
1. Tab: Focus on "First Name" input
2. Type: Enter first name
3. Tab: Focus on "Last Name" input
4. Type: Enter last name
5. Tab: Focus on "Email" input
6. Type: Enter email
7. Tab: Focus on "Phone" input (optional)
8. Tab: Focus on "Email opt-in" checkbox
9. Space: Toggle checkbox (if desired)
10. Tab: Focus on "Make this a tribute gift" disclosure button
11. Enter: Expand tribute section (if desired)
    - Tab through tribute fields if expanded
12. Tab: Focus on "Continue to Payment" button
13. Enter: Advance to payment

**Screen 3: Payment**
1. Tab: Focus on payment method tab (Credit Card)
2. Arrow Right: Navigate to PayPal tab (if desired)
3. Tab: Focus on card number field (hosted iframe)
4. Type: Enter card number
5. Tab: Focus on expiry field
6. Type: Enter expiry (MM/YY)
7. Tab: Focus on CVC field
8. Type: Enter CVC
9. Tab: Focus on postal code field
10. Type: Enter postal code
11. Tab: Focus on "Cover fees" checkbox
12. Space: Toggle checkbox (if desired)
13. Tab: Focus on "Donate $XX.XX" button
14. Enter: Submit donation

**Screen 4: Confirmation**
1. Tab: Focus on "View Receipt" link
2. Enter: Open PDF in new tab
3. Tab: Focus on social sharing buttons
4. Tab: Focus on "Make Another Donation" button

---

## Focus Management

### Focus Requirements

**On Page Load:**
- Focus starts at top of page (skip link or first heading)
- Or auto-focus first interactive element (amount button) — optional, can be disruptive

**On Navigation:**
- Focus moves to top of new screen
- Or focus moves to heading of new section (if same page)

**Modal Open:**
- Focus moves into modal
- First focusable element is close button or first input
- Focus trap: Tab cycles within modal, does not escape

**Modal Close:**
- Focus returns to element that triggered modal
- E.g., "Cancel Plan" button → Focus returns to "Cancel Plan" button

**Error Handling:**
- On form submission error:
  - Focus moves to error summary at top of form
  - Or focus moves to first field with error
- Screen reader announces: "3 errors found. First error: Email is required."

**Loading States:**
- Focus remains on submit button during loading
- Or focus moves to loading spinner with aria-live announcement

**Success:**
- Focus moves to success heading or message
- Screen reader announces success

---

## Color and Contrast

### Contrast Requirements

**Text Contrast:**
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px or ≥ 14px bold): 3:1 minimum

**Non-Text Contrast:**
- UI components (borders, icons): 3:1 minimum
- Graphical objects: 3:1 minimum

### Color Independence

**Never rely on color alone to convey information:**

**Bad**:
- Red border on error input (color only)
- Green text for success (color only)

**Good**:
- Red border + error icon + error message
- Green text + checkmark icon + "Success!" text

**Examples**:
- Error: Border color + error icon (⚠) + error text
- Success: Green background + checkmark (✓) + "Donation successful" text
- Required: Asterisk (*) + aria-required attribute (not color alone)
- Selected amount: Border + background tint + checkmark icon
- Active state: Color + icon + aria-checked attribute

---

## Testing Tools & Resources

### Automated Testing Tools

**Browser Extensions:**
- **axe DevTools** (Chrome, Firefox): Comprehensive a11y testing
- **WAVE** (Chrome, Firefox): Visual feedback on accessibility issues
- **Lighthouse** (Chrome): Built-in accessibility audit
- **IBM Equal Access** (Chrome, Firefox): IBM's accessibility checker

**Command Line:**
- **axe-core**: JavaScript library for automated testing
- **Pa11y**: Command-line accessibility tester
- **jest-axe**: Jest integration for React component testing

---

### Manual Testing Tools

**Contrast Checkers:**
- **WebAIM Contrast Checker**: webaim.org/resources/contrastchecker
- **Stark** (Figma, Chrome): Contrast checking in design tools
- **Colour Contrast Analyser**: Desktop app for contrast testing

**Screen Readers:**
- **VoiceOver** (macOS, iOS): Built-in
- **NVDA** (Windows): nvaccess.org (free)
- **JAWS** (Windows): freedomscientific.com (paid)
- **TalkBack** (Android): Built-in

**Keyboard Testing:**
- Unplug mouse, navigate with keyboard only
- Tab, Shift+Tab, Arrow keys, Enter, Space, Esc

**Zoom Testing:**
- Browser zoom: 200%, 400%
- Page zoom: Verify no horizontal scroll at 320px width
- Text-only zoom: Verify text resizes without breaking layout

---

### Accessibility Audit Checklist

**Per Screen:**
- [ ] Run axe DevTools scan, fix all violations
- [ ] Run WAVE scan, review flagged items
- [ ] Test with screen reader (VoiceOver or NVDA)
- [ ] Test keyboard navigation (no mouse)
- [ ] Check contrast ratios (text and UI components)
- [ ] Zoom to 200%, verify layout intact
- [ ] Resize to 320px width, verify no horizontal scroll
- [ ] Verify focus indicators visible
- [ ] Verify no color-only information
- [ ] Verify all images have alt text
- [ ] Verify all form inputs have labels
- [ ] Verify error messages are descriptive

**Integration Testing:**
- [ ] Complete full donation flow with keyboard only
- [ ] Complete full donation flow with screen reader
- [ ] Trigger errors, verify accessible error handling
- [ ] Test on mobile with TalkBack/VoiceOver

---

## Accessibility Statement

**Include on website:**

```
Accessibility Commitment

[Organization Name] is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

Conformance Status
The [donation platform] conforms to WCAG 2.2 Level AA. This means the platform has been designed and tested to be usable by people with disabilities using assistive technologies.

Feedback
We welcome your feedback on the accessibility of the donation experience. Please contact us:
- Email: accessibility@example.org
- Phone: 1-800-123-4567

We aim to respond to accessibility feedback within 3 business days.

Date: [Last updated date]
```

---

## Training & Documentation

### For Developers

**Accessibility Checklist (Pre-Deployment):**
1. [ ] All components built with semantic HTML
2. [ ] ARIA attributes added where necessary
3. [ ] Keyboard navigation tested on all screens
4. [ ] Focus indicators visible on all interactive elements
5. [ ] Screen reader tested (VoiceOver or NVDA)
6. [ ] Color contrast meets WCAG 2.2 AA (4.5:1 text, 3:1 UI)
7. [ ] Forms have visible labels and proper error handling
8. [ ] Loading and error states announced to screen readers
9. [ ] Modal focus trap implemented and tested
10. [ ] Automated tests (axe-core, jest-axe) passing

### For QA

**Accessibility Test Plan:**
1. Automated scan with axe DevTools (must pass)
2. Keyboard navigation test (complete flow without mouse)
3. Screen reader test (VoiceOver or NVDA, spot-check critical paths)
4. Zoom test (200% zoom, verify layout intact)
5. Mobile screen reader test (TalkBack or VoiceOver on device)
6. Contrast check (sample of text and UI elements)
7. Error handling test (trigger errors, verify announcements)

---

**End of Accessibility Guide**
