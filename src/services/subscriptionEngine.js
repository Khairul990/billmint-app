import * as dbEngine from './dbEngine.js';
import { submitPremiumRequest as dbSubmitPremiumRequest } from './dbEngine.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';

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
  getSubscriptionDetailsSync(settings) {
    const planId = settings?.plan || 'free';
    const planDetails = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    return {
      planId: planDetails.id,
      name: planDetails.name,
      status: settings?.subscriptionStatus || 'active',
      renewalDate: settings?.renewalDate || null,
      limits: planDetails.limits,
      features: planDetails.features
    };
  }

  async getSubscriptionDetails(workspaceId) {
    const settings = await dbEngine.getSettings(workspaceId);
    const planId = settings?.plan || 'free';
    
    let planDetails = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    
    try {
      const planDoc = await getDoc(doc(db, 'subscriptionPlans', planId.toLowerCase()));
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
      }
    } catch(e) {
      console.error("Failed to fetch dynamic plan", e);
    }
    
    return {
      planId: planDetails.id,
      name: planDetails.name,
      status: settings?.subscriptionStatus || 'active',
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
