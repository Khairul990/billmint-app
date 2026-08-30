-- ============================================================================
-- Migration: 007_notifications.sql
-- Description: Creates notifications table for workspace event tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PAYMENT_RECEIVED', 'INVOICE_OVERDUE', 'LOW_STOCK', 'OUTSOURCE_COMPLETED', 'SYSTEM')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(120),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_notifications_id_ws UNIQUE (id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace_user 
ON notifications(workspace_id, user_id, is_read, created_at DESC);
