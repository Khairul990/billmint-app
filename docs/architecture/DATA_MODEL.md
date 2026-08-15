# BillQyro Data Model & Database Architecture (0-100)

This document provides a comprehensive mapping of where data is stored in BillQyro, covering both the Cloud Database (Firebase Firestore) and the Local Database (IndexedDB).

## 1. High-Level Storage Strategy
BillQyro operates on an **Offline-First** storage strategy:
1. Data is primarily read from and written to **IndexedDB** (`localDb.js`).
2. A `syncQueue` in IndexedDB manages pending offline operations.
3. The `dbEngine.js` pushes data from IndexedDB/syncQueue to **Firestore** when online.
4. On startup, `dbEngine.js` pulls the latest changes from Firestore into IndexedDB.

---

## 2. Firestore Data Model (Cloud)

Firestore is structured with a **Multi-Tenant (User-scoped)** approach. Most business data is stored under the `userId`.

### 2.1 Global Collections (Root Level)
| Collection | Document ID | Purpose |
|------------|-------------|---------|
| `usersList` | `userId` | Core user profile, plan status (free/premium), subscription expiry. |
| `premiumRequests` | `requestId` | Upgrade requests sent from users to the admin panel. |
| `adminSettings` | `global` | Platform-wide configurations controlled by the super admin. |
| `publicInvoices` | `publicToken` | Contains invoice copies accessible via public links (no auth required). Used for the Customer Portal. |

### 2.2 User-Scoped Data (Root Level -> User Document)
| Collection | Document ID | Purpose |
|------------|-------------|---------|
| `settings` | `userId` | User's business profile, theme preferences, tax settings, active modules. |
| `subscription` | `userId` | Detailed subscription payload (payment id, validity, tier). |
| `platformRevenue`| `userId` | Tracks platform fees collected from this specific user/business. |

### 2.3 User-Scoped Sub-Collections (Root -> User -> `items` -> Document)
All primary business data resides in sub-collections to ensure strict data isolation. The path is `[collectionName]/{userId}/items/{docId}`.

| Collection Name | Schema Overview / Key Fields | Relationships |
|-----------------|------------------------------|---------------|
| `invoices` | `id`, `invoiceNumber`, `customerId`, `items[]`, `total`, `discount`, `tax`, `status` (paid/unpaid), `createdAt`, `publicToken` | Refers to `customers.id`, `staff.id`, `products.id` |
| `customers` | `id`, `name`, `phone`, `email`, `address`, `balance`, `type` | Used by `invoices`, `bankLedger` |
| `staff` | `id`, `name`, `phone`, `role`, `salary`, `status` | Used by `invoices` (staff billing), `bankLedger` |
| `products` | `id`, `name`, `price`, `stock`, `category`, `barcode`, `sku` | Used in `invoices.items` |
| `expenses` | `id`, `category`, `amount`, `date`, `note`, `paymentMethod` | Refers to `bankLedger` (outflow) |
| `students` | `id`, `name`, `course`, `batch`, `fee`, `joinDate` | Education Category specific |
| `bankLedger` | `id`, `type` (IN/OUT), `amount`, `category`, `referenceId`, `date` | Refers to `customers`, `staff`, `invoices`, `expenses` |
| `bankCredit` | `id`, `customerId`, `amount`, `type`, `date` | Customer credit/advance mapping |
| `auditLogs` | `id`, `action`, `entity`, `timestamp`, `details` | Tracks user activity for security |

---

## 3. IndexedDB Data Model (Local)

IndexedDB is managed via `localDb.js` using `localForage`/Native IndexedDB wrapper.

### Database Details
- **Name:** `billqyro-db`
- **Version:** `5`

### 3.1 Object Stores
All stores use `id` as the primary `keyPath`. Key indices include `userId` and `workspaceId` to support multi-workspace switching.

| Store Name | Matches Firestore? | Additional Info |
|------------|--------------------|-----------------|
| `invoices` | Yes (`invoices`) | Indexed by `userId`, `workspaceId`. Caches all user invoices. |
| `customers` | Yes (`customers`) | Indexed by `userId`, `workspaceId`. Caches all customer data. |
| `expenses` | Yes (`expenses`) | Indexed by `userId`, `workspaceId`. |
| `products` | Yes (`products`) | Indexed by `userId`, `workspaceId`. |
| `students` | Yes (`students`) | Indexed by `userId`, `workspaceId`. |
| `bankLedger` | Yes (`bankLedger`) | Indexed by `userId`, `workspaceId`. Offline cache of bank transactions. |
| `bankCredit` | Yes (`bankCredit`) | Indexed by `userId`, `workspaceId`. |
| `syncQueue` | **No (Local Only)** | Tracks offline operations: `{ id, action (CREATE/UPDATE/DELETE), collection, data, timestamp }`. Processed by `syncEngine.js`. |
| `auditLogs` | Yes (`auditLogs`) | Local buffer for audit events before pushing to cloud. |
| `errorLogs` | **No (Local Only)** | Stores client-side crash/error logs. |

---

## 4. Single Source of Truth / Data Derivation Rules

To prevent data inconsistencies, BillQyro follows strict derivation rules:
- **Customer Balance:** The `customers` collection holds a `balance` field, but it is ultimately derived/audited against the `bankLedger` and `invoices`.
- **Product Stock:** `products.stock` is reduced when an `invoice` is created.
- **Invoice Totals:** Stored in the `invoices` doc, but MUST equal the sum of `items[]` minus discounts plus tax.
- **Dashboard Metrics:** Not stored separately. The dashboard dynamically aggregates data from `invoices`, `expenses`, and `bankLedger`.

## 5. Security Rules & Isolation (Firebase Rules)
- **User Isolation:** `match /{collection}/{userId}/items/{document} { allow read, write: if request.auth.uid == userId; }`
- **Public Invoices:** `match /publicInvoices/{token} { allow read: if true; allow update: if request.resource.data.keys().hasOnly(['paymentProofUrl', 'status']); }`
- **Admin Settings:** Global settings are strictly `read-only` for normal users.
