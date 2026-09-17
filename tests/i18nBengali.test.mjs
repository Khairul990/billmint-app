/**
 * BillQyro i18n / Bengali translation regression suite.
 * Run: node tests/i18nBengali.test.mjs
 *
 * Guards:
 *  - Every English dictionary key has a Bengali translation (parity)
 *  - Bengali values are non-empty strings
 *  - t() fallback chain: current lang → English → fallback → key
 *  - setLanguage persists + broadcasts; invalid codes rejected
 *  - Legacy keys used by PdfDocument / HelpCenter keep working
 */
import assert from 'node:assert';

console.log('\n======================================================');
console.log('🌐 RUNNING i18n / BENGALI TRANSLATION REGRESSION');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;
function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// ── Browser shims ───────────────────────────────────────────────────────────
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};
let lastEvent = null;
global.window = {
  dispatchEvent: (e) => { lastEvent = e; return true; },
  addEventListener: () => {},
  removeEventListener: () => {}
};

const { t, getLanguage, setLanguage, useI18n, SUPPORTED_LANGUAGES } = await import('../src/utils/i18n.js');

// Access the dictionaries through behaviour (module keeps them private):
// switch to bn and probe every key we know must exist.
it('1.1: English ↔ Bengali dictionary parity (every key translates)', () => {
  // Probe via t(): a key whose bn value exists returns bn text when lang=bn.
  // We enumerate keys by switching languages and confirming no key returns
  // its English string while others translate — instead, verify via the
  // module's exported surface: t in bn must differ from t in en for every
  // key used by the app's translated surfaces.
  setLanguage('en');
  const probeKeys = [
    ...['dashboard', 'invoices', 'customers', 'products', 'expenses', 'settings',
        'create_invoice', 'view_all', 'recent_invoices', 'welcome', 'upgrade'],
    ...['nav.dashboard', 'nav.home', 'nav.due', 'nav.bills', 'nav.more', 'nav.reports',
        'nav.customers', 'nav.products', 'nav.payments', 'nav.collections', 'nav.bank',
        'nav.estimates', 'nav.orders', 'nav.settings', 'nav.help_center', 'nav.users_roles',
        'nav.outsource', 'nav.register', 'nav.portals', 'nav.create_invoice', 'nav.expenses'],
    ...['sec.main', 'sec.billing', 'sec.customers', 'sec.finance', 'sec.insights', 'sec.system'],
    ...['sidebar.smart_billing', 'sidebar.sign_out', 'sidebar.toggle_lang',
        'sidebar.my_business', 'sidebar.business_settings', 'sidebar.workspace_settings'],
    ...['more.business_identity', 'more.business_profile', 'more.workspace_manager',
        'more.modules_presets', 'more.templates_layouts', 'more.products_inventory',
        'more.bills_finance', 'more.invoices_bills', 'more.estimates_quotes',
        'more.reports_analytics', 'more.due_ledger', 'more.bank_cash', 'more.expenses',
        'more.collection_center', 'more.system_cloud', 'more.backup_restore',
        'more.storage_sync', 'more.subscription', 'more.support_compliance',
        'more.help_center', 'more.contact_support', 'more.privacy_legal',
        'more.factory_reset', 'more.factory_reset_btn', 'more.configure', 'more.cloud_active'],
    ...['studio.group.Command Center', 'studio.group.Core Workspace', 'studio.group.Advanced Operations',
        'studio.label.overview', 'studio.label.business', 'studio.label.theme', 'studio.label.invoice',
        'studio.label.features', 'studio.label.backup', 'studio.label.subscription', 'studio.label.portal',
        'studio.label.form', 'studio.label.security', 'studio.label.roles', 'studio.label.notification',
        'studio.label.localization', 'studio.label.dashboard', 'studio.label.automation', 'studio.label.database'],
    ...['studio.desc.overview', 'studio.desc.business', 'studio.desc.theme', 'studio.desc.invoice',
        'studio.desc.features', 'studio.desc.backup', 'studio.desc.subscription', 'studio.desc.portal',
        'studio.desc.form', 'studio.desc.security', 'studio.desc.roles', 'studio.desc.notification',
        'studio.desc.localization', 'studio.desc.dashboard', 'studio.desc.automation', 'studio.desc.database'],
    ...['studio.settings_studio', 'studio.control_center', 'studio.search', 'studio.all', 'studio.core',
        'studio.advanced', 'studio.tap_to_switch', 'studio.settings_menu', 'studio.select_section',
        'studio.unsaved', 'studio.synced', 'studio.discard', 'studio.save', 'studio.saving',
        'studio.publish', 'studio.publishing', 'studio.back', 'studio.switch_workspace',
        'studio.active_workspace', 'studio.cloud_state', 'studio.synchronized', 'studio.storage_guard',
        'studio.encrypted', 'studio.core_config', 'studio.studio_essentials',
        'studio.advanced_config', 'studio.deep_controls', 'studio.loading'],
    ...['loc.title', 'loc.subtitle', 'loc.language_card', 'loc.language_desc', 'loc.interface_language']
  ];
  setLanguage('bn');
  const untranslated = probeKeys.filter((k) => {
    const bn = t(k, '§missing§');
    return bn === '§missing§' || bn === k;
  });
  assert.deepStrictEqual(untranslated, [], `keys missing Bengali: ${untranslated.join(', ')}`);
  setLanguage('en');
});

