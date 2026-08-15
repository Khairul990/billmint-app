# BillQyro Offline-Sync Architecture

This document outlines the offline-first synchronization strategy implemented in BillQyro.

## 1. Core Philosophy: Offline-First
BillQyro treats the **local database (IndexedDB)** as the primary source of truth for the UI. The cloud (Firestore) acts as a persistent backup and multi-device synchronizer. 

## 2. Infrastructure Components (Verified from Source)

- **`localDb.js` (IndexedDB Wrapper):** Creates the `billqyro-db` (v5). It initializes all local Object Stores (`invoices`, `customers`, etc.) and the critical `syncQueue` store.
- **`syncQueue` (Object Store):** Stores a chronological list of mutations (CREATE, UPDATE, DELETE) that have occurred locally but have not yet been successfully pushed to Firestore.
- **`offlineEngine.js`:** A higher-level wrapper around synchronization operations. It provides methods like `getQueueStatus()`, `enqueue()`, and `syncNow()`. It also acts as the router for checking if the device `isOnline()`.
- **`syncWorker.js`:** A simple worker that attempts to flush the `syncQueue` in the background when requested, clearing the local queue only when all items are successfully synced.
- **`dbEngine.js` (The Hub):** Contains the actual complex logic for pushing/pulling to Firestore (`syncOfflineTransactions`, `flushSyncQueue`).

## 3. The Synchronization Lifecycle

### Action A: Device Goes Offline
1. The browser's `navigator.onLine` API is monitored, or a Firebase connection drop is detected.
2. The UI continues functioning normally because all reads and writes are executing against `localDb.js`.
3. Mutations are bundled with timestamps and pushed to the `syncQueue` store with `status: 'pending'`.

### Action B: Device Reconnects (Online Event)
1. An event listener detects reconnection (or the user manually clicks "Sync Now").
2. `offlineEngine.syncNow()` calls `syncOfflineTransactions()` in `dbEngine.js`.
3. The queue is processed sequentially:
   - For `CREATE` actions: A new document is written to Firestore.
   - For `UPDATE` actions: The document in Firestore is merged.
   - For `DELETE` actions: The document in Firestore is deleted.
4. If a Firestore write succeeds, the item's status in `syncQueue` is updated to `completed`.
5. `syncWorker.js` verifies all items are completed and then runs `BillQyroDB.clear('syncQueue')`.

## 4. Conflict Resolution & Failures (Verified)

### Conflict Handling Strategy
BillQyro implements a **"Cloud Wins"** strategy (`cloudWins(local, cloud)`).
- If a document was edited offline on Device A, and edited separately on Device B...
- When Device A reconnects, the `dbEngine.js` checks timestamps or simply forces the Cloud state to overwrite the local state upon the next background pull. 
- *Risk Note:* Deep merging is not fully implemented. "Last write wins" is the effective behavior.

### Failure Recovery & Retry Behavior
- If an item fails to push to Firestore (e.g., due to a temporary network drop during the sync loop), its status in `syncQueue` is set to `failed` (or remains `pending`).
- The `syncWorker.js` does NOT clear the `syncQueue` if there are pending/failed items.
- The next time `syncNow()` is triggered, it will retry pushing the failed/pending items.

### Duplicate Sync Risks (Needs Verification / Known Risk)
- Because `syncQueue` relies on a naive chronological replay, if a user clicks "Save" multiple times while experiencing a flaky connection, the queue might stack multiple `UPDATE` actions for the same document.
- `dbEngine.js` currently processes these sequentially. While Firestore handles idempotent writes well, rapid sequential writes on reconnection can cause temporary UI jitter or quota spikes.

## 5. Security Boundary during Sync
The `syncWorker` respects Firebase Security Rules. If a malicious user attempts to alter the local `syncQueue` to edit an invoice belonging to another `userId`, the Firestore rules will reject the write during the background sync, and the queue item will permanently fail.
