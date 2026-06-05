import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Generate a shareable payment link for an invoice
 * @param {Object} invoiceData - Complete invoice object
 * @returns {Promise<string>} - Public URL
 */
export const generatePaymentLink = async (invoiceData) => {
  // Use existing publicToken if it has one, otherwise generate a new unique ID
  const invoiceId = invoiceData.publicToken || `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Prepare public invoice data (preserving all visual configuration snapshots)
  const publicInvoiceData = {
    ...invoiceData,
    id: invoiceId,
    publicToken: invoiceId,
    invoiceNumber: invoiceData.invoiceNumber,
    date: invoiceData.date || new Date().toISOString(),
    
    // Business info is handled by businessSnapshot inside invoiceData
    
    // Payment info
    paymentStatus: invoiceData.paymentStatus || 'Unpaid',
    
    // Payment instruction (extracted from paymentSettingsSnapshot if needed)
    paymentInstructions: {
      upiId: invoiceData.paymentSettingsSnapshot?.upiId || '',
      bkashNumber: invoiceData.paymentSettingsSnapshot?.bkashNumber || '',
      nagadNumber: invoiceData.paymentSettingsSnapshot?.nagadNumber || '',
      bankDetails: invoiceData.paymentSettingsSnapshot?.customPaymentLink || '',
    },
    
    // Metadata
    ownerId: invoiceData.ownerId || invoiceData.userId || '',
    createdAt: new Date().toISOString(),
  };
  
  // Save to Firestore public_invoices collection
  const invoiceRef = doc(db, 'public_invoices', invoiceId);
  await setDoc(invoiceRef, publicInvoiceData, { merge: true });
  
  // Generate public URL
  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/invoice/${invoiceId}`;
  
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

  const invoiceRef = doc(db, 'public_invoices', invoiceId);
  const invoiceDoc = await getDoc(invoiceRef);
  
  if (!invoiceDoc.exists()) {
    throw new Error('Invoice not found');
  }
  
  return { id: invoiceDoc.id, ...invoiceDoc.data() };
};
