import assert from 'node:assert/strict';
import { FEATURE_REGISTRY, FEATURE_CATEGORIES, BUSINESS_SETUP_PRESETS } from '../src/services/featureRegistry.js';
import { featureControlEngine } from '../src/services/featureControlEngine.js';

// Setup Mock Environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {}
};

console.log('\n======================================================');
console.log('🧪 RUNNING BILLQYRO MODULE CONTROL SYSTEM TEST SUITE');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ----------------------------------------------------
// 1. FEATURE REGISTRY & PRESET VERIFICATION
// ----------------------------------------------------
test('1.1: Feature registry defines all core modules', () => {
  assert.ok(FEATURE_REGISTRY['invoice'], 'Invoicing core must exist');
  assert.ok(FEATURE_REGISTRY['customer'], 'Customer CRM must exist');
  assert.ok(FEATURE_REGISTRY['product'], 'Product catalog must exist');
  assert.ok(FEATURE_REGISTRY['product.inventory'], 'Inventory must exist');
  assert.ok(FEATURE_REGISTRY['product.stockTracking'], 'Stock tracking must exist');
  assert.ok(FEATURE_REGISTRY['product.lowStockAlert'], 'Low stock alert must exist');
  assert.ok(FEATURE_REGISTRY['payment'], 'Payment tracking must exist');
  assert.ok(FEATURE_REGISTRY['treasury'], 'Treasury must exist');
  assert.ok(FEATURE_REGISTRY['treasury.moneyOut'], 'Expenses must exist');
  assert.ok(FEATURE_REGISTRY['reports'], 'Reports must exist');
  assert.ok(FEATURE_REGISTRY['liveLink'], 'Live link must exist');
  assert.ok(FEATURE_REGISTRY['staff'], 'Staff must exist');
  assert.ok(FEATURE_REGISTRY['security'], 'Security must exist');
  assert.ok(FEATURE_REGISTRY['backup'], 'Backup must exist');
});

test('1.2: Business setup presets exist and are properly configured', () => {
  const presetIds = BUSINESS_SETUP_PRESETS.map(p => p.id);
  assert.ok(presetIds.includes('just_billing'), 'Just Billing preset must exist');
  assert.ok(presetIds.includes('billing_customers'), 'Billing + Customers preset must exist');
  assert.ok(presetIds.includes('retail'), 'Retail preset must exist');
  assert.ok(presetIds.includes('service'), 'Service preset must exist');
  assert.ok(presetIds.includes('custom'), 'Custom preset must exist');
});

// ----------------------------------------------------
// 2. PRESET APPLICATION & DEPENDENCY RESOLUTION
// ----------------------------------------------------
await runAsyncTest('2.1: Applying Just Billing preset enables only billing & payments', async () => {
  mockStorage.clear();
  const wsId = 'ws_simple_billing';
  
  await featureControlEngine.applyBusinessPreset(wsId, 'just_billing');

  const isInvoice = await featureControlEngine.isEnabled(wsId, 'invoice');
  const isPayment = await featureControlEngine.isEnabled(wsId, 'payment');
  const isCustomer = await featureControlEngine.isEnabled(wsId, 'customer');
  const isProduct = await featureControlEngine.isEnabled(wsId, 'product');
  const isInventory = await featureControlEngine.isEnabled(wsId, 'product.inventory');
  const isStaff = await featureControlEngine.isEnabled(wsId, 'staff');

  assert.equal(isInvoice, true, 'Invoice must be enabled');
  assert.equal(isPayment, true, 'Payment must be enabled');
  assert.equal(isCustomer, false, 'Customer must be disabled in Just Billing mode');
  assert.equal(isProduct, false, 'Product must be disabled in Just Billing mode');
  assert.equal(isInventory, false, 'Inventory must be disabled in Just Billing mode');
  assert.equal(isStaff, false, 'Staff must be disabled in Just Billing mode');
});

