-- ============================================================================
-- Migration: 009_backfill_jobs.sql
-- Description: Creates backfill_jobs table for safe, resumable historical data migration.
-- ============================================================================

CREATE TABLE IF NOT EXISTS backfill_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED')),
    current_stage VARCHAR(50) DEFAULT 'customers' NOT NULL,
    checkpoint_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    stats JSONB DEFAULT '{"processed":0,"succeeded":0,"failed":0,"skipped":0}'::jsonb NOT NULL,
    error_log JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_backfill_jobs_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_backfill_jobs_workspace 
ON backfill_jobs(workspace_id, created_at DESC);
