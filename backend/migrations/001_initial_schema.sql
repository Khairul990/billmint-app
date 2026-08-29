-- ============================================================================
-- BillQyro Phase 2 — Migration 001: Initial Relational Database Schema
-- Architecture Target: Multi-Tenant Enterprise PostgreSQL 16+
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. MIGRATION TRACKING TABLE
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    checksum VARCHAR(64),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CORE ENTITY TABLES
-- ============================================================================

-- 3.1 USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),
    avatar_url TEXT,
    system_role VARCHAR(30) DEFAULT 'user' NOT NULL CHECK (system_role IN ('user', 'superadmin', 'support')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3.2 WORKSPACES (Multi-Tenant Container)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    currency_symbol VARCHAR(10) DEFAULT '₹' NOT NULL,
    country VARCHAR(60) DEFAULT 'India' NOT NULL,
    tax_label VARCHAR(30) DEFAULT 'GSTIN' NOT NULL,
    invoice_prefix VARCHAR(20) DEFAULT 'INV-' NOT NULL,
    next_invoice_number BIGINT DEFAULT 1 NOT NULL CHECK (next_invoice_number >= 1),
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    subscription_tier VARCHAR(30) DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    is_suspended BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

-- 3.3 WORKSPACE MEMBERS (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'biller', 'viewer')),
    permissions JSONB DEFAULT '[]'::jsonb NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- 3.4 CUSTOMERS (Tenant-Scoped with Composite Tenant Key)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(40),
    email VARCHAR(255),
    address TEXT,
    gstin VARCHAR(50),
    opening_due NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (opening_due >= 0),
    current_due NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (current_due >= 0),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    -- Composite unique constraint enables child tables to enforce same-workspace references
    UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_workspace_search ON customers(workspace_id, name, phone) WHERE is_deleted = FALSE;

-- 3.5 PRODUCTS / SERVICES
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    rate NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (rate >= 0),
    unit VARCHAR(30) DEFAULT 'Pcs' NOT NULL,
    tax_rate NUMERIC(6,2) DEFAULT 0.00 NOT NULL CHECK (tax_rate >= 0),
    stock_quantity NUMERIC(14,2) DEFAULT 0.00 NOT NULL,
    min_stock_alert NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (min_stock_alert >= 0),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (workspace_id, name, rate),
    UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_products_workspace ON products(workspace_id) WHERE is_deleted = FALSE;

