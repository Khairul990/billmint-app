import {
  sendPaymentReceiptEmail,
  sendWhatsAppNotification
} from './cloudFunctions.js';
import {
  addNotification as addLocalNotification,
  getNotifications as getLocalNotifications,
  markNotificationAsRead as markLocalNotificationRead,
  clearAllNotifications as clearLocalNotifications
} from './notificationsService.js';
import { db, firebaseReady } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export const notificationEngine = {
  async sendEmail(to, subject, body) {
    try {
      const result = await sendPaymentReceiptEmail(to, body);
      return { channel: 'email', success: true, result };
    } catch (e) {
      console.error('[NotificationEngine] Email send failed:', e);
      return { channel: 'email', success: false, error: e.message };
    }
  },

  async sendSMS(to, message) {
    try {
      if (firebaseReady) {
        await addDoc(collection(db, 'notificationLogs'), {
          channel: 'sms', to, message, status: 'sent', createdAt: new Date().toISOString()
        });
      }
      addLocalNotification('SMS Sent', `SMS to ${to}: ${message.substring(0, 50)}...`, 'info');
      return { channel: 'sms', success: true };
    } catch (e) {
      return { channel: 'sms', success: false, error: e.message };
    }
  },

  async sendBrowserNotification(title, message) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/icon-192x192.png' });
      }
      addLocalNotification(title, message, 'info');
      return { channel: 'browser', success: true };
    } catch (e) {
      return { channel: 'browser', success: false, error: e.message };
    }
  },

  async sendWhatsApp(phone, message) {
    try {
      const result = await sendWhatsAppNotification(phone, message, '');
      return { channel: 'whatsapp', success: true, result };
    } catch (e) {
      const fallback = await this.sendSMS(phone, message);
      return { channel: 'whatsapp', success: false, fallback: fallback, error: e.message };
    }
  },

  async sendPaymentReceipt(invoice, customer) {
    const results = [];
    if (customer?.email) {
      results.push(await this.sendEmail(customer.email, 'Payment Receipt', `Payment received for invoice #${invoice.invoiceNumber}`));
    }
    if (customer?.phone) {
      const msg = `Your payment of ${invoice.grandTotal} for invoice #${invoice.invoiceNumber} has been received. Thank you!`;
      results.push(await this.sendSMS(customer.phone, msg));
    }
    addLocalNotification('Payment Receipt', `Receipt sent for invoice #${invoice.invoiceNumber}`, 'success');
    return results;
  },

  async sendInvoiceReminder(invoice, customer) {
    const dueAmount = (invoice.grandTotal || 0) - (invoice.paidAmount || 0);
    const msg = `Reminder: ${dueAmount} due for invoice #${invoice.invoiceNumber}. Due date: ${invoice.dueDate || 'N/A'}`;
    if (customer?.email) await this.sendEmail(customer.email, 'Payment Reminder', msg);
    if (customer?.phone) await this.sendSMS(customer.phone, msg);
    addLocalNotification('Payment Reminder', `Reminder sent for invoice #${invoice.invoiceNumber}`, 'warning');
  },

  getLocalNotifications() {
    return getLocalNotifications();
  },

  markRead(id) {
    markLocalNotificationRead(id);
  },

  clearAll() {
    clearLocalNotifications();
  },

  async getCloudNotifications(userId) {
    if (!firebaseReady) return [];
    try {
      const q = query(
        collection(db, 'notificationLogs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  },

  async requestBrowserPermission() {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    return result;
  }
};
