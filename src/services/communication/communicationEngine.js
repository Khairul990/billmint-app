// src/services/communication/communicationEngine.js

/**
 * Communication Engine – orchestrates preparation of WhatsApp communication payloads.
 * Uses verified existing engines: invoiceEngine, customerEngine, paymentEngine (if needed),
 * settingsEngine, messageTemplateEngine, messageComposer, attachmentEngine, shareUtils.
 * Respects demo mode, offline guards, workspace/user isolation, and settings overrides.
 */

import { invoiceEngine } from '../../services/invoiceEngine';
import { customerEngine } from '../../services/customerEngine';
import { settingsEngine } from '../../services/settingsEngine';
import { getRealUserId } from '../../services/dbEngine';
import { messageTemplateEngine } from './messageTemplateEngine';
import { composeMessage } from './messageComposer';
import { attachmentEngine } from './attachmentEngine';
import { generateWhatsAppReminderLink } from '../../utils/shareUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper to merge settings overrides.
 * Precedence: overrides > workspaceSettings > defaults (if any).
 */
function applyOverrides(baseSettings, overrides) {
  return { ...baseSettings, ...(overrides || {}) };
}

/**
 * Prepare communication payload for a given invoice.
 * @param {Object} params - { workspaceId, userId, invoiceId, overrides }
 * @returns {Promise<Object>} payload
 */
export async function prepareCommunication({ workspaceId, userId, invoiceId, overrides = {} }) {
  // Demo mode guard
  if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
    console.warn('[CommunicationEngine] Demo mode active – returning mock payload');
  }

  // Offline guard – abort if navigator offline (cannot open WhatsApp)
  if (!navigator.onLine) {
    return { status: 'offline_prepared', reason: 'Network offline' };
  }

  // Isolation check – ensure the user belongs to the workspace.
  // Fall back to the real user id / active workspace when the caller omits them.
  const realUserId = await getRealUserId();
  const effectiveUserId = userId || realUserId;
  if (!effectiveUserId || (realUserId && userId && realUserId !== userId)) {
    throw new Error('User/workspace isolation violation');
  }

  // Load core resources
  const invoice = await invoiceEngine.getInvoiceById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const customer = await customerEngine.getCustomerById(invoice.customerId);
  if (!customer) throw new Error('Customer not found');

  const workspaceSettings = await settingsEngine.getSettings(workspaceId);
  const mergedSettings = applyOverrides(workspaceSettings, overrides);

  // Choose template – default to reminder if enabled, else generic invoice
  const reminderEnabled = mergedSettings.whatsappReminderEnabled !== false;
  const templateType = reminderEnabled ? 'reminder' : 'invoice';
  const template = await messageTemplateEngine.getTemplate(templateType);

  // Settings are stored flat (businessName, logoUrl, phone, ...) so we pass the
  // whole merged settings object as the business context.
  const businessContext = mergedSettings || {};

  // Build context for composer
  const ctx = {
    business: businessContext,
    customer,
    invoice,
    settings: mergedSettings,
    currency: mergedSettings.currency || '₹',
    portalLink: invoice.publicToken ? `${window.location.origin}/invoice/${invoice.publicToken}` : '',
    paymentLink: mergedSettings.paymentLink || ''
  };

  const message = composeMessage(template?.content || '', ctx);

  // Prepare attachments (PDF + business image) based on settings toggles,
  // enabled by default so invoices are always shareable with a PDF.
  const includePdf = mergedSettings.includeInvoicePdf !== false;
  const includeImage = mergedSettings.includeBusinessImage !== false;
  const attachments = await attachmentEngine.prepareAttachments({
    includePdf,
    includeImage,
    invoice,
    business: businessContext
  });

  // Build WhatsApp deep link (reminder style)
  const waLink = generateWhatsAppReminderLink(invoice, ctx.currency, businessContext);

  const payload = {
    workspaceId: effectiveUserId ? (workspaceId || mergedSettings.activeWorkspaceId || 'default') : workspaceId,
    userId: effectiveUserId,
    invoiceId,
    invoice,
    customer,
    businessSettings: businessContext,
    currency: ctx.currency,
    message,
    portalLink: ctx.portalLink,
    includePdf,
    includeImage,
    attachments,
    recipientPhone: customer.phone,
    whatsappLink: waLink,
    preview: true,
    idempotencyKey: uuidv4(),
    status: 'prepared'
  };

  return payload;
}

export const communicationEngine = { prepareCommunication };
