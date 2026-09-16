/**
 * Stock Movement Engine
 * Append-only local ledger of every stock change (sales, purchases,
 * adjustments, returns) so shop owners can answer "why is my stock X?".
 *
 * Stored under 'billqyro_stock_movements' — works identically in demo
 * and real mode (audit log stays on-device).
 */

const MOVEMENTS_KEY = 'billqyro_stock_movements';

export const MOVEMENT_TYPES = {
  sale: { label: 'Sale', deltaSign: -1, color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
  'sale-return': { label: 'Sale Return', deltaSign: 1, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  purchase: { label: 'Purchase', deltaSign: 1, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  adjustment: { label: 'Adjustment', deltaSign: 0, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  initial: { label: 'Opening Stock', deltaSign: 0, color: 'text-theme-muted bg-theme-surface border-theme-border-soft' }
};

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

const writeAll = (list) => {
  try {
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(list));
  } catch (e) { /* storage full/unavailable — audit log is best-effort */ }
};

export const stockEngine = {
  getMovements(limit = 200) {
    return readAll()
      .slice()
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, limit);
  },

  getMovementsForProduct(productId, limit = 50) {
    return readAll()
      .filter(m => m.productId === productId)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, limit);
  },

  /**
   * @param {{productId:string, productName:string, delta:number, type:string,
   *          qtyAfter?:number, reason?:string, refId?:string, refNumber?:string, date?:string}} m
   */
  recordMovement(m) {
    if (!m || !m.productId || !Number.isFinite(parseFloat(m.delta))) return null;
    const list = readAll();
    const entry = {
      id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      productId: m.productId,
      productName: m.productName || '',
      delta: Math.round((parseFloat(m.delta) + Number.EPSILON) * 100) / 100,
      type: MOVEMENT_TYPES[m.type] ? m.type : 'adjustment',
      qtyAfter: (m.qtyAfter !== undefined && m.qtyAfter !== null) ? m.qtyAfter : null,
      reason: m.reason || '',
      refId: m.refId || '',
      refNumber: m.refNumber || '',
      date: m.date || new Date().toISOString()
    };
    list.push(entry);
    // Keep the log bounded (most recent 1000 entries)
    if (list.length > 1000) {
      const keep = list.slice(list.length - 1000);
      writeAll(keep);
    } else {
      writeAll(list);
    }
    return entry;
  },

  clearMovements() {
    writeAll([]);
  }
};
