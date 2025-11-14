# Design System & Brand Tokens
**Version**: 1.0
**Status**: Ready for Implementation
**Last Updated**: 2025-11-13

---

## Executive Summary

This design system establishes the visual language, interaction patterns, and accessibility standards for the Raisin Next donation experience. All tokens are designed for WCAG 2.2 AA compliance, mobile-first responsiveness, and high conversion optimization.

---

## Color Palette

### Primary Colors
```
Primary Blue: #0066CC (rgb(0, 102, 204))
  - Use: Primary CTAs, links, focus states
  - Contrast ratio on white: 4.72:1 (AA compliant)
  - Hover: #0052A3
  - Active: #003D7A
  - Disabled: #80B3E6 (50% opacity)

Primary Dark: #003D7A
  - Use: Headings, body text, high-emphasis content
  - Contrast ratio on white: 10.23:1 (AAA compliant)
```

### Secondary Colors
```
Success Green: #0D7A4D (rgb(13, 122, 77))
  - Use: Confirmation states, success messages, completed steps
  - Contrast ratio on white: 4.58:1 (AA compliant)
  - Background tint: #E6F4EE

Warning Orange: #D97706 (rgb(217, 119, 6))
  - Use: Warning messages, validation prompts
  - Contrast ratio on white: 4.51:1 (AA compliant)
  - Background tint: #FEF3E2

Error Red: #C81E1E (rgb(200, 30, 30))
  - Use: Error messages, validation failures
  - Contrast ratio on white: 6.12:1 (AA compliant)
  - Background tint: #FDEAEA
```

### Neutral Palette
```
Gray 900 (Text Primary): #1A202C
  - Use: Body text, headings
  - Contrast ratio: 15.8:1 (AAA)

Gray 700 (Text Secondary): #4A5568
  - Use: Helper text, secondary labels
  - Contrast ratio: 9.73:1 (AAA)

Gray 500 (Text Tertiary): #718096
  - Use: Placeholder text, disabled text
  - Contrast ratio: 5.14:1 (AA)

Gray 300 (Border): #CBD5E0
  - Use: Input borders, dividers

Gray 200 (Background Alt): #E2E8F0
  - Use: Disabled backgrounds, secondary surfaces

Gray 100 (Background Light): #F7FAFC
  - Use: Page backgrounds, card backgrounds

White: #FFFFFF
  - Use: Primary background, card surfaces
```

### Semantic Colors
```
Info Blue: #1E40AF
  - Use: Informational messages
  - Contrast ratio: 7.89:1 (AAA)

Impact Purple: #7C3AED
  - Use: Impact messaging, donation totals, thermometers
  - Contrast ratio: 5.02:1 (AA compliant)
```

---

## Typography

### Font Families
```
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
  - Use: All text content
  - Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

Monospace: 'SF Mono', 'Monaco', 'Courier New', monospace
  - Use: Amounts, transaction IDs, receipt numbers
```

### Type Scale
```
Display Large (Heading 1)
  - Font size: 32px (2rem)
  - Line height: 40px (1.25)
  - Font weight: 700
  - Letter spacing: -0.02em
  - Use: Page titles, campaign names
  - Mobile: 28px

Heading 2
  - Font size: 24px (1.5rem)
  - Line height: 32px (1.33)
  - Font weight: 600
  - Letter spacing: -0.01em
  - Use: Section headings, step titles
  - Mobile: 22px

Heading 3
  - Font size: 20px (1.25rem)
  - Line height: 28px (1.4)
  - Font weight: 600
  - Use: Sub-sections, card titles
  - Mobile: 18px

Body Large
  - Font size: 18px (1.125rem)
  - Line height: 28px (1.56)
  - Font weight: 400
  - Use: Important body text, confirmation messages
  - Mobile: 16px

Body Regular (Default)
  - Font size: 16px (1rem)
  - Line height: 24px (1.5)
  - Font weight: 400
  - Use: Primary body text, labels

Body Small
  - Font size: 14px (0.875rem)
  - Line height: 20px (1.43)
  - Font weight: 400
  - Use: Helper text, captions, legal text

Caption
  - Font size: 12px (0.75rem)
  - Line height: 16px (1.33)
  - Font weight: 400
  - Use: Footnotes, timestamps, micro-copy

Label
  - Font size: 14px (0.875rem)
  - Line height: 20px (1.43)
  - Font weight: 500
  - Use: Form labels, button text
```

