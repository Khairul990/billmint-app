/**
 * Server-Side Canonical Invoice Mathematical Engine.
 * 100% Parity with Phase 1 Client Engine (src/utils/invoiceMath.js).
 * Enforces decimal-safe rounding, non-negative invariants, and server-authoritative calculations.
 */

export const roundTo2 = (num) => Math.round((parseFloat(num) || 0) * 100) / 100;

/**
 * Calculates line item total and tax safely
 */
export const calculateLineItemFinancials = (qty, rate, discount = 0, taxPercent = 0) => {
  const quantity = Math.max(0, parseFloat(qty) || 0);
  const unitRate = Math.max(0, parseFloat(rate) || 0);
  const itemDiscount = Math.max(0, parseFloat(discount) || 0);
  const taxPct = Math.max(0, parseFloat(taxPercent) || 0);

  const baseAmount = roundTo2(quantity * unitRate);
  const taxableAmount = Math.max(0, roundTo2(baseAmount - itemDiscount));
  const lineTax = roundTo2((taxableAmount * taxPct) / 100);
  const lineTotal = roundTo2(taxableAmount + lineTax);

  return {
    quantity,
    rate: unitRate,
    discount: itemDiscount,
    taxPercent: taxPct,
    baseAmount,
    taxableAmount,
    taxAmount: lineTax,
    totalAmount: lineTotal
  };
};

/**
 * MASTER SERVER FINANCIAL CALCULATOR.
 * Computes canonical subtotal, taxTotal, discountTotal, grandTotal, amountPaid, balanceDue.
 * Ignores any client-supplied totals.
 */
export const calculateCanonicalInvoiceFinancials = ({
  items = [],
  taxPercentage = 0,
  discountAmount = 0,
  shippingCharge = 0,
  amountPaid = 0
} = {}) => {
  let subtotal = 0;
  let itemsDiscountTotal = 0;
  let itemsTaxTotal = 0;

  const processedItems = (Array.isArray(items) ? items : []).map((item, index) => {
    const line = calculateLineItemFinancials(
      item.quantity ?? item.qty,
      item.rate ?? item.price ?? item.unitPrice,
      item.discount ?? item.discountAmount,
      item.taxPercent ?? item.tax ?? 0
    );

    subtotal += line.taxableAmount;
    itemsDiscountTotal += line.discount;
    itemsTaxTotal += line.taxAmount;

    return {
      sequenceNumber: index + 1,
      name: (item.name || '').trim(),
      description: (item.description || '').trim(),
      quantity: line.quantity,
      rate: line.rate,
      taxPercent: line.taxPercent,
      discountAmount: line.discount,
      totalAmount: line.totalAmount
    };
  });

  const globalDiscount = Math.max(0, parseFloat(discountAmount) || 0);
  const globalShipping = Math.max(0, parseFloat(shippingCharge) || 0);
  const globalTaxPct = Math.max(0, parseFloat(taxPercentage) || 0);

  const totalDiscount = roundTo2(itemsDiscountTotal + globalDiscount);
  const taxableSubtotal = Math.max(0, roundTo2(subtotal - globalDiscount));

  let totalTax = itemsTaxTotal;
  if (globalTaxPct > 0 && itemsTaxTotal === 0) {
    totalTax = roundTo2((taxableSubtotal * globalTaxPct) / 100);
  }

  const grandTotal = Math.max(0, roundTo2(taxableSubtotal + totalTax + globalShipping));
  const paidVal = Math.max(0, roundTo2(parseFloat(amountPaid) || 0));
  const balanceDue = Math.max(0, roundTo2(grandTotal - paidVal));

  let paymentStatus = 'Unpaid';
  if (paidVal >= grandTotal && grandTotal > 0) {
    paymentStatus = 'Paid';
  } else if (paidVal > 0) {
    paymentStatus = 'Partially Paid';
  }

  return {
    items: processedItems,
    financials: {
      subtotal: roundTo2(subtotal),
      taxTotal: roundTo2(totalTax),
      discountTotal: roundTo2(totalDiscount),
      shippingCharge: roundTo2(globalShipping),
      grandTotal: roundTo2(grandTotal),
      amountPaid: roundTo2(paidVal),
      balanceDue: roundTo2(balanceDue),
      status: paymentStatus
    }
  };
};
