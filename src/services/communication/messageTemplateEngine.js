// src/services/communication/messageTemplateEngine.js

/**
 * Message Template Engine
 * Handles CRUD, versioning, and variable schema for communication templates.
 * Templates are stored in Firestore under `communicationTemplates` collection.
 * Each template schema:
 *   {
 *     id: string,               // unique id
 *     version: number,
 *     type: string,            // e.g., 'paymentReminder', 'invoiceSent'
 *     enabled: boolean,
 *     content: string,          // template with {{variables}}
 *     variables: string[],      // list of used variables (auto‑generated)
 *     updatedAt: timestamp
 *   }
 */

import { db, firebaseReady } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const TEMPLATES_COLLECTION = 'communicationTemplates';

// Built-in professional templates used as a fallback when Firestore is not
// configured or no custom template exists yet. Emoji-rich & WhatsApp-friendly.
const BUILT_IN_TEMPLATES = {
  reminder: {
    id: 'reminder',
    type: 'reminder',
    version: 1,
    enabled: true,
    content: [
      'Hello {{customerName}} 👋',
      '',
      'This is a friendly payment reminder from *{{businessName}}* 💼',
      '',
      '🧾 Invoice #: {{invoiceNumber}}',
      '💰 Outstanding Balance: *{{dueAmount}}*',
      '📅 Due Date: {{dueDate}}',
      '',
      'You can view your invoice & pay securely online here 👇',
      '🔗 {{portalLink}}',
      '',
      'If you have already paid, please kindly ignore this message 🙏',
      '',
      'Thank you for choosing *{{businessName}}* 😊',
      '📞 {{businessPhone}}'
    ].join('\n')
  },
  invoice: {
    id: 'invoice',
    type: 'invoice',
    version: 1,
    enabled: true,
    content: [
      'Hello {{customerName}} 👋',
      '',
      'Thank you for your business! Your invoice is ready 🎉',
      '',
      '🧾 Invoice #: {{invoiceNumber}}',
      '💵 Total: *{{totalAmount}}*',
      '✅ Paid: {{paidAmount}}',
      '⏳ Balance Due: {{dueAmount}}',
      '',
      'Please find your invoice details attached & pay securely online here 👇',
      '🔗 {{portalLink}}',
      '',
      'Need any help? Just reply to this message 💬',
      '',
      'Warm regards,',
      '*{{businessName}}* 📞 {{businessPhone}}'
    ].join('\n')
  }
};

export const messageTemplateEngine = {
  /**
   * Get a template by id (latest version). Falls back to a built-in
   * professional template when Firestore is unavailable or the doc is missing.
   */
  async getTemplate(id) {
    if (firebaseReady) {
      try {
        const tmplRef = doc(db, TEMPLATES_COLLECTION, id);
        const snap = await getDoc(tmplRef);
        if (snap.exists() && snap.data().enabled !== false) return snap.data();
      } catch (e) {
        console.error('[TemplateEngine] getTemplate error:', e);
      }
    }
    return BUILT_IN_TEMPLATES[id] || null;
  },

  /**
   * List templates of a given type (e.g., 'paymentReminder').
   */
  async listTemplates(type) {
    if (!firebaseReady) return [];
    const q = query(
      collection(db, TEMPLATES_COLLECTION),
      where('type', '==', type),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  /**
   * Save (create or update) a template.
   * Performs simple version bump and merges variables.
   */
  async saveTemplate({ id, type, content, enabled = true }) {
    if (!firebaseReady) throw new Error('Firestore not ready');
    const now = new Date().toISOString();
    const tmplRef = doc(db, TEMPLATES_COLLECTION, id);
    const existing = await getDoc(tmplRef);
    const version = existing.exists() ? (existing.data().version || 1) + 1 : 1;
    const variables = (content.match(/{{\s*[^}]+\s*}}/g) || []).map(v => v.replace(/[{}\s]/g, ''));
    const payload = { id, type, content, enabled, version, variables, updatedAt: now };
    await setDoc(tmplRef, payload, { merge: true });
    return payload;
  },

  /**
   * Delete a template.
   */
  async deleteTemplate(id) {
    if (!firebaseReady) return false;
    const tmplRef = doc(db, TEMPLATES_COLLECTION, id);
    await setDoc(tmplRef, { deleted: true }, { merge: true });
    return true;
  }
};
