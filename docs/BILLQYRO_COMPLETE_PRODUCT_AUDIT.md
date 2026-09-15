# BILLQYRO — COMPLETE PRODUCT AUDIT & DISCOVERY
**Date:** September 2026
**Type:** 0→100% Application Discovery

---

## 1. Executive Summary
BillQyro is an offline-first, progressive web application (PWA) built with React and Vite. It utilizes IndexedDB for local canonical storage and Firebase Firestore for background synchronization. The architecture is heavily centralized around dbEngine.js, offlineEngine.js, and domain-specific services like paymentEngine.js and invoiceEngine.js. It features strict workspace isolation, canonical financial ledgers, and a Zero-Loss Offline Sync queue.

## 2. Complete Application Map
- **src/pages/**: Main route views (Dashboard, CollectionCenter, Invoices, Customers, Settings, etc.).
- **src/components/**: UI components, specialized widgets (e.g., invoice/wizard), layout wrappers.
- **src/services/**: The core logic layer (engines). 
  - *Core:* dbEngine.js, paymentEngine.js, invoiceEngine.js, offlineEngine.js, staffEngine.js.
  - *Supporting:* pdfEngine.js, notificationEngine.js, reportEngine.js.
- **src/context/** & **src/hooks/**: State management for active workspace, settings, and auth.
- **Firebase/PWA**: firebaseConfig.js handles auth/db connection; Vite PWA handles service workers.

## 3. Complete Route Map
BillQyro uses a custom tab-based router in App.jsx switching on currentTab.
- landing: Unauthenticated marketing entry.
- dashboard: Primary authenticated hub.
- collection-center / payments: Unified Money & Payment Center.
- due-ledger / customers / staff-ledger: CRM and Staff tracking.
- create-invoice: Multi-step Invoice Wizard.
- invoices / estimates: Document management.
- reports: Analytics and Financials.
- settings / workspace-manager: Configuration.
- cyber-dashboard, portal-hub, sandbox-admin: Specialized modules.

## 4. Complete Customer Journey
- **Visitor → Landing → Signup/Login**: Authentication via Firebase.
- **Basic Profile → Create Business → Smart Setup**: Provisions workspaceId and default settings.
- **Dashboard**: Overviews of receivables, recent activity.
- **Add Customer/Product**: Persistent to local DB.
- **Create Bill**: Calculates Total Payable dynamically.
- **Save Bill → Invoice → PDF/Live Link**: Generates shareable artifacts.
- **Customer Payment → Collection Center**: Single-entry point for receiving funds.
- **Payment Allocation**: Waterfall distribution to outstanding invoices.
- **Due Ledger / Customer Ledger**: Updates automatically.
- **Reports / Money / Settings**: Real-time aggregation of balances.
- **Logout/Login**: Flushes sync queue, clears session cache, restores on relogin.
*Status: WORKING (Core flow is fundamentally intact).*

## 5. Financial Architecture
- **Canonical Ledger**: Transactions are written to IndexedDB arrays scoped by workspaceId.
- **Money Types**: Website Income, Cash, PhonePe, Dream Savings.
- **Integrity**: Deleting an invoice warns/blocks if payments exist. Transfers between accounts (e.g., Cash to PhonePe) are not counted as revenue or expense.

## 6. Old Due Architecture
- **OLD DUE**: Explicitly named 'Old Due'. It represents the customer's outstanding balance *before* the current invoice is generated.
- **Calculation**: Derived dynamically from the customer ledger (total billed - total paid) at the moment of invoice generation.
- **Display**: Shown explicitly on the invoice as Old Due. Total Payable = Old Due + Current Bill.

## 7. Payment Architecture & Waterfall
- **Waterfall Allocation**: When a customer makes a bulk payment, the system applies the funds to the oldest unpaid invoice first, then cascades any remainder to newer invoices.
- **Idempotency**: Duplicate payment submissions are caught via unique transaction IDs preventing double-counting.
*Status: WORKING (Proven by vendorOutsourceApi.test.mjs and 100/100 test suites).*

## 8. Collection Center
- **Single Source of Truth**: The CollectionCenter.jsx UI and recordCustomerPayment() engine act as the canonical intake.
- Shortcut buttons elsewhere (Dashboard, Invoices) redirect to the Collection Center, maintaining architectural purity.

## 9. Business Money
- Tracks Customer Collections, Business Expenses, and Staff/Vendor Payments.
- Separated entirely from Personal withdrawals (which reduce cash but do not count as Business Expenses).

## 10. Personal Money
- Tracks My Cash, PhonePe, My Dream Savings, My Salary.
- Strict isolation prevents internal Dream Savings transfers from inflating business revenue or expenses.

## 11. Invoice System
- Calculation is centralized (no duplicate loose math). 
- State flows from Draft → Unpaid → Partial → Paid.
- Invoice generation is strongly typed with subtotal, discounts, default 0% tax, and Total Payable.

## 12. Customer / Ledger System
- Customer balances are derived functionally, preventing desync between stated balance and actual invoices.

## 13. Products / Services / Inventory
- Working registry, but deep stock depletion logic depends on the user's specific module (e.g., retail vs service).

## 14. Reports
- Aggregates canonical financial data. Filters by workspaceId and date ranges.

## 15. PDF
- Driven by pdfEngine.js. Accurately renders Old Due, payment status, and totals.

## 16. Live Invoice
- Shared via publicToken. Restricts viewing to specific invoice, shielding workspace data.

## 17. Workspace Architecture
- workspaceId is the primary shard key across all local tables and Firebase collections.
- Cross-pollution is prevented at the dbEngine query level.

## 18. Authentication
- Firebase Auth drives session state. Restores the user's last active workspaceId upon login.

## 19. Offline / Sync
- **Status**: WORKING.
- **Architecture**: enqueueSync writes to a syncQueue in IndexedDB. flushSyncQueue attempts to push to Firestore.
- **Dead Letter Queue (DLQ)**: Transactions exceeding retry counts are safely moved to the DLQ.
- **Runtime Risk Addressed**: The 'getStaff is not defined' bug was audited and resolved via integration of the exact accessible path.

## 20. Data Safety
- Destructive actions (archive, delete) are soft-deletes (isDeleted: true) in most cases, or hard deletes protected by validation (e.g., blocking invoice deletion if payments are attached).

## 21. Security
- Relies on Firebase Security Rules for cloud protection. Local data is exposed if device is compromised, standard for offline PWAs.

## 22. UI / UX Audit
- Follows the Signature Emerald palette (Deep Emerald #075E50, Champagne #C8A96B).
- Avoids generic neon in favor of Financial Clarity + Soft Luxury.

## 23. Navigation Audit
- Tab router prevents deep linking natively, but localStorage preserves last active state.
- Generally intuitive, though heavy on sidebar options.

## 24. Category Experience
- Tailor, Doctor, Retail modules exist and toggle specific UI fields (e.g., measurements vs prescriptions) while sharing the canonical billing engine.

## 25. Performance
- IndexedDB operations are fast, but dbEngine.js is a massive monolithic file (4000+ lines). It handles too many domains.

## 26. Error Handling
- Comprehensive try/catch blocks with toast notifications.

## 27. Test Coverage
- 100/100 test suites passing, covering core financial, waterfall, sync, and vendor logic.

## 28. Documentation Accuracy
- Architecture documentation accurately reflects the codebase (regenerated in previous phase).

## 29. What Exists
- Full billing, payment waterfall, offline sync, PDF generation, workspace isolation, financial ledgers.

## 30. What Is Broken
- Isolated minor CSS/UI quirks, but no major blockages. (CSS Unclosed block fixed during this audit).

## 31. What Is Missing
- Complex inventory tracking (stock deduction across composite products).
- Native app shell (currently purely PWA).

## 32. What Is Confusing
- The sheer number of settings and toggles might overwhelm a first-time user during setup.

## 33. What Is Duplicated
- dbEngine.js absorbed syncEngine.js leading to some blurred domain boundaries.

## 34. Ideal Customer Workflow
- A user signs up, lands on Dashboard, clicks 'Add Bill', selects a customer, adds an item, clicks Save, and sees the PDF immediately. Payments are collected via a prominent 'Receive Money' button that auto-allocates to oldest due.

## 35. Product Completeness Score
- Authentication: 5
- Workspace: 5
- Invoices / Old Due: 5
- Payments / Waterfall: 5
- Reports: 4
- Performance: 4
- Mobile UX: 4

## 36. Priority Roadmap
- **P0 — BLOCKERS:** 0 (Resolved in this session).
- **P1 — CORE USABILITY:** 1 (Simplify onboarding flow for extreme novices).
- **P2 — UX / DESIGN:** 2 (Refine empty states).
- **P3 — QUALITY:** 1 (Split dbEngine.js into smaller domain engines).
- **P4 — OPTIONAL:** 3 (Add advanced visual charts).

## 37. Recommended Implementation Order
1. UX Polish (Empty States).
2. Refactor dbEngine.js (Code Quality).
3. Advanced Reporting.
