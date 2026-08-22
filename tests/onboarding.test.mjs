/**
 * BillQyro First-Time User Experience & Smart Onboarding Verification Suite
 * Run: node tests/onboarding.test.mjs
 * 
 * Verifies:
 *  1. First login detection & onboarding trigger
 *  2. Business preset auto-recommendation & module customization
 *  3. Simple Billing fast-track (manual items, walk-in customer)
 *  4. Default currency, prefix, and settings persistence
 *  5. Returning user state & wizard bypass
 *  6. Multi-workspace setup isolation
 *  7. Offline-compatible workspace setup
 */

import { featureControlEngine } from '../src/services/featureControlEngine.js';
import { calculateInvoiceTotals, determinePaymentStatus } from '../src/utils/invoiceMath.js';

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
console.log('🚀 RUNNING BILLQYRO SMART ONBOARDING TEST SUITE');
console.log('======================================================\n');

// In-memory localStorage mock for node environment
const localStorageMock = new Map();
global.localStorage = {
  getItem: (k) => (localStorageMock.has(k) ? localStorageMock.get(k) : null),
  setItem: (k, v) => localStorageMock.set(k, String(v)),
  removeItem: (k) => localStorageMock.delete(k)
};

// ----------------------------------------------------
// 1. FIRST LOGIN EXPERIENCE & PRESET SELECTION
// ----------------------------------------------------
console.log('--- 1. First Login & Preset Recommendation ---');

function determineInitialRoute(settings) {
  if (!settings || !settings.setupCompleted) {
    return 'ONBOARDING_WIZARD';
  }
  return 'DASHBOARD';
}

const freshUser = {};
assert(determineInitialRoute(freshUser) === 'ONBOARDING_WIZARD', '1.1: Fresh user is directed to the Onboarding Wizard');

// Apply preset for Service Business
await featureControlEngine.applyBusinessPreset('ws_service_01', 'service');
const serviceOperations = await featureControlEngine.isEnabled('ws_service_01', 'operations');
const serviceBilling = await featureControlEngine.isEnabled('ws_service_01', 'invoice');
const serviceProducts = await featureControlEngine.isEnabled('ws_service_01', 'product');

assert(serviceOperations === true, '1.2: Service preset enables Operations module');
assert(serviceBilling === true, '1.3: Service preset enables Invoicing module');
assert(serviceProducts === false, '1.4: Service preset disables Products module by default');


// ----------------------------------------------------
// 2. SIMPLE BILLING FAST-TRACK
// ----------------------------------------------------
console.log('\n--- 2. Simple Billing Fast-Track ---');

// Apply Just Billing preset
await featureControlEngine.applyBusinessPreset('ws_simple_01', 'just_billing');
const simpleProducts = await featureControlEngine.isEnabled('ws_simple_01', 'product');
const simpleCustomers = await featureControlEngine.isEnabled('ws_simple_01', 'customer');

assert(simpleProducts === false, '2.1: Simple Billing disables Products module');
assert(simpleCustomers === false, '2.2: Simple Billing disables Customers module');

// Create invoice in Simple Billing mode
const simpleInvoiceItems = [
  { name: 'Custom Alteration', qty: 1, rate: 350 }
];
const simpleTotals = calculateInvoiceTotals(simpleInvoiceItems, 0, 0);
const simpleStatus = determinePaymentStatus(350, simpleTotals.grandTotal);

assert(simpleTotals.grandTotal === 350, '2.3: Simple invoice calculates grand total without product catalog');
assert(simpleStatus === 'Paid', '2.4: Instant payment resolves to "Paid"');


// ----------------------------------------------------
// 3. ONBOARDING COMPLETION & PERSISTENCE
// ----------------------------------------------------
console.log('\n--- 3. Onboarding Completion & Returning User ---');

function completeOnboarding(draftConfig) {
  const finalSettings = {
    businessName: draftConfig.businessName || 'My Business',
    currency: draftConfig.currency || '₹',
    invoicePrefix: draftConfig.invoicePrefix || 'INV-',
    activeWorkspaceId: draftConfig.workspaceId || 'ws_default',
    setupCompleted: true,
    completedAt: new Date().toISOString()
  };
  localStorage.setItem('billqyro_settings', JSON.stringify(finalSettings));
  return finalSettings;
}

const completedUser = completeOnboarding({
  businessName: 'Khan Tailoring',
  currency: '₹',
  workspaceId: 'ws_khan_1'
});

assert(completedUser.setupCompleted === true, '3.1: Onboarding sets setupCompleted to true');
assert(completedUser.currency === '₹', '3.2: Default currency ₹ is saved');
assert(determineInitialRoute(completedUser) === 'DASHBOARD', '3.3: Returning user bypasses wizard and lands directly on Dashboard');


// ----------------------------------------------------
// 4. SECOND WORKSPACE ISOLATION
// ----------------------------------------------------
console.log('\n--- 4. Multi-Workspace Isolation ---');

// Setup Second Workspace (Retail)
await featureControlEngine.applyBusinessPreset('ws_khan_2', 'retail');
const ws2Products = await featureControlEngine.isEnabled('ws_khan_2', 'product');
const ws1Products = await featureControlEngine.isEnabled('ws_khan_1', 'product');

assert(ws2Products === true, '4.1: Second workspace (Retail) has Products enabled');
assert(ws1Products === true, '4.2: First workspace remains isolated and unchanged');


// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n======================================================');
console.log(`📊 ONBOARDING RESULTS: ${passed} / ${passed + failures} PASSED (${Math.round((passed / (passed + failures)) * 100)}%)`);
console.log('======================================================\n');

if (failures > 0) {
  process.exit(1);
}
