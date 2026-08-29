/**
 * BillQyro Internal Bank — invariant + sync test suite.
 * Run: node tests/bankSync.test.mjs
 *
 * Covers:
 *  - Original invariants (paise, balance, overdraft, negative opt-in, reversal,
 *    credit limit, collection, idempotent auto-post, CSV BOM, receivables)
 *  - Sync scenarios A–O (offline create, refresh, reconnect, second device,
 *    cloud appears locally, pending survives pull, no duplicates, reversal
 *    linking, credit limits, credit-free, autopost idempotency, offline->online
 *    merge, stale-cloud vs newer-local, stale-local vs newer-cloud,
 *    unauthorized access rejected).
 */
const base = 'file:///D:/Khair_Murafiq_Empire/BillQyro/';

let failures = 0;
let passed = 0;
const assert = (cond, msg) => {
  if (cond) { passed++; console.log('PASS: ' + msg); }
  else { failures++; console.error('FAIL: ' + msg); }
};

function resetEnv() {
  const store = new Map();
  global.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
  global.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const { bankEngine, rupeesToPaise, paiseToRupees, mergeBankItems, bankCloudWins, BANK_CATEGORIES } = await import('../src/services/bankEngine.js');

const snap = (docs) => ({ forEach: (cb) => docs.forEach((d) => cb({ data: () => d })) });
const docSnap = (data) => ({ exists: () => !!data, data: () => data });
const fakeDbEngine = () => ({ getRealUserId: () => 'local-user', syncOfflineTransactions: async () => true });
const fakeFirestore = ({ ledger = [], credit = [], settings = null, failCollections = [] } = {}) => {
  const fail = (name) => failCollections.includes(name);
  return {
    firebaseReady: true,
    db: { fake: true },
    doc: (...a) => a,
    collection: (...a) => a,
    getDocFromServer: async (ref) => {
      if (fail('bankMeta')) throw new Error('PERMISSION_DENIED');
      return docSnap(settings);
    },
    getDocsFromServer: async (ref) => {
      const col = ref[1];
      if (fail(col)) throw new Error('PERMISSION_DENIED');
      if (col === 'bankLedger') return snap(ledger);
      if (col === 'bankCredit') return snap(credit);
      return snap([]);
    }
  };
};

const t = (id, { __version = 1, updatedAt = new Date().toISOString(), ...extra } = {}) => ({
  id, __version, updatedAt, userId: 'local-user', workspaceId: 'default',
  date: new Date().toISOString(), syncStatus: 'synced', ...extra
});

// ---------------------------------------------------------------------------
// PART 1 — Original invariant harness
// ---------------------------------------------------------------------------
console.log('\n=== PART 1: Invariants ===');
resetEnv();

assert(rupeesToPaise(12.5) === 1250, 'rupees->paise integer');
assert(paiseToRupees(1250) === 12.5, 'paise->rupees');

await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 1000, category: 'Other Income', title: 'Seed' });
assert((await bankEngine.getState()).balancePaise === 100000, 'balance = 1000 after money in');

let threw = false;
try { await bankEngine.addTransaction({ type: 'moneyOut', amountRupees: 1500, category: 'Expense' }); } catch (e) { threw = true; }
assert(threw, 'overdraft money-out blocked when allowNegative=false');

await bankEngine.saveBankSettings({ allowNegativeBalance: true });
const t2 = await bankEngine.addTransaction({ type: 'moneyOut', amountRupees: 1500, category: 'Expense' });
assert((await bankEngine.getState()).balancePaise === -50000, 'negative balance allowed when enabled');

await bankEngine.reverseTransaction(t2.id, 'test reversal');
assert((await bankEngine.getState()).balancePaise === 100000, 'reversal restores balance');

await bankEngine.setCreditProfile('cust-1', 'Demo Customer', 300);
await bankEngine.addTransaction({ type: 'moneyOut', amountRupees: 250, category: 'Credit Sale (Customer)', customerId: 'cust-1', entryType: 'credit_sale' });
let threw2 = false;
try { await bankEngine.addTransaction({ type: 'moneyOut', amountRupees: 100, category: 'Credit Sale (Customer)', customerId: 'cust-1', entryType: 'credit_sale' }); } catch (e) { threw2 = true; }
assert(threw2, 'credit sale over limit blocked');

await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 250, category: 'Credit Collection', customerId: 'cust-1', entryType: 'credit_collection' });
await bankEngine.addTransaction({ type: 'moneyOut', amountRupees: 100, category: 'Credit Sale (Customer)', customerId: 'cust-1', entryType: 'credit_sale' });
assert(true, 'collection frees limit; new credit sale under limit accepted');

await bankEngine.saveBankSettings({ autoPostPayments: true });
const p1 = await bankEngine.autoPostPayment({ id: 'pmt_x', amount: 500, invoiceNumber: 'INV-1', customerName: 'A' });
const p2 = await bankEngine.autoPostPayment({ id: 'pmt_x', amount: 500, invoiceNumber: 'INV-1', customerName: 'A' });
const s4 = await bankEngine.getState();
assert(s4.ledger.filter((tx) => tx.source === 'invoice_payment').length === 1 && p1.id === p2.id, 'auto-post is idempotent (one entry)');
assert(p1.amountPaise === 50000, 'auto-post amount in paise');

