import { query } from '../../db/pool.js';

export class SyncRepository {
  static async findOperation(workspaceId, clientTxId) {
    const res = await query(
      `SELECT id, workspace_id, user_id, client_tx_id, entity_type, doc_id, action, status, server_version, processed_at
       FROM sync_operations
       WHERE workspace_id = $1 AND client_tx_id = $2
       LIMIT 1`,
      [workspaceId, clientTxId]
    );
    return res.rows[0] || null;
  }

  static async recordOperation({ workspaceId, userId, clientTxId, entityType, docId, action, payload, status = 'COMPLETED', serverVersion = 1 }) {
    const res = await query(
      `INSERT INTO sync_operations (
         workspace_id, user_id, client_tx_id, entity_type, doc_id, action, payload, status, server_version
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (workspace_id, client_tx_id) 
       DO UPDATE SET status = EXCLUDED.status, server_version = EXCLUDED.server_version
       RETURNING id, workspace_id, client_tx_id, entity_type, doc_id, action, status, server_version, processed_at`,
      [workspaceId, userId, clientTxId, entityType, docId, action.toLowerCase(), JSON.stringify(payload), status, serverVersion]
    );
    return res.rows[0];
  }

  /**
   * Apply entity mutation inside workspace boundary
   */
  static async applyEntityMutation(workspaceId, userId, op) {
    const { entityType, docId, action, payload } = op;

    switch (entityType) {
      case 'customers': {
        if (action === 'CREATE') {
          await query(
            `INSERT INTO customers (workspace_id, name, phone, email, billing_address, gstin)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (workspace_id, name, phone) DO NOTHING`,
            [workspaceId, payload.name || 'Unnamed Customer', payload.phone || '0000000000', payload.email || null, payload.billingAddress || null, payload.gstin || null]
          );
        } else if (action === 'UPDATE') {
          await query(
            `UPDATE customers 
             SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), updated_at = NOW()
             WHERE (id::text = $4 OR phone = $4) AND workspace_id = $5 AND is_deleted = FALSE`,
            [payload.name, payload.phone, payload.email, docId, workspaceId]
          );
        } else if (action === 'DELETE') {
          await query(
            `UPDATE customers SET is_deleted = TRUE, updated_at = NOW()
             WHERE (id::text = $1 OR phone = $1) AND workspace_id = $2`,
            [docId, workspaceId]
          );
        }
        break;
      }

      case 'products': {
        if (action === 'CREATE') {
          await query(
            `INSERT INTO products (workspace_id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (workspace_id, name, rate) DO NOTHING`,
            [workspaceId, payload.name || 'Unnamed Product', payload.sku || null, payload.description || null, payload.rate || 0, payload.unit || 'Pcs', payload.taxRate || 0, payload.stockQuantity || 0, payload.minStockAlert || 0]
          );
        } else if (action === 'UPDATE') {
          await query(
            `UPDATE products 
             SET name = COALESCE($1, name), rate = COALESCE($2, rate), stock_quantity = COALESCE($3, stock_quantity), updated_at = NOW()
             WHERE (id::text = $4 OR sku = $4) AND workspace_id = $5 AND is_deleted = FALSE`,
            [payload.name, payload.rate, payload.stockQuantity, docId, workspaceId]
          );
        } else if (action === 'DELETE') {
          await query(
            `UPDATE products SET is_deleted = TRUE, updated_at = NOW()
             WHERE (id::text = $1 OR sku = $1) AND workspace_id = $2`,
            [docId, workspaceId]
          );
        }
        break;
      }

      case 'expenses': {
        if (action === 'CREATE') {
          await query(
            `INSERT INTO expenses (workspace_id, amount, category, description, date)
             VALUES ($1, $2, $3, $4, $5)`,
            [workspaceId, payload.amount || 0, payload.category || 'General', payload.description || null, payload.date || new Date().toISOString().slice(0, 10)]
          );
        }
        break;
      }

      case 'bankLedger': {
        if (action === 'CREATE') {
          await query(
            `INSERT INTO bank_ledger_entries (workspace_id, type, amount, description, date)
             VALUES ($1, $2, $3, $4, $5)`,
            [workspaceId, payload.type || 'Income', payload.amount || 0, payload.description || 'Sync Deposit', payload.date || new Date().toISOString().slice(0, 10)]
          );
        }
        break;
      }

      default:
        // Other entities pass through gracefully
        break;
    }
  }
}
