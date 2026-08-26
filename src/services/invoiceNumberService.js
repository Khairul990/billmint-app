import { doc, getDoc, setDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig.js';

export const generateInvoiceNumber = async (userId) => {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'invoice_counters', userId);
  
  try {
    const newNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextCount = 1;
      
      if (!counterDoc.exists()) {
        // Initialize counter for this user
        transaction.set(counterRef, {
          year: currentYear,
          count: 1,
          lastUpdated: new Date().toISOString()
        });
      } else {
        const data = counterDoc.data();
        
        // Reset count if year changes
        if (data.year !== currentYear) {
          nextCount = 1;
        } else {
          nextCount = data.count + 1;
        }
        
        transaction.update(counterRef, {
          year: currentYear,
          count: nextCount,
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Format: INV-YYYY-XXX
      const formattedCount = String(nextCount).padStart(3, '0');
      return `INV-${currentYear}-${formattedCount}`;
    });
    
    return newNumber;
  } catch (error) {
    console.error("Failed to generate invoice number:", error);
    throw error;
  }
};

export const getCounterStatus = async (userId) => {
  const counterRef = doc(db, 'invoice_counters', userId);
  const counterDoc = await getDoc(counterRef);
  if (counterDoc.exists()) {
    return counterDoc.data();
  }
  return null;
};

export const resetCounter = async (userId) => {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'invoice_counters', userId);
  
  const counterDoc = await getDoc(counterRef);
  if (!counterDoc.exists()) {
    await setDoc(counterRef, {
      year: currentYear,
      count: 0,
      lastUpdated: new Date().toISOString()
    });
  } else {
    await updateDoc(counterRef, {
      year: currentYear,
      count: 0,
      lastUpdated: new Date().toISOString()
    });
  }
};
