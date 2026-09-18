/**
 * BillQyro Phase 27 — App Shell Skin contracts
 * Run: node tests/phase27AppShell.test.mjs
 *
 * The app (APK/PWA) must wear its own native skin while the website
 * keeps the original chrome. Verifies the wiring end to end.
 */

import { readFileSync } from 'fs';

let passed = 0, failures = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ PASS: ${msg}`); }
  else { failures++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('\n======================================================');
console.log('📱 RUNNING APP-SHELL SKIN TEST SUITE (Phase 27)');
console.log('======================================================\n');

console.log('--- 1. App-mode default theme (index.html) ---');
{
  const html = readFileSync('./index.html', 'utf8');
  assert(html.includes("appShell ? 'emerald-royal' : 'sapphire-noir'"), 'app shell defaults to emerald-royal, website keeps sapphire-noir');
  assert(/userTheme \|\| adminTheme \|\| \(appShell/.test(html), 'explicit user/admin theme choice still wins');
  assert(html.includes("android-app:"), 'TWA referrer detected pre-React');
}

console.log('--- 2. App root carries the skin attribute ---');
{
  const app = readFileSync('./src/App.jsx', 'utf8');
  assert(app.includes("data-app-shell={appMode ? '1' : undefined}"), 'main-app wrapper tagged only in app mode');
}

console.log('--- 3. Native chrome in Layout ---');
{
  const l = readFileSync('./src/components/Layout.jsx', 'utf8');
  assert(l.includes("isAppMode"), 'Layout knows app mode');
  assert(l.includes("'app-chrome'"), 'header switches to app-chrome skin');
  assert(l.includes('app-page-title'), 'centered native page title rendered');
  assert(/app-hide/.test(l), 'webby decorations (clock cluster, Secure pill) hidden in app mode');
  assert(/<div key={currentTab} className="app-screen/.test(l), 'screens slide in, keyed per tab');
  assert(!/app-chrome/.test(readFileSync('./src/pages/Landing.jsx', 'utf8')), 'marketing landing untouched');
}

console.log('--- 4. Native tab bar ---');
{
  const b = readFileSync('./src/components/BottomNav.jsx', 'utf8');
  assert(b.includes("'app-tabbar'"), 'bottom nav switches to solid native tab bar');
  assert(b.includes("'app-tab-chip"), 'active tab uses native chip, not web gradient pill');
}

console.log('--- 5. Skin CSS ---');
{
  const css = readFileSync('./src/index.css', 'utf8');
  assert(css.includes('.app-chrome') && css.includes('.app-tabbar') && css.includes('.app-page-title'), 'skin classes defined');
  assert(/\.app-screen\s*\{\s*animation: appScreenIn/.test(css), 'slide-in animation defined');
  assert(/prefers-reduced-motion/.test(css), 'reduced-motion respected');
}

console.log('--- 6. Website must stay byte-identical in web mode ---');
{
  const l = readFileSync('./src/components/Layout.jsx', 'utf8');
  // In web mode every conditional falls back to the original classes.
  assert(l.includes("'bg-theme-app/80 backdrop-blur-2xl border-b border-theme-border-soft/70'"), 'web header classes preserved as fallback');
  const b = readFileSync('./src/components/BottomNav.jsx', 'utf8');
  assert(b.includes("'glass-strong border-t border-theme-border-soft backdrop-blur-2xl'"), 'web tab bar classes preserved as fallback');
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
process.exit(failures > 0 ? 1 : 0);
