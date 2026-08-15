# HTML Design Map

This document serves as an analytical bridge between the provided reference HTML design and the existing production BillQyro React architecture. It dictates how to integrate the UI/UX without breaking business logic.

## File
`design-reference/billqyro-redesign.html`
(To be maintained as an isolated reference; do NOT import directly into React routes).

## Screens
1. **Today's Business (Dashboard):** Stat bands, charts, quick actions, collection center, activity feed.
2. **Invoice Builder Studio:** Split-screen layout (Form on left, live PDF preview on right).
3. **Settings Studio:** Nested sidebar navigation for Rate Plan, Policies, Theme, PDF, Retail, Security, Backup.
4. **Customer Client List:** Data table of customers.
5. **Products & Catalog:** Grid display of products and inventory.
6. **Order Management:** Data table of orders.
7. **Payment Logs:** Data table of recent payments.
8. **Client Portal Live View:** Mockup of the public-facing customer portal.
9. **Help Center:** FAQ and support form.

## Components
- **Sidebar & Topbar:** Glassmorphism styled, sticky, responsive.
- **Glass Panels (`.glass-panel`):** Primary card container for UI elements.
- **Buttons (`.btn`, `.btn-outline`):** Styled interactive elements.
- **Data Tables (`.data-table`):** Structured list views.
- **Modals (`.modal-overlay`):** Popups for adding customers, catalog, preview.
- **Split Preview (`.builder-split`):** Specialized layout for the Invoice Builder.

## Features & Integration Recommendations

| HTML Feature | Existing BillQyro Equivalent | Integration Recommendation | Business Logic | Data Source | Settings Required | Risk |
|--------------|------------------------------|----------------------------|----------------|-------------|-------------------|------|
| **Dashboard** | `Dashboard.jsx`, `analyticsEngine.js` | **Adapt UI Only:** Use the glass-panel CSS and layout structure, but inject real analytics data. | `analyticsEngine.js`, `bankEngine.js` | `invoices`, `bankLedger` | No | Low |
| **Invoice Builder (Split Screen)** | `CreateInvoice.jsx`, `InvoicePreview.jsx` | **Adapt Workflow:** The split-screen UX is highly superior. Keep `invoiceEngine.js` for saving, but redesign the UI to match this split view. Preserve offline-save. | `invoiceEngine.js`, `pdfEngine.js` | `invoices`, `customers`, `products` | No | **High** |
| **Settings Studio (Nested)** | `Settings.jsx`, `ThemeStudio.jsx`, `StudioLayout.jsx` | **Reuse Architecture:** BillQyro already uses a Studio architecture. Map the new HTML visual layout to the existing `<StudioLayout />` component. | `settingsEngine.js`, `featureControlEngine.js` | `settings` doc | Yes | Med |
| **Theme / Dark Mode** | `ThemeContext.jsx`, `themes.css` | **Preserve Existing:** Convert HTML hex colors into BillQyro CSS variables. Do NOT hardcode colors. Map HTML toggles to `toggleTheme()` context. | `themeEngine.js` | `settings.theme` | Yes | Low |
| **Client List** | `Customers.jsx` | **Adapt UI:** Apply the `.data-table` classes to the existing customer map. | `customerEngine.js` | `customers` | No | Low |
| **Product Grid** | `CreateInvoice.jsx` (Item selector) | **Adapt UI:** Use the grid layout for product selection. | `productEngine.js` | `products` | No | Low |
| **Payment Logs** | `InternalBank.jsx` | **Adapt UI:** Apply table styling to the bank ledger view. | `bankEngine.js` | `bankLedger` | No | Med |
| **Client Portal** | `PublicInvoice.jsx` | **Adapt UI:** Apply the fresh, centralized layout to the existing public link viewer. | `portalEngine.js` | `publicInvoices` | No | High |

## Strict Integration Rules

### Business Logic
- The HTML file contains static JS (e.g., `appState`, `saveInvoice()`). **DO NOT USE IT.**
- All saving must route through `dbEngine.js` -> `IndexedDB` -> `syncQueue` -> `Firestore`.

### PDF System
- The HTML shows a static DOM-based preview. BillQyro uses `react-pdf`. 
- The right side of the split screen must render the real `react-pdf` blob or use the exact same data payload as the real PDF engine to maintain 1:1 accuracy.

### Feature Control Integration
- Any new module shown in the HTML (e.g., "Retail Studio") must be registered in `featureRegistry.js` and toggled via `FeatureControlStudio.jsx`. Existing data must never be deleted when a feature toggles off.

### Architecture Validation Check
Before committing any UI adaptation from this HTML:
1. Does it bypass `dbEngine.js`? (If yes, reject).
2. Does it hardcode colors instead of `var(--theme-...)`? (If yes, fix).
3. Does it break mobile responsiveness? (If yes, fix).
