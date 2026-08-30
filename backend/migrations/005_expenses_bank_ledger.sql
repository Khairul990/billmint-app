-- ============================================================================
-- Migration: 005_expenses_bank_ledger.sql
-- Description: Creates expenses and bank_ledger_entries tables
-- Enforces multi-tenant workspace isolation and NUMERIC(14,2) precision.
-- ============================================================================

-- 1. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_expenses_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_workspace_lookup 
ON expenses(workspace_id, is_deleted, date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category 
ON expenses(workspace_id, category);

-- 2. Bank Ledger Entries Table
CREATE TABLE IF NOT EXISTS bank_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Income', 'Expense')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_bank_ledger_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_bank_ledger_workspace_lookup 
ON bank_ledger_entries(workspace_id, is_deleted, date DESC);

CREATE INDEX IF NOT EXISTS idx_bank_ledger_type 
ON bank_ledger_entries(workspace_id, type);