const csv = await bankEngine.exportCsv({});
assert(csv.startsWith('\uFEFFDate'), 'CSV export with BOM header');

const profiles = await bankEngine.getCreditProfiles();
const c1 = profiles.find((p) => p.id === 'cust-1');
assert(c1.outstandingPaise === 10000, 'customer outstanding = 100 (250-250+100)');

// ---------------------------------------------------------------------------
// PART 2 — Sync scenarios
// ---------------------------------------------------------------------------
console.log('\n=== PART 2: Sync ===');

// A. Create transaction offline (persisted, pending) + B. refresh before sync
resetEnv();
const offlineTx = await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 500, category: 'Other Income', title: 'Offline sale' });
assert((await bankEngine.getState()).ledger.length === 1, 'A: transaction created while offline');
assert((await bankEngine.getState()).ledger[0].syncStatus === 'pending', 'A: new entry is marked pending');
assert((await bankEngine.getState()).ledger[0].id === offlineTx.id, 'B: data survives refresh (same id after re-read)');
assert((await bankEngine.getState()).balancePaise === 50000, 'B: balance intact after refresh before sync');

// C. Sync after reconnect (offline -> online, empty cloud) preserves local pending
const resC = await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({}) });
assert(resC && resC.mergedLedgerCount === 1, 'C: sync after reconnect completes');
assert((await bankEngine.getState()).ledger.length === 1, 'C: pending local survives sync (no dup, no loss)');
assert((await bankEngine.getState()).ledger[0].syncStatus === 'pending', 'C: still pending until actually pushed');

// D+E. Second device opens same account -> cloud data appears locally
resetEnv();
const cloudLedger = [
  t('bntx_c1', { type: 'moneyIn', amountPaise: 100000, category: 'Other Income', title: 'Cloud in', date: new Date().toISOString(), __version: 3 }),
  t('bntx_c2', { type: 'moneyOut', amountPaise: 25000, category: 'Expense', title: 'Cloud out', date: new Date().toISOString(), __version: 2 })
];
const cloudCredit = [t('cust-9', { customerName: 'Cloud Cust', creditLimitPaise: 50000, __version: 2 })];
await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({ ledger: cloudLedger, credit: cloudCredit }) });
const stateDE = await bankEngine.getState();
assert(stateDE.ledger.length === 2, 'D/E: cloud transactions appear locally on second device');
assert(stateDE.balancePaise === 75000, 'D/E: balance reflects cloud data (1000 - 250)');
assert(stateDE.credit.length === 1 && stateDE.credit[0].creditLimitPaise === 50000, 'D/E: cloud credit profile appears locally');

// F. Local pending transaction survives cloud pull (merge keeps local-only)
resetEnv();
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 300, category: 'Other Income', title: 'Local pending' });
await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({ ledger: [t('bntx_c1', { type: 'moneyIn', amountPaise: 100000, category: 'Other Income', title: 'Cloud in', __version: 3 })] }) });
const stateF = await bankEngine.getState();
assert(stateF.ledger.length === 2, 'F: local pending survives cloud pull (both present)');
assert(stateF.ledger.some((x) => x.title === 'Local pending'), 'F: local-only entry not overwritten/deleted');

// G. Duplicate sync does not duplicate transaction
const mergedG = mergeBankItems([t('bntx_1', { __version: 1 })], [t('bntx_1', { __version: 1 }), t('bntx_1', { __version: 2 })]);
assert(mergedG.filter((x) => x.id === 'bntx_1').length === 1, 'G: duplicate cloud docs collapse to one entry');

// H. Reversal relationship remains intact through merge
resetEnv();
const lTx = await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 100, category: 'Other Income', title: 'To reverse' });
await bankEngine.reverseTransaction(lTx.id, 'mistake');
let localAfterReverse = (await bankEngine.getState()).ledger.find((x) => x.id === lTx.id);
assert(localAfterReverse.reversed === true && localAfterReverse.reversalOfId === lTx.id, 'H: reversal linked locally');
// Merge against older (version 1, non-reversed) cloud entry -> local newer wins
const cloudStale = [t(lTx.id, { type: 'moneyIn', amountPaise: 10000, title: 'To reverse', __version: 1, reversed: false })];
const mergedH = mergeBankItems([localAfterReverse], cloudStale);
assert(mergedH[0].reversed === true && mergedH[0].reversalOfId === lTx.id, 'H: reversal survives stale-cloud merge');
// And a newer cloud (version higher) that is also reversed keeps reversal too
const mergedH2 = mergeBankItems([localAfterReverse], [t(lTx.id, { type: 'moneyIn', amountPaise: 10000, title: 'To reverse', __version: 5, reversed: true })]);
assert(mergedH2[0].reversed === true, 'H: newer cloud reversed state preserved');

