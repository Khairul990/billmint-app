# BillQyro Signature Design System (Unlike)
**Architecture Standard & Reference Manual for Phase 6B+**  
*Version: 6.0-Signature | Focus: Financial Clarity + Soft Luxury*

---

## 1. Design Philosophy
BillQyro rejects generic SaaS templates, boring accounting forms, and over-stylized neon glassmorphism. The visual signature is built on **"Financial Clarity + Soft Luxury"**:
- **Atmospheric & Calm:** Interfaces feel settled, expensive, and tranquil. Surfaces adapt to the active theme rather than flashing harsh stark whites.
- **Financial Primacy:** Monetary metrics and balances visually dominate ordinary UI text through typography and weight without becoming cartoonish.
- **Tactile Soft Luxury:** 1px borders with subtle alpha channels, low-elevation multi-layer shadows, and controlled micro-interactions.
- **Information Hierarchy over Box Repetition:** Eliminates repetitive grids of 12 identical cards. Surfaces have distinct semantic purposes.

---

## 2. Color System
BillQyro combines its official brand heritage with a dynamic theme engine supporting 35+ presets and light/dark modes.

### Official Brand Family
| Token / Swatch | Hex Code | Primary Usage |
| :--- | :--- | :--- |
| **Signature Emerald** | `#0B8F78` | Primary financial actions, positive collection indicators, active brand marks |
| **Deep Emerald** | `#075E50` | Primary action gradients, high-contrast borders in light mode |
| **Bright Emerald** | `#18B99B` | Dark mode accents, interactive highlights, badge dots |
| **Champagne** | `#C8A96B` | High-value accents, VIP tiers, subtle borders on dark surfaces |

### Semantic Theme Tokens (Auto-Adapting)
```css
/* Automatically resolved from the active workspace theme and dark mode */
var(--bq-accent)          /* Primary brand accent */
var(--bq-accent-strong)   /* Darker/stronger accent variant */
var(--bq-accent-muted)    /* 12% alpha accent wash for tinted states */
var(--bq-text-primary)    /* Main readable text */
var(--bq-text-secondary)  /* Supporting captions and labels */
var(--bq-text-muted)      /* Inactive or placeholder text */
var(--bq-border-soft)     /* Restrained surface border */
var(--bq-border-strong)   /* Emphasized component separator */
var(--bq-success)         /* #10B981 - Paid, settled, positive cash */
var(--bq-warning)         /* #F59E0B - Partial, pending, approaching due */
var(--bq-danger)          /* #EF4444 - Overdue, unpaid balance, critical risk */
```

---

## 3. Surface Hierarchy (Solving the "White Box" Problem)
Never stack a pure white card inside a pure white page inside a pure white modal. BillQyro establishes a 5-level atmospheric surface hierarchy:

```
LEVEL 1: Atmospheric App Background (--bq-surface-app / var(--app-bg))
  └── LEVEL 2: Primary Signature Surface (--bq-surface-primary / var(--surface))
        └── LEVEL 3: Secondary / Subcard Surface (--bq-surface-secondary / var(--card-bg))
              └── LEVEL 4: Interactive Elevated Surface (--bq-surface-elevated / var(--surface-elevated))
                    └── LEVEL 5: Financial Highlight Surface (--bq-surface-financial / tinted brand emerald)
```

### Semantic Surfaces
1. **Financial Card (`variant="financial"`):** Softly tinted with brand emerald, elevated shadow, reserved for sales, due ledger, and collection totals.
2. **Action Card (`variant="action"`):** Focused interactive surface containing primary buttons or quick-bill triggers.
3. **Insight Card (`variant="insight"`):** Subtle sapphire tint for analytics, profit metrics, and business suggestions.
4. **Activity Surface (`variant="activity"`):** Low-contrast neutral list background for audit trails and transaction history.
5. **Warning Surface (`variant="warning"`):** Amber wash for overdue invoices and credit limit alerts.
6. **Success Surface (`variant="success"`):** Emerald wash for settlement confirmation and zero-due states.
7. **Neutral Surface (`variant="neutral"`):** Standard form backgrounds and settings containers.

---

## 4. Typography System
- **Display & Headings:** `Sora, sans-serif` (`font-display` or `.bq-font-display`). Used for top-level titles, page headers, modal titles, and financial cards.
- **Interface & Body:** `Plus Jakarta Sans, system-ui, sans-serif` (`font-sans`, `font-body` or `.bq-font-body`). Used for inputs, tables, labels, descriptions, and buttons.
- **Financial Digits:** `Sora` or `Space Grotesk` with `font-variant-numeric: tabular-nums` (`.bq-financial-number` or `font-numbers`). Ensures decimal alignment in tables and ledgers.

