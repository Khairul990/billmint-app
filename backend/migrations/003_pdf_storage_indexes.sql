-- ============================================================================
-- Migration: 003_pdf_storage_indexes.sql
-- Description: Adds byte_hash, generation_started_at, and lookup indexes for pdf_documents
-- ============================================================================

ALTER TABLE pdf_documents 
ADD COLUMN IF NOT EXISTS byte_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_pdf_documents_workspace_lookup 
ON pdf_documents(workspace_id, invoice_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_pdf_documents_stale_recovery 
ON pdf_documents(status, generation_started_at);
