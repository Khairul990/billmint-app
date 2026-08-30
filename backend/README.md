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
- `PATCH /api/v1/outsource-jobs/:id` — Update outsource job status (Pending/In Progress/Completed) & cost
- `POST /api/v1/vendor-payments` — Record payment to vendor with idempotency check

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
