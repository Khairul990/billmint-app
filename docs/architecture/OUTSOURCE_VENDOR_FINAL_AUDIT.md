# BillQyro — Outsource & Vendors System Architecture & Final Audit

**Document Version:** 9.0.0 (Production Release)  
**Status:** FULLY VERIFIED & COMPLETE (100% Passing)  
**Target Repository:** `Khairul990/billmint-app`  
**Branch:** `audit/fix-broken-business-features`  

---

## 1. Executive Summary

The **Outsource & Vendors System** is a dedicated enterprise module within BillQyro designed for managing external freelancers, contractors, and production vendors separately from internal staff. The module incorporates complete vendor directory management, outsource job milestone tracking, advance and partial payout accounting, internal bank ledger parity, and project gross margin profitability calculations.

---

## 2. Separation of Concerns (Staff vs Outsource)

- **Staff System (`src/pages/StaffLedger.jsx`):** Tracks internal employees, payroll wages, salary slips, attendance, and internal staff roles.
- **Outsource & Vendors System (`src/pages/business/OutsourceVendors.jsx`):** Tracks external third-party agencies, freelance specialists, vendor job costing, milestone disbursements, and client invoice profit linkages.

---

## 3. Data Models & IndexedDB Schema

Three dedicated object stores were integrated into `localDb.js` (Schema Version 9):

### A. Vendors (`vendors`)
```typescript
interface Vendor {
  id: string; // 'vnd-...'
  userId: string;
  workspaceId: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  category: string; // 'Graphic Designer', 'Web Developer', etc.
  address?: string;
  paymentPreference: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  upiId?: string;
  bankDetails?: string;
  defaultRate?: number;
  openingBalance?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __version: number;
}
```

### B. Outsource Jobs (`outsourceJobs`)
```typescript
interface OutsourceJob {
  id: string; // 'job-...'
  jobCode: string; // 'OUT-1001'
  userId: string;
  workspaceId: string;
  project: string;
  description: string;
  client?: string;
  relatedInvoiceId?: string | null;
  relatedInvoiceNumber?: string;
  vendorId: string;
  vendorName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  startDate: string;
  deadline?: string;
  agreedCost: number;
  totalPaid?: number;
  remainingPayable?: number;
  status: 'Draft' | 'Assigned' | 'In Progress' | 'Submitted' | 'Revision' | 'Approved' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### C. Outsource Payments (`outsourcePayments`)
```typescript
interface OutsourcePayment {
  id: string; // 'opay-...'
  userId: string;
  workspaceId: string;
  jobId?: string | null;
  jobCode?: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  date: string;
  paymentMethod: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque';
  reference?: string;
  note?: string;
  bankAccount?: string;
  isAdvance?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. Mathematical Invariants & Financial Engine

### 1. Outstanding Payable Formula
$$\text{Outstanding Payable} = \max(0, \text{Agreed Cost} - \sum \text{Valid Job Payments})$$
*Guarantees non-negative payable balance on advance or overpayment.*

### 2. Vendor 360 Lifetime Balance
$$\text{Current Vendor Payable} = \max(0, \text{Opening Balance} + \sum \text{Agreed Job Costs} - \sum \text{Vendor Payments})$$

### 3. Chronological Vendor Ledger
Running balance updates chronologically:
- **Opening Balance:** Credit (+)
- **Job Agreed Cost:** Credit (+)
- **Disbursement / Payment:** Debit (-)
- **Running Payable:** Balance at each transaction step

### 4. Client Invoice Linking & Profitability
- **Client Revenue:** Sum of distinct linked client invoices.
- **Outsource Cost:** Sum of agreed job costs.
- **Gross Profit:** $\text{Client Revenue} - \text{Outsource Cost}$
- **Gross Margin %:** $\frac{\text{Gross Profit}}{\text{Client Revenue}} \times 100$

---

## 5. Internal Bank Integration

When a vendor payout is recorded:
1. Payout record is stored in `outsourcePayments`.
2. Related job `remainingPayable` decreases.
3. If an Internal Bank account is selected, `bankEngine.addTransaction` records a `moneyOut` expense with `source: 'outsource_payout'`.
4. Bank balance decreases without double-counting.
5. Reversing/deleting a payment restores the job payable balance and maintains bank auditability.

---

## 6. Module Settings & Non-Destructive Toggles

- Registered under `FEATURE_CATEGORIES.OUTSOURCE` and `FEATURE_REGISTRY['outsource']` in `featureRegistry.js`.
- Sub-features: `outsource.vendors`, `outsource.jobs`, `outsource.payments`, `outsource.profit`.
- **Non-Destructive Invariant:** Disabling the Outsource module in settings hides the navigation item and routes, but **never deletes** existing vendor, job, or payment records in IndexedDB or cloud storage.

---

## 7. Verification & Test Suite

- **Automated Tests:** `tests/outsourceVendorEngine.test.mjs` (8/8 Passed, 100%).
- **Full Suite Regression:** 25/25 suites passed in `tests/run_all_tests.mjs`.
- **Lint:** Clean pass (0 errors).
- **Build:** Clean Vite production bundle.
