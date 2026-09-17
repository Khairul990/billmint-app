/**
 * BillQyro Phase 26 — App-shell mode (APK/PWA entry redesign)
 * Run: node tests/appMode.test.mjs
 *
 * Verifies:
 *  1. ?source=app / ?source=pwa / android-app:// referrer / standalone
 *     each switch app-mode on and persist it
 *  2. Plain website visits stay in web (landing) mode
 *  3. Persisted flag keeps app-mode after the query string is gone
 *  4. Corrupt storage never throws
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

// run_all_tests.mjs imports every suite into ONE process with shared
// browser mocks — snapshot the globals we touch and ALWAYS restore them,
// otherwise this suite breaks the ones that run after it.
const ORIG = {
  window: globalThis.window,
  document: globalThis.document,
  localStorage: globalThis.localStorage,
};
const restoreGlobals = () => {
  for (const [k, v] of Object.entries(ORIG)) {
    if (v === undefined) delete globalThis[k]; else globalThis[k] = v;
  }
};

// The util reads window.location/document.referrer/matchMedia at evaluation
// time — shim them per scenario, then re-import with a cache-buster.
async function loadService(env) {
  const store = makeStorage(env.storage || {});
  const search = env.search || '';
  const referrer = env.referrer || '';
  const standalone = !!env.standalone;
  globalThis.localStorage = store;
  globalThis.window = {
    location: { search },
    navigator: { standalone },
    matchMedia: () => ({ matches: standalone }),
  };
  globalThis.document = { referrer };
  const mod = await import(`../src/utils/appMode.js?t=${Date.now()}-${Math.random()}`);
  return { mod, store };
}

console.log('\n======================================================');
console.log('📱 RUNNING APP-MODE TEST SUITE (Phase 26)');
console.log('======================================================\n');

try {
  console.log('--- 1. App signals ---');
  {
    const { mod, store } = await loadService({ search: '?source=app' });
    assert(mod.isAppMode() === true, '?source=app → app mode');
    assert(store.getItem('billqyro_app_shell') === '1', 'flag persisted');

    const p2 = await loadService({ search: '?source=pwa' });
    assert(p2.mod.isAppMode() === true, '?source=pwa → app mode');

    const p3 = await loadService({ referrer: 'android-app://com.billqyro.app' });
    assert(p3.mod.isAppMode() === true, 'android-app:// referrer (TWA) → app mode');

    const p4 = await loadService({ standalone: true });
    assert(p4.mod.isAppMode() === true, 'display-mode standalone → app mode');
  }

  console.log('--- 2. Plain web visit stays web ---');
  {
    const { mod } = await loadService({ search: '', referrer: 'https://google.com/' });
    assert(mod.isAppMode() === false, 'no signals → web (landing) mode');
  }

  console.log('--- 3. Persistence after query string drops ---');
  {
    const first = await loadService({ search: '?source=app' });
    assert(first.mod.isAppMode() === true, 'app mode active on first open');
    const again = await loadService({ search: '', storage: { billqyro_app_shell: first.store.getItem('billqyro_app_shell') } });
    assert(again.mod.isAppMode() === true, 'flag survives navigation without query');
  }

  console.log('--- 4. Corrupt storage never throws ---');
  {
    let crashed = false, result = null;
    try {
      const r = await loadService({ storage: { billqyro_app_shell: 'garbage' }, search: '' });
      result = r.mod.isAppMode();
    } catch { crashed = true; }
    assert(!crashed, 'garbage flag value does not throw');
    assert(result === false, 'garbage flag treated as web mode');
  }
} finally {
  restoreGlobals();
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
if (failures > 0) process.exitCode = 1;
