import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { calculateTotals, generateNextInvoiceNumber } from '../utils/invoiceUtils';
import { invoiceTemplates } from '../config/invoiceTemplates';

const InvoiceContext = createContext(null);

const initialState = {
  id: '',
  invoiceNumber: '',
  generatingNumber: false,
  date: '',
  dueDate: '',
  billType: 'custom',
  selectedTemplate: 'retail',
  templateFields: invoiceTemplates[0].fields,
  pdfVisibleFields: [],
  customer: {
    id: '',
    name: '',
    phone: '',
    email: '',
    address: ''
  },
  items: [],
  totals: {
    subtotal: 0,
    taxPercentage: 18,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 0,
    amountPaid: 0,
    balanceDue: 0
  },
  settings: {
    notes: '',
    terms: '',
    paymentStatus: 'Unpaid',
    orderStatus: 'Pending',
    paymentMethod: 'Cash',
    paymentNote: ''
  },
  paymentProofs: [],
  saveCustomer: true,
  isInitialized: false, // Prevents overwriting with defaults when editing
};

const invoiceReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_INVOICE': {
      return { ...state, ...action.payload, isInitialized: true };
    }
    
    case 'GENERATE_INVOICE_NUMBER_START': {
      return { ...state, generatingNumber: true };
    }
    
    case 'SET_INVOICE_NUMBER': {
      return { ...state, invoiceNumber: action.payload, generatingNumber: false };
    }
    
    case 'SET_TEMPLATE': {
      const template = invoiceTemplates.find(t => t.id === action.payload);
      return {
        ...state,
        selectedTemplate: action.payload,
        templateFields: template ? template.fields : [],
        items: [], // Reset items when template changes
      };
    }
    
    case 'UPDATE_CUSTOMER': {
      return {
        ...state,
        customer: { ...state.customer, ...action.payload }
      };
    }
    
    case 'UPDATE_SAVE_CUSTOMER': {
      return { ...state, saveCustomer: action.payload };
    }

    case 'SET_ITEMS': {
      const newItems = action.payload;
      const { subtotal, taxAmount, grandTotal } = calculateTotals(
        newItems, 
        state.totals.taxPercentage, 
        state.totals.discountAmount
      );
      return {
        ...state,
        items: newItems,
        totals: {
          ...state.totals,
          subtotal,
          taxAmount,
          grandTotal,
          balanceDue: Math.max(0, grandTotal - state.totals.amountPaid)
        }
      };
    }

    case 'UPDATE_ITEM_FIELD': {
      const { index, field, value } = action.payload;
      const newItems = [...state.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      const { subtotal, taxAmount, grandTotal } = calculateTotals(
        newItems, state.totals.taxPercentage, state.totals.discountAmount
      );
      return {
        ...state, items: newItems, totals: { ...state.totals, subtotal, taxAmount, grandTotal, balanceDue: Math.max(0, grandTotal - state.totals.amountPaid) }
      };
    }

    case 'ADD_EMPTY_ROW': {
      const newItems = [...state.items, {
        id: `item-${Date.now()}`, sn: state.items.length + 1, description: '', itemService: '', qty: 1, rate: 0, discount: 0, tax: 0, unit: 'Piece'
      }];
      return { ...state, items: newItems };
    }

    case 'COPY_ROW': {
      const itemToCopy = { ...state.items[action.payload], id: `item-${Date.now()}`, sn: state.items.length + 1 };
      const newItems = [...state.items, itemToCopy];
      const { subtotal, taxAmount, grandTotal } = calculateTotals(newItems, state.totals.taxPercentage, state.totals.discountAmount);
      return { ...state, items: newItems, totals: { ...state.totals, subtotal, taxAmount, grandTotal, balanceDue: Math.max(0, grandTotal - state.totals.amountPaid) } };
    }

    case 'DELETE_ROW': {
      const index = action.payload;
      let newItems;
      if (state.items.length === 1) {
        newItems = [{ ...state.items[0], itemService: '', description: '', qty: 1, rate: 0 }];
      } else {
        newItems = state.items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sn: idx + 1 }));
      }
      const { subtotal, taxAmount, grandTotal } = calculateTotals(newItems, state.totals.taxPercentage, state.totals.discountAmount);
      return { ...state, items: newItems, totals: { ...state.totals, subtotal, taxAmount, grandTotal, balanceDue: Math.max(0, grandTotal - state.totals.amountPaid) } };
    }

    case 'BULK_DELETE_ROWS': {
      const indicesSet = new Set(action.payload);
      let newItems = state.items.filter((_, i) => !indicesSet.has(i)).map((item, idx) => ({ ...item, sn: idx + 1 }));
      if (newItems.length === 0) {
        newItems.push({ id: `item-${Date.now()}`, sn: 1, description: '', itemService: '', qty: 1, rate: 0, discount: 0, tax: 0, unit: 'Piece' });
      }
      const { subtotal, taxAmount, grandTotal } = calculateTotals(newItems, state.totals.taxPercentage, state.totals.discountAmount);
      return { ...state, items: newItems, totals: { ...state.totals, subtotal, taxAmount, grandTotal, balanceDue: Math.max(0, grandTotal - state.totals.amountPaid) } };
    }

    case 'UPDATE_TOTALS': {
      const updatedTotals = { ...state.totals, ...action.payload };
      const { subtotal, taxAmount, grandTotal } = calculateTotals(
        state.items, 
        updatedTotals.taxPercentage, 
        updatedTotals.discountAmount
      );
      
      let paymentStatus = state.settings.paymentStatus;
      const amountPaid = updatedTotals.amountPaid;
      
      if (amountPaid >= grandTotal && grandTotal > 0) {
        paymentStatus = 'Paid';
      } else if (amountPaid === 0) {
        paymentStatus = 'Unpaid';
      } else if (amountPaid > 0 && amountPaid < grandTotal) {
        paymentStatus = 'Partial';
      }

      // Check for Overdue
      if (paymentStatus !== 'Paid' && state.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(state.dueDate);
        if (today > due && (grandTotal - amountPaid) > 0) {
          paymentStatus = 'Overdue';
        }
      }

      return {
        ...state,
        totals: {
          ...updatedTotals,
          subtotal,
          taxAmount,
          grandTotal,
          balanceDue: Math.max(0, grandTotal - amountPaid)
        },
        settings: {
          ...state.settings,
          paymentStatus
        }
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    }
    
    case 'UPDATE_META': {
      return {
        ...state,
        ...action.payload // e.g. { billType: 'grocery' }
      };
    }
    
    case 'ADD_PAYMENT_PROOF': {
      return {
        ...state,
        paymentProofs: [...state.paymentProofs, action.payload]
      };
    }

    case 'REMOVE_PAYMENT_PROOF': {
      return {
        ...state,
        paymentProofs: state.paymentProofs.filter((_, i) => i !== action.payload)
      };
    }

    default:
      return state;
  }
};

