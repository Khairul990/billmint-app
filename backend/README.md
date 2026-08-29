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
- `GET /api/v1/workspaces` — List workspaces owned/shared with authenticated user
- `POST /api/v1/workspaces` — Atomic workspace creation with owner assignment
- `GET /api/v1/customers` — Paginated customers query with search & workspace isolation
- `POST /api/v1/customers` — Customer creation within authorized workspace
- `GET /api/v1/invoices` — Paginated invoices query with status, search & date range filters
- `POST /api/v1/invoices` — Server-authoritative canonical invoice creation with row-level locking & sequence allocation

### Public Endpoints (Unauthenticated):
- `GET /api/v1/public/invoices/:token` — Secure public invoice retrieval:
  - Located exclusively via high-entropy `public_token`.
  - Zero internal leaks: internal DB UUIDs, private notes, and user IDs are 100% stripped.
  - Returns sanitized Public DTO containing invoice details, line items, business display info, customer display name, and presentation metadata.
  - Conservative `Cache-Control: no-store` and rate limiting enforced.

---

## 5. Atomic Concurrency Function

```sql
-- Generates next sequential invoice number with row-level lock:
SELECT generate_next_invoice_number('b0000000-0000-0000-0000-000000000001'::uuid, 'Invoice');
-- Result: 'AFS-0101'
```
