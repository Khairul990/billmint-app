/**
 * BillQyro Phase 26/27 — App-shell mode (APK/PWA entry redesign)
 * Run: node tests/appMode.test.mjs
 *
 * Verifies:
 *  1. Strong install signals (TWA referrer / standalone) → app mode.
 *  2. App link (?source=app) → app mode for THAT TAB SESSION only — on
 *     phones AND desktops; a fresh session gets the website back.
 *  3. Session continuity: full-page navigations inside the app (query
 *     string dropped) keep app mode via the session flag.
 *  4. Stale localStorage flags from older builds are cleaned up — no more
 *     permanently hijacked browsers.
 *  5. Corrupt storage never throws.
 */

function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

let passed = 0, failures = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ PASS: ${msg}`); }
  else { failures++; console.error(`  ❌ FAIL: ${msg}`); }
}

// run_all_tests.mjs imports every suite into ONE process — snapshot and
// always restore the globals we touch.
const ORIG = {
  window: globalThis.window,
  document: globalThis.document,
  localStorage: globalThis.localStorage,
  sessionStorage: globalThis.sessionStorage,
};
const restoreGlobals = () => {
  for (const [k, v] of Object.entries(ORIG)) {
    if (v === undefined) delete globalThis[k]; else globalThis[k] = v;
  }
};

async function loadService(env = {}) {
  const local = makeStorage(env.storage || {});
  const session = makeStorage(env.session || {});
  globalThis.localStorage = local;
  globalThis.sessionStorage = session;
  globalThis.window = {
    location: { search: env.search || '' },
    navigator: { standalone: !!env.standalone },
    matchMedia: (q) => ({ matches: q.includes('standalone') ? !!env.standalone : false }),
  };
  globalThis.document = { referrer: env.referrer || '' };
  const mod = await import(`../src/utils/appMode.js?t=${Date.now()}-${Math.random()}`);
  return { mod, local, session };
}

console.log('\n======================================================');
console.log('📱 RUNNING APP-MODE TEST SUITE (Phase 26/27)');
console.log('======================================================\n');

try {
  console.log('--- 1. Strong install signals ---');
  {
    const { mod } = await loadService({ referrer: 'android-app://com.billqyro.app' });
    assert(mod.isAppMode() === true, 'TWA android-app:// referrer → app mode');

    const p = await loadService({ standalone: true });
    assert(p.mod.isAppMode() === true, 'display-mode standalone → app mode');
  }

  console.log('--- 2. App link is session-only (phone AND desktop) ---');
  {
    const phone = await loadService({ search: '?source=app' });
    assert(phone.mod.isAppMode() === true, '?source=app → app mode (this visit)');
    assert(phone.session.getItem('billqyro_app_shell_session') === '1', 'session flag set');

    // same browser, brand-new tab session, plain visit → website back
    const fresh = await loadService({ search: '', referrer: 'https://google.com/' });
    assert(fresh.mod.isAppMode() === false, 'fresh session (no param) → website mode');

    const freshPhone = await loadService({ search: '', referrer: 'https://google.com/' });
    assert(freshPhone.mod.isAppMode() === false, 'phone browser fresh visit → website (landing) mode');
  }

  console.log('--- 3. Session continuity inside the app ---');
  {
    // the demo journey navigates location.href='/' — query drops, same session
    const cont = await loadService({ search: '', session: { billqyro_app_shell_session: '1' } });
    assert(cont.mod.isAppMode() === true, 'session flag keeps app mode after the query drops');
  }

  console.log('--- 4. Stale localStorage flags are cleaned ---');
  {
    const { mod, local } = await loadService({ storage: { billqyro_app_shell: '1' } });
    assert(mod.isAppMode() === false, 'stale localStorage flag → website mode (no hijack)');
    assert(local.getItem('billqyro_app_shell') === null, 'stale flag removed');
  }

  console.log('--- 5. Corrupt storage never throws ---');
  {
    let crashed = false, result = null;
    try {
      const r = await loadService({});
      globalThis.sessionStorage = { getItem: () => { throw new Error('boom'); }, setItem: () => {}, removeItem: () => {} };
      const m2 = await import(`../src/utils/appMode.js?t=${Date.now()}-x`);
      result = m2.isAppMode();
    } catch { crashed = true; }
    assert(!crashed, 'throwing storage does not crash the app');
    assert(result === false, 'storage failure degrades to web mode');
  }
} finally {
  restoreGlobals();
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
if (failures > 0) process.exitCode = 1;
