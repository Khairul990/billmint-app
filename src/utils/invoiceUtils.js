/**
 * Calculates subtotals, taxes, and final invoice values
 * @param {Array} items - List of items { price, quantity }
 * @param {number} taxPercentage - Default tax rate
 * @param {number} discountAmount - Dollar/INR flat discount
 * @returns {Object} subtotal, taxAmount, grandTotal
 */
export const calculateTotals = (items = [], taxPercentage = 0, discountAmount = 0) => {
  const subtotal = items.reduce((acc, item) => {
    return acc + (parseFloat(item.amount) || 0);
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
export const formatCurrency = (amount, symbol = '₹', formatOption = 'Indian') => {
  const numericAmount = parseFloat(amount) || 0;
  let locale = 'en-IN';
  if (formatOption === 'Standard') {
    locale = 'en-US';
  } else if (formatOption === 'European') {
    locale = 'de-DE';
  }
  return `${symbol}${numericAmount.toLocaleString(locale, {
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

/**
 * Scans all invoices to find the highest SO-[number] design number and returns the next one.
 * @param {Array} invoices
 * @param {number} offset - row offset index
 * @returns {string} e.g. SO-9
 */
export const getNextDesignNumber = (invoices = [], offset = 0) => {
  let maxNum = 4; // Seeds have SO-5 to SO-8, so start at 4 if no items are found
  
  invoices.forEach(inv => {
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach(item => {
        if (item.designNo && typeof item.designNo === 'string' && item.designNo.startsWith('SO-')) {
          const numPart = item.designNo.replace('SO-', '');
          const parsed = parseInt(numPart, 10);
          if (!isNaN(parsed) && parsed > maxNum) {
            maxNum = parsed;
          }
        }
      });
    }
  });

  return `SO-${maxNum + 1 + offset}`;
};

/**
 * Auto-increments any string ending with a number (e.g. "KO-1" -> "KO-2", "sh-09" -> "sh-10")
 * Prevents conflicts by scanning existing items for the same prefix.
 * @param {string} str 
 * @param {Array} items 
 * @returns {string}
 */
export const autoIncrementString = (str, items = []) => {
  if (!str) return '';
  str = str.trim();
  
  let prefix = '';
  let numLength;
  let currentNum;

  const match = str.match(/^(.*?)(\d+)$/);
  if (match) {
    prefix = match[1];
    currentNum = parseInt(match[2], 10);
    numLength = match[2].length;
  } else {
    // If it doesn't end with a number, append '-' and start at 1
    if (str.endsWith('-')) {
      prefix = str;
    } else {
      prefix = str + '-';
    }
    currentNum = 0;
    numLength = 1;
  }

  let maxNum = currentNum;
  
  // Check all current items to find the highest number for this prefix
  items.forEach(item => {
     if (item.designNo && typeof item.designNo === 'string') {
        const itemCode = item.designNo.trim();
        if (itemCode.startsWith(prefix)) {
           const itemMatch = itemCode.match(/^(.*?)(\d+)$/);
           if (itemMatch && itemMatch[1] === prefix) {
              const n = parseInt(itemMatch[2], 10);
              if (!isNaN(n) && n > maxNum) {
                 maxNum = n;
              }
           }
        }
     }
  });

  const nextNum = maxNum + 1;
  const nextNumStr = nextNum.toString().padStart(numLength, '0');
  return `${prefix}${nextNumStr}`;
};
