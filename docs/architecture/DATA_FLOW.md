# BillQyro Data Flow Architecture

This document maps the real, verified execution path of data as it moves from the user interface down to the cloud database.

## 1. The Standard Flow (Offline-First)

The majority of data mutations in BillQyro follow this strict sequence:

### Step 1: User Interface (React)
- **Example:** User clicks "Save Invoice" in `CreateInvoice.jsx`.
- **Rule:** UI components **do not** contain direct IndexedDB or Firebase calls. They only collect state.

### Step 2: Component State & Context
- Component state (`useState`, `useReducer`) is bundled into a payload object.
- **Example:** The invoice object (items, customer details, totals) is passed to the Domain Engine.

### Step 3: Domain Engine (`src/services/*Engine.js`)
- The Domain Engine (e.g., `invoiceEngine.js`) is responsible for business validation.
- It calculates final numbers, appends timestamps, and handles cross-domain consequences (e.g., calling `bankEngine` if a payment was attached).
- **Flow Control:** The Engine forwards the validated payload to `dbEngine.js`.

### Step 4: The Database Hub (`dbEngine.js`)
- `dbEngine.js` intercepts almost all write requests.
- **Action:** It writes the payload directly to the **Local Database** (`localDb.js` / IndexedDB).
- **Result:** The UI immediately receives a success response, making the app feel instantaneous.

### Step 5: Sync Queue Registration
- Simultaneously, `dbEngine.js` registers a mutation intent in the `syncQueue` object store in IndexedDB.
- **Payload:** `{ id, action: 'CREATE', collection: 'invoices', data: {...}, timestamp }`.

### Step 6: Background Synchronization (`syncWorker.js` / `offlineEngine.js`)
- If the app is online, the `syncQueue` immediately begins processing.
- If offline, the queue waits until the `online` event fires.
- `dbEngine.js` pulls the payload from the queue and pushes it to **Firebase Firestore**.
- Upon a successful Firestore write, the item is removed from the local `syncQueue`.

---

## 2. Important Flow Exceptions (Verified from Source)

While the Offline-First flow covers ~90% of the app, there are critical exceptions that bypass the Sync Queue and write directly to Firebase.

### Exception A: Live Invoices & Customer Portal
- **Feature:** When an invoice is flagged for public sharing, or when a customer views a bill via a Public Link (`PublicInvoice.jsx`).
- **Flow:** `portalEngine.js` and `paymentLinkService.js` read/write **directly** to Firestore (`publicInvoices` collection).
- **Reason:** Public links must be live instantly for customers; offline caching is irrelevant here.

### Exception B: Authentication & Session
- **Feature:** Login, Logout, and Workspace Switching.
- **Flow:** `authEngine.js` communicates directly with Firebase Auth. 
- **Reason:** You cannot securely authenticate offline.

### Exception C: Super-Admin & Platform Settings
- **Feature:** Admin Panel settings (`adminEngine.js`) and subscription changes (`subscriptionEngine.js`).
- **Flow:** Writes bypass IndexedDB and go directly to Firestore.
- **Reason:** Platform-level limits and SaaS billing must have immediate cloud validation to prevent fraud.

---

## 3. Data Hydration (App Startup)

When BillQyro loads, how does it get data?

1. **Initial Render:** The UI reads immediately from `localDb.js` (IndexedDB) via `dbEngine.js`. The app is usable in milliseconds.
2. **Background Pull:** `dbEngine.js` reaches out to Firestore and asks: *"Give me everything that changed since my last sync timestamp."*
3. **Reconciliation:** New data from Firestore is merged into IndexedDB, and the UI re-renders if necessary.
4. **Queue Push:** Any leftover items in the local `syncQueue` are pushed to the cloud.

---

> [!CAUTION]
> **Refactoring Risk:** 
> Do not attempt to bypass `dbEngine.js` from a UI component to write directly to Firestore unless you are explicitly working on one of the verified exceptions (Portal, Auth, Admin). Doing so will break the Offline-First architecture.
