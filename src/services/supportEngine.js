import {
  submitSupportTicket as dbSubmitSupportTicket,
  getUserSupportTickets as dbGetUserSupportTickets,
  submitFeatureRequest as dbSubmitFeatureRequest,
  getUserFeatureRequests as dbGetUserFeatureRequests
} from './dbEngine.js';

class SupportEngine {
  async submitSupportTicket(userId, email, phone, issueType, message, screenshotBase64) {
    return await dbSubmitSupportTicket(userId, email, phone, issueType, message, screenshotBase64);
  }

  async getUserSupportTickets(userId) {
    return await dbGetUserSupportTickets(userId);
  }

  async submitFeatureRequest(userId, email, title, description, businessType, priority) {
    return await dbSubmitFeatureRequest(userId, email, title, description, businessType, priority);
  }

  async getUserFeatureRequests(userId) {
    return await dbGetUserFeatureRequests(userId);
  }
}

export const supportEngine = new SupportEngine();