export const InvoiceProvider = ({ children, editingInvoice, invoices, businessSettings }) => {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);

  // Initialize State (Edit mode vs Create mode)
  useEffect(() => {
    if (state.isInitialized) return;

    if (editingInvoice) {
      // Setup edit mode
      const parsedItems = (editingInvoice.items || []).map((item, idx) => ({
        id: item.id || `item-${Date.now()}-${idx}`,
        sn: item.sn || idx + 1,
        designNo: item.designNo || '',
        workType: item.workType || 'Embroidery',
        description: item.description || item.name || '',
        size: item.size || '',
        qty: item.qty || item.quantity || 1,
        rate: item.rate || item.price || 0,
        amount: item.amount || (item.qty || 1) * (item.rate || 0),
        smartRate: item.smartRate || { repair: 0, punching: 0, embroidery: 0, other: 0 },
        // ... include other potential fields needed by templates
        productName: item.productName || '',
        unit: item.unit || 'Piece',
        price: item.price || 0,
        discount: item.discount || 0,
        category: item.category || '',
        sizeVariant: item.sizeVariant || '',
        serviceName: item.serviceName || '',
        problemDetails: item.problemDetails || '',
        partsCost: item.partsCost || 0,
        labourCharge: item.labourCharge || 0,
        itemService: item.itemService || ''
      }));

      dispatch({
        type: 'INIT_INVOICE',
        payload: {
          id: editingInvoice.id,
          invoiceNumber: editingInvoice.invoiceNumber,
          date: editingInvoice.date,
          dueDate: editingInvoice.dueDate,
          billType: editingInvoice.billType || businessSettings?.defaultBillingTemplate || 'custom',
          selectedTemplate: editingInvoice.selectedTemplate || 'retail',
          templateFields: invoiceTemplates.find(t => t.id === (editingInvoice.selectedTemplate || 'retail'))?.fields || invoiceTemplates[0].fields,
          pdfVisibleFields: editingInvoice.pdfVisibleFields || [],
          customer: {
            id: editingInvoice.customerId || '',
            name: editingInvoice.customerName || '',
            phone: editingInvoice.customerPhone || '',
            email: editingInvoice.customerEmail || '',
            address: editingInvoice.customerAddress || ''
          },
          items: parsedItems,
          totals: {
            subtotal: editingInvoice.subtotal || 0,
            taxPercentage: editingInvoice.taxPercentage ?? 18,
            taxAmount: editingInvoice.taxAmount || 0,
            discountAmount: editingInvoice.discountAmount || 0,
            grandTotal: editingInvoice.grandTotal || 0,
            amountPaid: editingInvoice.amountPaid || 0,
            balanceDue: editingInvoice.balanceDue || 0
          },
          settings: {
            notes: editingInvoice.notes || '',
            terms: editingInvoice.terms || '',
            paymentStatus: editingInvoice.paymentStatus || 'Unpaid',
            orderStatus: editingInvoice.orderStatus || 'Pending',
            paymentMethod: editingInvoice.paymentMethod || 'Cash',
            paymentNote: editingInvoice.paymentNote || ''
          },
          paymentProofs: editingInvoice.paymentProofs || []
        }
      });
    } else {
      // Setup create mode
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const due = futureDate.toISOString().split('T')[0];

      dispatch({
        type: 'INIT_INVOICE',
        payload: {
          id: 'inv-' + Date.now(),
          invoiceNumber: generateNextInvoiceNumber(invoices),
          date: today,
          dueDate: due,
          billType: businessSettings?.defaultBillingTemplate || 'custom',
          selectedTemplate: 'retail',
          templateFields: invoiceTemplates[0].fields,
          pdfVisibleFields: businessSettings?.pdfVisibleFields?.[businessSettings?.defaultBillingTemplate || 'custom'] || [],
          items: [{
            id: `item-${Date.now()}-0`,
            sn: 1,
            designNo: '',
            workType: 'Embroidery',
            description: '',
            size: '',
            qty: 1,
            rate: 0,
            amount: 0,
            smartRate: { repair: 0, punching: 0, embroidery: 0, other: 0 }
          }],
          totals: {
            subtotal: 0,
            taxPercentage: businessSettings?.defaultTax ?? 18,
            taxAmount: 0,
            discountAmount: 0,
            grandTotal: 0,
            amountPaid: 0,
            balanceDue: 0
          },
          settings: {
            notes: businessSettings?.defaultNotes || 'Thank you for choosing BillQyro! Payment is expected within due date.',
            terms: businessSettings?.terms || '',
            paymentStatus: 'Unpaid',
            orderStatus: 'Pending',
            paymentMethod: 'Cash',
            paymentNote: ''
          }
        }
      });
    }
  }, [editingInvoice, invoices, businessSettings, state.isInitialized]);

  return (
    <InvoiceContext.Provider value={{ state, dispatch, businessSettings, editingInvoice }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};
