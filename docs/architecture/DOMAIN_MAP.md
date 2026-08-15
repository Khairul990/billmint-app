# BillQyro Domain Map (Core Business Contexts)

BillQyro is divided into distinct **Business Domains**. Each domain has a specific owner (Engine), data models, UI components, and dependencies. 

> **Architectural Rule (Single Source of Truth):**
> A domain's data must *only* be mutated by its designated Engine. Do not duplicate business logic across UI components.

---

## 1. Invoice Domain
The core domain of BillQyro. Handles the creation, calculation, and lifecycle of invoices/bills.
* **Owner/Engine:** `invoiceEngine.js`
* **Data Model:** `invoices` collection
* **Main UI:** `CreateInvoice.jsx`, `Invoices.jsx`, `InvoiceRow.jsx`
* **Dependencies:** `customerEngine`, `productEngine`, `staffEngine`, `pdfEngine`, `syncEngine`

## 2. Customer Domain
Manages customer profiles, outstanding dues, and histories.
* **Owner/Engine:** `customerEngine.js`
* **Data Model:** `customers` collection
* **Main UI:** `Customers.jsx`, `DueLedger.jsx`
* **Dependencies:** `bankEngine` (for credit/due calculation), `invoiceEngine`

## 3. Staff Domain
Manages staff profiles, salaries, and internal billing (Staff Ledger).
* **Owner/Engine:** `staffEngine.js`
* **Data Model:** `staff` collection
* **Main UI:** `StaffLedger.jsx`
* **Dependencies:** `bankEngine`, `invoiceEngine`

## 4. Financial & Ledger Domain (Bank)
The internal ledger tracking all money moving IN and OUT of the business. 
* **Owner/Engine:** `bankEngine.js`
* **Data Model:** `bankLedger`, `bankCredit` collections
* **Main UI:** `InternalBank.jsx`, `PendingPayments.jsx`
* **Dependencies:** `invoiceEngine` (payments), `expenseEngine`, `customerEngine`

## 5. Expense Domain
Tracks business outflows not tied directly to staff or refunds.
* **Owner/Engine:** `expenseEngine.js`
* **Data Model:** `expenses` collection
* **Main UI:** `InternalBank.jsx` (Expense Tab)
* **Dependencies:** `bankEngine`

## 6. Product & Inventory Domain
Manages stock, SKUs, and retail pricing.
* **Owner/Engine:** `productEngine.js`
* **Data Model:** `products` collection
* **Main UI:** `CreateInvoice.jsx` (Item selector)
* **Dependencies:** None directly, consumed by `invoiceEngine`.

## 7. Configuration & Settings Domain
Manages user preferences, business details, tax rates, and module toggles.
* **Owner/Engine:** `settingsEngine.js`, `featureControlEngine.js`
* **Data Model:** `settings` collection
* **Main UI:** `Settings.jsx`, `FeatureControlStudio.jsx`, `StudioLayout.jsx`
* **Dependencies:** `featureRegistry.js`

## 8. PDF & Document Domain
Responsible for rendering React components into printable/downloadable PDFs.
* **Owner/Engine:** `pdfEngine.js`, `PdfDocument.jsx`
* **Data Model:** Consumes `invoices` and `settings`
* **Main UI:** `InvoicePreview.jsx`, `PdfTemplateStudio.jsx`
* **Dependencies:** `react-pdf`, `TemplateEngine.js`

## 9. Communication Domain
Handles sending invoices and links to clients via WhatsApp or Email.
* **Owner/Engine:** `invoiceShareService.js`, `invoiceShareService2.js`
* **Data Model:** Stateless (generates links/PDFs on the fly)
* **Main UI:** Share Modal in `Invoices.jsx`
* **Dependencies:** `pdfEngine`, Firebase Storage

## 10. Portal Domain (Customer Facing)
The public-facing side of BillQyro where customers view bills and upload payment proofs.
* **Owner/Engine:** `portalEngine.js`, `paymentLinkService.js`
* **Data Model:** `publicInvoices` collection
* **Main UI:** `PublicInvoice.jsx`
* **Dependencies:** `bankEngine` (to process uploaded proofs)

## 11. Theme & UI Engine Domain
Manages the injection of dynamic CSS variables and premium layouts.
* **Owner/Engine:** `themeEngine.js`, `ThemeContext.jsx`
* **Data Model:** `settings.theme`
* **Main UI:** `ThemeStudio.jsx`
* **Dependencies:** `themes.css`, `premium-design.css`

## 12. Authentication & Identity Domain
Handles login, logout, session management, and workspace switching.
* **Owner/Engine:** `authEngine.js`, `workspaceEngine.js`
* **Data Model:** `usersList` collection, Firebase Auth
* **Main UI:** `Login.jsx`, `WorkspaceManager.jsx`
* **Dependencies:** Firebase Auth SDK

## 13. Sync & Offline Domain
The invisible layer keeping the app offline-capable and cloud-synced.
* **Owner/Engine:** `dbEngine.js`, `offlineEngine.js`, `syncWorker.js`
* **Data Model:** `syncQueue` (IndexedDB)
* **Main UI:** Network status indicator in Topbar
* **Dependencies:** `localDb.js`, Firestore SDK

## 14. Payment Logic Domain
Handles external payment links, gateways, and localized payment logging.
* **Owner/Engine:** `paymentEngine.js`, `paymentLinkService.js`
* **Dependencies:** `bankEngine`

## 15. Admin & Platform Domain
Super-Admin architecture for managing users, platform revenue, and global limits.
* **Owner/Engine:** `adminEngine.js`, `platformAdminService.js`, `platformRevenueService.js`
* **Data Model:** `adminSettings`, `usersList`, `platformRevenue`

## 16. Subscription & SaaS Domain
Manages user subscription tiers (Free/Pro), limits, and upgrades.
* **Owner/Engine:** `subscriptionEngine.js`
* **Data Model:** `subscription`

## 17. Security & Audit Domain
Logs user actions, handles role-based access, and detects anomalies.
* **Owner/Engine:** `securityEngine.js`, `auditEngine.js`
* **Data Model:** `auditLogs`