await runAsyncTest('2.2: Applying Retail preset enables products, inventory and stock tracking', async () => {
  mockStorage.clear();
  const wsId = 'ws_retail';
  
  await featureControlEngine.applyBusinessPreset(wsId, 'retail');

  const isInvoice = await featureControlEngine.isEnabled(wsId, 'invoice');
  const isCustomer = await featureControlEngine.isEnabled(wsId, 'customer');
  const isProduct = await featureControlEngine.isEnabled(wsId, 'product');
  const isInventory = await featureControlEngine.isEnabled(wsId, 'product.inventory');
  const isStockTracking = await featureControlEngine.isEnabled(wsId, 'product.stockTracking');
  const isLowStockAlert = await featureControlEngine.isEnabled(wsId, 'product.lowStockAlert');

  assert.equal(isInvoice, true, 'Invoice must be enabled');
  assert.equal(isCustomer, true, 'Customer must be enabled');
  assert.equal(isProduct, true, 'Product must be enabled');
  assert.equal(isInventory, true, 'Inventory must be enabled');
  assert.equal(isStockTracking, true, 'Stock Tracking must be enabled');
  assert.equal(isLowStockAlert, true, 'Low Stock Alert must be enabled');
});

await runAsyncTest('2.3: Dependency enforcement: Low Stock Alert disabled if Inventory is OFF', async () => {
  const wsId = 'ws_dep_test';
  await featureControlEngine.applyBusinessPreset(wsId, 'retail');

  // Turn OFF product.inventory
  await featureControlEngine.toggleFeature(wsId, 'product.inventory', false);

  const isLowStock = await featureControlEngine.isEnabled(wsId, 'product.lowStockAlert');
  assert.equal(isLowStock, false, 'Low Stock Alert must be effectively disabled when Inventory is OFF');
});

await runAsyncTest('2.4: enableFeatureWithDependencies auto-enables all prerequisites', async () => {
  const wsId = 'ws_auto_dep';
  await featureControlEngine.applyBusinessPreset(wsId, 'just_billing');

  // Low stock alert is OFF and its category is OFF in just_billing
  assert.equal(await featureControlEngine.isEnabled(wsId, 'product.lowStockAlert'), false);

  // Auto-enable low stock alert with all prerequisites
  await featureControlEngine.enableFeatureWithDependencies(wsId, 'product.lowStockAlert');

  assert.equal(await featureControlEngine.isEnabled(wsId, 'product'), true, 'Product should be auto-enabled');
  assert.equal(await featureControlEngine.isEnabled(wsId, 'product.inventory'), true, 'Inventory should be auto-enabled');
  assert.equal(await featureControlEngine.isEnabled(wsId, 'product.stockTracking'), true, 'Stock tracking should be auto-enabled');
  assert.equal(await featureControlEngine.isEnabled(wsId, 'product.lowStockAlert'), true, 'Low stock alert should now be active');
});

// ----------------------------------------------------
// 3. DATA PRESERVATION INVARIANTS (CRITICAL)
// ----------------------------------------------------
await runAsyncTest('3.1: Disabling a module NEVER deletes user data from storage', async () => {
  const wsId = 'ws_data_safety';
  
  // 1. Start with Retail (Products + Customers ON)
  await featureControlEngine.applyBusinessPreset(wsId, 'retail');
  
  // 2. Store mock products and customers in storage
  const mockProducts = [
    { id: 'p1', name: 'Silk Saree', price: 2500, stock: 15, workspaceId: wsId },
    { id: 'p2', name: 'Cotton Kurti', price: 800, stock: 40, workspaceId: wsId }
  ];
  const mockCustomers = [
    { id: 'c1', name: 'Aarav Sharma', phone: '+919876543210', workspaceId: wsId },
    { id: 'c2', name: 'Priya Verma', phone: '+919876543211', workspaceId: wsId }
  ];
  mockStorage.set('billqyro_products', JSON.stringify(mockProducts));
  mockStorage.set('billqyro_customers', JSON.stringify(mockCustomers));

  // 3. Disable Products and Customers completely
  await featureControlEngine.toggleCategory(wsId, 'products', false);
  await featureControlEngine.toggleCategory(wsId, 'customers', false);

  // 4. Verify features report disabled
  assert.equal(await featureControlEngine.isEnabled(wsId, 'product'), false);
  assert.equal(await featureControlEngine.isEnabled(wsId, 'customer'), false);

  // 5. INVARIANT CHECK: Products and Customers in storage MUST NOT BE PURGED
  const preservedProducts = JSON.parse(mockStorage.get('billqyro_products') || '[]');
  const preservedCustomers = JSON.parse(mockStorage.get('billqyro_customers') || '[]');

  assert.equal(preservedProducts.length, 2, 'Products data must be 100% preserved in storage');
  assert.equal(preservedProducts[0].name, 'Silk Saree', 'Product details must be intact');
  assert.equal(preservedCustomers.length, 2, 'Customers data must be 100% preserved in storage');
  assert.equal(preservedCustomers[0].name, 'Aarav Sharma', 'Customer details must be intact');

  // 6. Re-enable modules and verify immediate restoration
  await featureControlEngine.toggleCategory(wsId, 'products', true);
  await featureControlEngine.toggleCategory(wsId, 'customers', true);

  assert.equal(await featureControlEngine.isEnabled(wsId, 'product'), true);
  assert.equal(await featureControlEngine.isEnabled(wsId, 'customer'), true);
});

