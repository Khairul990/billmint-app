import { calculateTotals } from '../utils/invoiceUtils.js';

// Setup mock for testing calculateTotals
console.log('--- TEST 1: Single Row ---');
const items1 = [{ qty: 1, rate: 500, discount: 50 }];
// Expected:
// Row Amount = (1 * 500) - 50 = 450
// Subtotal = 450
// Tax (10%) = 450 * 0.10 = 45
// Grand Total = 495
const result1 = calculateTotals(items1, 10, 0);
console.log(result1);
console.log('Pass:', result1.subtotal === 450 && result1.taxAmount === 45 && result1.grandTotal === 495);

console.log('\n--- TEST 2: 24 Rows ---');
const items24 = Array.from({ length: 24 }, (_, i) => ({
  qty: 2,
  rate: 100,
  discount: 0
}));
// Expected:
// Row Amount = 2 * 100 = 200
// Subtotal = 24 * 200 = 4800
// Tax (5%) = 4800 * 0.05 = 240
// Grand Total = 5040
const result2 = calculateTotals(items24, 5, 0);
console.log(result2);
console.log('Pass:', result2.subtotal === 4800 && result2.taxAmount === 240 && result2.grandTotal === 5040);

console.log('\n--- TEST 3: Global Discount ---');
const items3 = [{ qty: 2, rate: 1000, discount: 100 }];
// Expected:
// Row Amount = 2000 - 100 = 1900
// Subtotal = 1900
// Global Discount = 500
// Taxable = 1900 - 500 = 1400
// Tax (18%) = 1400 * 0.18 = 252
// Grand Total = 1400 + 252 = 1652
const result3 = calculateTotals(items3, 18, 500);
console.log(result3);
console.log('Pass:', result3.subtotal === 1900 && result3.taxAmount === 252 && result3.grandTotal === 1652);
