const fs = require('fs');
let storageJS = fs.readFileSync('src/utils/storage.js', 'utf8');

// Fix the initializeStorage bug where we placed `await BillQyroDB.clear()` inside a non-async function
storageJS = storageJS.replace(
  /export const initializeStorage = \(\) => {([\s\S]*?)export const resetToDemoData/g,
  (match) => {
    return match.replace(/ await BillQyroDB\.clear\('.*?'\);/g, '');
  }
);

// We still want clearCustomers(), clearInvoices() etc. to actually clear the DB, so let's verify them.
// They were defined as: export const clearCustomers = async () => { ... }
storageJS = storageJS.replace(
  /export const clearCustomers = async \(\) => {[\s\S]*?return { status: 'success' };\s*};/g,
  `export const clearCustomers = async () => {
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
  await BillQyroDB.clear('customers');
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};`
);
storageJS = storageJS.replace(
  /export const clearInvoices = async \(\) => {[\s\S]*?return { status: 'success' };\s*};/g,
  `export const clearInvoices = async () => {
  localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
  await BillQyroDB.clear('invoices');
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};`
);
storageJS = storageJS.replace(
  /export const clearProducts = async \(\) => {[\s\S]*?return { status: 'success' };\s*};/g,
  `export const clearProducts = async () => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([]));
  await BillQyroDB.clear('products');
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};`
);
storageJS = storageJS.replace(
  /export const clearExpenses = async \(\) => {[\s\S]*?return { status: 'success' };\s*};/g,
  `export const clearExpenses = async () => {
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify([]));
  await BillQyroDB.clear('expenses');
  window.dispatchEvent(new CustomEvent('billqyro_sync'));
  return { status: 'success' };
};`
);

fs.writeFileSync('src/utils/storage.js', storageJS);
console.log('Fixed initializeStorage bug');
