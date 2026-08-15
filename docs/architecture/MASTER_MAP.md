# BillQyro — Master System Map
> **Source of Truth**: This document is derived from actual source code inspection.  
> Last verified: 2026-08-13 | Version: v8 Enterprise

---

## Tier 1 — Application Identity

```
BillQyro — Offline-First Billing & Business Management Platform
├── Type:           Progressive Web App (PWA) + Electron Desktop
├── Framework:      React 18 + Vite 5
├── Database:       IndexedDB (offline) ↔ Firestore (cloud)
├── Auth:           Firebase Authentication
├── Storage:        Firebase Storage (screenshots, PDFs)
├── Entry Point:    src/main.jsx → src/App.jsx
├── CSS System:     src/index.css + src/themes.css + src/premium-design.css
└── Build Tool:     Vite 5.4 (Node heap OOM at default; requires --max-old-space-size=4096)
```

---

## Tier 2 — Major System Domains

```
                            BILLQYRO
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
   PRODUCT                 ARCHITECTURE             DATA LAYER
       │                       │                       │
  Features/Modules          Files/Engines         Firestore/IndexedDB
  Pages/Studios             Services/Utils        SyncQueue/Storage
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
               AUTH/SEC   USER FLOWS   THEMES/TEMPLATES
```

---

## Tier 3 — Domains & Owners

| Domain | Engine | Storage | Route Prefix |
|--------|--------|---------|-------------|
| **Invoice** | `invoiceEngine.js` | IndexedDB `invoices` / Firestore `invoices` | `createInvoice`, `invoices` |
| **Customer** | `customerEngine.js` | IndexedDB `customers` / Firestore `customers` | `customers` |
| **Product/Inventory** | `productEngine.js` | IndexedDB `products` / Firestore `products` | `products` |
| **Staff** | `staffEngine.js` | Firestore `staff` | `staffLedger` |
| **Financial/Bank** | `bankEngine.js` | IndexedDB `bankLedger`/`bankCredit` / Firestore | `internalBank` |
| **Expense** | `expenseEngine.js` | IndexedDB `expenses` / Firestore `expenses` | `expenses` |
| **Settings** | `settingsEngine.js` | Firestore `settings` / localStorage fallback | `settings` |
| **PDF/Document** | `pdfEngine.js` + utils | Firebase Storage | (modal/hook) |
| **Communication** | `invoiceShareService.js` | Firestore `publicInvoices` | public share links |
| **Customer Portal** | `portalEngine.js` | Firestore `publicInvoices` | `portal/:token` |
| **Theme/UI** | `themeEngine.js` + `ThemeContext` | localStorage | ThemeStudio |
| **Auth/Identity** | `authEngine.js` + Firebase Auth | Firebase Auth | `login`, `admin` |
| **Offline/Sync** | `offlineEngine.js` + `dbEngine.js` | IndexedDB `syncQueue` | (background) |
| **Payment** | `paymentEngine.js` | IndexedDB / Firestore | `pendingPayments` |
| **Admin/Platform** | `adminEngine.js` + `platformAdminService.js` | Firestore admin collections | `admin/*` |
| **Subscription/SaaS** | `subscriptionEngine.js` | Firestore `subscriptionPlans` | `admin/subscription` |
| **Security/Audit** | `securityEngine.js` + `auditEngine.js` | IndexedDB `auditLogs` / Firestore | `auditLogs` |

---

## Tier 4 — Business Category System

Business categories are defined in `src/config/businessPresets.js`.

| Category ID | Label | Key Modules | Special Feature |
|-------------|-------|-------------|-----------------|
| `retail` | Retail Shop | billing, customers, products, dueLedger | — |
| `grocery` | Grocery / General Store | billing, customers, products, dueLedger | — |
| `service` | Service & Repair | devices, serviceJobs, delivery | Device tracking |
| `doctor` | Doctor / Clinic | patients, appointments, billing | Patient records |
| `teacher` | Teacher / Coaching | students, fees, attendance | Student portal |
| `tailor` | Tailor / Fashion | orders, measurements, delivery | Measurements |
| `embroidery` | Embroidery / Designer | designBook, orders, delivery | Design book |
| `freelance` | Freelancer / Agency | clients, projects, payments | Project tracking |
| `restaurant` | Restaurant / Food | billing, products | Quick billing |
| `custom` | Custom Business | configurable | All optional modules |
| `cybercafe` | Cyber Cafe / CSC | reports only | Separate UI mode |

