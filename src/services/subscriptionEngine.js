import * as dbEngine from './dbEngine';
import {  submitPremiumRequest as dbSubmitPremiumRequest  } from './dbEngine';

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
  async getSubscriptionDetails(workspaceId) {
    // In a real app, this queries dbEngine for the workspace's subscription doc
    // For now, returning a mock or fetched setting
    const settings = await dbEngine.getSettings(workspaceId);
    const planId = settings?.plan || 'free';
    const planDetails = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    
    return {
      planId: planDetails.id,
      name: planDetails.name,
      status: settings?.subscriptionStatus || 'active', // active, past_due, canceled
      renewalDate: settings?.renewalDate || null,
      limits: planDetails.limits,
      features: planDetails.features
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
