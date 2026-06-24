/**
 * Cloud Functions Stub
 * 
 * In a fully production-hardened environment, sensitive operations
 * like triggering emails or verifying payments should be moved to a backend
 * (Firebase Cloud Functions). This file serves as the client-side interface stub
 * for those future serverless functions.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';

const functions = app ? getFunctions(app) : null;

/**
 * Triggers an email receipt to the customer after payment.
 * Currently returns a mock success.
 */
export const sendPaymentReceiptEmail = async (invoiceId, customerEmail) => {
  if (!functions) {
    return { data: { success: true, message: 'Email service not configured' } };
  }
  
  try {
    const sendReceipt = httpsCallable(functions, 'sendPaymentReceiptEmail');
    const result = await sendReceipt({ invoiceId, customerEmail });
    return result;
  } catch (error) {
    console.error('Error calling sendPaymentReceiptEmail:', error);
    throw error;
  }
};

/**
 * Validates a transaction ID against a mock bank API.
 * Currently returns a mock success.
 */
export const verifyTransactionId = async (transactionId, expectedAmount) => {
  if (!functions) {
    return { data: { isValid: true, mockReason: 'Verification service not configured' } };
  }
  
  try {
    const verifyTx = httpsCallable(functions, 'verifyTransactionId');
    const result = await verifyTx({ transactionId, expectedAmount });
    return result;
  } catch (error) {
    console.error('Error calling verifyTransactionId:', error);
    throw error;
  }
};

/**
 * Triggers a WhatsApp notification with the invoice link.
 */
export const sendWhatsAppNotification = async (phone, invoiceLink, customerName) => {
  if (!functions) {
    return { data: { success: true, message: 'WhatsApp service not configured' } };
  }

  try {
    const sendWa = httpsCallable(functions, 'sendWhatsAppNotification');
    const result = await sendWa({ phone, invoiceLink, customerName });
    return result;
  } catch (error) {
    console.error('Error calling sendWhatsAppNotification:', error);
    throw error;
  }
};
