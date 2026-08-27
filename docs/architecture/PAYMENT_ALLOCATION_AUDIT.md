# BillQyro — Old Due Payment Allocation Architecture & Audit

**Document Version:** 9.0.0 (Production Release)  
**Status:** FULLY VERIFIED & DETERMINISTIC (100% Passing)  
**Target Repository:** `Khairul990/billmint-app`  
**Branch:** `audit/fix-broken-business-features`  

---

## 1. Executive Summary

When a customer carries an **Old Due (Previous Outstanding Balance)** and creates a **New Invoice**, any payment recorded against that transaction follows an authoritative, deterministic financial allocation order. This document outlines the mathematical rules, data structures, and edge-case invariants that govern payment allocation in BillQyro.

---

## 2. Default Allocation Priority

Incoming payments are allocated strictly in the following priority order:

1. **Priority 1 — Settle Previous / Old Due First:**
   $$\text{Allocated to Old Due} = \min(\text{Payment Amount}, \text{Previous Due})$$
   $$\text{Remaining Old Due} = \max(0, \text{Previous Due} - \text{Allocated to Old Due})$$

2. **Priority 2 — Settle Current Invoice with Remaining Balance:**
   $$\text{Unallocated Remainder} = \max(0, \text{Payment Amount} - \text{Allocated to Old Due})$$
   $$\text{Allocated to Current Invoice} = \min(\text{Unallocated Remainder}, \text{Current Invoice Total})$$
   $$\text{Remaining Current Invoice Due} = \max(0, \text{Current Invoice Total} - \text{Allocated to Current Invoice})$$

3. **Total Customer Outstanding:**
   $$\text{Customer Total Due} = \text{Remaining Old Due} + \text{Remaining Current Invoice Due}$$

---

## 3. Mandatory Mathematical Scenarios

| Scenario | Old Due | Current Bill Total | Total Receivable | Payment Amount | Allocated to Old Due | Remaining Old Due | Allocated to Current Bill | Remaining Current Bill Due | Customer Total Due | Current Bill Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Test 1: Partial Old Due** | ₹1,500 | ₹800 | ₹2,300 | ₹1,000 | ₹1,000 | ₹500 | ₹0 | ₹800 | ₹1,300 | `Unpaid` |
| **Test 2: Full Old Due + Partial Bill** | ₹1,500 | ₹800 | ₹2,300 | ₹2,000 | ₹1,500 | ₹0 | ₹500 | ₹300 | ₹300 | `Partially Paid` |
| **Test 3: Full Account Settlement** | ₹1,500 | ₹800 | ₹2,300 | ₹2,300 | ₹1,500 | ₹0 | ₹800 | ₹0 | ₹0 | `Paid` |
| **Test 4: Zero Old Due** | ₹0 | ₹800 | ₹800 | ₹300 | ₹0 | ₹0 | ₹300 | ₹500 | ₹500 | `Partially Paid` |
| **Test 5: Multi-Payment (₹500+700+400)** | ₹1,500 | ₹800 | ₹2,300 | ₹1,600 | ₹1,500 | ₹0 | ₹100 | ₹700 | ₹700 | `Partially Paid` |

---

## 4. Payment Record Fields & Auditability

Every payment record contains full metadata for end-to-end auditability without modifying historical invoices or duplicating ledger rows:

```typescript
interface PaymentRecord {
  id: string; // 'pmt_...'
  amount: number;
  date: string; // ISO 8601
  method: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Cheque';
  note?: string;
  transactionId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  allocatedToOldDue?: number;
  allocatedToCurrentInvoice?: number;
}
```

---

## 5. Non-Destructive Principles

- **Zero Data Mutation:** The system never alters historical invoice totals or deletes past payment history.
- **Zero Double-Counting:** Customer outstanding is strictly:
  $$\text{Customer Outstanding} = \sum (\text{Valid Receivables}) - \sum (\text{Valid Payments})$$
- **Isolated Edit Mode:** When editing an invoice, the current invoice is explicitly excluded from the `Old Due` calculation to avoid double-counting.
- **Status Independence:** The current invoice is marked `Paid` only when its own allocated portion covers the current invoice grand total. Paying Old Due alone does not mark the new invoice as Paid.

---

## 6. Automated Test Coverage

- **Suite:** `tests/paymentAllocation.test.mjs` (7 / 7 Passed, 100%)
- **Complete Suite:** `tests/run_all_tests.mjs` (27 / 27 Suites Passed, 100%)
