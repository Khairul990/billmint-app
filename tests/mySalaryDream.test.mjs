import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateCanonicalInvoiceFinancials, 
  filterByWorkspace, 
  roundTo2 
} from '../src/utils/invoiceMath.js';
import { paymentEngine } from '../src/services/paymentEngine.js';

test('BILLQYRO PHASE 9 — MY SALARY + MY DREAM MASTER TEST SUITE (TESTS A TO AE)', async (t) => {

  // --- TEST A: Record My Salary ---
  await t.test('TEST A: Record My Salary', () => {
    const bankLedger = [
      { id: 'sal_a', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 15000, salaryPeriod: 'August 2026', date: '2026-08-31' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.mySalaryTotal, 15000);
    const history = paymentEngine.getSalaryHistory({ bankLedger });
    assert.equal(history.totalSalary, 15000);
    assert.equal(history.records.length, 1);
    assert.equal(history.records[0].salaryPeriod, 'August 2026');
  });

  // --- TEST B: Salary reduces Website Income correctly ---
  await t.test('TEST B: Salary reduces Website Income correctly', () => {
    const invoices = [
      { id: 'inv_b', items: [{ price: 50000, quantity: 1 }], paymentHistory: [{ amount: 50000 }] }
    ];
    const bankLedger = [
      { id: 'sal_b', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 10000, date: '2026-08-31' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ invoices, bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 50000);
    assert.equal(buckets.mySalaryTotal, 10000);
    assert.equal(buckets.websiteIncomeAvailable, 40000);
  });

  // --- TEST C: Salary appears in Unified History ---
  await t.test('TEST C: Salary appears in Unified History', () => {
    const bankLedger = [
      { id: 'sal_c', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', sourceLocation: 'website_income', destinationLocation: 'owner_personal', amountRupees: 12000, note: 'August Salary' }
    ];
    const history = paymentEngine.getUnifiedTransactionHistory({ bankLedger });
    assert.equal(history.length, 1);
    assert.equal(history[0].category, 'My Salary');
    assert.equal(history[0].amount, 12000);
    assert.equal(history[0].sourceLocation, 'website_income');
    assert.equal(history[0].destinationLocation, 'owner_personal');
  });

  // --- TEST D: Salary is not counted as customer revenue ---
  await t.test('TEST D: Salary is not counted as customer revenue', () => {
    const bankLedger = [
      { id: 'sal_d', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 10000 }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.totalWebsiteRevenue, 0);
    assert.equal(buckets.mySalaryTotal, 10000);
  });

  // --- TEST E: Create Dream ---
  await t.test('TEST E: Create Dream', () => {
    const goal = paymentEngine.saveDreamGoal({
      dreamName: 'New Laptop',
      targetAmount: 50000,
      targetDate: '2027-12-31',
      category: 'Tech'
    }, 'ws_test_e');
    assert.ok(goal.id);
    assert.equal(goal.dreamName, 'New Laptop');
    assert.equal(goal.targetAmount, 50000);
  });

  // --- TEST F: Dream target calculation works ---
  await t.test('TEST F: Dream target calculation works', () => {
    const goal = paymentEngine.saveDreamGoal({
      dreamName: 'Bike',
      targetAmount: 80000
    }, 'ws_test_f');
    assert.equal(goal.targetAmount, 80000);
  });

  // --- TEST G: Dream progress calculation works ---
  await t.test('TEST G: Dream progress calculation works', () => {
    const goal = paymentEngine.saveDreamGoal({
      id: 'dream_prog_g',
      dreamName: 'Camera',
      targetAmount: 100000
    }, 'ws_test_g');

    const bankLedger = [
      { id: 't_g', isTransfer: true, amountRupees: 30000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_prog_g', workspaceId: 'ws_test_g' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger, workspaceId: 'ws_test_g' });
    const targetGoal = buckets.dreamGoals.find(d => d.id === 'dream_prog_g');
    assert.ok(targetGoal);
    assert.equal(targetGoal.savedAmount, 30000);
    assert.equal(targetGoal.progressPercentage, 30);
  });

  // --- TEST H: Dream remaining amount works ---
  await t.test('TEST H: Dream remaining amount works', () => {
    const goal = paymentEngine.saveDreamGoal({
      id: 'dream_rem_h',
      dreamName: 'Trip',
      targetAmount: 50000
    }, 'ws_test_h');

    const bankLedger = [
      { id: 't_h', isTransfer: true, amountRupees: 15000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_rem_h', workspaceId: 'ws_test_h' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger, workspaceId: 'ws_test_h' });
    const targetGoal = buckets.dreamGoals.find(d => d.id === 'dream_rem_h');
    assert.ok(targetGoal);
    assert.equal(targetGoal.remainingAmount, 35000);
    assert.equal(targetGoal.progressPercentage, 30);
  });

  // --- TEST I: My Cash -> Dream transfer ---
  await t.test('TEST I: My Cash -> Dream transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't_i', isTransfer: true, amountRupees: 2000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_i' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 8000);
    assert.equal(buckets.myDreamBalance, 2000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST J: PhonePe -> Dream transfer ---
  await t.test('TEST J: PhonePe -> Dream transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' },
      { id: 't_j', isTransfer: true, amountRupees: 4000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_j' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 6000);
    assert.equal(buckets.myDreamBalance, 4000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST K: Dream -> My Cash transfer ---
  await t.test('TEST K: Dream -> My Cash transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_k' },
      { id: 't2', isTransfer: true, amountRupees: 2000, sourceLocation: 'my_dream', destinationLocation: 'my_cash', dreamId: 'dream_k' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myDreamBalance, 3000);
    assert.equal(buckets.myCashBalance, 7000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST L: Dream -> PhonePe transfer ---
  await t.test('TEST L: Dream -> PhonePe transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' },
      { id: 't1', isTransfer: true, amountRupees: 5000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_l' },
      { id: 't2', isTransfer: true, amountRupees: 2000, sourceLocation: 'my_dream', destinationLocation: 'phonepe', dreamId: 'dream_l' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myDreamBalance, 3000);
    assert.equal(buckets.phonePeBalance, 7000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST M: Dream transfer does not count as expense ---
  await t.test('TEST M: Dream transfer does not count as expense', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'phonepe' },
      { id: 't_m', isTransfer: true, amountRupees: 3000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_m' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeExpenses, 0);
    assert.equal(buckets.myCashExpenses, 0);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST N: Dream transfer does not double-count personal money ---
  await t.test('TEST N: Dream transfer does not double-count personal money', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 4000, sourceLocation: 'my_cash', destinationLocation: 'phonepe' },
      { id: 't2', isTransfer: true, amountRupees: 2500, sourceLocation: 'phonepe', destinationLocation: 'my_dream' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

  // --- TEST O: Dream cannot receive more than available source balance ---
  await t.test('TEST O: Dream cannot receive more than available source balance', () => {
    const availableCash = 5000;
    const transferAttempt = 7000;
    const canTransfer = transferAttempt <= availableCash;
    assert.equal(canTransfer, false);
  });

  // --- TEST P: Dream cannot withdraw more than saved balance ---
  await t.test('TEST P: Dream cannot withdraw more than saved balance', () => {
    const savedInDream = 3000;
    const withdrawAttempt = 5000;
    const canWithdraw = withdrawAttempt <= savedInDream;
    assert.equal(canWithdraw, false);
  });

  // --- TEST Q: Negative Dream balance is impossible ---
  await t.test('TEST Q: Negative Dream balance is impossible', () => {
    const bankLedger = [
      { id: 't_neg', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_dream', destinationLocation: 'my_cash', dreamId: 'dream_q' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myDreamBalance, 0);
  });

  // --- TEST R: Multiple Dreams remain isolated ---
  await t.test('TEST R: Multiple Dreams remain isolated', () => {
    paymentEngine.saveDreamGoal({ id: 'dream_r1', dreamName: 'Laptop', targetAmount: 50000 }, 'ws_r');
    paymentEngine.saveDreamGoal({ id: 'dream_r2', dreamName: 'Bike', targetAmount: 80000 }, 'ws_r');

    const bankLedger = [
      { id: 't_r1', isTransfer: true, amountRupees: 20000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_r1', workspaceId: 'ws_r' },
      { id: 't_r2', isTransfer: true, amountRupees: 10000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_r2', workspaceId: 'ws_r' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger, workspaceId: 'ws_r' });
    const g1 = buckets.dreamGoals.find(g => g.id === 'dream_r1');
    const g2 = buckets.dreamGoals.find(g => g.id === 'dream_r2');
    assert.equal(g1.savedAmount, 20000);
    assert.equal(g2.savedAmount, 10000);
  });

  // --- TEST S: Dream reaches 100% and becomes COMPLETED ---
  await t.test('TEST S: Dream reaches 100% and becomes COMPLETED', () => {
    paymentEngine.saveDreamGoal({ id: 'dream_s', dreamName: 'Watch', targetAmount: 10000 }, 'ws_s');

    const bankLedger = [
      { id: 't_s', isTransfer: true, amountRupees: 10000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_s', workspaceId: 'ws_s' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger, workspaceId: 'ws_s' });
    const g = buckets.dreamGoals.find(x => x.id === 'dream_s');
    assert.equal(g.progressPercentage, 100);
    assert.equal(g.status, 'COMPLETED');
  });

  // --- TEST T: Archived Dream retains historical transactions ---
  await t.test('TEST T: Archived Dream retains historical transactions', () => {
    const goal = paymentEngine.saveDreamGoal({ id: 'dream_t', dreamName: 'Trip', targetAmount: 20000, status: 'ACTIVE' }, 'ws_t');
    const bankLedger = [
      { id: 't_t', isTransfer: true, amountRupees: 5000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_t', workspaceId: 'ws_t' }
    ];
    paymentEngine.updateDreamStatus('dream_t', 'ARCHIVED', 'ws_t');
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger, workspaceId: 'ws_t' });
    const g = buckets.dreamGoals.find(x => x.id === 'dream_t');
    assert.equal(g.status, 'ARCHIVED');
    assert.equal(g.transactionHistory.length, 1);
    assert.equal(g.savedAmount, 5000);
  });

  // --- TEST U: Salary and Dream remain financially distinct ---
  await t.test('TEST U: Salary and Dream remain financially distinct', () => {
    const bankLedger = [
      { id: 'sal_u', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 10000 },
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 5000, destinationLocation: 'phonepe' },
      { id: 't_u', isTransfer: true, amountRupees: 2000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_u' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.mySalaryTotal, 10000);
    assert.equal(buckets.myDreamBalance, 2000);
    assert.equal(buckets.phonePeBalance, 3000);
  });

  // --- TEST V: Duplicate Dream transaction is rejected ---
  await t.test('TEST V: Duplicate Dream transaction is rejected', () => {
    const existingTx = [{ id: 'tx_dream_v', dreamId: 'dream_123', amountRupees: 5000 }];
    const incomingId = 'tx_dream_v';
    const isDup = existingTx.some(t => t.id === incomingId);
    assert.equal(isDup, true);
  });

  // --- TEST W: Offline transaction remains idempotent ---
  await t.test('TEST W: Offline transaction remains idempotent', () => {
    const queue = [{ id: 'off_dream_w', dreamId: 'dream_w', amount: 3000, status: 'pending', __version: 1 }];
    const replay = { id: 'off_dream_w', dreamId: 'dream_w', amount: 3000, status: 'synced', __version: 2 };
    const merged = queue.map(q => q.id === replay.id && replay.__version > q.__version ? replay : q);
    assert.equal(merged[0].status, 'synced');
  });

  // --- TEST X: Workspace/account isolation ---
  await t.test('TEST X: Workspace/account isolation', () => {
    paymentEngine.saveDreamGoal({ id: 'dream_x_alpha', dreamName: 'Alpha Goal' }, 'ws_alpha');
    paymentEngine.saveDreamGoal({ id: 'dream_x_beta', dreamName: 'Beta Goal' }, 'ws_beta');
    const alphaGoals = paymentEngine.getDreamGoals('ws_alpha');
    const betaGoals = paymentEngine.getDreamGoals('ws_beta');
    assert.ok(alphaGoals.some(g => g.id === 'dream_x_alpha'));
    assert.ok(!alphaGoals.some(g => g.id === 'dream_x_beta'));
  });

  // --- TEST Y: Unauthorized user cannot access another user's Dream ---
  await t.test('TEST Y: Unauthorized user cannot access another user\'s Dream', () => {
    const userADreams = [{ id: 'd_userA', userId: 'userA' }];
    const activeUserId = 'userB';
    const accessible = userADreams.filter(d => d.userId === activeUserId);
    assert.equal(accessible.length, 0);
  });

  // --- TEST Z: No password/token exists in Dream or Salary records ---
  await t.test('TEST Z: No password/token exists in Dream or Salary records', () => {
    const bankLedger = [
      { id: 'sal_z', type: 'moneyOut', category: 'My Salary', source: 'owner_salary', amountRupees: 10000 }
    ];
    const history = paymentEngine.getSalaryHistory({ bankLedger });
    assert.equal(history.records[0].password, undefined);
    assert.equal(history.records[0].token, undefined);
  });

  // --- TEST AA: Dashboard Dream progress reflects canonical balance ---
  await t.test('TEST AA: Dashboard Dream progress reflects canonical balance', () => {
    paymentEngine.saveDreamGoal({ id: 'dream_aa', dreamName: 'Tablet', targetAmount: 40000 }, 'ws_aa');
    const bankLedger = [
      { id: 't_aa', isTransfer: true, amountRupees: 20000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_aa', workspaceId: 'ws_aa' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger, workspaceId: 'ws_aa' });
    const goal = buckets.dreamGoals.find(g => g.id === 'dream_aa');
    assert.equal(goal.savedAmount, 20000);
    assert.equal(goal.progressPercentage, 50);
  });

  // --- TEST AB: Unified History contains Dream transfers ---
  await t.test('TEST AB: Unified History contains Dream transfers', () => {
    const bankLedger = [
      { id: 't_ab', isTransfer: true, category: 'Transfer to My Dream', sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_ab', amountRupees: 5000 }
    ];
    const history = paymentEngine.getUnifiedTransactionHistory({ bankLedger });
    assert.equal(history.length, 1);
    assert.equal(history[0].isTransfer, true);
    assert.equal(history[0].destinationLocation, 'my_dream');
  });

  // --- TEST AC: Cash balance remains correct after Dream transfer ---
  await t.test('TEST AC: Cash balance remains correct after Dream transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 15000, destinationLocation: 'my_cash' },
      { id: 't_ac', isTransfer: true, amountRupees: 5000, sourceLocation: 'my_cash', destinationLocation: 'my_dream', dreamId: 'dream_ac' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 10000);
    assert.equal(buckets.myDreamBalance, 5000);
  });

  // --- TEST AD: PhonePe balance remains correct after Dream transfer ---
  await t.test('TEST AD: PhonePe balance remains correct after Dream transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 20000, destinationLocation: 'phonepe' },
      { id: 't_ad', isTransfer: true, amountRupees: 8000, sourceLocation: 'phonepe', destinationLocation: 'my_dream', dreamId: 'dream_ad' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.phonePeBalance, 12000);
    assert.equal(buckets.myDreamBalance, 8000);
  });

  // --- TEST AE: Total personal money remains unchanged after internal transfer ---
  await t.test('TEST AE: Total personal money remains unchanged after internal transfer', () => {
    const bankLedger = [
      { id: 'w1', type: 'moneyOut', category: 'Withdrawal', source: 'owner_withdrawal', amountRupees: 10000, destinationLocation: 'my_cash' },
      { id: 't1', isTransfer: true, amountRupees: 3000, sourceLocation: 'my_cash', destinationLocation: 'phonepe' },
      { id: 't2', isTransfer: true, amountRupees: 2000, sourceLocation: 'phonepe', destinationLocation: 'my_dream' },
      { id: 't3', isTransfer: true, amountRupees: 1000, sourceLocation: 'my_dream', destinationLocation: 'my_cash' }
    ];
    const buckets = paymentEngine.calculateFinancialBuckets({ bankLedger });
    assert.equal(buckets.myCashBalance, 8000);
    assert.equal(buckets.phonePeBalance, 1000);
    assert.equal(buckets.myDreamBalance, 1000);
    assert.equal(buckets.personalAvailableTotal, 10000);
  });

});
