const fs = require('fs');
let code = fs.readFileSync('src/utils/storage.js', 'utf8');

const regex = /export const syncFromFirestore = async \(\) => \{[\s\S]*?export const getStorageUsage = \(\) => \{/m;
const replacement = `export const syncFromFirestore = async () => {
  if (!firebaseReady) {
    console.log("Firebase not enabled, skipping Firestore sync.");
    return null;
  }
  try {
    const userId = getFirebaseUserId();
    console.log(\`Syncing data from Firestore for user: \${userId}\`);

    // Sync settings
    const settingsDoc = await getDoc(doc(db, 'settings', userId));
    if (settingsDoc.exists()) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsDoc.data()));
    }

    // Sync customers
    const customersSnap = await getDocs(collection(db, 'customers', userId, 'items'));
    const customers = [];
    customersSnap.forEach(docSnap => {
      customers.push(docSnap.data());
    });
    if (customers.length > 0) {
      for(const c of customers) await BillQyroDB.put('customers', c);
      updateLocalCache(KEYS.CUSTOMERS, customers);
    }

    // Sync invoices
    const invoicesMap = new Map();
    
    try {
      const snap1 = await getDocs(collection(db, 'invoices', userId, 'items'));
      snap1.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) { /* ignore */ }
    
    try {
      const snap2 = await getDocs(collection(db, 'invoice', userId, 'items'));
      snap2.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) { /* ignore */ }
    
    try {
      const snap3 = await getDocs(collection(db, 'users', userId, 'invoices'));
      snap3.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) { /* ignore */ }

    const invoices = Array.from(invoicesMap.values());
    if (invoices.length > 0) {
      for(const i of invoices) await BillQyroDB.put('invoices', i);
      updateLocalCache(KEYS.INVOICES, invoices);
    }

    // Sync products
    const productsSnap = await getDocs(collection(db, 'products', userId, 'items'));
    const products = [];
    productsSnap.forEach(docSnap => {
      products.push(docSnap.data());
    });
    if (products.length > 0) {
      for(const p of products) await BillQyroDB.put('products', p);
      updateLocalCache(KEYS.PRODUCTS, products);
    }

    // Sync expenses
    const expensesSnap = await getDocs(collection(db, 'expenses', userId, 'items'));
    const expenses = [];
    expensesSnap.forEach(docSnap => {
      expenses.push(docSnap.data());
    });
    if (expenses.length > 0) {
      for(const e of expenses) await BillQyroDB.put('expenses', e);
      updateLocalCache(KEYS.EXPENSES, expenses);
    }

    // Sync subscription
    const subDoc = await getDoc(doc(db, 'subscription', userId));
    if (subDoc.exists()) {
      localStorage.setItem(KEYS.SUBSCRIPTION, JSON.stringify(subDoc.data()));
    }

    return {
      settings: JSON.parse(localStorage.getItem(KEYS.SETTINGS)),
      customers: JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [],
      products: JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [],
      invoices: JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [],
      expenses: JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [],
      subscription: JSON.parse(localStorage.getItem(KEYS.SUBSCRIPTION))
    };
  } catch (error) {
    console.error("Error syncing from Firestore:", error);
    throw error;
  }
};

export const getStorageUsage = () => {`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/utils/storage.js', code);
