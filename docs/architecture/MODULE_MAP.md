# BillQyro — Module Map
> Verified from: `src/services/featureRegistry.js`, `src/config/businessPresets.js`, `src/services/featureControlEngine.js`

---

## Module Architecture

```
Business Category Selection (OnboardingWizard)
          │
          ▼
businessPresets.js → BUSINESS_PRESETS[categoryId]
          │
          ├── recommendedModules[]
          ├── optionalModules[]
          └── hiddenModules[]
                    │
                    ▼
          Settings stored in Firestore settings doc
          (activeModules, hiddenModules, categoryId)
                    │
                    ▼
          featureControlEngine.js
                    │
          ├── isModuleEnabled(moduleId)
          └── toggleModule(moduleId) → saves to settings
                    │
                    ▼
          Sidebar.jsx: renders nav items based on enabled modules
          App.jsx: conditionally renders pages based on module state
```

---

## All Available Modules (VERIFIED from businessPresets.js)

| Module ID | Name | Default (Retail) | Feature Engine |
|-----------|------|-----------------|----------------|
| `billing` | Invoicing & Billing | ✅ Recommended | invoiceEngine |
| `customers` | Customers (CRM) | ✅ Recommended | customerEngine |
| `products` | Products & Inventory | ✅ Recommended | productEngine |
| `dueLedger` | Due Ledger | ✅ Recommended | invoiceEngine.calculateDueLedger |
| `expenses` | Expenses Tracking | Optional | expenseEngine |
| `reports` | Reports & Analytics | ✅ Recommended | reportEngine |
| `patients` | Patient Records | Hidden (non-medical) | dbEngine |
| `students` | Student Directory | Hidden (non-education) | localDb students |
| `prescription` | E-Prescriptions | Hidden | [PLANNED] |
| `appointments` | Appointments | Hidden | appointmentEngine (stub) |
| `measurements` | Measurements | Hidden | Measurements.jsx |
| `designBook` | Design Book | Hidden | DesignBook.jsx |
| `fees` | Fee Collection | Hidden (non-education) | invoiceEngine |
| `attendance` | Attendance | Hidden | [PLANNED] |
| `orders` | Order Management | Hidden | Orders.jsx |
| `delivery` | Delivery Tracking | Hidden | Delivery.jsx |
| `paymentProofs` | Payment Proofs | Optional | PaymentProofCenter |
| `devices` | Device Management | Hidden | Devices.jsx |
| `serviceJobs` | Service Jobs | Hidden | ServiceJobs.jsx |
| `clients` | Client Roster | Hidden | Clients.jsx |
| `projects` | Projects | Hidden | Projects.jsx |
| `payments` | Payment Tracking | Depends | paymentEngine |

---

## Critical Rule: Module Disable = Data Preserved

> [!IMPORTANT]
> Disabling a module MUST NOT delete its existing data.
> The feature control system only controls UI visibility, not data deletion.
> Data remains in IndexedDB and Firestore even when a module is hidden.

---

## Feature Registry Categories (featureRegistry.js)

| Category ID | Default State |
|-------------|--------------|
| `invoice` | ENABLED |
| `customers` | ENABLED |
| `staff` | DISABLED |
| `products` | ENABLED |
| `payments` | ENABLED |
| `liveLink` | ENABLED |
| `treasury` | ENABLED |
| `reports` | ENABLED |
| `notifications` | ENABLED |
| `security` | ENABLED |
| `appearance` | ENABLED |
| `backup` | ENABLED |
| `advanced` | ENABLED |
| `operations` | ENABLED |

---

## Feature Dependencies (VERIFIED from featureRegistry.js)

```
invoice
  └── invoice.customColumns
  └── invoice.discount
  └── invoice.tax
  └── invoice.paymentStatus

customer
  └── customer.ledger
  └── customer.portal
  └── customer.notifications

product
  └── product.inventory
       └── product.stockTracking
            └── product.lowStockAlert

payment
  └── payment.partialPayment
  └── payment.paymentProof
  └── payment.approval

liveLink
  └── liveLink.paymentRequest (requires: payment)
       └── liveLink.whatsappProof
       └── liveLink.approvalWorkflow (requires: payment.approval)

bank (treasury category)
  └── bank.credit (requires: customer)

treasury
  └── treasury.moneyIn
  └── treasury.moneyOut
  └── treasury.ledger
```
