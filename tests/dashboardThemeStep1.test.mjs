import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboardPath = new URL('../src/pages/Dashboard.jsx', import.meta.url);
const source = fs.readFileSync(dashboardPath, 'utf8');

// Step 1 release guard: the reference layout must use BillQyro theme tokens
// rather than introducing a fixed dark dashboard background.
const forbiddenFixedDarkBackgrounds = [
  'bg-[#0d1117]',
  'bg-[#161b22]',
  'bg-[#0f141a]',
  'bg-[#111827]'
];

for (const token of forbiddenFixedDarkBackgrounds) {
  assert.equal(source.includes(token), false, `Fixed dark background token found: ${token}`);
}

// The dashboard surface itself and its primary cards must be theme-driven.
assert.match(source, /bg-theme-app/);
assert.match(source, /bg-theme-card/);
assert.match(source, /border-theme-border-soft/);
assert.match(source, /text-theme-primary/);
assert.match(source, /text-theme-muted/);

// Step 1 layout guards: all eight executive financial stats are present.
for (const label of [
  "Today's Sales",
  "Today's Collected",
  "Today's Due",
  "Today's Payments",
  'Month Revenue',
  'Month Collected',
  'Total Outstanding',
  'Collection Rate'
]) {
  assert.equal(source.includes(`>${label}</`), true, `Missing executive stat: ${label}`);
}

// Today's Performance must retain the reference information architecture.
assert.match(source, /Today's Performance/);
assert.match(source, /Collection Progress/);
assert.match(source, /Invoiced Today/);
assert.match(source, /Collected Today/);
assert.match(source, /Pending Today/);
assert.match(source, /Avg Payment/);
assert.match(source, /Largest Payment/);

console.log('DASHBOARD THEME + STEP 1 GUARD: 100% PASSED');
