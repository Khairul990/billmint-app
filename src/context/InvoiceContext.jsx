import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { invoiceTemplates } from '../data/invoiceTemplates';
import { generateNextInvoiceNumber } from '../utils/invoiceUtils';
import { invoiceEngine } from '../services/invoiceEngine';
import { calculateCanonicalInvoiceFinancials, roundTo2 } from '../utils/invoiceMath';

const InvoiceContext = createContext();

const initialState = {
  id: '', publicToken: '', invoiceNumber: '', date: '', dueDate: '', billType: 'retail', selectedTemplate: 'retail', templateFields: [], pdfVisibleFields: [],
  customer: { id: '', name: '', phone: '', email: '', address: '' }, items: [],
  totals: { subtotal: 0, taxPercentage: 18, taxAmount: 0, discountAmount: 0, grandTotal: 0, oldDue: 0, totalDue: 0, amountPaid: 0, balanceDue: 0 },
  settings: { notes: '', terms: '', paymentStatus: 'Unpaid', orderStatus: 'Pending', paymentMethod: 'Cash', paymentNote: '' }, paymentProofs: [], isInitialized: false
};

const invoiceReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_INVOICE': return { ...state, ...action.payload, isInitialized: true };
    case 'UPDATE_CUSTOMER': return { ...state, customer: { ...state.customer, ...action.payload } };
    case 'SET_ITEMS': return { ...state, items: action.payload };
    case 'ADD_ITEM': return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM': return { ...state, items: state.items.map((item, index) => index === action.payload.index ? { ...item, ...action.payload.item } : item) };
    case 'REMOVE_ITEM': return { ...state, items: state.items.filter((_, index) => index !== action.payload) };
    case 'UPDATE_TOTALS': {
      const updatedTotals = { ...state.totals, ...action.payload };
      const subtotal = state.items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const taxPercentage = updatedTotals.taxPercentage ?? state.totals.taxPercentage ?? 0;
      const taxAmount = (subtotal * taxPercentage) / 100;
      const discountAmount = Number(updatedTotals.discountAmount) || 0;
      const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);
      const amountPaid = Number(updatedTotals.amountPaid) || 0;
      const oldDue = roundTo2(Number(updatedTotals.oldDue) || 0);
      const totalDue = roundTo2(oldDue + Math.max(0, grandTotal - amountPaid));
      let paymentStatus = state.settings.paymentStatus;
      if (amountPaid >= grandTotal && grandTotal > 0) paymentStatus = 'Paid';
      else if (amountPaid > 0 && amountPaid < grandTotal) paymentStatus = 'Partial';
      else if (amountPaid === 0) paymentStatus = 'Unpaid';
      if (paymentStatus === 'Unpaid' && state.dueDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = new Date(state.dueDate);
        if (today > due && (grandTotal - amountPaid) > 0) paymentStatus = 'Overdue';
      }
      return { ...state, totals: { ...updatedTotals, subtotal, taxAmount, grandTotal, oldDue, totalDue, balanceDue: Math.max(0, grandTotal - amountPaid) }, settings: { ...state.settings, paymentStatus } };
    }
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'UPDATE_META': return { ...state, ...action.payload };
    case 'ADD_STATUS_AUDIT': {
      const auditEntry = { action: 'payment_status_changed', oldStatus: action.payload.oldStatus, newStatus: action.payload.newStatus, timestamp: new Date().toISOString() };
      return { ...state, settings: { ...state.settings, auditHistory: [...(state.settings.auditHistory || []), auditEntry] } };
    }
    case 'ADD_PAYMENT_PROOF': return { ...state, paymentProofs: [...state.paymentProofs, action.payload] };
    case 'REMOVE_PAYMENT_PROOF': return { ...state, paymentProofs: state.paymentProofs.filter((_, i) => i !== action.payload) };
    default: return state;
  }
};

// Previous due is the customer's outstanding balance BEFORE this invoice.
// It is calculated from prior invoices only, using each invoice's current-bill balance so
// an already-carried previous due is never counted twice.
const getCustomerPreviousDue = (customerId, customerName, invoices = [], excludeInvoiceId = null) => {
  if (!Array.isArray(invoices) || (!customerId && !customerName)) return 0;
  return roundTo2(invoices.reduce((sum, inv) => {
    if (!inv || inv.id === excludeInvoiceId) return sum;
    const sameId = customerId && (inv.customer?.id === customerId || inv.customerId === customerId);
    const sameName = !customerId && customerName && String(inv.customer?.name || inv.customerName || '').trim().toLowerCase() === String(customerName).trim().toLowerCase();
    if (!sameId && !sameName) return sum;
    const f = calculateCanonicalInvoiceFinancials(inv);
    return sum + (Number(f.currentBillDue) || 0);
  }, 0));
};

