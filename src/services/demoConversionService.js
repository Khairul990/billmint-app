/**
 * Demo → real-account conversion.
 *
 * A visitor exploring the live demo builds a whole workspace (customers,
 * invoices, products, expenses). When they decide to create a free account we
 * stash that sandbox data, walk them to signup, and after their real account
 * exists we offer to import everything — "continue exactly where you left
 * off" instead of starting from zero.
 */

const STASH_KEY = 'billqyro_demo_convert_stash';
export const SIGNUP_HINT_KEY = 'billqyro_open_signup';

const DEMO_DATA_KEYS = [
  'billqyro_demo_customers',
  'billqyro_demo_invoices',
  'billqyro_demo_products',
  'billqyro_demo_expenses',
  'billqyro_demo_payments',
  'billqyro_demo_settings'
];

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

/** Snapshot the demo sandbox so it survives exiting demo mode. */
export const stageDemoForConversion = () => {
  try {
    const invoices = readJson('billqyro_demo_invoices', []);
    const customers = readJson('billqyro_demo_customers', []);
    const products = readJson('billqyro_demo_products', []);
    const expenses = readJson('billqyro_demo_expenses', []);
    const payments = readJson('billqyro_demo_payments', []);
    const settings = readJson('billqyro_demo_settings', {});
    if (!Array.isArray(invoices) || invoices.length === 0) return null;

    const stash = {
      appName: 'BillQyro',
      stagedAt: new Date().toISOString(),
      persona: settings.businessType || 'retail',
      summary: {
        invoices: invoices.length,
        customers: customers.length,
        products: products.length,
        expenses: expenses.length,
        payments: payments.length
      },
      payload: {
        appName: 'BillQyro',
        settings,
        customers,
        products,
        invoices,
        expenses,
        payments
      }
    };
    localStorage.setItem(STASH_KEY, JSON.stringify(stash));
    return stash.summary;
  } catch { return null; }
};

/** Staged sandbox waiting for a real account (or null). */
export const getStagedConversion = () => {
  try {
    const raw = localStorage.getItem(STASH_KEY);
    if (!raw) return null;
    const stash = JSON.parse(raw);
    if (!stash || !stash.payload || !Array.isArray(stash.payload.invoices)) return null;
    return stash;
  } catch { return null; }
};

const clearDemoSandbox = () => {
  DEMO_DATA_KEYS.forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('billqyro_demo_session_active');
  localStorage.removeItem('billqyro_demo_journey_mode');
  localStorage.removeItem('billqyro_demo_logged_in');
  localStorage.removeItem('billqyro_demo_video_creator');
};

/**
 * Import the staged demo workspace into the signed-in account.
 * Must run AFTER authentication so Firestore writes target the right user.
 * Demo premium flags are stripped — a real free account starts free.
 */
export const importStagedDemoIntoAccount = async () => {
  const stash = getStagedConversion();
  if (!stash) throw new Error('No staged demo data.');

  const { importRestore } = await import('./dbEngine.js');
  const settings = { ...(stash.payload.settings || {}) };
  // Real account: remove the sandbox's showcase-premium markers.
  delete settings.isPremium;
  delete settings.subscriptionPlan;
  delete settings.plan;
  settings.subscriptionStatus = 'active';
  settings.importedFromDemo = true;
  settings.importedAt = new Date().toISOString();

  const payload = {
    ...stash.payload,
    settings,
    subscription: null
  };
  await importRestore(payload);

  localStorage.removeItem(STASH_KEY);
  clearDemoSandbox();
  return payload;
};

/** Drop the staged sandbox entirely (user chose to start fresh). */
export const discardStagedConversion = () => {
  localStorage.removeItem(STASH_KEY);
  clearDemoSandbox();
};
