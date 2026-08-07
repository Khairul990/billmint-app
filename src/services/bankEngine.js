/**
 * BillQyro Internal Bank / Credit & Ledger Engine
 *
 * Additive module. Reuses the existing BillQyro persistence & sync architecture:
 *  - IndexedDB (`bankLedger`/`bankCredit` stores) is the browser source of truth,
 *    exactly like invoices/customers. A scoped localStorage cache mirrors the
 *    active workspace for fast reads and offline fallback.
 *  - Writes are pushed to Firestore through dbEngine.queueSyncTransaction
 *    (the existing offline queue) -> subcollections bankLedger/{userId}/items,
 *    bankCredit/{userId}/items, bankMeta/{userId}/items/settings.
 *  - Cloud pull uses the same per-id cloudWins (version -> timestamp) merge used
 *    by syncFromFirestore, so newer local data is never overwritten by stale
 *    cloud data and pending offline entries always survive a pull.
 *
 * All money is represented as integer PAISE (minor units) to avoid float errors.
 */
import { formatCurrency } from '../utils/invoiceUtils.js';
import { BillQyroDB } from './localDb.js';

const loadDb = () => import('./dbEngine.js');

const BASE_KEYS = {
  bankLedger: 'billqyro_bank_ledger',
  bankCredit: 'billqyro_bank_credit',
  bankSettings: 'billqyro_bank_settings'
};

// Money unit conversion helpers
export const rupeesToPaise = (rupees) => Math.round((Number(rupees) || 0) * 100);
export const paiseToRupees = (paise) => (Number(paise) || 0) / 100;

export const BANK_CATEGORIES = {
  moneyIn: [
    'Sale / Invoice Payment',
    'Credit Collection',
    'Bank Loan / Advance',
    'Owner Investment',
    'Other Income'
  ],
  moneyOut: [
    'Purchase / Stock',
    'Salary / Wages',
    'Expense',
    'Credit Sale (Customer)',
    'Withdrawal',
    'Other Expense'
  ]
};

/**
 * Canonical BillQyro conflict resolution (mirrors dbEngine.cloudWins):
 * higher __version wins; on tie, later updatedAt/createdAt wins.
 */
export const bankCloudWins = (localRecord, cloudRecord) => {
  if (!localRecord) return true;
  if (!cloudRecord) return false;
  const localVer = localRecord.__version || 0;
  const cloudVer = cloudRecord.__version || 0;
  if (cloudVer > localVer) return true;
  if (cloudVer < localVer) return false;
  const localTime = new Date(localRecord.updatedAt || localRecord.createdAt || 0).getTime();
  const cloudTime = new Date(cloudRecord.updatedAt || cloudRecord.createdAt || 0).getTime();
  return cloudTime > localTime;
};

/**
 * Deterministic per-id merge of local + cloud bank items. Local items not in
 * cloud are preserved (offline work never disappears). Duplicates by id collapse.
 * Cloud winners are marked 'synced'; local winners keep their own syncStatus
 * (so still-pending entries remain pending and get pushed).
 */
export const mergeBankItems = (localItems, cloudItems) => {
  const map = new Map();
  for (const l of localItems || []) {
    if (l && l.id) map.set(l.id, l);
  }
  for (const c of cloudItems || []) {
    if (!c || !c.id) continue;
    const l = map.get(c.id);
    const winner = bankCloudWins(l, c) ? c : l;
    map.set(c.id, winner ? { ...winner, syncStatus: winner === c ? 'synced' : winner.syncStatus } : c);
  }
  return Array.from(map.values());
};

class BankEngine {
  constructor() {
    this._lastSyncTime = 0;
  }

  _deviceId() {
    try {
      let id = localStorage.getItem('billqyro_device_id');
      if (!id) {
        id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('billqyro_device_id', id);
      }
      return id;
    } catch {
      return 'dev-unknown';
    }
  }

  _isDemo() {
    try {
      return localStorage.getItem('billqyro_demo_session_active') === 'true';
    } catch {
      return false;
    }
  }

  async _getScope() {
    const db = await loadDb().catch(() => null);
    let uid = 'local-user';
    let ws = 'default';
    if (db && db.getRealUserId) {
      try { uid = db.getRealUserId() || 'local-user'; } catch { /* keep default */ }
    }
    try {
      const settingsStr = localStorage.getItem(uid && uid !== 'local-user' ? `billqyro_settings_${uid}` : 'billqyro_settings');
      const s = settingsStr ? JSON.parse(settingsStr) : null;
      ws = (s && s.activeWorkspaceId) || 'default';
    } catch { /* keep default */ }
    return { uid, ws };
  }