-- 3.6 INVOICES (Cross-Tenant Referential Integrity Enforced)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invoice_number VARCHAR(80) NOT NULL,
    bill_type VARCHAR(30) DEFAULT 'Invoice' NOT NULL CHECK (bill_type IN ('Invoice', 'Estimate', 'Quotation', 'BillOfSupply')),
    date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(30) DEFAULT 'Unpaid' NOT NULL CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Void')),
    
    -- Monetary Quantities (Stored in fixed 2-decimal numeric precision)
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
    discount_total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
    shipping_charge NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (shipping_charge >= 0),
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (grand_total >= 0),
    amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    balance_due NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (balance_due >= 0),
    
    -- Security, Tokens & Idempotency
    public_token VARCHAR(64) NOT NULL UNIQUE,
    verification_code VARCHAR(32),
    selected_template VARCHAR(60) DEFAULT 'modern' NOT NULL,
    notes TEXT,
    terms TEXT,
    version INTEGER DEFAULT 1 NOT NULL CHECK (version >= 1),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Cross-Tenant Barrier: Invoice can only reference a customer belonging to the SAME workspace
    FOREIGN KEY (customer_id, workspace_id) REFERENCES customers(id, workspace_id) ON DELETE SET NULL,
    UNIQUE (workspace_id, invoice_number, bill_type),
    UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_workspace_date ON invoices(workspace_id, date DESC, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_status ON invoices(workspace_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON invoices(public_token);

-- 3.7 INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL DEFAULT 1 CHECK (sequence_number >= 1),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity NUMERIC(12,3) NOT NULL DEFAULT 1.000 CHECK (quantity >= 0),
    rate NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (rate >= 0),
    tax_percent NUMERIC(6,2) DEFAULT 0.00 NOT NULL CHECK (tax_percent >= 0),
    discount_amount NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (discount_amount >= 0),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id, sequence_number);

-- 3.8 PAYMENTS & RECEIVABLES
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    customer_id UUID,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(40) NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'bKash', 'Nagad', 'Card', 'Cheque', 'Other')),
    transaction_reference VARCHAR(120),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    proof_attachment_key TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (invoice_id, workspace_id) REFERENCES invoices(id, workspace_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id, workspace_id) REFERENCES customers(id, workspace_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_workspace_invoice ON payments(workspace_id, invoice_id);

-- 3.9 PDF DOCUMENTS (Immutable Versioned Cache Registry)
CREATE TABLE IF NOT EXISTS pdf_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    content_hash VARCHAR(64) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) DEFAULT 'application/pdf' NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    engine_used VARCHAR(50) DEFAULT 'worker-pdf-v1' NOT NULL,
    status VARCHAR(30) DEFAULT 'READY' NOT NULL CHECK (status IN ('GENERATING', 'READY', 'FAILED')),
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (invoice_id, workspace_id) REFERENCES invoices(id, workspace_id) ON DELETE CASCADE,
    UNIQUE (invoice_id, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_pdf_lookup ON pdf_documents(invoice_id, content_hash, status);

-- 3.10 SYNC OPERATIONS (Idempotent Offline Mutation Log)
CREATE TABLE IF NOT EXISTS sync_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_tx_id VARCHAR(120) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    doc_id VARCHAR(120) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('save', 'update', 'delete', 'sync')),
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'COMPLETED' NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'CONFLICT', 'DEAD_LETTER')),
    server_version BIGINT NOT NULL DEFAULT 1,
    processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (workspace_id, client_tx_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_ops_workspace_client ON sync_operations(workspace_id, client_tx_id);

-- 3.11 AUDIT LOGS (Immutable Security & Compliance Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_time ON audit_logs(workspace_id, created_at DESC);

-- ============================================================================
-- 4. AUXILIARY BUSINESS STUDIOS TABLES
-- ============================================================================

-- 4.1 EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    notes TEXT,
    receipt_attachment_key TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_workspace_date ON expenses(workspace_id, date DESC);

-- 4.2 INTERNAL BANK LEDGER
CREATE TABLE IF NOT EXISTS bank_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    entry_type VARCHAR(30) NOT NULL CHECK (entry_type IN ('Deposit', 'Withdrawal', 'TransferIn', 'TransferOut', 'Fee')),
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    balance_after NUMERIC(14,2) NOT NULL,
    reference_id VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bank_ledger_workspace ON bank_ledger(workspace_id, created_at DESC);

-- 4.3 STUDENTS (Tuition / Academy Studio)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    roll_number VARCHAR(60),
    course VARCHAR(150),
    monthly_fee NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (monthly_fee >= 0),
    total_due NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (total_due >= 0),
    phone VARCHAR(40),
    parent_phone VARCHAR(40),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_workspace ON students(workspace_id) WHERE is_active = TRUE;

-- 4.4 STAFF (Payroll / Attendance Studio)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(100),
    salary NUMERIC(14,2) DEFAULT 0.00 NOT NULL CHECK (salary >= 0),
    phone VARCHAR(40),
    joined_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_workspace ON staff(workspace_id) WHERE is_active = TRUE;

-- ============================================================================
-- 5. PROCEDURES & CONCURRENCY FUNCTIONS
-- ============================================================================

-- Atomic Invoice Number Generator with Row-Level Lock
CREATE OR REPLACE FUNCTION generate_next_invoice_number(p_workspace_id UUID, p_bill_type VARCHAR DEFAULT 'Invoice')
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR;
    v_next_val BIGINT;
    v_result VARCHAR;
BEGIN
    -- Acquire exclusive row-level lock on the specific workspace record
    SELECT invoice_prefix, next_invoice_number
    INTO v_prefix, v_next_val
    FROM workspaces
    WHERE id = p_workspace_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Workspace % not found', p_workspace_id;
    END IF;

    -- Format invoice number (e.g. INV-0001, EST-0001)
    IF p_bill_type = 'Estimate' OR p_bill_type = 'Quotation' THEN
        v_result := 'EST-' || LPAD(v_next_val::TEXT, 4, '0');
    ELSE
        v_result := v_prefix || LPAD(v_next_val::TEXT, 4, '0');
    END IF;

    -- Increment counter atomically within same transaction
    UPDATE workspaces
    SET next_invoice_number = v_next_val + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_workspace_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Record this migration execution
INSERT INTO schema_migrations (migration_name, checksum)
VALUES ('001_initial_schema.sql', 'sha256_phase2_initial_schema_v1')
ON CONFLICT (migration_name) DO NOTHING;