### Hierarchy Scale
| Role | Font Family | Size (Desktop / Mobile) | Weight | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Display (L1)** | Sora | 32px / 26px | 800 | -0.04em |
| **Heading (L2)** | Sora | 22px / 19px | 700 | -0.03em |
| **Section Heading (L3)** | Sora | 16px / 15px | 700 | -0.02em |
| **Body (Regular)** | Plus Jakarta Sans | 14px / 14px | 400 - 500 | 0 |
| **Caption / Label** | Plus Jakarta Sans | 11px / 10px | 700 | +0.05em (Uppercase) |
| **Financial Number (Hero)** | Sora (tabular) | 28px - 36px / 24px | 800 | -0.025em |
| **Financial Number (Table)** | Sora (tabular) | 14px / 13px | 600 - 700 | -0.02em |

---

## 5. Spacing System
Consistent 4px/8px modular rhythm:
- **Page Container Padding:** `p-4 sm:p-6 md:p-8`
- **Section Vertical Gap:** `space-y-6 md:space-y-8`
- **Card Internal Padding:** `p-4 sm:p-5 md:p-6`
- **Card Header-to-Content:** `pb-3` (with 1px soft border separator)
- **Form Row Gap:** `gap-4`
- **Button Padding:** 
  - `sm`: `h-8 px-3 text-xs`
  - `md`: `h-10 px-4 text-sm`
  - `lg`: `h-12 px-6 text-sm font-bold`

---

## 6. Radius Tokens
- `--bq-radius-xs` (6px): Badges, sub-tags, table row highlights
- `--bq-radius-sm` (10px): Small inputs, dropdown menu popovers, icon buttons
- `--bq-radius-md` (14px): Standard buttons, input fields, selector boxes
- `--bq-radius-lg` (18px): Cards, bottom sheets, drawer containers
- `--bq-radius-xl` (24px): Hero banners, modal dialogs, primary cockpit surfaces
- `--bq-radius-full` (9999px): Status pill badges, avatar containers

---

## 7. Shadow & Elevation System
Avoid opaque black drop-shadows or neon glow halos.
- **`--bq-shadow-sm`:** `0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 3px -1px rgba(15, 23, 42, 0.02)` (Default cards)
- **`--bq-shadow-md`:** `0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)` (Elevated cards & dropdowns)
- **`--bq-shadow-lg`:** `0 16px 36px -6px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)` (Modals & popups)
- **`--bq-shadow-financial`:** `0 10px 30px -4px color-mix(in srgb, var(--accent) 16%, transparent)` (Financial highlight surfaces)

*In dark mode, shadows automatically scale to higher opacity (`rgba(0,0,0,0.25 - 0.45)`) without changing the light source angle.*

---

## 8. Button System
Import from `src/components/ui/Button`:
```jsx
import { Button, ActionButton } from '@/components/ui/Button';

// 1. High-Confidence Primary
<Button variant="primary">Create Invoice</Button>

// 2. Financial / Collection Specific Action
<Button variant="financial" leftIcon={IndianRupee}>Collect ₹5,000</Button>

// 3. Supporting Secondary
<Button variant="secondary">Download PDF</Button>

// 4. Low-Emphasis Ghost
<Button variant="ghost">Cancel</Button>

// 5. Destructive Action
<Button variant="destructive">Void Invoice</Button>
```

---

## 9. Input System
Import from `src/components/ui/Input`:
```jsx
import { Input, Select, Textarea, Label, HelperText } from '@/components/ui/Input';

// Standard Interface Input
<div>
  <Label required>Customer Name</Label>
  <Input placeholder="Enter business or person name..." />
</div>

// Financial Amount Input with Currency Prefix & Tabular Font
<div>
  <Label required>Payment Received</Label>
  <Input 
    variant="financial" 
    type="number" 
    step="0.01" 
    placeholder="0.00" 
    currencyPrefix="₹" 
  />
  <HelperText>Entered amount will immediately adjust customer balance.</HelperText>
</div>
```

---

## 10. Status System (Multi-Channel Indication)
Never rely exclusively on color to convey status. Every status badge must use **Icon + Label + Shape + Tinted Color + Typography**.