  async _cacheKey(store) {
    const base = BASE_KEYS[store];
    const demo = this._demoKey(store);
    if (demo) return demo;
    try {
      const db = await loadDb();
      if (db && db.getScopedKey) return db.getScopedKey(base);
    } catch { /* fall back below */ }
    const scope = await this._getScope();
    return `${base}_${scope.uid}_${scope.ws}`;
  }

  _demoKey(store) {
    if (!this._isDemo()) return null;
    return {
      bankLedger: 'billqyro_demo_bank_ledger',
      bankCredit: 'billqyro_demo_bank_credit',
      bankSettings: 'billqyro_demo_bank_settings'
    }[store] || null;
  }

  async _readCache(store) {
    const key = await this._cacheKey(store);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async _writeCache(store, items) {
    const key = await this._cacheKey(store);
    try {
      localStorage.setItem(key, JSON.stringify(items || []));
    } catch (e) {
      console.warn('[BANK] Failed to write cache', store, e);
    }
  }

  _scoped(items, scope) {
    return (items || []).filter((it) => (
      it && (!it.userId || it.userId === scope.uid) && (!it.workspaceId || it.workspaceId === scope.ws)
    ));
  }

  /**
   * Read a collection. In the browser, IndexedDB is the source of truth; the
   * scoped localStorage cache is mirrored fresh on every read so real-time cloud
   * updates written directly to IndexedDB are never lost. Falls back to cache
   * when IndexedDB is unavailable (offline/Node tests) or empty (migration).
   */
  async _readStore(store, scoped = true) {
    const scope = await this._getScope();
    if (typeof indexedDB !== 'undefined' && !this._demoKey(store)) {
      try {
        let items = await BillQyroDB.getAll(store);
        if (!items || items.length === 0) {
          const cached = await this._readCache(store);
          if (cached.length) {
            await this._putAll(store, cached);
            items = cached;
          }
        }
        if (scoped) {
          items = this._scoped(items, scope);
          await this._writeCache(store, items);
        }
        return items;
      } catch (e) {
        console.warn('[BANK] IndexedDB read failed, falling back to cache:', e);
      }
    }
    let items = await this._readCache(store);
    return scoped ? this._scoped(items, scope) : items;
  }

  async _putAll(store, items) {
    if (this._demoKey(store)) return;
    if (typeof indexedDB === 'undefined') return;
    try {
      for (const it of items || []) {
        if (it && it.id) await BillQyroDB.put(store, it);
      }
    } catch (e) {
      console.warn('[BANK] IndexedDB write failed:', e);
    }
  }

  /** Persist items: update scoped cache + upsert into IndexedDB (preserves other workspaces). */
  async _writeStore(store, items) {
    const scope = await this._getScope();
    await this._writeCache(store, this._scoped(items, scope));
    await this._putAll(store, items);
    return items;
  }

  _bump(record, scope) {
    const now = new Date().toISOString();
    return {
      ...record,
      __version: (Number(record.__version) || 0) + 1,
      updatedAt: now,
      updatedByDeviceId: this._deviceId(),
      source: record.source || 'localUserAction',
      userId: record.userId || scope.uid,
      workspaceId: record.workspaceId || scope.ws,
      syncStatus: 'pending'
    };
  }

  async _push(store, id, data) {
    if (this._isDemo()) return;
    try {
      const db = await loadDb();
      if (db && db.queueSyncTransaction) {
        await db.queueSyncTransaction('save', store, id, data);
      }
    } catch (e) {
      console.warn('[BANK] Push to sync queue failed:', e);
    }
  }

  // ------------------------------------------------------------------ Settings

  async _getBankSettings() {
    const key = await this._cacheKey('bankSettings');
    let s = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) s = JSON.parse(raw);
    } catch { /* keep defaults */ }
    return s || {
      label: 'Internal Bank',
      currencySymbol: 'Rs.',
      startingBalancePaise: 0,
      defaultAccount: '',
      allowNegativeBalance: false,
      autoPostPayments: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async _writeSettings(settings) {
    const key = await this._cacheKey('bankSettings');
    try {
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (e) {
      console.warn('[BANK] Failed to write bank settings:', e);
    }
  }

  async getBankSettings() {
    return this._getBankSettings();
  }

  async saveBankSettings(patch) {
    const scope = await this._getScope();
    const current = await this._getBankSettings();
    const next = this._bump({
      ...current,
      ...patch,
      startingBalancePaise: rupeesToPaise(
        patch.startingBalanceRupees !== undefined
          ? patch.startingBalanceRupees
          : paiseToRupees(current.startingBalancePaise)
      )
    }, scope);
    await this._writeSettings(next);
    await this._push('bankMeta', 'settings', next);
    window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    return next;
  }

  // ------------------------------------------------------------------- Ledger

  async _getLedger() {
    return this._readStore('bankLedger', true);
  }

  async _getCredit() {
    return this._readStore('bankCredit', true);
  }

  _computeBalance(settings, ledger) {
    const starting = settings?.startingBalancePaise || 0;
    return ledger.reduce((sum, t) => {
      if (t.reversed) return sum;
      if (t.type === 'moneyIn') return sum + (t.amountPaise || 0);
      // A credit-sale money-out increases receivables (AR), not cash outflow.
      if (t.entryType === 'credit_sale') return sum;
      return sum - (t.amountPaise || 0);
    }, starting);
  }

  _computeTotals(ledger, from = null, to = null) {
    let totalIn = 0, totalOut = 0, todayIn = 0, todayOut = 0, count = 0;
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    ledger.forEach((t) => {
      if (t.reversed) return;
      const d = new Date(t.date);
      if (from && d < from) return;
      if (to && d > to) return;
      count++;
      if (t.type === 'moneyIn') {
        totalIn += t.amountPaise;
        if (t.date.slice(0, 10) === todayKey) todayIn += t.amountPaise;
      } else {
        totalOut += t.amountPaise;
        if (t.date.slice(0, 10) === todayKey) todayOut += t.amountPaise;
      }
    });
    return { totalIn, totalOut, todayIn, todayOut, count };
  }

  async getState() {
    const [settings, ledger, credit] = await Promise.all([this._getBankSettings(), this._getLedger(), this._getCredit()]);
    const totals = this._computeTotals(ledger);
    return {
      settings,
      ledger,
      credit,
      totals,
      balancePaise: this._computeBalance(settings, ledger),
      allowNegativeBalance: !!settings.allowNegativeBalance
    };
  }

  /**
   * Add a ledger transaction.
   * params: { type: 'moneyIn'|'moneyOut', amountRupees, category, title, account,
   *   customerId?, customerName?, invoiceId?, invoiceNumber?, entryType?,
   *   source?, sourceRefId?, note?, date? }
   */
  async addTransaction(params = {}) {
    const scope = await this._getScope();
    const [settings, ledger] = [await this._getBankSettings(), await this._getLedger()];
    const amount = rupeesToPaise(params.amountRupees);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be greater than zero.');
    }
    if (params.type !== 'moneyIn' && params.type !== 'moneyOut') {
      throw new Error('Invalid transaction type.');
    }

    const date = params.date ? new Date(params.date) : new Date();
    if (isNaN(date.getTime())) throw new Error('Invalid date.');

    // Balance invariant (cash). Credit-sale entries are receivables, not cash outflow.
    if (params.type === 'moneyOut' && !settings.allowNegativeBalance && params.entryType !== 'credit_sale') {
      const balance = this._computeBalance(settings, ledger);
      if (balance - amount < 0) {
        throw new Error('Insufficient balance. Enable "Allow negative balance" in Bank settings or record a smaller amount.');
      }
    }

    // Credit-sale limit invariant
    if (params.entryType === 'credit_sale' && params.customerId) {
      const credit = await this._getCredit();
      const profile = credit.find((c) => c.id === params.customerId);
      if (profile && profile.creditLimitPaise > 0) {
        const outstanding = this._getCustomerOutstandingByLedger(ledger, params.customerId);
        if (outstanding + amount > profile.creditLimitPaise) {
          throw new Error('This credit sale would exceed the customer credit limit.');
        }
      } else if (profile && profile.creditLimitPaise === 0) {
        throw new Error('Customer credit limit is zero. Set a limit first.');
      }
    }

    const entry = this._bump({
      id: 'bntx_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8),
      type: params.type,
      amountPaise: amount,
      category: params.category || (params.type === 'moneyIn' ? 'Other Income' : 'Other Expense'),
      title: params.title || '',
      account: params.account || settings.defaultAccount || '',
      customerId: params.customerId || null,
      customerName: params.customerName || '',
      invoiceId: params.invoiceId || null,
      invoiceNumber: params.invoiceNumber || '',
      entryType: params.entryType || (params.type === 'moneyOut' && params.category === 'Credit Sale (Customer)' ? 'credit_sale' : 'manual'),
      source: params.source || 'manual',
      sourceRefId: params.sourceRefId || null,
      note: params.note || '',
      date: date.toISOString(),
      reversed: false,
      reversedAt: null,
      reversalOfId: null,
      createdBy: scope.uid,
      createdAt: new Date().toISOString()
    }, scope);

    ledger.push(entry);
    await this._writeStore('bankLedger', ledger);
    await this._push('bankLedger', entry.id, entry);

    try {
      const db = await loadDb();
      if (db && db.logAudit) await db.logAudit('bank_transaction_created', 'bankLedger', entry.id, null, { type: entry.type, amountPaise: entry.amountPaise, category: entry.category });
    } catch (e) {
      console.warn('[BANK] audit failed', e);
    }

    window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    return entry;
  }

  async reverseTransaction(id, reason = '') {
    const scope = await this._getScope();
    const ledger = await this._getLedger();
    const idx = ledger.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Transaction not found.');
    if (ledger[idx].reversed) throw new Error('Transaction is already reversed.');
    ledger[idx] = this._bump({
      ...ledger[idx],
      reversed: true,
      reversedAt: new Date().toISOString(),
      reversalOfId: id,
      note: reason ? `${ledger[idx].note} [Reversed: ${reason}]`.trim() : ledger[idx].note
    }, scope);
    await this._writeStore('bankLedger', ledger);
    await this._push('bankLedger', id, ledger[idx]);
    try {
      const db = await loadDb();
      if (db && db.logAudit) await db.logAudit('bank_transaction_reversed', 'bankLedger', id, null, { reason });
    } catch (e) {
      console.warn('[BANK] reverse audit failed', e);
    }
    window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    return ledger[idx];
  }

  async editTransaction(id, patch = {}) {
    const scope = await this._getScope();
    const ledger = await this._getLedger();
    const idx = ledger.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Transaction not found.');
    if (ledger[idx].reversed) throw new Error('Reversed transactions cannot be edited.');

    const amountRupees = patch.amountRupees;
    const amountPaise = amountRupees !== undefined ? rupeesToPaise(amountRupees) : ledger[idx].amountPaise;
    if (amountRupees !== undefined && (!Number.isFinite(amountPaise) || amountPaise <= 0)) {
      throw new Error('Amount must be greater than zero.');
    }

    ledger[idx] = this._bump({
      ...ledger[idx],
      ...patch,
      amountPaise,
      note: patch.note !== undefined ? patch.note : ledger[idx].note
    }, scope);
    await this._writeStore('bankLedger', ledger);
    await this._push('bankLedger', id, ledger[idx]);
    try {
      const db = await loadDb();
      if (db && db.logAudit) await db.logAudit('bank_transaction_updated', 'bankLedger', id, null, ledger[idx]);
    } catch (e) {
      console.warn('[BANK] edit audit failed', e);
    }
    window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    return ledger[idx];
  }

  _getCustomerOutstandingByLedger(ledger, customerId) {
    return ledger.reduce((sum, t) => {
      if (t.customerId !== customerId || t.reversed) return sum;
      if (t.entryType === 'credit_sale') return sum + (t.amountPaise || 0);
      if (t.entryType === 'credit_collection') return sum - (t.amountPaise || 0);
      return sum;
    }, 0);
  }

  async getCustomerOutstanding(customerId) {
    const ledger = await this._getLedger();
    return this._getCustomerOutstandingByLedger(ledger, customerId);
  }

  // ------------------------------------------------------------------- Credit

  async setCreditProfile(customerId, customerName, creditLimitRupees) {
    const scope = await this._getScope();
    const credit = await this._getCredit();
    const limitPaise = rupeesToPaise(creditLimitRupees);
    if (!Number.isFinite(limitPaise) || limitPaise < 0) throw new Error('Credit limit must be zero or more.');
    const idx = credit.findIndex((c) => c.id === customerId);
    const entry = this._bump({
      id: customerId,
      customerName: customerName || '',
      creditLimitPaise: limitPaise
    }, scope);
    if (idx === -1) credit.push(entry); else credit[idx] = entry;
    await this._writeStore('bankCredit', credit);
    await this._push('bankCredit', customerId, entry);
    try {
      const db = await loadDb();
      if (db && db.logAudit) await db.logAudit('bank_credit_limit_set', 'bankCredit', customerId, null, { creditLimitPaise: limitPaise });
    } catch (e) {
      console.warn('[BANK] credit audit failed', e);
    }
    window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    return entry;
  }

  async getCreditProfiles() {
    const credit = await this._getCredit();
    const ledger = await this._getLedger();
    return credit.map((profile) => {
      const outstanding = this._getCustomerOutstandingByLedger(ledger, profile.id);
      return {
        ...profile,
        outstandingPaise: outstanding,
        remainingPaise: Math.max(0, profile.creditLimitPaise - outstanding),
        overLimit: profile.creditLimitPaise > 0 && outstanding > profile.creditLimitPaise
      };
    });
  }

  // --------------------------------------------------------------- Auto-post

  /**
   * Idempotent auto money-in from an invoice payment.
   * Dedupes on source + sourceRefId so repeated calls never double-post.
   */
  async autoPostPayment(paymentInfo = {}) {
    const settings = await this._getBankSettings();
    if (settings.autoPostPayments === false) return null;
    const refId = paymentInfo.id || paymentInfo.sourceRefId;
    if (!refId) return null;
    const ledger = await this._getLedger();
    const existing = ledger.find((t) => t.source === 'invoice_payment' && t.sourceRefId === refId && !t.reversed);
    if (existing) return existing;

    const amount = Number(paymentInfo.amountPaise !== undefined ? paymentInfo.amountPaise : rupeesToPaise(paymentInfo.amount));
    if (!Number.isFinite(amount) || amount <= 0) return null;

    return this.addTransaction({
      type: 'moneyIn',
      amountRupees: paiseToRupees(amount),
      category: 'Sale / Invoice Payment',
      title: (paymentInfo.invoiceNumber ? `Invoice ${paymentInfo.invoiceNumber}` : 'Invoice payment') + (paymentInfo.customerName ? ` · ${paymentInfo.customerName}` : ''),
      account: paymentInfo.account || settings.defaultAccount || '',
      customerId: paymentInfo.customerId || null,
      customerName: paymentInfo.customerName || '',
      invoiceId: paymentInfo.invoiceId || null,
      invoiceNumber: paymentInfo.invoiceNumber || '',
      note: paymentInfo.note || (paymentInfo.method ? `Paid via ${paymentInfo.method}` : ''),
      source: 'invoice_payment',
      sourceRefId: refId,
      date: paymentInfo.date || new Date().toISOString()
    });
  }

  // ------------------------------------------------------------------- CSV

  _toCSVRow(t) {
    return [
      t.date,
      t.type === 'moneyIn' ? 'Money In' : 'Money Out',
      paiseToRupees(t.amountPaise),
      t.category,
      t.title,
      t.account,
      t.customerName || '',
      t.invoiceNumber || '',
      t.reversed ? 'Reversed' : '',
      t.note
    ];
  }

  async exportCsv(filters = {}) {
    const ledger = await this._getLedger();
    const rows = [['Date', 'Type', 'Amount', 'Category', 'Title', 'Account', 'Customer', 'Invoice #', 'Status', 'Note']];
    ledger
      .filter((t) => {
        if (filters.type && t.type !== filters.type) return false;
        if (filters.category && t.category !== filters.category) return false;
        if (filters.customerId && t.customerId !== filters.customerId) return false;
        if (filters.includeReversed !== true && t.reversed) return false;
        if (filters.from && new Date(t.date) < filters.from) return false;
        if (filters.to && new Date(t.date) > filters.to) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((t) => {
        rows.push(this._toCSVRow(t).map((cell) => {
          const s = String(cell == null ? '' : cell);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }));
      });
    return '\uFEFF' + rows.map((r) => r.join(',')).join('\r\n');
  }

  // ------------------------------------------------------------------ Sync

  async _loadFirestore() {
    const [{ db, firebaseReady }, { getDocsFromServer, getDocFromServer, doc, collection }] = await Promise.all([
      import('./firebaseConfig.js'),
      import('firebase/firestore')
    ]);
    return { db, firebaseReady, getDocsFromServer, getDocFromServer, doc, collection };
  }

  /**
   * Pull + merge Internal Bank data from Firestore.
   * Mirrors dbEngine.syncFromFirestore semantics:
   *   1) flush the offline queue first (never lose offline work),
   *   2) if any bank item is still pending, skip the pull (protect local),
   *   3) fetch cloud, merge per-id with cloudWins, write back,
   *   4) never clear-and-replace destructively.
   * `deps` may be injected for tests: { dbEngine, firestore }.
   */
  async syncFromCloud(force = false, deps = {}) {
    if (this._isDemo()) return null;

    const now = Date.now();
    if (!force && now - this._lastSyncTime < 15000) return null;
    this._lastSyncTime = now;

    const db = deps.dbEngine || await loadDb().catch(() => null);
    let uid = null;
    if (db && db.getRealUserId) {
      try { uid = db.getRealUserId(); } catch { uid = null; }
    }
    if (!uid) return null;

    // 1. Flush offline transactions first so pending local work reaches the cloud.
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        if (db && db.syncOfflineTransactions) await db.syncOfflineTransactions();
      } catch (e) {
        console.warn('[BANK SYNC] Flush failed:', e);
      }
    }

    // 2. If bank items are still pending, protect local data: skip the pull.
    if (typeof indexedDB !== 'undefined') {
      try {
        const queue = await BillQyroDB.getAll('syncQueue');
        const pending = queue.filter((tx) => (
          (tx.userId === uid || !tx.userId)
          && ['bankLedger', 'bankCredit', 'bankMeta'].includes(tx.storeName)
          && (tx.status === 'pending' || !tx.status)
        ));
        if (pending.length > 0) {
          console.warn('[BANK SYNC] Pending bank items in queue. Skipping cloud pull to protect local data.');
          return null;
        }
      } catch (e) {
        console.warn('[BANK SYNC] Could not inspect queue:', e);
      }
    }

    // 3. Fetch cloud. Permission/network failures fall back to empty (no-op pull).
    let fr;
    try {
      fr = deps.firestore || await this._loadFirestore();
    } catch {
      console.warn('[BANK SYNC] Firestore unavailable; skipping pull (local data untouched).');
      return null;
    }
    const { db: fsdb, firebaseReady, getDocFromServer, getDocsFromServer, doc, collection } = fr;
    if (!fsdb || !firebaseReady) return null;

    const emptyDoc = { exists: () => false, data: () => null };
    const emptySnap = { forEach: () => {} };
    const safeFetch = async (p, fallback, name) => {
      try { return await p; }
      catch (e) {
        console.warn(`[BANK SYNC] Read blocked/failed for ${name}:`, e && e.message ? e.message : e);
        return fallback;
      }
    };

    const [settingsSnap, ledgerSnap, creditSnap] = await Promise.all([
      safeFetch(getDocFromServer(doc(fsdb, 'bankMeta', uid, 'items', 'settings')), emptyDoc, 'bankMeta'),
      safeFetch(getDocsFromServer(collection(fsdb, 'bankLedger', uid, 'items')), emptySnap, 'bankLedger'),
      safeFetch(getDocsFromServer(collection(fsdb, 'bankCredit', uid, 'items')), emptySnap, 'bankCredit')
    ]);

    // 4. Merge ledger (per-id, cloudWins). Local-only + pending entries survive.
    const cloudLedger = [];
    ledgerSnap.forEach((ds) => {
      const d = ds.data();
      d.syncStatus = 'synced';
      cloudLedger.push(d);
    });
    const localLedger = await this._readStore('bankLedger', false);
    const mergedLedger = mergeBankItems(localLedger, cloudLedger);
    await this._writeStore('bankLedger', mergedLedger);

    // 5. Merge credit profiles.
    const cloudCredit = [];
    creditSnap.forEach((ds) => {
      const d = ds.data();
      d.syncStatus = 'synced';
      cloudCredit.push(d);
    });
    const localCredit = await this._readStore('bankCredit', false);
    const mergedCredit = mergeBankItems(localCredit, cloudCredit);
    await this._writeStore('bankCredit', mergedCredit);

    // 6. Merge settings (single doc; only apply if same workspace and cloud wins).
    if (settingsSnap.exists()) {
      const cloudSettings = settingsSnap.data();
      const scope = await this._getScope();
      const wsMatch = !cloudSettings.workspaceId || cloudSettings.workspaceId === scope.ws;
      const localSettings = await this._getBankSettings();
      if (wsMatch && (!localSettings || bankCloudWins(localSettings, cloudSettings))) {
        await this._writeSettings({ ...cloudSettings, syncStatus: 'synced' });
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_bank_updated'));
    }
    return { mergedLedgerCount: mergedLedger.length, mergedCreditCount: mergedCredit.length };
  }

  resetScope() { this._scope = null; }

  format(paise) {
    return formatCurrency(paiseToRupees(paise), 'Rs.');
  }
}

export const bankEngine = new BankEngine();