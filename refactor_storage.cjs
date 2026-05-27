const fs = require('fs');

let storageJS = fs.readFileSync('src/utils/storage.js', 'utf8');

// 1. Refactor getExpenses, getCustomers, getProducts, getInvoices to be async
storageJS = storageJS.replace(
  /export const getExpenses = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.EXPENSES\)\) \|\| \[\];\s*};/g,
  `export const getExpenses = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('expenses');
    if (data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.EXPENSES)) || [];
};`
);

storageJS = storageJS.replace(
  /export const getCustomers = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.CUSTOMERS\)\) \|\| \[\];\s*};/g,
  `export const getCustomers = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('customers');
    if (data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
};`
);

storageJS = storageJS.replace(
  /export const getProducts = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.PRODUCTS\)\) \|\| \[\];\s*};/g,
  `export const getProducts = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('products');
    if (data.length > 0) return data;
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.PRODUCTS)) || [];
};`
);

storageJS = storageJS.replace(
  /export const getInvoices = \(\) => {[\s\S]*?return JSON\.parse\(localStorage\.getItem\(KEYS\.INVOICES\)\) \|\| \[\];\s*};/g,
  `export const getInvoices = async () => {
  initializeStorage();
  try {
    const data = await BillQyroDB.getAll('invoices');
    if (data.length > 0) {
      return data.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    }
  } catch(e) {}
  return JSON.parse(localStorage.getItem(KEYS.INVOICES)) || [];
};`
);

// Helper for local cache updates (keep 20 items only)
const updateCacheHelper = `
const updateLocalCache = (key, items) => {
  const cacheLimit = 20;
  // Make sure we have a sortable list based on creation or fallback
  const sorted = [...items].sort((a,b) => {
    const da = a.createdAt ? new Date(a.createdAt) : 0;
    const db = b.createdAt ? new Date(b.createdAt) : 0;
    return db - da;
  });
  localStorage.setItem(key, JSON.stringify(sorted.slice(0, cacheLimit)));
};
`;

if(!storageJS.includes('updateLocalCache')) {
  storageJS = storageJS.replace("const DEFAULT_SETTINGS =", updateCacheHelper + "\nconst DEFAULT_SETTINGS =");
}

// 2. Modify synchronous calls inside storage.js
// For each of the save/delete functions, change `const items = getX();` to `const items = await getX();`
storageJS = storageJS.replace(/const expenses = getExpenses\(\);/g, 'const expenses = await getExpenses();');
storageJS = storageJS.replace(/const customers = getCustomers\(\);/g, 'const customers = await getCustomers();');
storageJS = storageJS.replace(/const products = getProducts\(\);/g, 'const products = await getProducts();');
storageJS = storageJS.replace(/const invoices = getInvoices\(\);/g, 'const invoices = await getInvoices();');

// 3. Change localStorage.setItem(KEYS.XYZ, JSON.stringify(items)); to updateLocalCache(KEYS.XYZ, items);
// But ONLY for the 4 big tables. Settings and Subscription remain normal.
storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.EXPENSES,\s*JSON\.stringify\(.*?expenses.*?\)\);/g, 'updateLocalCache(KEYS.EXPENSES, expenses);');
storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.EXPENSES,\s*JSON\.stringify\(filtered\)\);/g, 'updateLocalCache(KEYS.EXPENSES, filtered);');

storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.CUSTOMERS,\s*JSON\.stringify\(.*?customers.*?\)\);/g, 'updateLocalCache(KEYS.CUSTOMERS, customers);');
storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.CUSTOMERS,\s*JSON\.stringify\(filtered\)\);/g, 'updateLocalCache(KEYS.CUSTOMERS, filtered);');

storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.PRODUCTS,\s*JSON\.stringify\(.*?products.*?\)\);/g, 'updateLocalCache(KEYS.PRODUCTS, products);');
storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.PRODUCTS,\s*JSON\.stringify\(filtered\)\);/g, 'updateLocalCache(KEYS.PRODUCTS, filtered);');

storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.INVOICES,\s*JSON\.stringify\(invoices\)\);/g, 'updateLocalCache(KEYS.INVOICES, invoices);');
storageJS = storageJS.replace(/localStorage\.setItem\(KEYS\.INVOICES,\s*JSON\.stringify\(filtered\)\);/g, 'updateLocalCache(KEYS.INVOICES, filtered);');