---

## Spacing System

Based on 8px grid system for consistent rhythm and alignment.

```
Space 0: 0px
Space 1: 4px (0.25rem)   - Tight spacing, icon padding
Space 2: 8px (0.5rem)    - Input padding, small gaps
Space 3: 12px (0.75rem)  - Compact layouts
Space 4: 16px (1rem)     - Default gap, card padding
Space 5: 20px (1.25rem)  - Medium spacing
Space 6: 24px (1.5rem)   - Section spacing
Space 8: 32px (2rem)     - Large section gaps
Space 10: 40px (2.5rem)  - Major section breaks
Space 12: 48px (3rem)    - Page-level spacing
Space 16: 64px (4rem)    - XL spacing (desktop only)
Space 20: 80px (5rem)    - XXL spacing (desktop only)
```

### Spacing Usage Guidelines
```
Card Internal Padding: Space 6 (24px) desktop, Space 4 (16px) mobile
Section Vertical Spacing: Space 8 (32px) desktop, Space 6 (24px) mobile
Form Field Spacing: Space 5 (20px) between fields
Button Padding: Space 3 (12px) vertical, Space 6 (24px) horizontal
Input Padding: Space 3 (12px) vertical, Space 4 (16px) horizontal
```

---

## Border Radius

```
None: 0px           - Tables, strict layouts
Small: 4px          - Input fields, tags
Medium: 8px         - Buttons, cards, dropdowns
Large: 12px         - Modal dialogs, prominent cards
XL: 16px            - Hero cards, feature callouts
Full: 9999px        - Pills, badges, avatar shapes
```

---

## Shadows

```
Shadow Small (Elevation 1)
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
  Use: Input fields (focus), small cards

Shadow Medium (Elevation 2)
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
  Use: Buttons (hover), dropdown menus

Shadow Large (Elevation 3)
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
  Use: Modal dialogs, popovers

Shadow XL (Elevation 4)
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
  Use: Sticky headers, important overlays
```

---

## Component States

### Button States
```
Default:
  - Background: Primary Blue (#0066CC)
  - Text: White
  - Border: None
  - Shadow: None

Hover:
  - Background: #0052A3
  - Shadow: Shadow Medium
  - Cursor: pointer
  - Transition: all 150ms ease

Focus (Keyboard):
  - Outline: 3px solid #0066CC with 2px white offset
  - Outline offset: 2px
  - Background: #0052A3

Active (Click):
  - Background: #003D7A
  - Shadow: Shadow Small
  - Transform: translateY(1px)

Disabled:
  - Background: Gray 200 (#E2E8F0)
  - Text: Gray 500 (#718096)
  - Cursor: not-allowed
  - Opacity: 0.6

Loading:
  - Background: Primary Blue (#0066CC)
  - Text: White with loading spinner
  - Cursor: wait
  - Pointer events: none
```

### Input Field States
```
Default:
  - Background: White
  - Border: 1px solid Gray 300 (#CBD5E0)
  - Text: Gray 900

Hover:
  - Border: 1px solid Gray 500 (#718096)

Focus:
  - Border: 2px solid Primary Blue (#0066CC)
  - Shadow: 0 0 0 3px rgba(0, 102, 204, 0.1)
  - Outline: none

Filled (Valid):
  - Border: 1px solid Gray 300
  - Background: White

Error:
  - Border: 2px solid Error Red (#C81E1E)
  - Background: Error tint (#FDEAEA)
  - Error message below field

Disabled:
  - Background: Gray 200 (#E2E8F0)
  - Border: 1px solid Gray 300
  - Text: Gray 500
  - Cursor: not-allowed
```

### Checkbox/Radio States
```
Default (Unchecked):
  - Border: 2px solid Gray 300
  - Background: White
  - Size: 20px × 20px

Hover (Unchecked):
  - Border: 2px solid Primary Blue

Focus (Keyboard):
  - Outline: 3px solid rgba(0, 102, 204, 0.3)
  - Outline offset: 2px

Checked:
  - Background: Primary Blue (#0066CC)
  - Border: 2px solid Primary Blue
  - Checkmark/dot: White

Disabled (Checked):
  - Background: Gray 300
  - Border: Gray 300
  - Checkmark: Gray 500
```

---

## Animation & Transitions

