import { query } from '../../db/pool.js';

export class ProductRepository {
  static async create({ workspaceId, name, sku, description, rate, unit, taxRate, stockQuantity, minStockAlert }) {
    const res = await query(
      `INSERT INTO products (
         workspace_id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, workspace_id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert, is_deleted, created_at, updated_at`,
      [workspaceId, name, sku || null, description || null, rate, unit, taxRate, stockQuantity, minStockAlert]
    );
    const row = res.rows[0];
    return {
      ...row,
      rate: parseFloat(row.rate),
      tax_rate: parseFloat(row.tax_rate),
      stock_quantity: parseFloat(row.stock_quantity),
      min_stock_alert: parseFloat(row.min_stock_alert),
      is_low_stock: parseFloat(row.stock_quantity) <= parseFloat(row.min_stock_alert)
    };
  }

  static async list({ workspaceId, search = null, sku = null, lowStock = false, limit = 25, offset = 0 }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        id, 
        workspace_id, 
        name, 
        sku, 
        description, 
        rate, 
        unit, 
        tax_rate, 
        stock_quantity, 
        min_stock_alert, 
        is_deleted, 
        created_at, 
        updated_at,
        COUNT(*) OVER() AS full_count
      FROM products
      WHERE workspace_id = $1 AND is_deleted = FALSE
    `;

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
    }

    if (sku) {
      params.push(sku);
      sql += ` AND sku = $${params.length}`;
    }

    if (lowStock) {
      sql += ` AND stock_quantity <= min_stock_alert`;
    }

    params.push(limit);
    sql += ` ORDER BY name ASC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...prod } = row;
      return {
        ...prod,
        rate: parseFloat(prod.rate),
        tax_rate: parseFloat(prod.tax_rate),
        stock_quantity: parseFloat(prod.stock_quantity),
        min_stock_alert: parseFloat(prod.min_stock_alert),
        is_low_stock: parseFloat(prod.stock_quantity) <= parseFloat(prod.min_stock_alert)
      };
    });

    return {
      items,
      total
    };
  }

  static async findById(workspaceId, productId) {
    const res = await query(
      `SELECT id, workspace_id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert, is_deleted, created_at, updated_at
       FROM products
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       LIMIT 1`,
      [productId, workspaceId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      rate: parseFloat(row.rate),
      tax_rate: parseFloat(row.tax_rate),
      stock_quantity: parseFloat(row.stock_quantity),
      min_stock_alert: parseFloat(row.min_stock_alert),
      is_low_stock: parseFloat(row.stock_quantity) <= parseFloat(row.min_stock_alert)
    };
  }

  static async update(workspaceId, productId, updates = {}) {
    const fieldMap = {
      name: 'name',
      sku: 'sku',
      description: 'description',
      rate: 'rate',
      unit: 'unit',
      taxRate: 'tax_rate',
      stockQuantity: 'stock_quantity',
      minStockAlert: 'min_stock_alert'
    };

    const keys = Object.keys(updates).filter(k => fieldMap[k] !== undefined);
    if (keys.length === 0) {
      return await this.findById(workspaceId, productId);
    }

    const setClauses = [];
    const params = [productId, workspaceId];

    keys.forEach(k => {
      params.push(updates[k]);
      setClauses.push(`${fieldMap[k]} = $${params.length}`);
    });

    setClauses.push('updated_at = NOW()');

    const sql = `
      UPDATE products
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
      RETURNING id, workspace_id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert, is_deleted, created_at, updated_at
    `;

    const res = await query(sql, params);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      ...row,
      rate: parseFloat(row.rate),
      tax_rate: parseFloat(row.tax_rate),
      stock_quantity: parseFloat(row.stock_quantity),
      min_stock_alert: parseFloat(row.min_stock_alert),
      is_low_stock: parseFloat(row.stock_quantity) <= parseFloat(row.min_stock_alert)
    };
  }

  static async softDelete(workspaceId, productId) {
    const res = await query(
      `UPDATE products
       SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       RETURNING id`,
      [productId, workspaceId]
    );
    return res.rows.length > 0;
  }
}