// ----------------------------------------------------
// 4. WORKSPACE ISOLATION
// ----------------------------------------------------
await runAsyncTest('4.1: Workspace A and Workspace B maintain completely isolated module states', async () => {
  const wsA = 'ws_boutique';
  const wsB = 'ws_quick_billing';

  // Workspace A = Retail (Products ON, Customers ON)
  await featureControlEngine.applyBusinessPreset(wsA, 'retail');

  // Workspace B = Just Billing (Products OFF, Customers OFF)
  await featureControlEngine.applyBusinessPreset(wsB, 'just_billing');

  // Query Workspace A
  const wsA_product = await featureControlEngine.isEnabled(wsA, 'product');
  const wsA_customer = await featureControlEngine.isEnabled(wsA, 'customer');

  // Query Workspace B
  const wsB_product = await featureControlEngine.isEnabled(wsB, 'product');
  const wsB_customer = await featureControlEngine.isEnabled(wsB, 'customer');

  assert.equal(wsA_product, true, 'Workspace A must have Product enabled');
  assert.equal(wsA_customer, true, 'Workspace A must have Customer enabled');

  assert.equal(wsB_product, false, 'Workspace B must have Product disabled');
  assert.equal(wsB_customer, false, 'Workspace B must have Customer disabled');
});

// ----------------------------------------------------
// 5. SETTINGS SAFETY INVARIANT
// ----------------------------------------------------
await runAsyncTest('5.1: Updating feature states preserves business name, currency, and logo', async () => {
  const wsId = 'ws_profile_test';
  
  // Set initial settings with custom profile
  const initialSettings = {
    activeWorkspaceId: wsId,
    businessName: 'Murafiq Fashion Hub',
    currency: 'INR',
    ownerName: 'Khairul Murafiq',
    logoUrl: 'https://example.com/logo.png',
    phone: '+919999988888'
  };
  mockStorage.set('billqyro_settings', JSON.stringify(initialSettings));

  // Toggle multiple features
  await featureControlEngine.applyBusinessPreset(wsId, 'retail');
  await featureControlEngine.toggleFeature(wsId, 'staff', true);
  await featureControlEngine.toggleFeature(wsId, 'staff.ledger', true);

  // Check persisted settings
  const finalSettings = JSON.parse(mockStorage.get('billqyro_settings') || '{}');

  assert.equal(finalSettings.businessName, 'Murafiq Fashion Hub', 'Business name must be preserved');
  assert.equal(finalSettings.currency, 'INR', 'Currency must be preserved');
  assert.equal(finalSettings.ownerName, 'Khairul Murafiq', 'Owner name must be preserved');
  assert.equal(finalSettings.logoUrl, 'https://example.com/logo.png', 'Logo URL must be preserved');
  assert.ok(finalSettings.workspaceFeatures[wsId], 'Workspace features map must be saved');
});

console.log('\n======================================================');
console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('======================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