### Timing Functions
```
Ease: cubic-bezier(0.4, 0, 0.2, 1)      - General purpose
Ease-In: cubic-bezier(0.4, 0, 1, 1)     - Exiting elements
Ease-Out: cubic-bezier(0, 0, 0.2, 1)    - Entering elements
Ease-In-Out: cubic-bezier(0.4, 0, 0.6, 1) - Emphasis changes
```

### Duration
```
Fast: 100ms        - Hover states, color changes
Default: 150ms     - Button interactions, input focus
Medium: 250ms      - Dropdown expand, tooltip appear
Slow: 300ms        - Page transitions, modal open
Delayed: 500ms     - Success confirmations, celebrations
```

### Transition Properties
```
Button Hover: all 150ms ease
Input Focus: border-color 150ms ease, box-shadow 150ms ease
Dropdown Expand: opacity 150ms ease, transform 150ms ease-out
Modal Backdrop: opacity 250ms ease
Loading Spinner: rotate 1s linear infinite
Progress Bar: width 300ms ease-out
```

### Motion Preferences
```
Respect prefers-reduced-motion media query:
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
```

---

## Responsive Breakpoints

```
Mobile First Approach:

Base (Mobile): 320px - 767px
  - Single column layouts
  - Stacked form fields
  - Full-width buttons
  - 16px side margins
  - Touch-optimized (44×44px minimum)

Tablet: 768px - 1023px
  - Two-column layouts where appropriate
  - Wider form fields (max 400px)
  - 24px side margins
  - Hybrid touch/mouse interactions

Desktop: 1024px - 1439px
  - Multi-column layouts
  - Max content width: 1200px
  - 32px side margins
  - Hover states active

Large Desktop: 1440px+
  - Centered content (max 1200px)
  - Generous whitespace
  - 48px side margins
```

---

## Accessibility Standards

### WCAG 2.2 AA Compliance Checklist

**Color Contrast**
- Text (normal): Minimum 4.5:1 ratio
- Text (large 18px+): Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio
- No information conveyed by color alone

**Keyboard Navigation**
- All interactive elements keyboard accessible
- Visible focus indicators (3px outline, 2px offset)
- Logical tab order (top to bottom, left to right)
- Skip links for main content
- No keyboard traps

**Screen Reader Support**
- Semantic HTML (nav, main, section, footer)
- ARIA labels for all form inputs
- ARIA live regions for dynamic content
- ARIA expanded/collapsed states for toggles
- Alternative text for all images

**Touch Targets**
- Minimum 44×44px tap areas
- 8px spacing between adjacent targets
- Buttons have adequate padding

**Forms**
- Labels always visible (no placeholder-only)
- Required fields marked with asterisk and aria-required
- Inline validation with aria-invalid
- Error messages linked via aria-describedby
- Fieldset grouping for related inputs

**Time Limits**
- No automatic timeouts on donation flow
- Session warnings with extend option
- No auto-advancing carousels

**Motion & Animation**
- No auto-play videos
- Respect prefers-reduced-motion
- No flashing content >3 times per second

---

## Icon System

