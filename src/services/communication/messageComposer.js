// src/services/communication/messageComposer.js

/**
 * Message Composer
 * Takes a template content string with {{variables}} and a context object.
 * Returns the interpolated message with safe fallbacks.
 */
export function composeMessage(templateContent, context = {}) {
  if (!templateContent) return '';
  // Replace each {{var}} with resolved value or empty string
  return templateContent.replace(/{{\s*([^}\s]+)\s*}}/g, (_, varName) => {
    const value = resolveVariable(varName, context);
    return value !== undefined && value !== null ? value : '';
  });
}

/**
 * Resolve known variables from the context hierarchy.
 * Context can contain: business, customer, invoice, settings, etc.
 */
function resolveVariable(name, ctx) {
  // Direct mappings
  const map = {
    businessName: ctx.business?.businessName,
    businessPhone: ctx.business?.phone,
  
    businessAddress: ctx.business?.address,
    customerName: ctx.customer?.name,
    customerId: ctx.customer?.id,
    customerPhone: ctx.customer?.phone,
    invoiceNumber: ctx.invoice?.invoiceNumber,
    invoiceDate: ctx.invoice?.createdAt,
    dueDate: ctx.invoice?.dueDate,
    totalAmount: formatCurrency(ctx.invoice?.grandTotal, ctx.currency),
    paidAmount: formatCurrency(ctx.invoice?.amountPaid, ctx.currency),
    dueAmount: formatCurrency(
      ctx.invoice?.balanceDue !== undefined ? ctx.invoice.balanceDue : (ctx.invoice?.grandTotal - (ctx.invoice?.amountPaid || 0)),
      ctx.currency
    ),
    currency: ctx.currency,
    portalLink: ctx.portalLink,
    paymentLink: ctx.paymentLink,
    businessWhatsApp: ctx.business?.whatsapp
  };
  return map[name];
}

function formatCurrency(amount, symbol = '₹') {
  if (amount == null) return '';
  return `${symbol}${Number(amount).toFixed(2)}`;
}