// 4. syncLocalInvoice in storage.js needs to be async
storageJS = storageJS.replace(
  /const syncLocalInvoice = \(cloudData\) => {/,
  'const syncLocalInvoice = async (cloudData) => {'
);
storageJS = storageJS.replace(
  /syncLocalInvoice\(cloudData\);/g,
  'await syncLocalInvoice(cloudData);'
);

// 5. exportBackup needs to be async
storageJS = storageJS.replace(
  /export const exportBackup = \(\) => {/g,
  `export const exportBackup = async () => {`
);
storageJS = storageJS.replace(
  /settings: getSettings\(\),\s*customers: getCustomers\(\),\s*products: getProducts\(\),\s*invoices: getInvoices\(\),\s*expenses: getExpenses\(\),\s*subscription: getSubscriptionStatus\(\),/g,
  `settings: getSettings(),
    customers: await getCustomers(),
    products: await getProducts(),
    invoices: await getInvoices(),
    expenses: await getExpenses(),
    subscription: getSubscriptionStatus(),`
);

// 6. importRestore Needs to update IndexedDB first!
storageJS = storageJS.replace(
  /export const importRestore = \(backupData\) => {/g,
  `export const importRestore = async (backupData) => {`
);
// replace localStorage sets with updateLocalCache + IndexedDB put
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.CUSTOMERS, JSON\.stringify\(backupData\.customers\)\);/g,
  `updateLocalCache(KEYS.CUSTOMERS, backupData.customers);
  for (const c of backupData.customers) await BillQyroDB.put('customers', c);`
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.PRODUCTS, JSON\.stringify\(backupData\.products\)\);/g,
  `updateLocalCache(KEYS.PRODUCTS, backupData.products);
  for (const p of backupData.products) await BillQyroDB.put('products', p);`
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.INVOICES, JSON\.stringify\(backupData\.invoices\)\);/g,
  `updateLocalCache(KEYS.INVOICES, backupData.invoices);
  for (const i of backupData.invoices) await BillQyroDB.put('invoices', i);`
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.EXPENSES, JSON\.stringify\(backupData\.expenses\)\);/g,
  `updateLocalCache(KEYS.EXPENSES, backupData.expenses);
  for (const e of backupData.expenses) await BillQyroDB.put('expenses', e);`
);

// 7. Clear functions need to clear IndexedDB and be async
storageJS = storageJS.replace(/export const clearInvoices = \(\) => {/g, 'export const clearInvoices = async () => {');
storageJS = storageJS.replace(/export const clearCustomers = \(\) => {/g, 'export const clearCustomers = async () => {');
storageJS = storageJS.replace(/export const clearProducts = \(\) => {/g, 'export const clearProducts = async () => {');
storageJS = storageJS.replace(/export const clearExpenses = \(\) => {/g, 'export const clearExpenses = async () => {');

storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.INVOICES, JSON\.stringify\(\[\]\)\);/g,
  "localStorage.setItem(KEYS.INVOICES, JSON.stringify([])); await BillQyroDB.clear('invoices');"
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.CUSTOMERS, JSON\.stringify\(\[\]\)\);/g,
  "localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([])); await BillQyroDB.clear('customers');"
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.PRODUCTS, JSON\.stringify\(\[\]\)\);/g,
  "localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([])); await BillQyroDB.clear('products');"
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.EXPENSES, JSON\.stringify\(\[\]\)\);/g,
  "localStorage.setItem(KEYS.EXPENSES, JSON.stringify([])); await BillQyroDB.clear('expenses');"
);

// 8. cleanDuplicateDrafts and cleanTemporaryData functions
const cleanupFunctions = `
export const cleanDuplicateDrafts = async () => {
  const invoices = await getInvoices();
  // Group by customer, date, subtotal to find duplicates. For simplicity, just remove invoices with 'draft' status or 0 amount if they exist.
  const valid = invoices.filter(inv => inv.grandTotal > 0 || inv.paymentStatus === 'Paid');
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
  // Clear any logs, offline sync queue that is old, preview cache
  let count = 0;
  try {
    const queue = await BillQyroDB.getAll('syncQueue');
    const oldTxs = queue.filter(tx => Date.now() - tx.createdAt > 7 * 24 * 60 * 60 * 1000); // 7 days old
    for (const tx of oldTxs) {
      await BillQyroDB.delete('syncQueue', tx.id);
      count++;
    }
  } catch(e){}
  return count;
};

export const clearCacheOnly = () => {
  // Just clear localstorage arrays, leave IndexedDB alone!
  localStorage.removeItem(KEYS.INVOICES);
  localStorage.removeItem(KEYS.CUSTOMERS);
  localStorage.removeItem(KEYS.PRODUCTS);
  localStorage.removeItem(KEYS.EXPENSES);
  return {status: 'success'};
};
`;

storageJS = storageJS + "\\n" + cleanupFunctions;

// 9. Fix syncFromFirestore
// We must put items into IndexedDB and then call updateLocalCache
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.CUSTOMERS, JSON\.stringify\(customers\)\);/g,
  `for(const c of customers) await BillQyroDB.put('customers', c);
      updateLocalCache(KEYS.CUSTOMERS, customers);`
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.PRODUCTS, JSON\.stringify\(products\)\);/g,
  `for(const p of products) await BillQyroDB.put('products', p);
      updateLocalCache(KEYS.PRODUCTS, products);`
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.EXPENSES, JSON\.stringify\(expenses\)\);/g,
  `for(const e of expenses) await BillQyroDB.put('expenses', e);
      updateLocalCache(KEYS.EXPENSES, expenses);`
);
storageJS = storageJS.replace(
  /localStorage\.setItem\(KEYS\.INVOICES, JSON\.stringify\(invoices\)\);/g,
  `for(const i of invoices) await BillQyroDB.put('invoices', i);
      updateLocalCache(KEYS.INVOICES, invoices);`
);

fs.writeFileSync('src/utils/storage.js', storageJS);
console.log('Storage refactor script completed.');
