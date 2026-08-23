# Phase 06 — Billing & Invoice Studio Audit

**Status**: COMPLETED  
**Architecture Compliance**: 100% Verified

---

## 1. Scope & Accomplishments

### Billing Studio Engine (`src/pages/CreateInvoice.jsx`)
- **Real-Time Dynamic Pricing Calculator**:
  - Subtotal calculation with item quantity $\times$ unit price.
  - Multi-mode discounts (Percentage % vs Flat Currency value).
  - Tax computation (GST / VAT percentage application on taxable amount).
  - Shipping & handling additions.
- **Old Due / Historical Balance Isolation**:
  - Automatically loads prior customer balance through `computeCustomerLedger(customer, invoices, editingInvoiceId)`.
  - When editing an existing invoice, isolates the active invoice ID to prevent double-counting historical dues.
  - Formula strictly enforced:
    $$\text{Previous Due} + \text{Current Invoice Total} - \text{Amount Paid Now} = \text{Total Outstanding}$$
- **Multi-Method QR Code Engine**:
  - Instant on-the-fly QR code generation (`qrcode` library) for UPI (India), bKash/Nagad (Bangladesh), and Direct Live Link.
- **Direct Output Integrations**:
  - Live PDF Preview side-drawer.
  - WhatsApp direct 1-click invoice sharing with formatted greeting, balance summary, and live link.
  - Inventory stock depletion check and automatic product deduction.

---

## 2. Verification Status

| Calculation & Flow | Validation Criterion | Result |
| :--- | :--- | :---: |
| **Old Due Auto-Lookup** | Pulls true outstanding ledger balance on customer selection | ✅ PASS |
| **Editing Double-Count Guard** | Historical due calculation correctly excludes active bill | ✅ PASS |
| **Payment Status Logic** | Properly flags `Paid`, `Partial`, or `Unpaid` based on amount paid | ✅ PASS |
| **QR Code Encoding** | Dynamic URL parameters for UPI/bKash/Nagad match invoice values | ✅ PASS |

---

## 3. Files Audited & Verified
- `src/pages/CreateInvoice.jsx`
- `src/services/invoiceEngine.js`
- `src/utils/financialCalculations.js`
- `src/utils/invoiceUtils.js`
