import re

with open('src/utils/storage.js', 'r', encoding='utf-8') as f:
    storageJS = f.read()

storageJS = re.sub(
    r'export const getExpenses = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.EXPENSES\)\) \|\| \[\];\s*};',
    '''export const getExpenses = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('expenses');
    if (data && data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
};''',
    storageJS
)

storageJS = re.sub(
    r'export const getCustomers = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.CUSTOMERS\)\) \|\| \[\];\s*};',
    '''export const getCustomers = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('customers');
    if (data && data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
};''',
    storageJS
)

storageJS = re.sub(
    r'export const getProducts = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.PRODUCTS\)\) \|\| \[\];\s*};',
    '''export const getProducts = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('products');
    if (data && data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
};''',
    storageJS
)

storageJS = re.sub(
    r'export const getInvoices = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.INVOICES\)\) \|\| \[\];\s*};',
    '''export const getInvoices = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('invoices');
    if (data && data.length > 0) {
      return data.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
};''',
    storageJS
)

updateCacheHelper = '''
const updateLocalCache = (key, items) => {
  const cacheLimit = 20;
  const sorted = [...items].sort((a,b) => {
    const da = a.createdAt ? new Date(a.createdAt) : 0;
    const db = b.createdAt ? new Date(b.createdAt) : 0;
    return db - da;
  });
  localStorage.setItem(key, JSON.stringify(sorted.slice(0, cacheLimit)));
};
'''

if 'updateLocalCache' not in storageJS:
    storageJS = storageJS.replace("const DEFAULT_SETTINGS =", updateCacheHelper + "\nconst DEFAULT_SETTINGS =")

storageJS = storageJS.replace("const expenses = getExpenses();", "const expenses = await getExpenses();")
storageJS = storageJS.replace("const customers = getCustomers();", "const customers = await getCustomers();")
storageJS = storageJS.replace("const products = getProducts();", "const products = await getProducts();")
storageJS = storageJS.replace("const invoices = getInvoices();", "const invoices = await getInvoices();")

storageJS = storageJS.replace("localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));", "updateLocalCache(KEYS.EXPENSES, expenses);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.EXPENSES, JSON.stringify(filtered));", "updateLocalCache(KEYS.EXPENSES, filtered);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));", "updateLocalCache(KEYS.CUSTOMERS, customers);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));", "updateLocalCache(KEYS.CUSTOMERS, filtered);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));", "updateLocalCache(KEYS.PRODUCTS, products);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));", "updateLocalCache(KEYS.PRODUCTS, filtered);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));", "updateLocalCache(KEYS.INVOICES, invoices);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.INVOICES, JSON.stringify(filtered));", "updateLocalCache(KEYS.INVOICES, filtered);")

storageJS = storageJS.replace("const syncLocalInvoice = (cloudData) => {", "const syncLocalInvoice = async (cloudData) => {")
storageJS = storageJS.replace("syncLocalInvoice(cloudData);", "await syncLocalInvoice(cloudData);")

storageJS = storageJS.replace("export const exportBackup = () => {", "export const exportBackup = async () => {")
storageJS = storageJS.replace(
    "settings: getSettings(),\n    customers: getCustomers(),\n    products: getProducts(),\n    invoices: getInvoices(),\n    expenses: getExpenses(),\n    subscription: getSubscriptionStatus(),",
    "settings: getSettings(),\n    customers: await getCustomers(),\n    products: await getProducts(),\n    invoices: await getInvoices(),\n    expenses: await getExpenses(),\n    subscription: getSubscriptionStatus(),"
)

storageJS = storageJS.replace("export const importRestore = (backupData) => {", "export const importRestore = async (backupData) => {")
storageJS = storageJS.replace("localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(backupData.customers));", "updateLocalCache(KEYS.CUSTOMERS, backupData.customers);\n  for (const c of backupData.customers) await BillQyroDB.put('customers', c);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(backupData.products));", "updateLocalCache(KEYS.PRODUCTS, backupData.products);\n  for (const p of backupData.products) await BillQyroDB.put('products', p);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.INVOICES, JSON.stringify(backupData.invoices));", "updateLocalCache(KEYS.INVOICES, backupData.invoices);\n  for (const i of backupData.invoices) await BillQyroDB.put('invoices', i);")
storageJS = storageJS.replace("localStorage.setItem(KEYS.EXPENSES, JSON.stringify(backupData.expenses));", "updateLocalCache(KEYS.EXPENSES, backupData.expenses);\n  for (const e of backupData.expenses) await BillQyroDB.put('expenses', e);")

storageJS = storageJS.replace("export const clearInvoices = () => {", "export const clearInvoices = async () => {")
storageJS = storageJS.replace("export const clearCustomers = () => {", "export const clearCustomers = async () => {")
storageJS = storageJS.replace("export const clearProducts = () => {", "export const clearProducts = async () => {")
storageJS = storageJS.replace("export const clearExpenses = () => {", "export const clearExpenses = async () => {")