---

## Tier 5 — Feature Registry (src/services/featureRegistry.js)

Feature categories (VERIFIED):
- `invoice` — Invoicing Core, Custom Columns, Discounts, Taxes, Payment Status
- `customers` — Customer Mgmt, Customer Ledger, Customer Portal, Notifications
- `staff` — Staff Mgmt, Staff Ledger
- `products` — Product Catalog, Inventory, Stock Tracking, Low Stock Alerts
- `payments` — Payments, Partial Payments, Payment Proof, Approval Workflow
- `liveLink` — Live Link, Payment Request, WhatsApp Proof, Approval Workflow
- `treasury` — Internal Treasury, Money In, Money Out, Treasury Ledger, Internal Bank, Customer Credit
- `reports` — [VERIFIED — engine exists]
- `notifications` — [VERIFIED — engine exists]
- `security` — [VERIFIED — engine exists]
- `appearance` — [VERIFIED — theme system]
- `backup` — [VERIFIED — backupEngine.js]
- `advanced` — [VERIFIED — advanced settings]
- `operations` — Orders, Appointments, Delivery, Measurements, Design Book, Devices, Service Jobs, Projects

---

## Tier 6 — IndexedDB Object Stores (VERIFIED from localDb.js v5)

| Store | keyPath | Indexes | Purpose | Sync |
|-------|---------|---------|---------|------|
| `invoices` | `id` | userId, workspaceId | Invoice records | Cloud-synced |
| `customers` | `id` | userId, workspaceId | Customer records | Cloud-synced |
| `expenses` | `id` | userId, workspaceId | Expense records | Cloud-synced |
| `products` | `id` | userId, workspaceId | Product catalog | Cloud-synced |
| `students` | `id` | userId, workspaceId | Student records | Cloud-synced |
| `bankLedger` | `id` | userId, workspaceId | Bank transactions | Cloud-synced |
| `bankCredit` | `id` | userId, workspaceId | Customer credit | Cloud-synced |
| `syncQueue` | `id` | userId, workspaceId | Offline operation queue | Local-only queue |
| `auditLogs` | `id` | (none) | Audit trail | Local-only |
| `errorLogs` | `id` | (none) | Error logging | Local-only |

---

## Tier 7 — Firestore Collections (VERIFIED from source)

| Collection | Scope | Notes |
|-----------|-------|-------|
| `invoices` | User-scoped | Primary invoice data |
| `customers` | User-scoped | Customer data |
| `expenses` | User-scoped | Expense records |
| `products` | User-scoped | Product catalog |
| `students` | User-scoped | Student records |
| `bankLedger` | User-scoped | Bank ledger entries |
| `settings` | User-scoped | Business settings |
| `publicInvoices` | **PUBLIC** | Shared invoice tokens (no auth) |
| `subscriptionPlans` | **GLOBAL** | Plan definitions (admin-managed) |
| `premiumRequests` | **PLATFORM** | Upgrade requests |
| `adminData` | **PLATFORM** | Platform admin data |
| `auditLogs` | User-scoped | Security audit trail |

---

## Tier 8 — Subscription Plans (VERIFIED from subscriptionEngine.js)

| Plan | Invoice Limit | Customer Limit | Product Limit | Users |
|------|--------------|----------------|---------------|-------|
| FREE | 10 | 5 | 10 | 1 |
| PRO | 500 | 200 | 500 | 3 |
| ENTERPRISE | ∞ | ∞ | ∞ | ∞ |

Dynamic plan overrides loaded from Firestore `subscriptionPlans/{planId}`.

---

## Tier 9 — Conflict Resolution (VERIFIED)

`offlineEngine.js` exports `cloudWins(local, cloud)` — **Cloud Wins strategy** (VERIFIED).

---

## Tier 10 — Demo Mode (VERIFIED)

`billqyro_demo_session_active === 'true'` in localStorage causes `localDb.js` to **skip all writes** (put/delete/clear return immediately without writing). Demo data served from `demoDataManager.js`.

---

## Atlas Location

The interactive visual map is at:
```
docs/architecture/atlas/index.html
```
Open directly in any browser. No build step required.

---

## Change Protocol

Before ANY change to production code, read:
- `docs/architecture/AI_CHANGE_PROTOCOL.md`
- The relevant domain section above
- The Atlas node for the file being changed
