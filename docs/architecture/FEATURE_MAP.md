# BillQyro Feature Inventory Map

This document serves as the complete inventory of all features currently present in BillQyro. When modifying a feature, consult this map to understand its dependencies and risks.

| Feature Name | Purpose | Main UI / Component | Core Engine | Dependencies | Risk Level |
|--------------|---------|---------------------|-------------|--------------|------------|
| **Core Billing (Invoicing)** | Create, edit, and manage customer bills. | `CreateInvoice.jsx`, `Invoices.jsx` | `invoiceEngine.js` | `products`, `customers`, `staff`, `offlineEngine` | **HIGH** |
| **PDF Generation** | Convert digital invoices into printable A4 PDFs. | `PdfDocument.jsx` | `pdfEngine.js` | `TemplateEngine.js`, `settings` | MED |
| **Customer Directory** | Manage client base, track history and dues. | `Customers.jsx` | `customerEngine.js` | `invoices`, `bankLedger` | MED |
| **Staff Ledger** | Track staff internal billing and payments. | `StaffLedger.jsx` | `staffEngine.js` | `invoices`, `bankLedger` | MED |
| **Internal Bank** | Track all IN/OUT cash flow and expenses. | `InternalBank.jsx` | `bankEngine.js` | `expenses`, `customers`, `staff` | **HIGH** |
| **Due Ledger** | specialized view for outstanding customer payments. | `DueLedger.jsx` | `customerEngine.js` | `bankCredit`, `invoices` | MED |
| **Product Inventory** | Manage items, pricing, and stock (Retail). | `CreateInvoice.jsx` | `productEngine.js` | `invoices` | LOW |
| **WhatsApp/Email Share** | Send invoice PDFs/links to clients. | `Invoices.jsx` (Share Modal) | `invoiceShareService.js`| Firebase Storage, `pdfEngine` | MED |
| **Customer Portal** | Public link for customers to view bills and upload proof. | `PublicInvoice.jsx` | `portalEngine.js` | `publicInvoices` (Firestore) | **HIGH** |
| **Payment Proof Approval** | Verify payments uploaded by customers via Portal. | `PendingPayments.jsx` | `bankEngine.js` | `publicInvoices`, Firebase Storage | MED |
| **Dynamic Theme Engine** | Allow users to customize brand colors, borders, fonts. | `ThemeStudio.jsx` | `themeEngine.js` | `settings`, `themes.css` | MED |
| **Feature Toggles (Modules)**| Turn specific industry modules (e.g., Staff, Retail) ON/OFF. | `FeatureControlStudio.jsx`| `featureControlEngine.js`| `featureRegistry.js`, `Sidebar.jsx` | **HIGH** |
| **Dashboard Analytics** | Aggregated view of revenue, bills, and recent activity. | `Dashboard.jsx` | `analyticsEngine.js` | `invoices`, `bankLedger` | LOW |
| **Multi-Workspace** | Allow users to manage multiple businesses under one account.| `WorkspaceManager.jsx` | `workspaceEngine.js`| `authEngine`, `dbEngine` | **HIGH** |
| **Admin Panel** | Super-admin controls for platform management. | `AdminPanel.jsx` | `adminEngine.js` | `usersList`, `premiumRequests` | **HIGH** |
| **Offline Syncing** | Keep app functional without internet, sync later. | (Background Process) | `dbEngine.js` | `localDb.js`, `offlineEngine.js` | **CRITICAL** |
| **Education Module** | Student management, batch tracking. | `Students.jsx` | `customerEngine` (adapted) | Module: `education` | LOW |
| **Medical Module** | Patient records tracking. | `Patients.jsx` | `customerEngine` (adapted) | Module: `medical` | LOW |
| **Service/Repair Module** | Track repair jobs, devices. | `ServiceJobs.jsx` | `orderEngine` (implied) | Module: `service` | LOW |
| **Payment Gateways** | Generate payment links and log transactions. | `PaymentSettings.jsx` | `paymentEngine.js`, `paymentLinkService.js` | `bankEngine` | **HIGH** |
| **Platform Administration** | Manage platform limits, revenues, and global stats. | `PlatformAdmin.jsx` | `platformAdminService.js`, `platformRevenueService.js` | `adminSettings` | **HIGH** |
| **SaaS Billing & Subscriptions** | Control user subscription tiers (Free/Pro). | `BillingStudio.jsx` | `subscriptionEngine.js` | `usersList` | **HIGH** |
| **Audit Logging** | Track sensitive actions and role-based access. | `AuditLogs.jsx` | `securityEngine.js`, `auditEngine.js` | `auditLogs` | MED |

---

## Modifying Features (Risk Protocol)
- **CRITICAL Risk:** Any change to `dbEngine.js` or offline syncing logic. Requires exhaustive testing across all network states.
- **HIGH Risk:** Modifying billing calculations (`invoiceEngine`), Bank Ledger logic (`bankEngine`), or Feature routing (`App.jsx` + `featureRegistry`).
- **MED Risk:** UI adjustments, PDF template changes, or domain-isolated logic (like Staff or Customers).
- **LOW Risk:** Cosmetic changes, dashboard analytics, or isolated industry modules.
