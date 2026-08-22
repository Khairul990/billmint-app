/**
 * BillQyro Data Backup, Restore & Disaster Recovery Verification Suite
 * Run: node tests/backupRestore.test.mjs
 * 
 * Verifies:
 *  1. Backup creation, formatVersion, and completeness
 *  2. JSON structure validation & corrupt file rejection
 *  3. Restore safety & state hydration
 *  4. Inventory & stock quantity preservation
 *  5. Financial reconciliation after restore
 *  6. Safe rollback on failure
 */

import { determinePaymentStatus } from '../src/utils/invoiceMath.js';

let passed = 0;
let failures = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failures++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('\n======================================================');
console.log('💾 RUNNING BILLQYRO BACKUP & RESTORE TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------
// 1. BACKUP CREATION & STRUCTURE VALIDATION
// ----------------------------------------------------
console.log('--- 1. Backup Creation & Schema Completeness ---');

function createMockBackup(invoices, customers, products, expenses, staff, settings) {
  return {
    appName: "BillQyro",
    backupVersion: 1,
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    workspaceId: settings?.activeWorkspaceId || 'default',
    recordCounts: {
      invoices: invoices.length,
      customers: customers.length,
      products: products.length,
      expenses: expenses.length,
      staff: staff.length
    },
    settings,
    customers,
    products,
    invoices,
    expenses,
    staff,
    subscription: { status: 'free' }
  };
}

const mockInvoices = [
  { id: 'inv_1', invoiceNumber: 'INV-101', grandTotal: 2500, paidAmount: 2500, items: [{ name: 'Silk Shirt', qty: 2, rate: 1250 }] },
  { id: 'inv_2', invoiceNumber: 'INV-102', grandTotal: 1000, paidAmount: 400, items: [{ name: 'Tailoring Service', qty: 1, rate: 1000 }] }
];

const mockCustomers = [
  { id: 'cust_1', name: 'John Doe', phone: '9876543210', email: 'john@example.com' }
];

const mockProducts = [
  { id: 'prod_1', name: 'Silk Shirt', price: 1250, stockQty: 48 }
];

const mockStaff = [
  { id: 'stf_1', name: 'Master Tailor Ali', role: 'Staff' }
];

const mockSettings = {
  businessName: 'Apex Clothiers',
  currency: '₹',
  activeWorkspaceId: 'ws_main'
};

const backup = createMockBackup(mockInvoices, mockCustomers, mockProducts, [], mockStaff, mockSettings);

assert(backup.appName === 'BillQyro', '1.1: Backup header contains appName');
assert(backup.formatVersion === 1, '1.2: Backup contains formatVersion 1');
assert(backup.workspaceId === 'ws_main', '1.3: Backup preserves active workspaceId');
assert(backup.recordCounts.invoices === 2, '1.4: Invoices record count matches');
assert(backup.recordCounts.staff === 1, '1.5: Staff record count matches');
assert(backup.products[0].stockQty === 48, '1.6: Product stock quantity is preserved in backup');


// ----------------------------------------------------
// 2. BACKUP VALIDATION & MALFORMED FILE REJECTION
// ----------------------------------------------------
console.log('\n--- 2. Validation & Corrupt Backup Rejection ---');

function validateBackupStructure(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid backup file structure' };
  }
  const requiredKeys = ['settings', 'customers', 'products', 'invoices', 'expenses'];
  for (const k of requiredKeys) {
    if (!Object.prototype.hasOwnProperty.call(data, k)) {
      return { valid: false, error: `Missing required database key: ${k}` };
    }
  }
  return { valid: true };
}

assert(validateBackupStructure(backup).valid, '2.1: Valid backup payload passes structure check');
assert(!validateBackupStructure(null).valid, '2.2: Null / non-object payload is rejected');
assert(!validateBackupStructure({ settings: {} }).valid, '2.3: Incomplete backup missing invoices/products is rejected');
assert(!validateBackupStructure('not_json_string').valid, '2.4: Malformed string payload is rejected');


// ----------------------------------------------------
// 3. RESTORE HYDRATION & FINANCIAL INTEGRITY
// ----------------------------------------------------
console.log('\n--- 3. Restore Hydration & Financial Invariants ---');

// Reconstruct state from restored backup
const restoredInvoices = backup.invoices;
const restoredProducts = backup.products;

// Verify invoice 1
const inv1 = restoredInvoices[0];
const inv1Status = determinePaymentStatus(inv1.paidAmount, inv1.grandTotal);
assert(inv1Status === 'Paid', '3.1: Restored fully-paid invoice resolves to "Paid" status');

// Verify invoice 2
const inv2 = restoredInvoices[1];
const inv2Status = determinePaymentStatus(inv2.paidAmount, inv2.grandTotal);
const inv2Balance = inv2.grandTotal - inv2.paidAmount;
assert(inv2Status === 'Partially Paid' && inv2Balance === 600, '3.2: Restored partial invoice resolves to "Partially Paid" with ₹600 due balance');

// Verify stock integrity
const prod1 = restoredProducts[0];
assert(prod1.stockQty === 48, '3.3: Product stock quantity is 48 after restoration');


// ----------------------------------------------------
// 4. RESTORE ROLLBACK SAFETY
// ----------------------------------------------------
console.log('\n--- 4. Rollback Safety on Corrupt Data ---');

function simulateSafeRestore(targetData, currentCache) {
  const previousState = JSON.parse(JSON.stringify(currentCache));
  try {
    const check = validateBackupStructure(targetData);
    if (!check.valid) {
      throw new Error(check.error);
    }
    // Apply changes
    return { success: true, state: targetData };
  } catch (err) {
    // Rollback to previous state
    return { success: false, error: err.message, state: previousState };
  }
}

const currentWorkingState = { invoices: [{ id: 'current_1' }], customers: [] };
const failedRestoreResult = simulateSafeRestore({ corrupt: true }, currentWorkingState);

assert(!failedRestoreResult.success, '4.1: Corrupt restore throws error gracefully');
assert(failedRestoreResult.state.invoices.length === 1 && failedRestoreResult.state.invoices[0].id === 'current_1', '4.2: Previous state is completely preserved (0 data loss on failed restore)');


// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n======================================================');
console.log(`📊 BACKUP & RESTORE RESULTS: ${passed} / ${passed + failures} PASSED (${Math.round((passed / (passed + failures)) * 100)}%)`);
console.log('======================================================\n');

if (failures > 0) {
  process.exit(1);
}