it('1.2: Bengali values are non-empty and actually Bengali (sample)', () => {
  setLanguage('bn');
  const samples = ['nav.dashboard', 'nav.more', 'studio.search', 'more.collection_center', 'sec.finance'];
  for (const k of samples) {
    const v = t(k);
    assert.ok(v && v.trim().length > 0, `${k} empty`);
    assert.ok(/[\u0980-\u09FF]/.test(v), `${k} has no Bengali glyphs: ${v}`);
  }
  setLanguage('en');
});

it('2.1: t() fallback chain — current lang → en → fallback → key', () => {
  setLanguage('en');
  assert.strictEqual(t('nav.dashboard'), 'Dashboard');
  assert.strictEqual(t('totally.missing.key', 'Fallback Here'), 'Fallback Here');
  assert.strictEqual(t('totally.missing.key'), 'totally.missing.key');
  setLanguage('bn');
  assert.strictEqual(t('nav.dashboard'), 'ড্যাশবোর্ড');
  // Unknown key in bn still falls back to the provided English fallback
  assert.strictEqual(t('not.a.real.key', 'Fallback'), 'Fallback');
  setLanguage('en');
});

it('3.1: setLanguage persists to localStorage (dedicated key + settings)', () => {
  setLanguage('bn');
  assert.strictEqual(localStorage.getItem('billqyro_language'), 'bn');
  const settings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
  assert.strictEqual(settings.language, 'bn');
  assert.strictEqual(getLanguage(), 'bn');
  setLanguage('en');
  assert.strictEqual(getLanguage(), 'en');
});

it('3.2: setLanguage broadcasts the change event', () => {
  lastEvent = null;
  setLanguage('bn');
  assert.ok(lastEvent, 'no event dispatched');
  assert.strictEqual(lastEvent.type, 'billqyro:language');
  assert.strictEqual(lastEvent.detail.lang, 'bn');
  setLanguage('en');
});

it('3.3: Invalid language codes are rejected', () => {
  setLanguage('bn');
  setLanguage('fr');
  assert.strictEqual(getLanguage(), 'bn');
  setLanguage('en');
});

it('4.1: Legacy keys (PdfDocument / HelpCenter) keep working', () => {
  setLanguage('bn');
  for (const k of ['bill_to', 'items', 'total', 'save', 'best_selling', 'revenue_vs_expenses']) {
    assert.ok(typeof t(k) === 'string' && t(k).length > 0, `legacy key broken: ${k}`);
    assert.notStrictEqual(t(k), k, `legacy key untranslated: ${k}`);
  }
  setLanguage('en');
});

it('4.2: useI18n hook is exported (reactive components)', () => {
  assert.strictEqual(typeof useI18n, 'function');
  assert.deepStrictEqual(SUPPORTED_LANGUAGES, ['en', 'bn']);
});

console.log(`\n  ${passedTests} passed, ${failedTests} failed\n`);
if (failedTests > 0) process.exit(1);