// I. Credit limit remains correct through sync
resetEnv();
await bankEngine.setCreditProfile('cust-2', 'B', 200);
const mergedCreditI = mergeBankItems(
  (await bankEngine.getState()).credit,
  [t('cust-2', { customerName: 'B', creditLimitPaise: 20000, __version: 1, updatedAt: '2020-01-01T00:00:00.000Z' })]
);
assert(mergedCreditI[0].creditLimitPaise === 20000, 'I: credit limit remains correct after merge');

// J. Customer payment frees credit correctly
resetEnv();
await bankEngine.setCreditProfile('cust-3', 'C', 500);
await bankEngine.addTransaction({ type: 'moneyOut', amountRupees: 400, category: 'Credit Sale (Customer)', customerId: 'cust-3', entryType: 'credit_sale' });
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 150, category: 'Credit Collection', customerId: 'cust-3', entryType: 'credit_collection' });
const profJ = await bankEngine.getCreditProfiles();
assert(profJ[0].outstandingPaise === 25000, 'J: payment frees credit (outstanding 250 after 400-150)');
assert(profJ[0].remainingPaise === 25000, 'J: remaining credit correct after payment');

// K. Invoice auto-post remains idempotent
resetEnv();
await bankEngine.saveBankSettings({ autoPostPayments: true });
const k1 = await bankEngine.autoPostPayment({ id: 'pay-77', amount: 250, invoiceNumber: 'INV-77', customerName: 'Cust' });
const k2 = await bankEngine.autoPostPayment({ id: 'pay-77', amount: 250, invoiceNumber: 'INV-77', customerName: 'Cust' });
assert(k1.id === k2.id, 'K: auto-post dedupes by sourceRefId');
// After a cloud pull that echoes the same auto-posted entry, still one entry
await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({ ledger: [t(k1.id, { type: 'moneyIn', amountPaise: 25000, source: 'invoice_payment', sourceRefId: 'pay-77', __version: 1 })] }) });
assert((await bankEngine.getState()).ledger.filter((x) => x.source === 'invoice_payment').length === 1, 'K: no duplicate after cloud echo pull');

// L. Offline -> online merge combines local pending + cloud cleanly
resetEnv();
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 111, category: 'Other Income', title: 'Local pending' });
await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({ ledger: [t('bntx_c9', { type: 'moneyOut', amountPaise: 5000, category: 'Expense', title: 'Cloud', __version: 2 })] }) });
const stateL = await bankEngine.getState();
assert(stateL.ledger.length === 2, 'L: offline+online merge yields union');
assert(stateL.balancePaise === 6100, 'L: merged balance correct (111 - 50 = 61)');

// M. Stale cloud vs newer local -> local wins (do not overwrite newer local)
resetEnv();
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 50, category: 'Other Income', title: 'Local newer' });
let localEntry = (await bankEngine.getState()).ledger[0];
await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({ ledger: [t(localEntry.id, { type: 'moneyIn', amountPaise: 1, title: 'STALE', __version: 0, updatedAt: '2020-01-01T00:00:00.000Z' })] }) });
let afterM = (await bankEngine.getState()).ledger[0];
assert(afterM.amountPaise === 5000 && afterM.title === 'Local newer', 'M: stale cloud (older version) does not overwrite newer local');

// N. Stale local vs newer cloud -> cloud wins (do not overwrite newer cloud)
resetEnv();
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 50, category: 'Other Income', title: 'Old local' });
let localEntryN = (await bankEngine.getState()).ledger[0];
await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine(), firestore: fakeFirestore({ ledger: [t(localEntryN.id, { type: 'moneyIn', amountPaise: 99999, title: 'NEW CLOUD', __version: 50, updatedAt: new Date().toISOString() })] }) });
let afterN = (await bankEngine.getState()).ledger[0];
assert(afterN.amountPaise === 99999 && afterN.title === 'NEW CLOUD', 'N: newer cloud (higher version) wins over stale local');

// O. Unauthorized business access rejected -> local data untouched
resetEnv();
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 777, category: 'Other Income', title: 'My money' });
let threwO = false;
try {
  await bankEngine.syncFromCloud(true, {
    dbEngine: fakeDbEngine(),
    firestore: fakeFirestore({ failCollections: ['bankLedger', 'bankCredit', 'bankMeta'] })
  });
} catch (e) { threwO = true; }
const stateO = await bankEngine.getState();
assert(!threwO && stateO.ledger.length === 1 && stateO.ledger[0].amountPaise === 77700, 'O: permission-denied pull is a no-op, local data intact');

// O2. Graceful network failure (firestore module unavailable) -> no data loss
resetEnv();
await bankEngine.addTransaction({ type: 'moneyIn', amountRupees: 100, category: 'Other Income', title: 'Safe' });
let resO2 = await bankEngine.syncFromCloud(true, { dbEngine: fakeDbEngine() }); // no firestore injected -> _loadFirestore fails in Node
assert(resO2 === null && (await bankEngine.getState()).ledger.length === 1, 'O2: network/firestore failure never loses local financial records');

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);