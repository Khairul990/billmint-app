import * as dbEngine from './dbEngine.js';
import { submitPremiumRequest as dbSubmitPremiumRequest } from './dbEngine.js';
import { doc, getDoc } from './fsHelpers.js';
import { db, firebaseReady } from './firebaseConfig.js';
import { getAuthSession } from './dbEngine.js';

const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    limits: {
      invoices: 10,
      customers: 5,
      products: 10,
      users: 1
    },
    features: ['basic_invoicing', 'pdf_download', 'offline_mode']
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    limits: {
      invoices: 500,
      customers: 200,
      products: 500,
      users: 3
    },
    features: ['basic_invoicing', 'pdf_download', 'offline_mode', 'premium_themes', 'customer_portal', 'payment_links']
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    limits: {
      invoices: Infinity,
      customers: Infinity,
      products: Infinity,
      users: Infinity
    },
    features: ['basic_invoicing', 'pdf_download', 'offline_mode', 'premium_themes', 'customer_portal', 'payment_links', 'api_access', 'custom_domain', 'white_label']
  }
};

class SubscriptionEngine {
  // In-memory plan-doc cache: { [planId]: { details, at } }. Successes and
  // failures both cache for 5 minutes, so no caller pattern can hot-loop
  // Firestore reads (this once caused a permission-denied error storm).
  _planCache = {};

  _setPlanCache(planId, details, at) { this._planCache[planId] = { details, at }; }

  _hasAuthSession() {
    try {
      const session = getAuthSession();
      return !!(session && (session.uid || session.email));
    } catch { return false; }
  }

  getSubscriptionDetailsSync(settings) {
    const planId = settings?.subscriptionPlan || settings?.plan || (settings?.isPremium ? 'pro' : 'free');
    const isPremium = settings?.isPremium || (planId !== 'free' && planId !== 'Free');
    const planDetails = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    
    return {
      planId: planDetails.id,
      name: planDetails.name,
      status: isPremium ? 'premium' : (settings?.subscriptionStatus || 'active'),
      renewalDate: settings?.renewalDate || null,
      limits: planDetails.limits,
      features: planDetails.features
    };
  }

  async getSubscriptionDetails(workspaceId) {
    const settings = await dbEngine.getSettings(workspaceId);
    const planId = settings?.subscriptionPlan || settings?.plan || (settings?.isPremium ? 'pro' : 'free');
    const isPremium = settings?.isPremium || (planId !== 'free' && planId !== 'Free');

    let planDetails = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;

    // Guard: only fetch the dynamic plan document when Firebase is actually
    // configured AND someone is signed in. The doc lives behind auth rules, so
    // anonymous calls (public landing) always fail with permission-denied.
    if (firebaseReady && this._hasAuthSession()) {
      const cacheKey = planId.toLowerCase();
      const now = Date.now();
      const cached = this._planCache?.[cacheKey];
      // Serve from cache while fresh, or while a recent failure is backing off
      // (prevents hot retry loops from ever hammering Firestore again).
      if (cached && (now - cached.at) < 5 * 60 * 1000) {
        planDetails = cached.details;
      } else {
        try {
          const planDoc = await getDoc(doc(db, 'subscriptionPlans', cacheKey));
          if (planDoc.exists()) {
            const data = planDoc.data();
            planDetails = {
              id: data.id || data.slug || planId,
              name: data.name,
              limits: {
                invoices: data.limits.maxInvoices === -1 ? Infinity : data.limits.maxInvoices,
                maxInvoices: data.limits.maxInvoices,
                customers: data.limits.maxCustomers === -1 ? Infinity : data.limits.maxCustomers,
                products: data.limits.maxProducts === -1 ? Infinity : data.limits.maxProducts,
                users: data.limits.maxTeamMembers === -1 ? Infinity : data.limits.maxTeamMembers
              },
              features: Object.keys(data.toggles).filter(k => data.toggles[k]),
              ...data
            };
            this._setPlanCache(cacheKey, planDetails, now);
          }
        } catch (e) {
          // Remember the failure for 60s so callers in a loop back off instead
          // of spamming Firestore (this once flooded the console ~7x/second).
          this._setPlanCache(cacheKey, planDetails, now);
          console.warn('Dynamic plan fetch unavailable, using built-in plan limits');
        }
      }
    }

    return {
      planId: planDetails.id,
      name: planDetails.name,
      status: isPremium ? 'premium' : (settings?.subscriptionStatus || 'active'),
      renewalDate: settings?.renewalDate || null,
      limits: planDetails.limits,
      features: planDetails.features,
      rawPlan: planDetails
    };
  }

  async checkLimit(workspaceId, resourceType, currentCount) {
    const sub = await this.getSubscriptionDetails(workspaceId);
    if (!sub || !sub.limits) return true; // Fail safe open if not found? Usually fail closed.
    
    const limit = sub.limits[resourceType];
    if (limit === Infinity) return true;
    if (limit === undefined) return false;
    
    return currentCount < limit;
  }

  async hasFeature(workspaceId, featureName) {
    const sub = await this.getSubscriptionDetails(workspaceId);
    return sub.features.includes(featureName);
  }

  async upgradePlan(workspaceId, newPlanId, billingDetails) {
    // Mock upgrade process
    // In reality, this would integrate with paymentEngine / Stripe / etc.
    const newPlan = SUBSCRIPTION_PLANS[newPlanId.toUpperCase()];
    if (!newPlan) throw new Error("Invalid plan");

    const settings = await dbEngine.getSettings(workspaceId);
    const updatedSettings = {
      ...settings,
      plan: newPlan.id,
      subscriptionStatus: 'active',
      renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    };
    
    await dbEngine.saveSettings(workspaceId, updatedSettings);
    return updatedSettings;
  }
  
  getAvailablePlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  async submitPremiumRequest(plan, paidAmount, paymentMethod, transactionId, screenshotBase64 = '') {
    return await dbSubmitPremiumRequest(plan, paidAmount, paymentMethod, transactionId, screenshotBase64);
  }
}

export const subscriptionEngine = new SubscriptionEngine();
