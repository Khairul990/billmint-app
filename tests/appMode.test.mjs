/**
 * BillQyro Phase 26/27 — App-shell mode (APK/PWA entry redesign)
 * Run: node tests/appMode.test.mjs
 *
 * Verifies:
 *  1. Strong install signals (TWA referrer / standalone) switch on app mode
 *     and PERSIST — an installed app stays in app mode.
 *  2. Weak signal (?source=app link) applies to that visit only and never
 *     persists — one curious desktop click cannot hijack the browser.
 *  3. Desktop-class browser with a stuck flag RECOVERS to website mode
 *     (marketing landing + APK download always reachable on the web).
 *  4. Phone browser with the flag keeps app mode; clean phone visitor web.
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

// run_all_tests.mjs imports every suite into ONE process with shared
// browser mocks — snapshot the globals we touch and ALWAYS restore them.
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

// Shim the browser bits appMode reads: referrer, display-mode media query,
// desktop-width media query, touch support.
async function loadService(env) {
  const store = makeStorage(env.storage || {});
  const w = {
    location: { search: env.search || '' },
    navigator: { standalone: !!env.standalone },
    matchMedia: (q) => ({
      matches: q.includes('standandalone') ? !!env.standalone
        : q.includes('min-width') ? !!env.desktop
        : false,
    }),
  };
  if (env.touch) w.ontouchstart = () => {};
  globalThis.localStorage = store;
  globalThis.window = w;
  globalThis.document = { referrer: env.referrer || '' };
  const mod = await import(`../src/utils/appMode.js?t=${Date.now()}-${Math.random()}`);
  return { mod, store };
}

console.log('\n======================================================');
console.log('📱 RUNNING APP-MODE TEST SUITE (Phase 26/27)');
console.log('======================================================\n');

try {
  console.log('--- 1. Strong install signals persist ---');
  {
    const { mod, store } = await loadService({ referrer: 'android-app://com.billqyro.app', touch: true });
    assert(mod.isAppMode() === true, 'TWA android-app:// referrer → app mode');
    assert(store.getItem('billqyro_app_shell') === '1', 'strong signal persists the flag');

    const p = await loadService({ standalone: true, touch: true });
    assert(p.mod.isAppMode() === true, 'display-mode standalone → app mode');
  }

  console.log('--- 2. Weak link signal never persists ---');
  {
    const { mod, store } = await loadService({ search: '?source=app', touch: true });
    assert(mod.isAppMode() === true, '?source=app → app mode for this visit');
    assert(store.getItem('billqyro_app_shell') === null, 'no flag persisted from a link visit');

    const p2 = await loadService({ search: '?source=pwa', touch: true });
    assert(p2.mod.isAppMode() === true, '?source=pwa → app mode for this visit');
  }

  console.log('--- 3. Desktop recovery from a stuck flag ---');
  {
    const { mod, store } = await loadService({
      desktop: true, // min-width 1024 matches, no touch, no standalone, no referrer
      storage: { billqyro_app_shell: '1' },
    });
    assert(mod.isAppMode() === false, 'stuck flag in a desktop browser → website mode');
    assert(store.getItem('billqyro_app_shell') === null, 'stuck flag cleared');

    const clean = await loadService({ desktop: true, search: '' });
    assert(clean.mod.isAppMode() === false, 'clean desktop visit → website mode');

    const preview = await loadService({ desktop: true, search: '?source=app' });
    assert(preview.mod.isAppMode() === true, 'explicit ?source=app preview still works on desktop');
    assert(preview.store.getItem('billqyro_app_shell') === null, 'desktop preview does not persist');
  }

  console.log('--- 4. Phone browser behaviour ---');
  {
    const phone = await loadService({ touch: true, storage: { billqyro_app_shell: '1' } });
    assert(phone.mod.isAppMode() === true, 'flagged phone browser keeps app mode');

    const fresh = await loadService({ touch: true, search: '', referrer: 'https://google.com/' });
    assert(fresh.mod.isAppMode() === false, 'clean phone visitor → website (landing) mode');
  }

  console.log('--- 5. Corrupt storage never throws ---');
  {
    let crashed = false, result = null;
    try {
      const r = await loadService({ storage: { billqyro_app_shell: 'garbage' }, search: '', touch: true });
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