export const InvoiceProvider = ({ children, editingInvoice, invoices, businessSettings }) => {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);
  const lastInitializedKeyRef = React.useRef(null);

  useEffect(() => {
    const currentKey = editingInvoice ? `edit_${editingInvoice.id}_${editingInvoice.updatedAt || ''}` : 'new';
    if (lastInitializedKeyRef.current === currentKey) return;
    lastInitializedKeyRef.current = currentKey;
    if (editingInvoice) {
      const parsedItems = (editingInvoice.items || []).map((item, idx) => ({ id: item.id || `item-${Date.now()}-${idx}`, sn: item.sn || idx + 1, designNo: item.designNo || '', workType: item.workType || 'Embroidery', description: item.description || item.name || '', size: item.size || '', qty: item.qty || item.quantity || 1, rate: item.rate || item.price || 0, amount: item.amount || (item.qty || 1) * (item.rate || 0), smartRate: item.smartRate || { repair: 0, punching: 0, embroidery: 0, other: 0 }, productName: item.productName || '', unit: item.unit || 'Piece', price: item.price || 0, discount: item.discount || 0, category: item.category || '', sizeVariant: item.sizeVariant || '', serviceName: item.serviceName || '', problemDetails: item.problemDetails || '', partsCost: item.partsCost || 0, labourCharge: item.labourCharge || 0, itemService: item.itemService || '' }));
      const previousDue = roundTo2(Number(editingInvoice.totals?.oldDue ?? editingInvoice.oldDue ?? editingInvoice.previousDue) || 0);
      dispatch({ type: 'INIT_INVOICE', payload: {
        id: editingInvoice.id, publicToken: editingInvoice.publicToken || editingInvoice.id, invoiceNumber: editingInvoice.invoiceNumber, date: editingInvoice.date, dueDate: editingInvoice.dueDate,
        billType: editingInvoice.billType || businessSettings?.defaultBillingTemplate || 'custom', selectedTemplate: editingInvoice.selectedTemplate || 'retail', templateFields: invoiceTemplates.find(t => t.id === (editingInvoice.selectedTemplate || 'retail'))?.fields || invoiceTemplates[0].fields, pdfVisibleFields: editingInvoice.pdfVisibleFields || [],
        customer: { id: editingInvoice.customer?.id || editingInvoice.customerId || '', name: editingInvoice.customer?.name || editingInvoice.customerName || '', phone: editingInvoice.customer?.phone || editingInvoice.customerPhone || '', email: editingInvoice.customer?.email || editingInvoice.customerEmail || '', address: editingInvoice.customer?.address || editingInvoice.customerAddress || '' }, items: parsedItems,
        totals: { subtotal: editingInvoice.totals?.subtotal || editingInvoice.subtotal || 0, taxPercentage: editingInvoice.totals?.taxPercentage ?? editingInvoice.taxPercentage ?? 18, taxAmount: editingInvoice.totals?.taxAmount || editingInvoice.taxAmount || 0, discountAmount: editingInvoice.totals?.discountAmount || editingInvoice.discountAmount || 0, grandTotal: editingInvoice.totals?.grandTotal || editingInvoice.grandTotal || 0, oldDue: previousDue, totalDue: roundTo2(previousDue + Math.max(0, (Number(editingInvoice.totals?.grandTotal || editingInvoice.grandTotal) || 0) - (Number(editingInvoice.totals?.amountPaid || editingInvoice.amountPaid) || 0))), amountPaid: editingInvoice.totals?.amountPaid || editingInvoice.amountPaid || 0, balanceDue: editingInvoice.totals?.balanceDue || editingInvoice.balanceDue || 0 },
        settings: { notes: editingInvoice.settings?.notes || editingInvoice.notes || '', terms: editingInvoice.settings?.terms || editingInvoice.terms || '', paymentStatus: editingInvoice.settings?.paymentStatus || editingInvoice.paymentStatus || 'Unpaid', orderStatus: editingInvoice.settings?.orderStatus || editingInvoice.orderStatus || 'Pending', paymentMethod: editingInvoice.settings?.paymentMethod || editingInvoice.paymentMethod || 'Cash', paymentNote: editingInvoice.settings?.paymentNote || editingInvoice.paymentNote || '' }, paymentProofs: editingInvoice.paymentProofs || []
      }});
    } else {
      const today = new Date().toISOString().split('T')[0]; const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + 14); const due = futureDate.toISOString().split('T')[0];
      dispatch({ type: 'INIT_INVOICE', payload: { id: 'inv-' + Date.now(), publicToken: invoiceEngine.generateSecureToken(), invoiceNumber: generateNextInvoiceNumber(invoices), date: today, dueDate: due, billType: businessSettings?.defaultBillingTemplate || 'custom', selectedTemplate: 'retail', templateFields: invoiceTemplates[0].fields, pdfVisibleFields: businessSettings?.pdfVisibleFields?.[businessSettings?.defaultBillingTemplate || 'custom'] || [], items: [{ id: `item-${Date.now()}-0`, sn: 1, designNo: '', workType: 'Embroidery', description: '', size: '', qty: 1, rate: 0, amount: 0, smartRate: { repair: 0, punching: 0, embroidery: 0, other: 0 } }], totals: { subtotal: 0, taxPercentage: businessSettings?.defaultTax ?? 18, taxAmount: 0, discountAmount: 0, grandTotal: 0, oldDue: 0, totalDue: 0, amountPaid: 0, balanceDue: 0 }, settings: { notes: businessSettings?.defaultNotes || 'Thank you for choosing BillQyro! Payment is expected within due date.', terms: businessSettings?.terms || '', paymentStatus: 'Unpaid', orderStatus: 'Pending', paymentMethod: 'Cash', paymentNote: '' } } });
    }
  }, [editingInvoice, invoices, businessSettings]);

  // Keep previous due live while selecting/changing a customer on a new invoice.
  useEffect(() => {
    if (!state.isInitialized || editingInvoice || !state.customer?.id && !state.customer?.name) return;
    const oldDue = getCustomerPreviousDue(state.customer.id, state.customer.name, invoices, state.id);
    if (roundTo2(Number(state.totals.oldDue) || 0) !== oldDue) dispatch({ type: 'UPDATE_TOTALS', payload: { oldDue } });
  }, [state.customer?.id, state.customer?.name, invoices, state.id, editingInvoice, state.isInitialized]);

  return <InvoiceContext.Provider value={{ state, dispatch, businessSettings, editingInvoice, invoices }}>{children}</InvoiceContext.Provider>;
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) throw new Error('useInvoice must be used within an InvoiceProvider');
  return context;
};
