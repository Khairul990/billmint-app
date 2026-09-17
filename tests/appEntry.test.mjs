/**
 * BillQyro Phase 26 — AppEntry + app-shell contracts
 * Run: node tests/appEntry.test.mjs
 *
 * Static source-contract tests (the runtime journey is covered by the
 * Playwright app-mode audit).
 */

import { readFileSync } from 'fs';

let passed = 0, failures = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ PASS: ${msg}`); }
  else { failures++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('\n======================================================');
console.log('🚪 RUNNING APP-ENTRY CONTRACT TEST SUITE (Phase 26)');
console.log('======================================================\n');

console.log('--- 1. appMode util ---');
{
  const src = readFileSync('./src/utils/appMode.js', 'utf8');
  assert(src.includes("billqyro_app_shell"), 'persistence key present');
  assert(src.includes("android-app://"), 'TWA referrer signal detected');
  assert(src.includes("display-mode: standalone"), 'standalone display-mode detected');
  assert(src.includes("source') === 'app'"), 'startUrl ?source=app signal detected');
}

console.log('--- 2. AppEntry screen ---');
{
  const src = readFileSync('./src/pages/AppEntry.jsx', 'utf8');
  assert(src.includes('embedded'), 'reuses the real Login panel (embedded)');
  assert(src.includes("generateDemoWorkspace"), 'demo journey still reachable');
  assert(src.includes("billqyro_demo_session_active"), 'demo flags set like the landing did');
  assert(src.includes("#login"), '/#login conversion flow lands in signup mode');
  assert(!/hero|testimonial|pricing|features-grid|footer-links/i.test(src), 'zero marketing sections');
  assert(src.includes('bg-theme-main'), 'app theme language (not website bq26 skin)');
  assert(src.includes('safe-area-inset-top'), 'status-bar safe area respected');
}

console.log('--- 3. App.jsx wiring ---');
{
  const src = readFileSync('./src/App.jsx', 'utf8');
  const sites = (src.match(/<Landing onLoginSuccess=\{handleLoginSuccess\} \/>/g) || []).length;
  const entrySites = (src.match(/<AppEntry onLoginSuccess=\{handleLoginSuccess\} \/>/g) || []).length;
  assert(entrySites >= 3, `all unauthenticated entries gated (found ${entrySites})`);
  assert(sites === 0 || entrySites >= sites, 'no ungated marketing landing left');
  assert(src.includes('isAppMode'), 'appMode util imported');
}

console.log('--- 4. Install nudge suppressed in app shell ---');
{
  const src = readFileSync('./src/components/PwaInstallPrompt.jsx', 'utf8');
  assert(src.includes('isAppMode()'), 'PwaInstallPrompt early-returns in app mode');
}

console.log('--- 5. TWA manifest (v1.0.3 APK) ---');
{
  const m = JSON.parse(readFileSync('/home/user/BillQyro-keystore-backup/twa-manifest.json', 'utf8'));
  assert(m.appVersion === '1.0.3' && m.appVersionCode === 4, 'version bumped to 1.0.3 / code 4');
  assert(m.startUrl === '/?source=app', 'APK startUrl carries ?source=app');
  assert(m.shortcuts.every((s) => s.url.includes('source=app')), 'all shortcuts carry source=app');
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
process.exit(failures > 0 ? 1 : 0);
