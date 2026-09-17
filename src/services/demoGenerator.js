// Demo / Sandbox data generator.
// Produces a realistic, premium-feeling sample workspace so visitors can tour
// the full platform from the landing page without registering.
//
// Phase 23: delegates to the category-aware engine (demoDataGenerator) so the
// demo workspace matches the business category the visitor was exploring on
// the landing page (retail, tailor, doctor, restaurant…), while keeping the
// rich invoice/expense document shapes the app components expect.

import { generateSmartDemoData } from '../utils/demoDataGenerator';

const DEMO_PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank Transfer'];

const pick = (arr, i) => arr[i % arr.length];

export const generateDemoWorkspace = (persona = 'retail') => {
  const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';
  if (!isSandbox) {
    console.error('Cannot generate demo data outside of Sandbox mode.');
    return false;
  }

  const now = Date.now();
  const { products, customers, invoices: smartInvoices, payments, expenses: smartExpenses, settings: smartSettings } = generateSmartDemoData(persona);

  // ── Invoices — rich document shape (sn/description/qty/rate, subtotal,
  //    payment history, public token for the live-link tour) ────────────────
  const generatedInvoices = smartInvoices.map((inv, i) => {
    const items = inv.items.map((it, j) => ({
      sn: j + 1,
      description: it.name,
      qty: it.quantity,
      rate: it.price,
      amount: it.price * it.quantity
    }));
    const subtotal = items.reduce((sum, it) => sum + it.amount, 0);
    const amountPaid = Math.min(inv.amountPaid, subtotal);
    return {
      ...inv,
      invoiceNumber: `INV-${1001 + i}`,
      items,
      subtotal,
      taxAmount: 0,
      taxPercentage: 0,
      grandTotal: subtotal,
      amountPaid,
      balanceDue: subtotal - amountPaid,
      syncStatus: 'synced',
      publicToken: `demo_token_${i}`,
      paymentHistory: amountPaid > 0 ? [{
        id: `ph-${now}-${i}`,
        date: inv.date,
        amount: amountPaid,
        method: pick(DEMO_PAYMENT_METHODS, i),
        reviewer: 'Sandbox AutoGen'
      }] : []
    };
  });
  generatedInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ── Expenses — dashboard widget shape (recurring rent/utility series) ────
  const generatedExpenses = smartExpenses.map((e, i) => {
    const isRecurring = e.kind === 'rent' || e.kind === 'utilities';
    return {
      ...e,
      title: e.description,
      paymentMethod: pick(DEMO_PAYMENT_METHODS, i + 1),
      notes: 'Sample expense entry',
      vendor: '—',
      recurring: isRecurring,
      seriesId: isRecurring ? `${e.kind}|monthly` : undefined,
      syncStatus: 'synced'
    };
  });

  localStorage.setItem('billqyro_demo_customers', JSON.stringify(customers));
  localStorage.setItem('billqyro_demo_products', JSON.stringify(products));
  localStorage.setItem('billqyro_demo_invoices', JSON.stringify(generatedInvoices));
  localStorage.setItem('billqyro_demo_expenses', JSON.stringify(generatedExpenses));
  localStorage.setItem('billqyro_demo_payments', JSON.stringify(payments));

  // ── Settings — category-branded identity, setup marked complete so demo
  //    visitors land directly on the dashboard ──────────────────────────────
  const settings = JSON.parse(localStorage.getItem('billqyro_demo_settings') || '{}');
  Object.assign(settings, smartSettings, {
    nextInvoiceNumber: 1001 + generatedInvoices.length,
    setupCompleted: true,
    profileSetupCompleted: true,
    businessSetupCompleted: true,
    businessType: persona,
    businessPhone: '+91 98300 00000',
    businessEmail: 'demo@billqyro.app',
    currency: 'INR',
    themeColor: settings.themeColor || 'brand-premium',
    // The demo showcases the FULL product — premium plan so visitors are never
    // stopped by free-tier / platform-due gates while exploring the sandbox.
    isPremium: true,
    subscriptionPlan: 'pro',
    plan: 'pro',
    subscriptionStatus: 'active'
  });
  localStorage.setItem('billqyro_demo_settings', JSON.stringify(settings));

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('billqyro_sync'));
  return true;
};

export const resetSandboxData = () => {
  const isSandbox = localStorage.getItem('billqyro_demo_session_active') === 'true';
  if (!isSandbox) {
    console.error('Cannot reset sandbox data outside of Sandbox mode.');
    return false;
  }
  localStorage.removeItem('billqyro_demo_customers');
  localStorage.removeItem('billqyro_demo_products');
  localStorage.removeItem('billqyro_demo_invoices');
  localStorage.removeItem('billqyro_demo_expenses');
  localStorage.removeItem('billqyro_demo_payments');
  localStorage.removeItem('billqyro_demo_settings');
  return true;
};
