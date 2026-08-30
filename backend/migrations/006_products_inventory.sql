-- ============================================================================
-- Migration: 006_products_inventory.sql
-- Description: Indexes for Products search and low-stock queries.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_workspace_search 
ON products(workspace_id, name, sku) 
WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_products_low_stock 
ON products(workspace_id, stock_quantity, min_stock_alert) 
WHERE is_deleted = FALSE;
