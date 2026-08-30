-- ============================================================================
-- Migration: 004_vendors_outsource.sql
-- Description: Creates vendors, outsource_jobs, and vendor_payments tables
-- Multi-tenant composite foreign keys enforce mathematical workspace isolation.
-- ============================================================================

-- 1. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    service VARCHAR(255),
    address TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_vendors_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_vendors_workspace_lookup 
ON vendors(workspace_id, is_deleted, created_at DESC);

-- 2. Outsource Jobs Table
CREATE TABLE IF NOT EXISTS outsource_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    vendor_id UUID NOT NULL,
    work_description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_outsource_vendor FOREIGN KEY (vendor_id, workspace_id) REFERENCES vendors(id, workspace_id) ON DELETE RESTRICT,
    CONSTRAINT uq_outsource_jobs_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_outsource_jobs_vendor_status 
ON outsource_jobs(workspace_id, vendor_id, status);

CREATE INDEX IF NOT EXISTS idx_outsource_jobs_invoice 
ON outsource_jobs(workspace_id, invoice_id);

-- 3. Vendor Payments Table
CREATE TABLE IF NOT EXISTS vendor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    reference_note TEXT,
    idempotency_key VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_vendor_payment_vendor FOREIGN KEY (vendor_id, workspace_id) REFERENCES vendors(id, workspace_id) ON DELETE RESTRICT,
    CONSTRAINT uq_vendor_payments_idempotency UNIQUE (workspace_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor 
ON vendor_payments(workspace_id, vendor_id, created_at DESC);