```jsx
import { StatusBadge } from '@/components/ui/Badge';

<StatusBadge status="paid" />      {/* Emerald, CheckCircle2, Pill shape */}
<StatusBadge status="partial" />   {/* Amber, Clock, Pill shape */}
<StatusBadge status="unpaid" />    {/* Rose, AlertCircle, Pill shape */}
<StatusBadge status="overdue" />   {/* Red pulse, AlertTriangle, Rounded-rect */}
<StatusBadge status="pending" />   {/* Sky, Clock, Pill shape */}
<StatusBadge status="draft" />     {/* Slate, FileEdit, Rounded-rect */}
<StatusBadge status="void" />      {/* Gray, Ban, Strikethrough text, Square shape */}
```

---

## 11. Financial Visual Language & Equation Architecture
The core BillQyro accounting relationship must be visually self-explanatory:

$$\text{Old Due} + \text{Current Bill} = \text{Total Payable} - \text{Paid} = \text{Balance Due}$$

### Component Usage
```jsx
import { FinancialEquation, FinancialValue } from '@/components/ui';

// Render canonical customer ledger / invoice settlement equation:
<FinancialEquation 
  oldDue={2500} 
  currentBill={8000} 
  paid={5000} 
  currency="₹" 
/>

// Displaying standalone financial metrics:
<FinancialValue 
  label="Today's Collection"
  value={48500}
  currency="₹"
  intent="collection"
  size="lg"
/>
```

---

## 12. Motion & Micro-Interactions
- **Philosophy:** Purposeful, snappy, respectful of system preferences.
- **Duration Scale:**
  - Micro-interactions (hover, active press): `120ms - 180ms`
  - Transitions (tabs, accordion open): `200ms - 250ms`
  - Modals / Sheets entry: `280ms - 320ms`
- **Easings:** `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) for natural dampening.
- **Reduced Motion:** Always respected via `@media (prefers-reduced-motion: reduce)`.

---

## 13. Iconography Guidelines
- **Library:** `lucide-react` exclusively.
- **Stroke Width:** `1.75` for medium/large icons, `2` for small icons (`14px - 16px`).
- **Sizes:**
  - Inline / Button small: `14px` (`w-3.5 h-3.5`)
  - Button standard / Input icon: `16px` (`w-4 h-4`)
  - Nav & Stat icon: `18px - 20px` (`w-5 h-5`)
  - Hero / Empty state illustration: `32px - 40px` (`w-8 h-8` to `w-10 h-10`)

---

## 14. Responsive Rules
The design system must render flawlessly from **320px to 1920px**:
- **Mobile (<640px):**
  - Base `font-size: 14.5px` with compact touch targets (`min-h-[40px]`).
  - Equations stack into structured vertical breakdown cards with clear visual operators.
  - Tables collapse or enable horizontal swipe with fixed sticky identifier columns.
- **Tablet (640px - 1024px):**
  - Two-column layouts for financial cards and metrics.
- **Desktop (>1024px):**
  - Full horizontal flow equations.
  - Multi-column ledger inspection with sticky action sidebars.

---

## 15. Theme Compatibility Rules
1. **NEVER hardcode `bg-white` or `text-black` on containers.**
   - Use `bg-theme-card` or `var(--bq-surface-primary)`.
   - Use `text-theme-primary` or `var(--bq-text-primary)`.
2. **NEVER use pure black `#000000` for text in light mode.**
   - Use `var(--text-primary)` (`#0F172A` or `#1F1B1D`).
3. **NEVER hardcode one brand color across all surfaces.**
   - All accent rings and glows must reference `var(--bq-accent)` so that themes like `obsidian-gold`, `sapphire-noir`, or `arctic-teal` remain 100% harmonious.

---

## 16. Do / Don't Examples

| Practice | DO | DON'T |
| :--- | :--- | :--- |
| **Card Stacking** | Use `bq-surface-primary` inside `bq-surface-app`, with `bg-theme-surface-elevated` for sub-sections. | Stack 3 white `<div>` cards inside a white modal. |
| **Financial Numbers** | Use `<FinancialValue value={val} intent="balanceDue" />` with tabular figures. | Render `<span>{val}</span>` with variable-width fonts that cause columns to jitter. |
| **Status Badges** | Use `<StatusBadge status="paid" />` with icon + label + shape. | Use a plain green dot with no text or accessibility label. |
| **Buttons** | Use `<Button variant="financial">` for payment collection. | Make every button bright green or rainbow gradient. |
| **Animations** | Use quick 180ms ease-out transitions on hover and tap. | Add permanent bouncing or floating animations to static dashboard cards. |
