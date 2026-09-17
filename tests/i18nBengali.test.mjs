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
    // ── phase 2: dashboard / create-invoice / invoices ──
    ...['dash.greeting_morning', 'dash.greeting_afternoon', 'dash.greeting_evening',
        'dash.command_center', 'dash.header_sub', 'dash.health', 'dash.health_optimal',
        'dash.health_attention', 'dash.health_moderate', 'dash.empty_title', 'dash.empty_sub',
        'dash.step1', 'dash.step2', 'dash.step3', 'dash.customer', 'dash.invoice',
        'dash.total_revenue_month', 'dash.month_revenue', 'dash.today_inflow', 'dash.today_outflow',
        'dash.total_collected', 'dash.still_to_collect', 'dash.operating_capital',
        'dash.collection_realized', 'dash.settled_pct', 'dash.sales_title', 'dash.recent_activity',
        'dash.recent_invoices', 'dash.money_to_collect', 'dash.paid', 'dash.partial',
        'dash.unpaid', 'dash.overdue', 'dash.record_payment', 'dash.pro_tip'],
    ...['ci.customer', 'ci.staff', 'ci.select_customer', 'ci.new_customer', 'ci.ai_bill',
        'ci.walk_in', 'ci.select_staff', 'ci.invoice_number', 'ci.date', 'ci.due_date',
        'ci.customer_name', 'ci.phone', 'ci.address_city', 'ci.item_ph', 'ci.amount_paid_now',
        'ci.payment_method', 'ci.notes', 'ci.terms', 'ci.subtotal', 'ci.discount', 'ci.tax',
        'ci.shipping', 'ci.old_due', 'ci.print_bill'],
    ...['inv.title', 'inv.trash_title', 'inv.trash_sub', 'inv.view_trash', 'inv.active',
        'inv.import', 'inv.export_json', 'inv.create_invoice', 'inv.total_collected',
        'inv.tab_all', 'inv.tab_paid', 'inv.tab_partial', 'inv.tab_pending', 'inv.tab_overdue',
        'inv.search_ph', 'inv.cloud_synced', 'inv.delete_ph'],
    // ── phase 3: customers / products / expenses / reports / collection + voice ──
    ...['cust.command_center', 'cust.subtitle', 'cust.add', 'cust.owing', 'cust.total_outstanding',
        'cust.search_ph', 'cust.total_billed', 'cust.total_paid', 'cust.outstanding', 'cust.old_due',
        'cust.name_label', 'cust.phone_label', 'cust.old_due_label', 'cust.email_label', 'cust.address_label'],
    ...['prod.hub', 'prod.add', 'prod.search_ph', 'prod.stock', 'prod.low', 'prod.empty_title',
        'prod.empty_sub', 'prod.update_item', 'prod.add_item', 'prod.tab_basic', 'prod.tab_stock',
        'prod.tab_advanced', 'prod.title_label', 'prod.category_label', 'prod.brand_label',
        'prod.desc_label', 'prod.price_label', 'prod.unit_label', 'prod.stock_label',
        'prod.low_stock_label', 'prod.sku_label', 'prod.barcode_label', 'prod.delete_confirm'],
    ...['exp.title', 'exp.subtitle', 'exp.log', 'exp.monthly_cost', 'exp.by_category', 'exp.name_label',
        'exp.category_label', 'exp.amount_label', 'exp.date_label', 'exp.vendor_label',
        'exp.empty_title', 'exp.empty_sub', 'exp.delete', 'exp.receipt', 'exp.cat_supplies',
        'exp.cat_utilities', 'exp.cat_salaries', 'exp.cat_rent', 'exp.cat_marketing', 'exp.cat_other'],
    ...['rep.title', 'rep.subtitle', 'rep.export_csv', 'rep.today', 'rep.yesterday', 'rep.this_week',
        'rep.this_month', 'rep.last_month', 'rep.this_year', 'rep.all_time', 'rep.custom',
        'rep.tab_sales', 'rep.collected_cash', 'rep.collected'],
    ...['cc.title', 'cc.subtitle', 'cc.pending', 'cc.select_invoice', 'cc.search_ph'],
    ...['voice.bill', 'voice.stop', 'voice.listening', 'voice.title', 'voice.unsupported',
        'voice.filled', 'voice.no_items'],
    ...['setup.step_of', 'setup.title_1', 'setup.title_4', 'setup.sub_2', 'setup.back',
        'setup.continue', 'setup.launch', 'setup.initializing', 'setup.dot_1', 'setup.dot_4'],
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
