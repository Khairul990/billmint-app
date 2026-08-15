# BillQyro — Architecture Audit Report
> Mismatches between existing documentation and actual source code.  
> Source code is the authority. All findings verified by direct inspection.

---

## Audit Summary

| Severity | Count |
|---------|-------|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 4 |
| LOW | 3 |
| INFO | 5 |

---

## HIGH Severity Findings

### AUDIT-001 — Previous architecture docs missing engines
**File(s):** `docs/architecture/DOMAIN_MAP.md`, `docs/architecture/FEATURE_MAP.md`  
**Documented:** Engines like `paymentEngine.js`, `adminEngine.js`, `platformAdminService.js`, `platformRevenueService.js`, `subscriptionEngine.js`, `securityEngine.js`, `auditEngine.js` were not listed.  
**Actual:** All these files exist in `src/services/` and are imported in `src/App.jsx`.  
**Resolution:** Documentation updated in DOMAIN_MAP.md and FEATURE_MAP.md.  
**Status:** ✅ RESOLVED

### AUDIT-002 — Conflict resolution strategy was UNVERIFIED
**File(s):** `docs/architecture/OFFLINE_SYNC.md`  
**Documented:** Strategy listed as "unclear / TBD".  
**Actual:** `offlineEngine.js` line 57 explicitly exports `cloudWins(local, cloud)` from `dbEngine.js`. **Cloud Wins is the verified strategy.**  
**Resolution:** OFFLINE_SYNC.md updated.  
**Status:** ✅ RESOLVED

---

## MEDIUM Severity Findings

### AUDIT-003 — Demo mode write-block not documented
**File(s):** `src/services/localDb.js` lines 138, 151, 164  
**Documented:** Not mentioned anywhere in architecture docs.  
**Actual:** When `billqyro_demo_session_active === 'true'` in localStorage, all IndexedDB `put()`, `delete()`, and `clear()` operations return immediately without writing. This is critical for understanding demo mode behavior.  
**Resolution:** Documented in MASTER_MAP.md and DATA_FLOW.md.  
**Status:** ✅ RESOLVED

### AUDIT-004 — Firebase App Check commented out
**File(s):** `src/services/firebaseConfig.js` lines 6–52  
**Documented:** Not mentioned.  
**Actual:** App Check code is commented out. Security is not fully hardened unless uncommented.  
**Resolution:** Noted in SECURITY_MAP.md.  
**Recommended action:** Enable App Check for production.

### AUDIT-005 — invoiceShareService.js is empty / stub
**File(s):** `src/services/invoiceShareService.js` (0 bytes)  
**Documented:** Listed as share service.  
**Actual:** The file exists but is 0 bytes. Actual share logic is in `invoiceShareService2.js` (8.2 KB).  
**Status:** [ARCHITECTURE MISMATCH] — Original service replaced by v2 but not deleted.  
**Recommended action:** Delete `invoiceShareService.js` stub or consolidate.

### AUDIT-006 — appointmentEngine.js and orderEngine.js are stubs
**File(s):** `src/services/appointmentEngine.js` (159 bytes), `src/services/orderEngine.js` (147 bytes)  
**Documented:** Listed as active engines.  
**Actual:** Both files are near-empty stubs. Logic appears to be inside page components directly.  
**Status:** [PLANNED / NOT FULLY IMPLEMENTED]  
**Recommended action:** Either implement engines properly or mark as stub in documentation.

---

## LOW Severity Findings

### AUDIT-007 — syncEngine.js and syncWorker.js are near-stubs
**File(s):** `src/services/syncEngine.js` (150 bytes), `src/services/syncWorker.js` (572 bytes)  
**Actual:** Core sync logic is in `dbEngine.js`. These are thin wrappers.  
**Status:** [LEGACY — VERIFY before modifying]

### AUDIT-008 — StudioLayout.jsx.bak exists
**File(s):** `src/pages/studios/StudioLayout.jsx.bak` (26.7 KB)  
**Actual:** Backup file from previous version. Not imported anywhere.  
**Status:** [LEGACY / UNUSED — safe to delete after review]

### AUDIT-009 — CreateInvoice_Backup.jsx is a stub
**File(s):** `src/pages/CreateInvoice_Backup.jsx` (831 bytes)  
**Actual:** Minimal backup file, not used in routing.  
**Status:** [LEGACY / UNUSED]

---

## INFO Findings

### INFO-001 — dbEngine.js is the system's single largest file (139 KB)
Contains all core CRUD, sync, Firestore, and utility functions. High-risk — changes affect entire system.

### INFO-002 — Dashboard.jsx is the largest page (106 KB)
Contains significant embedded logic. Potential refactor candidate.

### INFO-003 — App.jsx is effectively the router (98 KB)
All routing logic, auth state, and some business state live in App.jsx. High coupling.

### INFO-004 — Two SubscriptionStudio files exist
- `src/pages/admin/SubscriptionStudio.jsx` (36.8 KB)
- `src/pages/studios/SubscriptionStudio.jsx` (32.2 KB)
Both appear to serve different contexts (admin vs. user). Verify which is active in routing.

### INFO-005 — Node OOM during production build
`npm run build` fails with JavaScript heap OOM. Fix: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`.
