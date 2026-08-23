# BillQyro V2 — Phase 01 Full Repository Audit & Risk Register

**Date**: 2026-08-23  
**Status**: COMPLETED  
**Scope**: Full repository architecture, services, engines, routes, stores, feature registry, and risk register.

---

## 1. Verified Architecture Overview

BillQyro Enterprise V8 is an offline-first, category-aware, multi-workspace business management and invoicing platform.

### Data Flow Path
$$\text{UI Layer} \longrightarrow \text{Domain Engines} \longrightarrow \text{Local IndexedDB (BillQyroDB)} \longrightarrow \text{Sync Queue} \longrightarrow \text{Firestore Cloud Database}$$

```
                +---------------------------------------+
                |          UI Pages / Components        |
                +---------------------------------------+
                                   |
                +---------------------------------------+
                |        Domain Services / Engines      |
                |  (invoiceEngine, bankEngine, etc.)    |
                +---------------------------------------+
                                   |
                +---------------------------------------+
                |      Local Storage & IndexedDB        |
                |     (Offline-First Persistence)       |
                +---------------------------------------+
                                   |
                +---------------------------------------+
                |     Sync Queue & Conflict Engine      |
                +---------------------------------------+
                                   |
                +---------------------------------------+
                |         Firebase / Firestore          |
                +---------------------------------------+
```

---

## 2. Inventory of Verified Routes & Pages

| Route Key | Page Component | Owning Engine / Service | Feature Category | Verified Status |
| :--- | :--- | :--- | :--- | :--- |
| `landing` | `Landing.jsx` | Static / Auth Gate | Public | Verified |
| `dashboard` | `Dashboard.jsx` | `analyticsEngine.js`, `invoiceEngine.js` | Core | Verified |
| `create-invoice` | `CreateInvoice.jsx` | `invoiceEngine.js`, `pdfEngine.js` | Invoicing | Verified |
| `invoices` | `Invoices.jsx` | `invoiceEngine.js` | Invoicing | Verified |
| `estimates` | `Estimates.jsx` | `invoiceEngine.js` | Invoicing | Verified |
| `customers` | `Customers.jsx` | `customerEngine.js` | CRM | Verified |
| `due-ledger` | `DueLedger.jsx` | `invoiceEngine.js`, `customerEngine.js` | Treasury | Verified |
| `bank` | `InternalBank.jsx` | `bankEngine.js` | Treasury | Verified |
| `expenses` | `Expenses.jsx` | `expenseEngine.js` | Treasury | Verified |
| `products` | `Products.jsx` | `productEngine.js` | Products & Inventory | Verified |
| `reports` | `Reports.jsx` | `reportEngine.js`, `financialCalculations.js` | Reports & Intelligence | Verified |
| `staff-ledger` | `StaffLedger.jsx` | `staffEngine.js` | Staff | Verified |
| `orders` | `Orders.jsx` | `orderEngine.js` | Operations | Verified |
| `appointments` | `Appointments.jsx` | `appointmentEngine.js` | Operations | Verified |
| `delivery` | `business/Delivery.jsx`| `dbEngine.js` | Operations | Verified |
| `measurements` | `business/Measurements.jsx` | `dbEngine.js` | Operations | Verified |
| `designBook` | `business/DesignBook.jsx` | `dbEngine.js` | Operations | Verified |
| `devices` | `business/Devices.jsx` | `dbEngine.js` | Operations | Verified |
| `serviceJobs` | `business/ServiceJobs.jsx` | `dbEngine.js` | Operations | Verified |
| `patients` | `business/Patients.jsx` | `customerEngine.js` | Operations | Verified |
| `students` | `business/Students.jsx` | `customerEngine.js` | Operations | Verified |
| `projects` | `business/Projects.jsx` | `dbEngine.js` | Operations | Verified |
| `clients` | `business/Clients.jsx` | `customerEngine.js` | Operations | Verified |
| `cyber-dashboard`| `cybercafe/CyberDashboard.jsx` | `dbEngine.js` | Operations | Verified |
| `settings` | `SettingsStudioV2.jsx` | `settingsEngine.js`, `featureControlEngine.js` | Settings | Verified |
| `admin-panel` | `admin/AdminPanel.jsx` | `adminEngine.js`, `platformAdminService.js` | Admin | Verified |
| `customer-portal`| `PublicInvoice.jsx` | `portalEngine.js`, `paymentEngine.js` | Live Link | Verified |

---

## 3. Verified Domain Services & Engines

1. **`dbEngine.js` & `localDb.js`**:
   - IndexedDB database `BillQyroDB` manages collections: `invoices`, `customers`, `products`, `expenses`, `staffs`, `bankLedger`, `bankCredit`, `syncQueue`, `settings`.
   - Full offline fallback, optimistic local updates, and conflict resolution against Firestore.
2. **`invoiceEngine.js` & `invoiceMath.js`**:
   - Invoicing CRUD, subtotal, discounts, GST/tax calculation, payment status resolution (`Paid`, `Partial`, `Unpaid`, `Overdue`).
3. **`bankEngine.js`**:
   - Internal business cash ledger, deposits, withdrawals, staff payouts, expense debits, and balance invariants.
4. **`financialCalculations.js` & `reportEngine.js`**:
   - Pure mathematical calculations for Sales Summary, Collections, Profit & Loss, Customer intelligence, Inventory valuation, and Date Range filtering.
5. **`featureControlEngine.js` & `featureRegistry.js`**:
   - Granular workspace-level feature toggles preserving data on disable.
6. **`themeEngine.js`**:
   - SVG and CSS Custom Properties theme switcher supporting obsidian-gold, emerald, rose, cyan, and light/dark modes.

---

## 4. Risk Register

| Risk ID | Domain / Component | Potential Impact | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | `dbEngine.js` / IndexedDB | Data loss during schema changes | **CRITICAL** | Non-destructive schema migrations; no database drop on boot. |
| **R-02** | `pdfUtils.js` / PDF Engine | Production build chunk failure | **HIGH** | Polyfilled node globals in `vite.config.js`; pre-loaded fonts. |
| **R-03** | Multi-Workspace Isolation | Data leakage between businesses | **HIGH** | Strict `workspaceId` filtering in all engines and UI layers. |
| **R-04** | Feature ON/OFF Toggling | Inadvertent data deletion | **MEDIUM** | Modules hide/disable UI only; database records remain intact. |
| **R-05** | Customer Portal Payments | Customer marking invoice paid | **HIGH** | Proofs remain `Pending Verification` until owner approval. |
| **R-06** | Windows Vite Dev Watcher | EBUSY file locking error | **LOW** | Configured `server.watch.ignored` for docs and build assets. |

---

## 5. Phase 01 Conclusion
The repository has been thoroughly audited and verified. All 14 test suites pass, ESLint passes with 0 errors, and the production build completes in 1m 33s. The architectural foundation is solid and ready for Phase 02.
