import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { isEducationCategory } from '../utils/categoryChecks';

/**
 * Generate a shareable payment link for an invoice
 * @param {Object} invoiceData - Complete invoice object
 * @returns {Promise<string>} - Public URL
 */
export const generatePaymentLink = async (invoiceData) => {
  // Use customerId to generate the permanent portal link
  const customerId = invoiceData.customerId || invoiceData.customer?.id;
  if (!customerId) {
    throw new Error('Please assign a student/customer to this invoice to generate a portal link.');
  }
  
  // No Firestore write on copy/share. We solely use the permanent Live Link.
  const baseUrl = window.location.origin;
  const category = invoiceData.businessSnapshot?.businessCategory || invoiceData.businessCategory || invoiceData.businessSnapshot?.defaultBillingTemplate;
  const isEdu = isEducationCategory(category);
  const portalPath = isEdu ? '/student-portal' : '/billing';
  const publicUrl = `${baseUrl}${portalPath}/${customerId}`;
  
  return publicUrl;
};

/**
 * Fetch public invoice data
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} - Invoice data
 */
export const getPublicInvoice = async (invoiceId) => {
  if (!db) {
    throw new Error('Firebase Database not initialized.');
  }

  const invoiceRef = doc(db, 'publicInvoices', invoiceId);
  const invoiceDoc = await getDoc(invoiceRef);
  
  if (!invoiceDoc.exists()) {
    throw new Error('Invoice not found');
  }
  
  return { id: invoiceDoc.id, ...invoiceDoc.data() };
};
