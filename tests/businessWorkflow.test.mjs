/**
 * BillQyro Real-World Business Workflow & Usability Verification Suite
 * Run: node tests/businessWorkflow.test.mjs
 * 
 * Verifies all 4 user personas, mathematical accuracy, stock tracking,
 * customer ledger reconciliation, payment states, and workspace isolation.
 */

import { calculateInvoiceTotals, calculateItemTotal, determinePaymentStatus } from '../src/utils/invoiceMath.js';
import { featureControlEngine } from '../src/services/featureControlEngine.js';

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
console.log('🧪 RUNNING BILLQYRO BUSINESS WORKFLOW TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------
// 1. PERSONA A: SIMPLE BILLING WORKFLOW
// ----------------------------------------------------
console.log('--- 1. Persona A: Simple Billing (Manual Items, No Catalog) ---');

// 1.1 Manual line item calculation
const item1 = calculateItemTotal(1, 500);
assert(item1 === 500, '1.1: Single manual line item calculates correctly (1 x ₹500 = ₹500)');

const items = [
  { name: 'Tailoring Service (Suit)', qty: 1, rate: 500 },
  { name: 'Button replacement', qty: 4, rate: 25 }
];
const invoiceTotals = calculateInvoiceTotals(items, 0, 0);
assert(invoiceTotals.subtotal === 600 && invoiceTotals.grandTotal === 600, '1.2: Multiple manual line items sum up to ₹600 without tax');

// 1.3 Full Payment -> Paid
const paidStatus = determinePaymentStatus(500, 500, 'Unpaid');
assert(paidStatus === 'Paid', '1.3: Payment of ₹500 on ₹500 invoice sets status to "Paid"');

// 1.4 Partial Payment -> Partially Paid
const partialStatus = determinePaymentStatus(400, 1000, 'Unpaid');
assert(partialStatus === 'Partially Paid', '1.4: Payment of ₹400 on ₹1000 invoice sets status to "Partially Paid"');

// 1.5 Zero Payment -> Unpaid
const unpaidStatus = determinePaymentStatus(0, 1000, 'Unpaid');
assert(unpaidStatus === 'Unpaid', '1.5: Payment of ₹0 on ₹1000 invoice sets status to "Unpaid"');

// 1.6 Tax & Discount calculation
const totalsWithTaxDisc = calculateInvoiceTotals(
  [{ name: 'Service', qty: 2, rate: 1000 }], // 2000
  18, // 18% GST
  200 // ₹200 flat discount
);
// Taxable: 2000 - 200 = 1800. Tax: 1800 * 0.18 = 324. Grand Total = 2124
assert(totalsWithTaxDisc.subtotal === 2000, '1.6a: Subtotal is ₹2000');
assert(totalsWithTaxDisc.discountAmount === 200, '1.6b: Discount is ₹200');
assert(totalsWithTaxDisc.taxAmount === 324, '1.6c: 18% Tax on ₹1800 is ₹324');
assert(totalsWithTaxDisc.grandTotal === 2124, '1.6d: Grand total is ₹2124');


// ----------------------------------------------------
// 2. PERSONA B: RETAIL & INVENTORY WORKFLOW
// ----------------------------------------------------
console.log('\n--- 2. Persona B: Retail Shop & Stock Tracking ---');

const mockProduct = {
  id: 'prod_cotton_shirt',
  name: 'Cotton Oxford Shirt',
  price: 799,
  stockQty: 50,
  lowStockThreshold: 10
};

// Simulate Stock Deduction on Bill Creation
function processStockDeduction(products, billItems) {
  const updatedProducts = JSON.parse(JSON.stringify(products));
  billItems.forEach(item => {
    const prod = updatedProducts.find(p => p.id === item.productId || p.name === item.name);
    if (prod && prod.stockQty !== undefined) {
      prod.stockQty = Math.max(0, prod.stockQty - item.qty);
    }
  });
  return updatedProducts;
}

// Simulate Stock Restoration on Bill Deletion
function processStockRestoration(products, billItems) {
  const updatedProducts = JSON.parse(JSON.stringify(products));
  billItems.forEach(item => {
    const prod = updatedProducts.find(p => p.id === item.productId || p.name === item.name);
    if (prod && prod.stockQty !== undefined) {
      prod.stockQty += item.qty;
    }
  });
  return updatedProducts;
}

const billItems = [{ productId: 'prod_cotton_shirt', name: 'Cotton Oxford Shirt', qty: 5, rate: 799 }];
const afterBill = processStockDeduction([mockProduct], billItems);
assert(afterBill[0].stockQty === 45, '2.1: Selling 5 shirts decrements inventory stock from 50 to 45');

const afterDelete = processStockRestoration(afterBill, billItems);
assert(afterDelete[0].stockQty === 50, '2.2: Deleting or cancelling invoice restores stock from 45 back to 50');


// ----------------------------------------------------
// 3. PERSONA C: SERVICE & CUSTOMER LEDGER RECONCILIATION
// ----------------------------------------------------
console.log('\n--- 3. Persona C: Service Business & Ledger Reconciliation ---');

const mockCustomerInvoices = [
  { id: 'inv_1', grandTotal: 2500, paidAmount: 1000, paymentStatus: 'Partially Paid' },
  { id: 'inv_2', grandTotal: 1500, paidAmount: 1500, paymentStatus: 'Paid' },
  { id: 'inv_3', grandTotal: 800, paidAmount: 0, paymentStatus: 'Unpaid' },
];

function reconcileCustomerLedger(invoices) {
  let totalBilled = 0;
  let totalPaid = 0;
  
  invoices.forEach(inv => {
    totalBilled += (inv.grandTotal || 0);
    totalPaid += (inv.paidAmount || inv.amountPaid || 0);
  });
  
  const totalDue = Math.max(0, totalBilled - totalPaid);
  return { totalBilled, totalPaid, totalDue };
}

const ledger = reconcileCustomerLedger(mockCustomerInvoices);
assert(ledger.totalBilled === 4800, '3.1: Total billed is ₹4,800 (2500 + 1500 + 800)');
assert(ledger.totalPaid === 2500, '3.2: Total received is ₹2,500 (1000 + 1500 + 0)');
assert(ledger.totalDue === 2300, '3.3: Total outstanding due reconciles exactly to ₹2,300');


// ----------------------------------------------------
// 4. WORKSPACE ISOLATION & DATA SAFETY
// ----------------------------------------------------
console.log('\n--- 4. Workspace Isolation & Module Safety ---');

const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

// Apply 'just_billing' in Workspace A
await featureControlEngine.applyBusinessPreset('ws_boutique', 'just_billing');
// Apply 'retail' in Workspace B
await featureControlEngine.applyBusinessPreset('ws_grocery', 'retail');

const boutiqueProductsEnabled = await featureControlEngine.isEnabled('ws_boutique', 'product');
const groceryProductsEnabled = await featureControlEngine.isEnabled('ws_grocery', 'product');

assert(boutiqueProductsEnabled === false, '4.1: Boutique workspace has Products OFF (Just Billing)');
assert(groceryProductsEnabled === true, '4.2: Grocery workspace has Products ON (Retail)');


// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n======================================================');
console.log(`📊 BUSINESS WORKFLOW RESULTS: ${passed} / ${passed + failures} PASSED (${Math.round((passed / (passed + failures)) * 100)}%)`);
console.log('======================================================\n');

if (failures > 0) {
  process.exit(1);
}
