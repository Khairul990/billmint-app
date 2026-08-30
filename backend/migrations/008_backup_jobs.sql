-- ============================================================================
-- Migration: 008_backup_jobs.sql
-- Description: Creates backup_jobs table for workspace data exports.
-- ============================================================================

CREATE TABLE IF NOT EXISTS backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'READY', 'FAILED')),
    storage_key VARCHAR(255),
    file_size_bytes BIGINT DEFAULT 0,
    content_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    CONSTRAINT uq_backup_jobs_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_workspace 
ON backup_jobs(workspace_id, created_at DESC);
