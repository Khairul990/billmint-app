/**
 * BillQyro Phase 27 — Security hardening regression tests (master-spec §23/§24/§26)
 * Run: node tests/phase27SecurityHardening.test.mjs
 *
 * Source-level guarantees:
 *  1. The admin PIN gate is FAIL-CLOSED: no guessable default PIN ships in
 *     the bundle; an unconfigured gate stays locked.
 *  2. Cloud-function stubs never fake success: unavailable verification is
 *     'not verified', unavailable notifications are 'not sent'.
 *  3. Admin identity comes from server-verified Firebase token claims
 *     (tokenResult.claims.superAdmin), not client-side state.
 *  4. The dev-only admin bypass stays gated on import.meta.env.DEV.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

let passed = 0, failures = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ PASS: ${msg}`); }
  else { failures++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('\n======================================================');
console.log('🛡️  RUNNING SECURITY-HARDENING TEST SUITE (Phase 27)');
console.log('======================================================\n');

console.log('--- 1. Admin PIN gate is fail-closed ---');
{
  const src = read('src/pages/admin/AdminPINLogin.jsx');
  assert(!src.includes(": '1234'"), "no hardcoded '1234' fallback PIN in the bundle");
  assert(src.includes('? rawPin : null'), 'unconfigured PIN resolves to null (locked)');
  assert(src.includes('pinConfigured'), 'unconfigured state is surfaced in the UI');
}

console.log('--- 2. Cloud-function stubs never fake success ---');
{
  const src = read('src/services/cloudFunctions.js');
  assert(!src.includes('isValid: true'), 'payment verification never auto-returns valid');
  assert(!src.includes('success: true'), 'notifications never fake a successful send');
  assert(src.includes('isValid: false, unavailable: true'), 'unavailable verification reports not-verified');
  assert(src.includes('success: false, unavailable: true'), 'unavailable notifications report not-sent');
}

console.log('--- 3. Admin identity is server-verified ---');
{
  const app = read('src/App.jsx');
  assert(app.includes('tokenResult.claims.superAdmin'), 'session.isSuperAdmin sourced from Firebase ID-token claims');
  const rules = read('firestore.rules');
  assert(rules.includes('request.auth.token.superAdmin == true'), 'firestore rules enforce superAdmin claims server-side');
}

console.log('--- 4. Dev admin bypass is dev-only ---');
{
  const src = read('src/utils/adminAccess.js');
  assert(src.includes('if (import.meta.env.DEV) return true;'), 'DEV admin bypass gated on import.meta.env.DEV (stripped in prod builds)');
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
if (failures > 0) process.exitCode = 1;
