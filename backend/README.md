# BillQyro — Phase 2 Backend & Database Architecture

> **Notice:** This directory contains the **isolated local PostgreSQL backend foundation** for Phase 2.  
> It does **NOT** interfere with, replace, or alter the active frontend or Firebase data storage.

---

## 1. Directory Structure

```
backend/
├── migrations/
│   └── 001_initial_schema.sql    # Idempotent DDL schema for PostgreSQL 16+
├── seeds/
│   └── 001_dev_seed.sql          # Local testing mock data (Zero real user info)
├── scripts/
│   └── migrate.mjs               # Node.js deterministic migration runner
├── .env.example                  # Local environment template
└── README.md                     # Architecture & setup documentation
```

---

## 2. Quick Start (Local ₹0 Development)

### Prerequisites:
- Docker Desktop or Docker Engine installed.
- Node.js 18+

### Step 1: Start PostgreSQL and MinIO Containers
```bash
docker-compose up -d
```

### Step 2: Verify PostgreSQL Health
```bash
docker ps --filter "name=billqyro-postgres-dev"
```

### Step 3: Run Database Migrations
```bash
# Direct psql migration:
docker exec -i billqyro-postgres-dev psql -U billqyro_dev_user -d billqyro_dev < backend/migrations/001_initial_schema.sql

# Or apply dev seed:
docker exec -i billqyro-postgres-dev psql -U billqyro_dev_user -d billqyro_dev < backend/seeds/001_dev_seed.sql
```

---

## 3. Multi-Tenant Cross-Workspace Referential Guardrails

To eliminate the risk of Workspace A referencing a Customer or Invoice from Workspace B, all parent entity tables expose composite unique constraints `(id, workspace_id)` and child tables use composite foreign keys:

```sql
-- Invoices table foreign key to Customers table:
FOREIGN KEY (customer_id, workspace_id) REFERENCES customers(id, workspace_id) ON DELETE SET NULL
```

This enforces strict database-level mathematical tenant isolation independently of application bugs.

---

## 4. REST API v1 Endpoints

### System & Health:
- `GET /health` — Public health probe
- `GET /ready` — Service readiness probe

### Authenticated Workspace Endpoints (Requires Firebase Bearer Token):
- `GET /api/v1/auth/me` — Authenticated profile & idempotent user auto-provisioning
- `GET /api/v1/workspaces` — List workspaces where authenticated user is a member
- `POST /api/v1/workspaces` — Create workspace
- `POST /api/v1/customers` — Create customer with duplicate check & workspace isolation
- `GET /api/v1/customers` — Paginated list of customers with search filtering
- `POST /api/v1/invoices` — Atomically create invoice with sequence lock & financial calculation
- `GET /api/v1/invoices` — Paginated list of invoices with search and date filtering
- `GET /api/v1/invoices/:id/pdf` — Retrieve cached immutable PDF or generate deterministically
- `POST /api/v1/payments` — Record immutable payment with row-level lock and audit log
- `GET /api/v1/payments` — Paginated list of payment ledger history
- `POST /api/v1/vendors` — Create vendor with workspace isolation
- `GET /api/v1/vendors` — Paginated list of vendors with search filtering
- `GET /api/v1/vendors/:id/ledger` — Vendor statement with jobs, payments, and server-side due balance
- `POST /api/v1/outsource-jobs` — Assign outsource job linked to vendor and invoice
- `GET /api/v1/outsource-jobs` — Paginated list of outsource jobs with vendor/invoice/status filters
- `POST /api/v1/expenses` — Record expense with amount, category, date, and description
- `GET /api/v1/expenses` — Paginated list of expenses with category and date filtering
- `POST /api/v1/bank-ledger` — Record bank income or expense transaction
- `GET /api/v1/bank-ledger` — Paginated list of bank ledger entries with type filtering
- `POST /api/v1/products` — Create product with inventory and tax details
- `GET /api/v1/products` — Paginated list of products with search, SKU, and lowStock filtering
- `GET /api/v1/products/:id` — Product detail with low-stock status
- `PATCH /api/v1/products/:id` — Update product details and inventory
- `DELETE /api/v1/products/:id` — Soft-delete product
- `GET /api/v1/reports/dashboard` — Dashboard revenue, invoice counts, expenses, and net summary
- `GET /api/v1/reports/sales` — Filterable sales and invoice reporting
- `GET /api/v1/reports/payments` — Aggregated payment totals & paginated payment history
- `GET /api/v1/reports/expenses` — Total expenses & category-wise breakdown
- `GET /api/v1/reports/bank-ledger` — Bank cashflow report (Income/Expense/Net balance)
- `POST /api/v1/sync/batch` — Idempotent offline batch mutation engine
- `GET /api/v1/notifications` — Notification activity center
- `POST /api/v1/notifications/:id/read` — Mark notification as read
- `POST /api/v1/notifications/read-all` — Mark all workspace notifications as read
- `GET /api/v1/notifications/unread-count` — Unread notification count
- `POST /api/v1/backups/export` — Trigger workspace data snapshot export
- `GET /api/v1/backups` — List previous export jobs
- `GET /api/v1/backups/:id` — Get export status and signed download URL

### Public Endpoints (Unauthenticated):
- `GET /api/v1/public/invoices/:token` — Secure public invoice retrieval via cryptographic token (strips internal UUIDs/notes)

---

## 5. Local MinIO S3 Object Storage Emulator

MinIO runs locally via Docker Compose:
- **API Endpoint**: `http://localhost:9000`
- **Console UI**: `http://localhost:9001`
- **Access Key**: `minio_admin`
- **Secret Key**: `minio_dev_secret_123`
- **Bucket**: `billqyro-storage-dev`

Immutable PDF Storage Key convention:
```
pdfs/{workspaceId}/{invoiceId}/{contentHash}.pdf
```

---

## 6. Atomic Concurrency Function

```sql
-- Generates next sequential invoice number with row-level lock:
SELECT generate_next_invoice_number('b0000000-0000-0000-0000-000000000001'::uuid, 'Invoice');
-- Result: 'AFS-0101'
```