storageJS = re.sub(
    r"export const clearInvoices = async \(\) => \{\s*localStorage\.setItem\(KEYS\.INVOICES, JSON\.stringify\(\[\]\)\);\s*window\.dispatchEvent\(new CustomEvent\('billqyro_sync'\)\);\s*return \{ status: 'success' \};\s*\};",
    "export const clearInvoices = async () => { localStorage.setItem(KEYS.INVOICES, JSON.stringify([])); await BillQyroDB.clear('invoices'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };",
    storageJS
)
storageJS = re.sub(
    r"export const clearCustomers = async \(\) => \{\s*localStorage\.setItem\(KEYS\.CUSTOMERS, JSON\.stringify\(\[\]\)\);\s*window\.dispatchEvent\(new CustomEvent\('billqyro_sync'\)\);\s*return \{ status: 'success' \};\s*\};",
    "export const clearCustomers = async () => { localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([])); await BillQyroDB.clear('customers'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };",
    storageJS
)
storageJS = re.sub(
    r"export const clearProducts = async \(\) => \{\s*localStorage\.setItem\(KEYS\.PRODUCTS, JSON\.stringify\(\[\]\)\);\s*window\.dispatchEvent\(new CustomEvent\('billqyro_sync'\)\);\s*return \{ status: 'success' \};\s*\};",
    "export const clearProducts = async () => { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([])); await BillQyroDB.clear('products'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };",
    storageJS
)
storageJS = re.sub(
    r"export const clearExpenses = async \(\) => \{\s*localStorage\.setItem\(KEYS\.EXPENSES, JSON\.stringify\(\[\]\)\);\s*window\.dispatchEvent\(new CustomEvent\('billqyro_sync'\)\);\s*return \{ status: 'success' \};\s*\};",
    "export const clearExpenses = async () => { localStorage.setItem(KEYS.EXPENSES, JSON.stringify([])); await BillQyroDB.clear('expenses'); window.dispatchEvent(new CustomEvent('billqyro_sync')); return { status: 'success' }; };",
    storageJS
)


cleanupFunctions = '''
export const getStorageUsage = () => {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('billqyro_')) {
      const value = localStorage.getItem(key) || '';
      totalBytes += key.length + value.length;
    }
  }
  const kb = totalBytes / 1024;
  const limitKb = 5000;
  const percentage = Math.min((kb / limitKb) * 100, 100);
  return { kb: kb.toFixed(2), limitKb, percentage: percentage.toFixed(2) };
};

export const cleanDuplicateDrafts = async () => {
  const invoices = await getInvoices();
  const valid = invoices.filter(inv => inv.grandTotal > 0 || inv.paymentStatus === 'Paid' || inv.paymentStatus === 'Draft');
  const removed = invoices.length - valid.length;
  
  if (removed > 0) {
    await BillQyroDB.clear('invoices');
    for (const inv of valid) await BillQyroDB.put('invoices', inv);
    updateLocalCache(KEYS.INVOICES, valid);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  }
  return removed;
};

export const cleanTemporaryData = async () => {
  let count = 0;
  try {
    const queue = await BillQyroDB.getAll('syncQueue');
    const oldTxs = queue.filter(tx => Date.now() - (tx.createdAt||0) > 7 * 24 * 60 * 60 * 1000);
    for (const tx of oldTxs) {
      await BillQyroDB.delete('syncQueue', tx.id);
      count++;
    }
  } catch(e){}
  return count;
};

export const clearCacheOnly = () => {
  localStorage.removeItem(KEYS.INVOICES);
  localStorage.removeItem(KEYS.CUSTOMERS);
  localStorage.removeItem(KEYS.PRODUCTS);
  localStorage.removeItem(KEYS.EXPENSES);
  return {status: 'success'};
};
'''

storageJS = storageJS + "\n" + cleanupFunctions

syncReplacement = '''export const syncFromFirestore = async () => {
  if (!firebaseReady) {
    console.log("Firebase not enabled, skipping Firestore sync.");
    return null;
  }
  try {
    const userId = getFirebaseUserId();
    console.log("Syncing data from Firestore for user: " + userId);

    const settingsDoc = await getDoc(doc(db, 'settings', userId));
    if (settingsDoc.exists()) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsDoc.data()));
    }

    const customersSnap = await getDocs(collection(db, 'customers', userId, 'items'));
    const customers = [];
    customersSnap.forEach(docSnap => customers.push(docSnap.data()));
    if (customers.length > 0) {
      for(const c of customers) await BillQyroDB.put('customers', c);
      updateLocalCache(KEYS.CUSTOMERS, customers);
    }

    const invoicesMap = new Map();
    try {
      const snap1 = await getDocs(collection(db, 'invoices', userId, 'items'));
      snap1.forEach(docSnap => invoicesMap.set(docSnap.id, docSnap.data()));
    } catch(e) {}
    
    const invoices = Array.from(invoicesMap.values());
    if (invoices.length > 0) {
      for(const i of invoices) await BillQyroDB.put('invoices', i);
      updateLocalCache(KEYS.INVOICES, invoices);
    }

    const productsSnap = await getDocs(collection(db, 'products', userId, 'items'));
    const products = [];
    productsSnap.forEach(docSnap => products.push(docSnap.data()));
    if (products.length > 0) {
      for(const p of products) await BillQyroDB.put('products', p);
      updateLocalCache(KEYS.PRODUCTS, products);
    }

    const expensesSnap = await getDocs(collection(db, 'expenses', userId, 'items'));
    const expenses = [];
    expensesSnap.forEach(docSnap => expenses.push(docSnap.data()));
    if (expenses.length > 0) {
      for(const e of expenses) await BillQyroDB.put('expenses', e);
      updateLocalCache(KEYS.EXPENSES, expenses);
    }

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
};'''

storageJS = re.sub(
    r'export const syncFromFirestore = async \(\) => \{[\s\S]*?throw error;\s*\}\s*\};',
    syncReplacement,
    storageJS
)

with open('src/utils/storage.js', 'w', encoding='utf-8') as f:
    f.write(storageJS)

print("Storage v3 Python Script finished")
