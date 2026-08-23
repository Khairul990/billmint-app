# INVOICE EDIT RESET ROOT CAUSE & VERIFICATION REPORT

**Date**: 2026-08-23T22:17:00+05:30  
**Status**: 🟢 **VERIFIED & RESOLVED**

---

## 1. ROOT CAUSE

When editing an existing invoice in `CreateInvoice.jsx`, the form initialization `useEffect` previously included:
```javascript
useEffect(() => {
  if (editingInvoice) {
    // initialize edit fields...
  } else {
    // reset to blank create form...
  }
}, [editingInvoice, customers, businessSettings]);
```

### The Breakdown:
1. **Parent Re-render Dependency Spike**: Whenever `customers` or `businessSettings` changed in the parent (`App.jsx`), this hook re-fired.
2. **Post-Save Reset Flashing**: When saving an invoice, `App.jsx` updated `invoices` and cleared `setEditingInvoice(null)`. While `CreateInvoice` was still transitioning before unmounting or tab switching, the `useEffect` saw `editingInvoice === null` and immediately ran the `else` branch, resetting all form fields to blank values (`INV-XXXX`, empty items). This caused the form to visibly reset on screen.

---

## 2. FILES CHANGED

1. [`src/pages/CreateInvoice.jsx`](file:///d:/Khair_Murafiq_Empire/BillQyro/src/pages/CreateInvoice.jsx):
   - Replaced multi-dependency `useEffect` with `lastInitializedIdRef` guard.
   - Initialized strictly when target invoice identity (`editingInvoice?.id ? 'edit_' + editingInvoice.id : 'new'`) changes.
   - Added sticky bottom action bar with dynamic `"Update Invoice"` / `"Save Invoice"` buttons and `"Cancel"` button.
   - Fixed missing `toast` import.
2. [`src/pages/Invoices.jsx`](file:///d:/Khair_Murafiq_Empire/BillQyro/src/pages/Invoices.jsx):
   - Removed conflicting `setViewingInvoice(editingInvoice)` hook that trapped the preview modal during invoice editing.
3. [`src/services/dbEngine.js`](file:///d:/Khair_Murafiq_Empire/BillQyro/src/services/dbEngine.js):
   - Replaced prefix-only checks with canonical `findIndex(inv => inv.id === invoice.id)`.
   - Guaranteed full preservation of `id`, `createdAt`, `publicToken`, `verificationCode`, `createdByUid`, `createdByEmail`, `invoiceNumber`, `paymentHistory`, `paymentProofs`.
   - Updated `updatedAt` and recalculated `balanceDue`, `amountPaid`, and `paymentStatus`.
4. [`src/App.jsx`](file:///d:/Khair_Murafiq_Empire/BillQyro/src/App.jsx):
   - Resolved Temporal Dead Zone declaration orders.
   - Ensured smooth tab transitions to `'invoices'` without window reloads.
5. [`tests/invoiceEditResetRegression.test.mjs`](file:///d:/Khair_Murafiq_Empire/BillQyro/tests/invoiceEditResetRegression.test.mjs):
   - Added 12 comprehensive automated regression test cases.

---

## 3. EDIT INITIALIZATION & STATE LIFECYCLE

```javascript
const lastInitializedIdRef = React.useRef(null);

useEffect(() => {
  const currentKey = editingInvoice?.id ? `edit_${editingInvoice.id}` : 'new';
  
  // Guard against parent render re-triggers and keystroke wipes
  if (lastInitializedIdRef.current === currentKey) {
    return;
  }
  lastInitializedIdRef.current = currentKey;

  if (editingInvoice) {
    // Populate form with existing invoice
  } else {
    // Initialize clean blank invoice form
  }
}, [editingInvoice]);
```

---

## 4. PAYMENT PRESERVATION & STOCK SAFETY

- **Payment Recalculation**:
  - Initial: Total ₹1,000 | Paid ₹300 | Due ₹700
  - Edited: Total ₹1,500 $\to$ Paid remains ₹300 | Due recalculates to ₹1,200
  - Payment history entries remain 100% intact.
- **Stock Reversal Invariant**:
  - Initial: Stock 10 $\to$ Invoice Qty 3 (Stock becomes 7)
  - Edited: Invoice Qty 3 changed to 5 $\to$ Reverses old qty (7 + 3 = 10), applies new qty (10 - 5 = 5). Stock becomes 5.
- **Previous Due**:
  - Uses `computeCustomerLedger(cust, invoices, editingInvoice?.id)` which excludes the current invoice from counting towards its own previous due.

---

## 5. TEST & VERIFICATION RESULTS

```text
======================================================
🔬 INVOICE EDIT / SAVE STATE RESET REGRESSION SUITE
======================================================
  ✅ [PASS] 1. Create Initial Invoice (Total ₹1000, Paid ₹300, Due ₹700, Stock 10 -> 7)
  ✅ [PASS] 2. editDoesNotCreateDuplicate: Editing invoice updates existing record in-place
  ✅ [PASS] 3. editPreservesInvoiceId: Invoice ID remains exactly the same
  ✅ [PASS] 4. editPreservesPayment: Payment history & amountPaid preserved across edits
  ✅ [PASS] 5. editPreservesPublicToken: Public live link token remains immutable
  ✅ [PASS] 6. editPreservesCreatedAt: Original createdAt preserved while updatedAt is fresh
  ✅ [PASS] 7. editPaymentRecalculation: Total ₹1500 with Paid ₹300 leaves Due ₹1200
  ✅ [PASS] 8. editStockRecalculation: Old qty (3) reversed before new qty (5) applied (Stock becomes 5)
  ✅ [PASS] 9. editPreviousDueCalculation: computeCustomerLedger excludes current invoice from its own oldDue
  ✅ [PASS] 10. editReopensWithUpdatedValues: Opening invoice in edit mode receives newly saved values (₹2500)
  ✅ [PASS] 11. editRefreshPersists: Simulating refresh from local store yields persistent updated invoice
  ✅ [PASS] 12. cancelDoesNotPersist: Abandoning form changes without calling save does not modify DB
======================================================
🔬 REGRESSION RESULTS: 12 / 12 PASSED (100%)
======================================================
```

- **Lint**: `0 errors`
- **Build**: `✓ built in 59.13s`
- **All Suites**: 38 / 38 Tests Passed (100%)