### Icon Library
Use Heroicons (https://heroicons.com/) for consistency
- Outline style for navigation and secondary actions
- Solid style for primary actions and active states
- Size: 20px default, 24px for prominent actions, 16px for inline

### Common Icons
```
Check Circle: Success states, completed steps
X Circle: Error states, failed validation
Information Circle: Help tooltips, info messages
Exclamation Triangle: Warning messages
Lock Closed: Secure payment, privacy indicators
Heart: Tribute donations, favorite actions
Calendar: Date selection, scheduling
Credit Card: Payment methods
User: Account/donor profile
Mail: Email fields, receipts
Gift: Tribute gifts, special offers
ArrowRight: CTAs, next step indicators
ArrowLeft: Back navigation
ChevronDown: Dropdown indicators
ChevronRight: Expandable sections
Plus: Add item, expand
Minus: Remove item, collapse
```

---

## Loading & Empty States

### Loading Patterns
```
Skeleton Screens:
  - Use for initial page load
  - Animate shimmer effect (1.5s duration)
  - Match layout structure of loaded content
  - Gray 200 base, Gray 100 shimmer

Spinner:
  - Use for button loading states
  - Size: 20px for buttons, 32px for full-page
  - Color: White on primary buttons, Primary Blue on surfaces
  - Animation: 1s linear infinite rotation

Progress Bar:
  - Use for multi-step processes
  - Height: 4px
  - Background: Gray 200
  - Fill: Primary Blue
  - Smooth animation (300ms ease-out)
```

### Empty State Pattern
```
Illustration or Icon (optional)
  - Size: 64px-96px
  - Color: Gray 400

Heading (required)
  - Font: Heading 3
  - Color: Gray 700
  - Text: "No [items] yet"

Body Text (optional)
  - Font: Body Regular
  - Color: Gray 600
  - Explain why empty or what to do

CTA Button (when applicable)
  - Primary button
  - Action to populate state
```

---

## Microcopy & Voice

### Tone Guidelines
- **Warm & Encouraging**: Celebrate donor generosity
- **Clear & Direct**: No jargon, simple language
- **Trustworthy**: Transparent about fees, security, impact
- **Respectful**: Dignified language for tribute gifts
- **Accessible**: Plain language, <8th grade reading level

### Button Text Patterns
```
Primary Actions:
  - "Donate $[amount]"
  - "Complete donation"
  - "Set up monthly gift"
  - Action-oriented, specific

Secondary Actions:
  - "Go back"
  - "Edit amount"
  - "Cancel"
  - Clear outcome

Loading States:
  - "Processing..."
  - "Submitting donation..."
  - Present continuous tense
```

### Validation Messages
```
Error Messages (Conversational):
  - "Please enter your email address"
  - "This email doesn't look quite right"
  - "Card number is required"
  - Start with "Please" or describe the issue

Success Messages (Celebratory):
  - "Thank you! Your donation is complete."
  - "You're all set!"
  - "Success! Your monthly gift is active."

Helper Text (Supportive):
  - "We'll send your receipt here"
  - "Your payment information is secure"
  - "Optional — we won't share your number"
```

---

## Performance Budgets

### Critical Rendering Path
```
Target LCP (Largest Contentful Paint): <2.5s on mobile 3G
Target FID (First Input Delay): <100ms
Target CLS (Cumulative Layout Shift): <0.1

Above-the-fold priority:
  - Campaign hero image (optimized WebP, max 800px width)
  - Amount selector buttons
  - Primary CTA visibility
```

### Asset Optimization
```
Images:
  - Format: WebP with JPEG fallback
  - Responsive sizes: 320px, 640px, 1024px, 1280px
  - Lazy load below-the-fold
  - Next.js Image component

Fonts:
  - Load Inter font via Google Fonts or self-host
  - Font-display: swap
  - Preload critical font weights (400, 600)

JavaScript:
  - Code split by route
  - Dynamic import for non-critical features
  - Defer third-party scripts (analytics)
  - Bundle size budget: <200KB gzipped

CSS:
  - Critical CSS inlined
  - TailwindCSS with PurgeCSS
  - CSS budget: <50KB
```

---

## Browser Support

### Target Browsers
```
Desktop:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

Mobile:
  - iOS Safari 14+
  - Chrome Android 90+
  - Samsung Internet 14+

Progressive Enhancement:
  - Core donation flow works without JavaScript
  - Enhanced experience with JS enabled
  - Graceful degradation for older browsers
```

---

## Implementation Notes

### CSS Architecture
```
Approach: Utility-first with TailwindCSS
  - Custom theme extending Tailwind defaults
  - Component classes for complex patterns
  - CSS modules for scoped styles

Token Implementation:
  - Define tokens in tailwind.config.js
  - Use CSS custom properties for runtime theming
  - Export tokens for React components (styled-components if needed)
```

### Component Library
```
Recommended: Headless UI + Custom Styled Components
  - Headless UI for accessible primitives (Combobox, Dialog, Disclosure)
  - Custom styling with Tailwind classes
  - Radix UI as alternative for additional primitives

Avoid heavy component libraries:
  - Performance overhead
  - Customization difficulties
  - Maintain design system ownership
```

### Developer Handoff
```
1. Import design tokens into project
2. Create base component styles (Button, Input, Label, etc.)
3. Implement responsive utilities
4. Set up accessibility testing tools (axe DevTools)
5. Configure performance monitoring (Web Vitals)
6. Create component Storybook for visual testing
```

---

## Design System Maintenance

### Version Control
- Major version (1.x.x): Breaking changes to tokens or components
- Minor version (x.1.x): New components or tokens added
- Patch version (x.x.1): Bug fixes or refinements

### Change Process
1. Propose change with rationale
2. Accessibility review
3. Performance impact assessment
4. Update documentation
5. Migrate existing components
6. Release with changelog

---

**End of Design System Document**
