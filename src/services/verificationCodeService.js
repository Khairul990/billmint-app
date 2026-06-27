import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Generate unique verification code for an invoice
 * @param {string} invoiceNumber - e.g., "INV-2024-001"
 * @returns {string} - e.g., "BQ-INV2024001-X7K9P"
 */
export const generateVerificationCode = (invoiceNumber) => {
  // Remove special characters from invoice number
  const cleanNumber = invoiceNumber.replace(/[^a-zA-Z0-9]/g, '');
  
  // Generate random 5-character code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let randomCode = '';
  for (let i = 0; i < 5; i++) {
    randomCode += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return `BQ-${cleanNumber}-${randomCode}`;
};

/**
 * Save verification code to invoice
 */
export const saveVerificationCode = async (invoiceId, code) => {
  try {
    const invoiceRef = doc(db, 'publicInvoices', invoiceId);
    await updateDoc(invoiceRef, {
      verificationCode: code,
      codeGeneratedAt: new Date().toISOString(),
    });
    return code;
  } catch (error) {
    console.error('Failed to save verification code:', error);
    throw error;
  }
};
