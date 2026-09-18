/**
 * BillQyro Phase 27 — Android touch-target contracts
 * Run: node tests/phase27TouchTargets.test.mjs
 *
 * Verifies the mobile touch-target system (master-spec §23/§30):
 *  1. .tap-target utility exists in index.css (pointer:coarse hit-area expansion)
 *  2. Compact icon-action buttons across list pages carry .tap-target
 *  3. InvoiceCard multi-select checkbox sits inside a padded label (real tap target)
 *  4. Desktop remains visually unchanged (media-scoped rule only)
 */

import { readFileSync } from 'fs';

let passed = 0, failures = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ PASS: ${msg}`); }
  else { failures++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('\n======================================================');
console.log('👆 RUNNING PHASE 27 TOUCH-TARGET TEST SUITE');
console.log('======================================================\n');

console.log('--- 1. tap-target utility ---');
{
  const css = readFileSync('./src/index.css', 'utf8');
  assert(css.includes('.tap-target'), '.tap-target class defined');
  assert(/@media \(pointer: coarse\)[\s\S]*\.tap-target::after/.test(css), 'hit-area expansion is pointer:coarse-scoped (desktop untouched)');
  assert(/inset: -8px/.test(css), 'hit area expands 8px in every direction');
}

console.log('--- 2. Icon actions carry tap-target ---');
{
  const files = [
    'src/pages/Customers.jsx', 'src/pages/Products.jsx', 'src/pages/Invoices.jsx',
    'src/pages/Estimates.jsx', 'src/pages/Orders.jsx', 'src/pages/Expenses.jsx',
  ];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const total = (src.match(/p-[12](\.5)? text-theme-muted hover/g) || []).length;
    const tagged = (src.match(/tap-target p-[12](\.5)? text-theme-muted hover/g) || []).length;
    assert(total === tagged, `${f}: ${tagged}/${total} compact icon buttons tap-targeted`);
  }
  const ci = readFileSync('./src/pages/CreateInvoice.jsx', 'utf8');
  assert(ci.includes('tap-target p-1.5 rounded-lg'), 'CreateInvoice item toggles tap-targeted');
}

console.log('--- 3. InvoiceCard checkbox tap target ---');
{
  const src = readFileSync('./src/components/InvoiceCard.jsx', 'utf8');
  assert(/<label[^>]*p-3[^>]*>\s*<input[^>]+type="checkbox"/.test(src), 'multi-select checkbox wrapped in padded label');
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
process.exit(failures > 0 ? 1 : 0);
