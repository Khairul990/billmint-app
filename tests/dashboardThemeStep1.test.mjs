import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboardPath = new URL('../src/pages/Dashboard.jsx', import.meta.url);
const source = fs.readFileSync(dashboardPath, 'utf8');

// Step 1 release guard: the dashboard must use BillQyro theme tokens
// and must not introduce the retired fixed dark dashboard backgrounds.
const forbiddenFixedDarkBackgrounds = [
  'bg-[#0d1117]',
  'bg-[#161b22]',
  'bg-[#0f141a]',
  'bg-[#111827]'
];

for (const token of forbiddenFixedDarkBackgrounds) {
  assert.equal(source.includes(token), false, `Fixed dark background token found: ${token}`);
}

// The dashboard surface and primary cards must remain theme-driven.
assert.match(source, /bg-theme-app/);
assert.match(source, /bg-theme-card/);
assert.match(source, /border-theme-border-soft/);
assert.match(source, /text-theme-primary/);
assert.match(source, /text-theme-muted/);

// Current command-center information architecture.
assert.match(source, />TOTAL REVENUE \(THIS MONTH\)</);
assert.match(source, />Today's Invoiced Volume</);
assert.match(source, /Revenue & Collection Trend/);
assert.match(source, /Collection Center/);
assert.match(source, /Business Health/);
assert.match(source, /Recent Invoices/);
assert.match(source, />Create Invoice</);
assert.match(source, />Record Payment</);

// Executive financial data must be calculated by the dashboard model.
for (const metric of [
  'todaysSales',
  'todaysCollected',
  'todaysOutstanding',
  'todaysPaymentCount',
  'thisMonthRevenue',
  'thisMonthCollected',
  'totalOutstanding',
  'collectionRate'
]) {
  assert.match(source, new RegExp(`\\b${metric}\\b`), `Missing dashboard metric: ${metric}`);
}

console.log('DASHBOARD THEME + STEP 1 GUARD: 100% PASSED');
