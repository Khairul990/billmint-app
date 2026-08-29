-- ============================================================================
-- Migration: 002_payment_indexes.sql
-- Description: Composite payment index for efficient workspace date-ordered listing
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payments_date_order 
ON payments(workspace_id, payment_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_lookup 
ON audit_logs(workspace_id, action, created_at DESC);
