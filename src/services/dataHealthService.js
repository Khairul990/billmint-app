/**
 * Data health + backup cadence (Phase 24).
 *
 * 1. runDataHealthCheck — fast local integrity scan over the workspace:
 *    invoice math (canonical totals), orphan customer refs, duplicate invoice
 *    numbers, negative stock, negative balances. Produces a 0–100 score.
 * 2. Backup reminder cadence — the app nudges the user to take a backup at
 *    most once a month when their last backup is older than 30 days (and
 *    they actually have data worth protecting).
 */

const HEALTH_KEY = 'billqyro_last_health_check';
const BACKUP_REMIND_PREFIX = 'billqyro_backup_reminder_';

const monthStamp = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/** Canonical invoice total from line items (mirrors invoiceMath). */
const lineSubtotal = (items) =>
  (Array.isArray(items) ? items : []).reduce((sum, it) => {
    const qty = parseFloat(it.qty ?? it.quantity) || 0;
    const rate = parseFloat(it.rate ?? it.price) || 0;
    return sum + qty * rate;
  }, 0);

export const runDataHealthCheck = ({ invoices = [], customers = [], products = [], expenses = [] } = {}) => {
  const issues = [];
  const customerIds = new Set(customers.map((c) => c.id));

  // 1. Invoice math integrity
  let mathMismatch = 0, overpaid = 0, negativeBalance = 0;
  for (const inv of invoices) {
    const items = Array.isArray(inv.items) ? inv.items : [];
    const canonicalSubtotal = lineSubtotal(items);
    const storedSubtotal = parseFloat(inv.subtotal ?? inv.total ?? canonicalSubtotal) || 0;
    if (items.length && Math.abs(canonicalSubtotal - storedSubtotal) > 1) mathMismatch++;
    const paid = parseFloat(inv.amountPaid) || 0;
    const total = parseFloat(inv.grandTotal ?? storedSubtotal) || 0;
    if (paid > total + 1) overpaid++;
    if (parseFloat(inv.balanceDue) < 0) negativeBalance++;
  }
  if (mathMismatch) issues.push({ type: 'math', severity: 'high', count: mathMismatch, message: `${mathMismatch} ইনভয়েসে আইটেম-যোগফলের সাথে সাবটোটাল মিলছে না` });
  if (overpaid) issues.push({ type: 'overpaid', severity: 'medium', count: overpaid, message: `${overpaid} ইনভয়েসে মোটের চেয়ে বেশি টাকা পেইড দেখাচ্ছে` });
  if (negativeBalance) issues.push({ type: 'negative-balance', severity: 'medium', count: negativeBalance, message: `${negativeBalance} ইনভয়েসে নেগেটিভ ব্যালান্স আছে` });

  // 2. Orphan references
  const orphans = invoices.filter((inv) => inv.customerId && !customerIds.has(inv.customerId)).length;
  if (orphans) issues.push({ type: 'orphan', severity: 'medium', count: orphans, message: `${orphans} ইনভয়েসে এমন কাস্টমার যার প্রোফাইল খুঁজে পাওয়া যায়নি` });

  // 3. Duplicate invoice numbers
  const seen = new Map();
  let duplicates = 0;
  for (const inv of invoices) {
    if (!inv.invoiceNumber) continue;
    if (seen.has(inv.invoiceNumber)) duplicates++;
    else seen.set(inv.invoiceNumber, true);
  }
  if (duplicates) issues.push({ type: 'duplicate-number', severity: 'low', count: duplicates, message: `${duplicates} ডুপ্লিকেট ইনভয়েস নম্বর` });

  // 4. Negative stock
  const negativeStock = products.filter((p) => (parseFloat(p.stockQty) || 0) < 0).length;
  if (negativeStock) issues.push({ type: 'stock', severity: 'low', count: negativeStock, message: `${negativeStock} প্রোডাক্টের স্টক নেগেটিভ` });

  const totalRecords = invoices.length + customers.length + products.length + expenses.length;
  const penalty = issues.reduce((sum, i) => sum + i.count * (i.severity === 'high' ? 4 : i.severity === 'medium' ? 2 : 1), 0);
  const score = Math.max(0, 100 - penalty);

  const result = {
    ranAt: new Date().toISOString(),
    score,
    status: score >= 95 ? 'healthy' : score >= 80 ? 'attention' : 'critical',
    issues,
    counts: { invoices: invoices.length, customers: customers.length, products: products.length, expenses: expenses.length, totalRecords }
  };
  try { localStorage.setItem(HEALTH_KEY, JSON.stringify(result)); } catch { /* ignore */ }
  return result;
};

export const getLastHealthCheck = () => {
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

/**
 * Monthly backup nudge. Returns null when no reminder is due:
 *  - fewer than 10 records (nothing worth nagging about yet), or
 *  - last backup is < 30 days old, or
 *  - already dismissed this calendar month.
 */
export const evaluateBackupReminder = ({ invoices = [], customers = [], products = [] } = {}) => {
  const records = invoices.length + customers.length + products.length;
  if (records < 10) return null;

  let daysSince = null;
  try {
    const last = localStorage.getItem('last_backup_date');
    if (last && last !== 'Never') {
      daysSince = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
    }
  } catch { /* ignore */ }
  const needsBackup = daysSince === null || daysSince >= 30;
  if (!needsBackup) return null;

  const dismissedKey = BACKUP_REMIND_PREFIX + monthStamp();
  try { if (localStorage.getItem(dismissedKey) === '1') return null; } catch { /* ignore */ }

  return { daysSince, records, dismissedKey };
};

export const markBackupReminderDismissed = () => {
  try { localStorage.setItem(BACKUP_REMIND_PREFIX + monthStamp(), '1'); } catch { /* ignore */ }
};
