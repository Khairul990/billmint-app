# BillQyro — Due Ledger / Collections Page Blinking & Re-render Fix Audit

## 1. Executive Summary
This document provides a comprehensive technical audit of the fix applied to eliminate the visible blinking, flashing, and re-render loops on the **Due Ledger / Collections** page (`src/pages/DueLedger.jsx`).

---

## 2. Root Cause Analysis
### Why did repeated rendering & blinking occur?
1. **Component Definition Inside Render Function**:
   - The sub-component `Section` was declared **inside** the body of `DueCenter`.
   - On every state update (e.g. search input keystrokes, parent re-renders, sync updates), `Section` received a brand-new function reference.
   - React was forced to unmount the entire DOM subtree and remount it on every single render.
2. **Animation Re-triggering on Remount**:
   - Because `Section` was being unmounted and remounted, Framer Motion re-evaluated `initial="hidden"` and `animate="visible"` for every list item (`staggerItem` animating `opacity: 0 -> 1` and `y: 20 -> 0`).
   - This caused the entire bill list to blink and flash continuously.
3. **Unstable Callback References**:
   - Action callbacks (`handleMarkPaid`, `handleOpenCustomer`, `handleSendReminder`) were re-instantiated inline on every render without `useCallback`.
4. **Unmemoized Filter Computations**:
   - `filteredToday`, `filteredThisWeek`, and `filteredOlder` were computed inline without `useMemo`, creating new array references on every render cycle.

---

## 3. Implemented Fixes
1. **Extracted `DueSection` Sub-Component Outside `DueCenter`**:
   - Extracted `DueSection` to top-level scope wrapped with `React.memo` and explicit `displayName = 'DueSection'`.
   - Component identity remains static across renders, preventing unmount/remount cycles.
2. **Pure Helper Functions**:
   - Extracted `getUrgencyBadge` and `getStatusBadge` to pure top-level helper functions.
3. **Memoized Handlers**:
   - Wrapped `handleMarkPaid`, `handleOpenCustomer`, and `handleSendReminder` in `useCallback`.
4. **Memoized Filtered Subsets**:
   - Wrapped `filteredToday`, `filteredThisWeek`, and `filteredOlder` in `useMemo` with minimal dependencies (`grouped.*` and `searchQuery`).
5. **Static Root Container**:
   - Replaced dynamic animated wrapper with stable `<div>` container to eliminate unnecessary layout re-animations.

---

## 4. Verification & Test Results
- **Automated Regression Suite (`tests/dueLedgerUX.test.mjs`)**:
  - ✅ 1. Due Ledger loads once & isolates active due bills
  - ✅ 2. Cached data renders with exact dues
  - ✅ 3. Cloud sync event does not mutate original invoice references
  - ✅ 4. Sync status transitions preserve data integrity
  - ✅ 5. Search filtering isolates matching bills accurately without mutating source
  - ✅ 6. Filter by invoice number works accurately
  - ✅ 7. Invoice list rows have unique, persistent IDs
  - ✅ 8. Workspace switching isolates ledger records cleanly
  - ✅ 9. Empty invoice dataset safely produces 0 dues without throwing
  - ✅ 10. Offline state safely renders local cache data
  - ✅ 11. Online/offline transitions preserve total calculations
  - ✅ 12. Due calculation matches grandTotal minus amountPaid
  - ✅ 13. Overdue calculations handle date boundaries without NaN
  - ✅ 14. CustomEvent billqyro_sync can be dispatched and handled cleanly
  - ✅ 15. Processed bills list returns immediate data without requiring repeated async ticks
- **Full Suite**: 34 / 34 test suites passed (100%).
- **ESLint**: 0 errors (`npx eslint src/ --quiet`).
- **Production Build**: Successfully compiled (`npm run build`).
