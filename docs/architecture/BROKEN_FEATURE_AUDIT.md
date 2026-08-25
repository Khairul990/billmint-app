# BillQyro — Broken / Incomplete Feature Audit

## Scope
Source-code audit of the production `main` branch, focused on features that appear in the UI but are incomplete, local-only, or have placeholder synchronization logic.

## Confirmed findings

### 1. Appointments cloud synchronization — incomplete
`src/services/appointmentEngine.js` previously contained only a placeholder `syncFromCloud()` that returned `true` without loading or persisting cloud data.

**Action on audit branch:** replaced the placeholder with a user/workspace-scoped IndexedDB + sync-queue engine. The engine now supports `getAll`, `save`, `delete`, and scoped `syncFromCloud` behavior.

**Important remaining integration:** `src/pages/Appointments.jsx` still writes directly to its legacy `billqyro_appointments` localStorage key. The page must be migrated to call `appointmentEngine.save()` / `getAll()` for end-to-end use of the new engine.

### 2. Orders cloud synchronization — incomplete
`src/services/orderEngine.js` previously contained only a placeholder `syncFromCloud()` that returned `true` without loading or persisting cloud data.

**Action on audit branch:** replaced the placeholder with a user/workspace-scoped IndexedDB + sync-queue engine.

**Important remaining integration:** the Orders page must be migrated from its legacy localStorage persistence to `orderEngine` so writes actually enter the sync queue.

### 3. Activity history — cloud persistence incomplete
`src/services/activityEngine.js` previously stored activity history in workspace-only localStorage and explicitly commented that production Firestore persistence was not implemented.

**Action on audit branch:** activity records are now user + workspace scoped, persisted to IndexedDB, and queued for the existing sync engine.

### 4. Automation engine — functional placeholders remain
`src/services/automationEngine.js` contains placeholder implementations for:
- automatic backup execution
- payment reminder delivery
- recurring invoice generation

The current implementation logs/records intent instead of executing the underlying business actions. These should not be presented as fully operational automation until their real integrations are implemented and tested.

## Storage architecture change on audit branch
IndexedDB schema was upgraded to include:
- `appointments`
- `orders`
- `activities`

All include `userId` and `workspaceId` indexes.

## Verification status
This audit branch intentionally has **not** been merged to `main` yet. The new engine/storage foundation needs page-level integration and regression testing before production merge.

## Next required implementation
1. Migrate Appointments UI persistence to `appointmentEngine`.
2. Migrate Orders UI persistence to `orderEngine`.
3. Verify migration of existing legacy localStorage data without data loss.
4. Implement real automation actions or clearly label unsupported automation controls.
5. Run complete regression + build + manual runtime checks.
