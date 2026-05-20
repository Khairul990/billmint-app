/**
 * Calculates subtotals, taxes, and final invoice values
 * @param {Array} items - List of items { price, quantity }
 * @param {number} taxPercentage - Default tax rate
 * @param {number} discountAmount - Dollar/INR flat discount
 * @returns {Object} subtotal, taxAmount, grandTotal
 */
export const calculateTotals = (items = [], taxPercentage = 0, discountAmount = 0) => {
  const subtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return acc + (qty * price);
  }, 0);

  const discount = parseFloat(discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  
  const taxRate = parseFloat(taxPercentage) || 0;
  const taxAmount = (taxableAmount * taxRate) / 100;
  
  const grandTotal = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
};

/**
 * Formats a number as neat business currency
 * @param {number} amount
 * @param {string} symbol - currency sign (e.g. ₹, $)
 */
export const formatCurrency = (amount, symbol = '₹') => {
  const numericAmount = parseFloat(amount) || 0;
  return `${symbol}${numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Scans all invoices to increment to the next logical invoice code
 * @param {Array} invoices
 * @returns {string} e.g. INV-1004
 */
export const generateNextInvoiceNumber = (invoices = []) => {
  if (invoices.length === 0) return 'INV-1001';

  let maxNum = 1000;
  invoices.forEach(inv => {
    const numPart = inv.invoiceNumber ? inv.invoiceNumber.replace('INV-', '') : '';
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  });

  return `INV-${maxNum + 1}`;
};
