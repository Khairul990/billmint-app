import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Save, LayoutTemplate, Plus, Trash2, Copy, FileText, 
  Eye, EyeOff, Maximize, X, Check, ChevronDown, Palette, Columns, 
  DollarSign, UserPlus, CreditCard, Layers, Tag, ChevronUp, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/invoiceUtils';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import InvoiceCustomizationPanel from '../components/invoice-templates/InvoiceCustomizationPanel';
import InvoicePreview from '../components/InvoicePreview';
import { LivePreviewLayouts } from '../components/invoice-templates/layouts/LivePreviewLayouts';
import { UNIVERSAL_TEMPLATES } from '../services/TemplateEngine';
import { getStudioHeaderTarget } from '../utils/portalTargets';
import { getInvoiceColumns } from '../utils/invoiceSchema';
import { customerEngine } from '../services/customerEngine';
import { computeCustomerLedger, allocatePayment } from '../utils/financialCalculations';
import { toast } from 'react-hot-toast';

const CreateInvoice = ({ 
  onSaveInvoice, 
  invoices = [], 
  customers = [], 
  staffs = [], 
  products = [], 
  businessSettings, 
  editingInvoice, 
  onBack, 
  defaultTemplate = 'minimal-classic', 
  subscription 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(businessSettings?.selectedPdfTemplate || defaultTemplate);
  const [viewMode, setViewMode] = useState('pdf');
  const [activeTab, setActiveTab] = useState('listing');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftBusinessSettings, setDraftBusinessSettings] = useState(businessSettings || {});
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [billingTarget, setBillingTarget] = useState('customer');
  const [items, setItems] = useState([
    { id: Date.now().toString(), sNo: '1', name: '', qty: 1, price: 0, customFields: {} }
  ]);
  const [discountType, setDiscountType] = useState('none');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [oldDue, setOldDue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(businessSettings?.defaultPaymentMethod || 'Cash');
  const [notes, setNotes] = useState('Thank you for your business!');
  const [previewQrCode, setPreviewQrCode] = useState(null);
  const [enableQrCode, setEnableQrCode] = useState(true);

  // Quick Add Customer state
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  // Category item expandable state
  const [expandedCategoryItemId, setExpandedCategoryItemId] = useState(null);

  const [invoiceColumns, setInvoiceColumns] = useState([]);

  // Active workspace type
  const wsType = (businessSettings?.businessType || businessSettings?.businessWorkspaces?.find(
    ws => ws.id === businessSettings.activeWorkspaceId
  )?.type || 'retail').toLowerCase();

  useEffect(() => {
    if (businessSettings) {
      const sourceInvoice = editingInvoice || { settings: { invoiceBuilderSettings: businessSettings?.invoiceBuilderSettings } };
      setInvoiceColumns(
        getInvoiceColumns(sourceInvoice, businessSettings).sort((a, b) => a.order - b.order)
      );
    }
  }, [businessSettings, editingInvoice]);

  useEffect(() => {
    const builderSettings = draftBusinessSettings?.invoiceBuilderSettings || {};
    const customCols = builderSettings.customColumns || [];
    const itemLabel = builderSettings.itemLabel || 'Item';
    const taxLabel = builderSettings.taxLabel || 'Tax';
    
    setInvoiceColumns(cols => cols.map(c => {
      let label = c.label;
      if (c.id === 'item' && itemLabel) label = itemLabel;
      else if (c.id === 'tax' && taxLabel) label = taxLabel;
      else if (c.isExtra) {
        const customCol = customCols.find(cc => cc.id === c.id);
        if (customCol) label = customCol.name;
      }
      return { ...c, label };
    }));
  }, [draftBusinessSettings]);

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)), 0);
    const discountAmt = parseFloat(discountAmount) || 0;
    let discount = 0;
    if (discountType === 'percent') {
      discount = subtotal * (discountAmt / 100);
    } else if (discountType === 'flat') {
      discount = discountAmt;
    }
    const afterDiscount = Math.max(0, subtotal - discount);
    const tax = afterDiscount * ((parseFloat(taxPercent) || 0) / 100);
    const shippingVal = parseFloat(shipping) || 0;
    const oldDueVal = parseFloat(oldDue) || 0;
    
    // Canonical arithmetic invariants
    const grandTotal = Math.round((afterDiscount + tax + shippingVal) * 100) / 100;
    const paidVal = parseFloat(amountPaid) || 0;

    // Canonical Allocation: Settle Old Due first, then Current Invoice
    const allocation = allocatePayment(paidVal, oldDueVal, grandTotal);

    return { 
      subtotal: Math.round(subtotal * 100) / 100, 
      discount: Math.round(discount * 100) / 100, 
      tax: Math.round(tax * 100) / 100, 
      grandTotal, 
      oldDue: oldDueVal, 
      totalDue: allocation.totalReceivable, 
      totalReceivable: allocation.totalReceivable, 
      paidVal, 
      allocatedToOldDue: allocation.allocatedToOldDue,
      remainingOldDue: allocation.remainingOldDue,
      allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
      currentBillDue: allocation.remainingCurrentInvoiceDue,
      balanceDue: allocation.customerTotalDue, 
      paymentStatus: allocation.currentInvoicePaymentStatus 
    };
  }, [items, discountType, discountAmount, taxPercent, shipping, oldDue, amountPaid]);

  // Auto-calculate canonical Previous Due when selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        const ledger = computeCustomerLedger(cust, invoices, editingInvoice?.id);
        setOldDue(ledger.totalDue);
      }
    } else {
      if (!editingInvoice) {
        setOldDue(0);
      }
    }
  }, [selectedCustomerId, customers, invoices, editingInvoice]);

  useEffect(() => {
    const generateQr = async () => {
      const paymentQrEnabled = enableQrCode || businessSettings?.paymentQrEnabled || false;
      const showQrInPreview = businessSettings?.showQrInPreview !== false;
      
      if (paymentQrEnabled && showQrInPreview) {
        const method = businessSettings?.paymentMethod || 'Manual';
        const upiId = businessSettings?.upiId || '';
        const bkashNumber = businessSettings?.bkashNumber || '';
        const nagadNumber = businessSettings?.nagadNumber || '';
        const payeeName = businessSettings?.payeeName || businessSettings?.businessName || '';
        const currencyCode = businessSettings?.currencyCode || 'INR';
        const dueAmount = totals.grandTotal || 0;

        let qrText = '';
        if (method === 'UPI') {
          qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${dueAmount}&cu=${currencyCode}&tn=${invoiceNumber}`;
        } else if (method === 'bKash') {
          qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoiceNumber}`;
        } else if (method === 'Nagad') {
          qrText = `Nagad Payment\nNumber: ${nagadNumber}\nAmount: ${dueAmount}\nInvoice: ${invoiceNumber}`;
        } else {
          qrText = `${window.location.origin}/invoice/preview`;
        }

        try {
          const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 120 });
          setPreviewQrCode(qrDataUrl);
        } catch (e) {
          console.error(e);
        }
      } else {
        setPreviewQrCode(null);
      }
    };
    generateQr();
  }, [businessSettings, totals.grandTotal, invoiceNumber, enableQrCode]);

  const lastInitializedIdRef = React.useRef(null);

  useEffect(() => {
    const currentKey = editingInvoice?.id ? `edit_${editingInvoice.id}` : 'new';
    
    // Form must only initialize when the invoice identity changes (Create vs Edit invoice ID)
    if (lastInitializedIdRef.current === currentKey) {
      return;
    }
    lastInitializedIdRef.current = currentKey;

    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber || editingInvoice.id);
      setDate(editingInvoice.date || new Date().toISOString().split('T')[0]);
      if (editingInvoice.customerId) {
        setSelectedCustomerId(editingInvoice.customerId);
      } else if (editingInvoice.customerName) {
        const cust = customers.find(c => c.name === editingInvoice.customerName || (editingInvoice.customerPhone && c.phone === editingInvoice.customerPhone));
        if (cust) setSelectedCustomerId(cust.id);
      }
      if (editingInvoice.items && editingInvoice.items.length > 0) {
        setItems(editingInvoice.items.map((it, idx) => ({
          id: it.id || (Date.now().toString() + idx),
          sNo: it.sNo || (idx + 1).toString(),
          name: it.itemService || it.name || it.description || '',
          description: it.description || '',
          qty: parseFloat(it.qty ?? it.quantity) || 1,
          price: parseFloat(it.rate ?? it.price) || 0,
          customFields: it.customFields || {}
        })));
      }
      setDiscountAmount(parseFloat(editingInvoice.discountAmount) || 0);
      setDiscountType(parseFloat(editingInvoice.discountAmount) > 0 ? 'flat' : 'none');
      setTaxPercent(parseFloat(editingInvoice.taxAmount) ? (parseFloat(editingInvoice.taxAmount) / (parseFloat(editingInvoice.subtotal) || 1)) * 100 : 0);
      setShipping(parseFloat(editingInvoice.shipping) || 0);
      setOldDue(parseFloat(editingInvoice.oldDue) || 0);
      setAmountPaid(parseFloat(editingInvoice.amountPaid ?? editingInvoice.paidAmount) || 0);
      setPaymentMethod(editingInvoice.paymentMethod || 'Cash');
      setNotes(editingInvoice.notes || '');
      setSelectedTemplate(editingInvoice.selectedTemplate || businessSettings?.selectedPdfTemplate || defaultTemplate);
    } else {
      // Clean blank state for Create mode
      setInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedCustomerId('');
      setSelectedStaffId('');
      setItems([{ id: Date.now().toString(), sNo: '1', name: '', qty: 1, price: 0, customFields: {} }]);
      setDiscountType('none');
      setDiscountAmount(0);
      setTaxPercent(businessSettings?.defaultTax || 0);
      setShipping(0);
      setOldDue(0);
      setAmountPaid(0);
      setPaymentMethod(businessSettings?.defaultPaymentMethod || 'Cash');
      setNotes(businessSettings?.defaultNotes || 'Thank you for your business!');
    }
  }, [editingInvoice]);

  const customer = customers.find(c => c.id === selectedCustomerId);
  const staff = staffs.find(s => s.id === selectedStaffId);

  const previewData = useMemo(() => ({
    invoiceNumber: invoiceNumber || 'INV-XXXX',
    date: date ? new Date(date).toLocaleDateString() : '-',
    customerName: billingTarget === 'staff' ? (staff?.name || 'Walk-in Staff') : (customer ? customer.name : 'Walk-in Customer'),
    customerPhone: billingTarget === 'staff' ? (staff?.phone || '') : (customer?.phone || ''),
    billingTarget,
    selectedTemplate,
    pdfTemplate: selectedTemplate,
    items: items.map(i => ({ 
      ...i, 
      description: i.name, 
      rate: parseFloat(i.price) || 0, 
      qty: parseFloat(i.qty) || 0, 
      amount: (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0) 
    })),
    subtotal: totals.subtotal,
    taxAmount: totals.tax,
    discountAmount: totals.discount,
    shipping: parseFloat(shipping) || 0,
    grandTotal: totals.grandTotal,
    oldDue: totals.oldDue,
    totalDue: totals.totalReceivable,
    totalReceivable: totals.totalReceivable,
    amountPaid: totals.paidVal,
    paidAmount: totals.paidVal,
    balanceDue: totals.balanceDue,
    paymentStatus: totals.paymentStatus,
    totals: { 
      ...totals, 
      tax: totals.tax, 
      amountPaid: totals.paidVal,
      balanceDue: totals.balanceDue,
      paymentStatus: totals.paymentStatus
    },
    notes,
    businessSettings: {
      ...draftBusinessSettings,
      selectedPdfTemplate: selectedTemplate,
      bankDetails: { ...(draftBusinessSettings?.bankDetails || {}), ...bankDetails },
      upiId: bankDetails.upiId || draftBusinessSettings?.bankDetails?.upiId || draftBusinessSettings?.upiId
    },
    regionalSettingsSnapshot: {
      country: draftBusinessSettings?.country || 'India',
      currency: draftBusinessSettings?.currency || '₹',
      currencyCode: draftBusinessSettings?.currencyCode || 'INR',
      numberFormat: draftBusinessSettings?.numberFormat || 'Indian',
      dateFormat: draftBusinessSettings?.dateFormat || 'DD/MM/YYYY'
    },
    paymentSettingsSnapshot: {
      paymentMethod,
      upiId: bankDetails.upiId || draftBusinessSettings?.bankDetails?.upiId || draftBusinessSettings?.upiId || '',
      bkashNumber: draftBusinessSettings?.bkashNumber || '',
      nagadNumber: draftBusinessSettings?.nagadNumber || '',
      payeeName: draftBusinessSettings?.payeeName || draftBusinessSettings?.businessName || ''
    },
    currencySymbol: draftBusinessSettings?.currency || '₹',
    invoiceColumns,
    qrCodeBase64: previewQrCode
  }), [invoiceNumber, date, customer, staff, billingTarget, selectedTemplate, items, shipping, totals, notes, draftBusinessSettings, bankDetails, paymentMethod, invoiceColumns, previewQrCode]);

  const handleAddItem = () => {
    const sNo = items.length > 0 ? (parseInt(items[items.length-1].sNo) + 1).toString() : '1';
    setItems([...items, { id: Date.now().toString(), sNo: isNaN(sNo) ? '' : sNo, name: '', qty: 1, price: 0, customFields: {} }]);
  };

  const handleUpdateItem = (id, field, value, isCustom = false) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (isCustom) {
          return { ...item, customFields: { ...(item.customFields || {}), [field]: value } };
        }
        
        // Auto-match product from catalog
        if (field === 'name' && value) {
          const matched = products.find(p => p.name?.toLowerCase() === value.trim().toLowerCase() || p.sku === value.trim());
          if (matched) {
            return {
              ...item,
              name: matched.name,
              price: parseFloat(matched.sellingPrice ?? matched.price ?? matched.rate) || item.price,
              description: matched.description || item.description
            };
          }
        }

        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id).map((it, idx) => ({ ...it, sNo: (idx + 1).toString() })));
    } else {
      setItems([{ id: Date.now().toString(), sNo: '1', name: '', qty: 1, price: 0, customFields: {} }]);
    }
  };

  const handleDuplicateItem = (id) => {
    const itemToDuplicate = items.find(item => item.id === id);
    if (itemToDuplicate) {
      const copiedItem = { ...itemToDuplicate, id: Date.now().toString() };
      setItems([...items, copiedItem].map((it, idx) => ({ ...it, sNo: (idx + 1).toString() })));
    }
  };

  // Quick Add Customer Handler
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim() || isSavingCustomer) return;

    setIsSavingCustomer(true);
    try {
      const newCust = {
        id: `cust_${Date.now()}`,
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim(),
        previousDue: 0,
        createdAt: new Date().toISOString()
      };
      await customerEngine.saveCustomer(newCust);
      customers.push(newCust);
      setSelectedCustomerId(newCust.id);
      setShowQuickAddCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      toast.success('Customer added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add customer');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    const isEditing = Boolean(editingInvoice?.id);
    const existingPaymentHistory = Array.isArray(editingInvoice?.paymentHistory) ? [...editingInvoice.paymentHistory] : [];
    
    // In edit mode: if legacy invoice had paid amount > 0 but empty history, initialize baseline
    let finalPaymentHistory = [...existingPaymentHistory];
    const initialPaid = parseFloat(editingInvoice?.amountPaid ?? editingInvoice?.paidAmount) || 0;
    if (isEditing && finalPaymentHistory.length === 0 && initialPaid > 0) {
      finalPaymentHistory = [{
        id: 'pmt_init_' + (editingInvoice.id || Date.now()),
        amount: initialPaid,
        method: editingInvoice.paymentMethod || 'Cash',
        date: editingInvoice.date || new Date().toISOString(),
        note: 'Initial payment'
      }];
    }

    const currentHistorySum = Math.round(finalPaymentHistory.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100;
    const paidVal = Math.round((parseFloat(totals.paidVal) || 0) * 100) / 100;

    if (isEditing) {
      if (paidVal > currentHistorySum) {
        const delta = Math.round((paidVal - currentHistorySum) * 100) / 100;
        if (delta > 0) {
          finalPaymentHistory.push({
            id: 'pmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            amount: delta,
            method: paymentMethod || 'Cash',
            date: new Date().toISOString(),
            note: 'Payment on edit'
          });
        }
      } else if (paidVal === 0) {
        finalPaymentHistory = [];
      } else if (paidVal < currentHistorySum) {
        finalPaymentHistory = [{
          id: 'pmt_adj_' + Date.now(),
          amount: paidVal,
          method: paymentMethod || 'Cash',
          date: new Date().toISOString(),
          note: 'Adjusted payment'
        }];
      }
    } else {
      // Create mode
      if (paidVal > 0) {
        finalPaymentHistory = [{
          id: 'pmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          amount: paidVal,
          method: paymentMethod || 'Cash',
          date: date || new Date().toISOString(),
          note: 'Payment on creation'
        }];
      } else {
        finalPaymentHistory = [];
      }
    }

    const payload = {
      id: editingInvoice?.id || undefined,
      invoiceNumber: editingInvoice?.invoiceNumber || invoiceNumber,
      createdAt: editingInvoice?.createdAt || undefined,
      publicToken: editingInvoice?.publicToken || undefined,
      verificationCode: editingInvoice?.verificationCode || undefined,
      createdByUid: editingInvoice?.createdByUid || undefined,
      createdByEmail: editingInvoice?.createdByEmail || undefined,
      paymentProofs: editingInvoice?.paymentProofs || [],
      date,
      billType: 'Invoice',
      customerName: customer?.name || editingInvoice?.customerName || 'Walk-in Customer',
      customerPhone: customer?.phone || editingInvoice?.customerPhone || '',
      customerId: customer?.id || editingInvoice?.customerId || '',
      notes,
      subtotal: totals.subtotal,
      taxAmount: totals.tax,
      taxPercentage: parseFloat(taxPercent) || 0,
      discountAmount: totals.discount,
      shipping: parseFloat(shipping) || 0,
      grandTotal: totals.grandTotal,
      oldDue: totals.oldDue,
      totalReceivable: totals.totalReceivable,
      amountPaid: totals.paidVal,
      paidAmount: totals.paidVal,
      balanceDue: totals.balanceDue,
      paymentStatus: totals.paymentStatus,
      paymentMethod,
      paymentHistory: finalPaymentHistory,
      items: items.map((i, idx) => ({
        id: i.id,
        sNo: i.sNo || (idx + 1).toString(),
        itemService: i.name,
        name: i.name,
        description: i.description || '',
        qty: parseFloat(i.qty) || 0,
        rate: parseFloat(i.price) || 0,
        amount: (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0),
        customFields: i.customFields || {}
      })),
      selectedTemplate,
      pdfTemplate: selectedTemplate,
      invoiceColumns
    };
    
    if (onSaveInvoice) {
      setIsSaving(true);
      try {
        await onSaveInvoice(payload, false, false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const invoiceLimit = subscription?.limits?.maxInvoices ?? subscription?.limits?.invoices ?? 50;
  const isLimitHit = !editingInvoice?.id && invoices.length >= invoiceLimit;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-24 relative">
      {isLimitHit && (
        <div className="absolute inset-0 z-50 bg-theme-main/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-theme-card max-w-md w-full p-8 rounded-3xl shadow-2xl border border-theme-border-soft text-center">
            <div className="w-16 h-16 mx-auto bg-theme-warning/10 text-theme-warning rounded-2xl flex items-center justify-center mb-6">
              <LayoutTemplate className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-theme-primary mb-3">Invoice Limit Reached</h2>
            <p className="text-sm text-theme-muted mb-8">
              You have created {invoices.length} out of {invoiceLimit} invoices allowed on your current plan. Please upgrade to continue creating more invoices.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => onBack ? onBack() : window.history.back()} className="px-6 py-3 rounded-xl border border-theme-border-soft text-theme-primary font-bold hover:bg-theme-surface transition-colors">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      <AnimatePresence>
        {showQuickAddCustomer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-theme-border-soft"
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-theme-accent" />
                  <h3 className="text-base font-black text-theme-primary">Add New Customer</h3>
                </div>
                <button onClick={() => setShowQuickAddCustomer(false)} className="p-1 text-theme-muted hover:text-theme-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleQuickAddCustomer} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Customer Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. John Doe"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="input-premium w-full bg-theme-surface"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +91 9876543210"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="input-premium w-full bg-theme-surface"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Address / City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Downtown Street"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="input-premium w-full bg-theme-surface"
                  />
                </div>
                <div className="flex gap-2 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowQuickAddCustomer(false)}
                    className="btn-premium-outline flex-1 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingCustomer || !newCustName.trim()}
                    className="btn-premium flex-1 py-2 text-xs"
                  >
                    {isSavingCustomer ? 'Saving...' : 'Save & Select'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sticky Header via Portal */}
      {getStudioHeaderTarget('studio-header-portal') && createPortal(
        <div className="flex items-center gap-4">
          <button onClick={() => onBack ? onBack() : window.history.back()} className="mr-2 p-2 rounded-full hover:bg-theme-surface text-theme-muted hover:text-theme-primary transition-colors shadow-sm bg-theme-card border border-theme-border-soft">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] text-white flex items-center justify-center shadow-premium-sm">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-theme-primary tracking-tight">Invoice Builder Studio</div>
            <div className="text-[10px] text-theme-muted font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-success animate-pulse" /> Live Preview Active
            </div>
          </div>
        </div>,
        getStudioHeaderTarget('studio-header-portal')
      )}
      {getStudioHeaderTarget('studio-header-actions-portal') && createPortal(
        <div className="flex items-center gap-3 pr-4">
          <button onClick={() => setShowPreviewModal(true)} className="p-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface transition-colors flex items-center gap-2 text-sm font-bold text-theme-primary bg-theme-card shadow-sm">
            <Maximize className="w-4 h-4" /> <span className="hidden sm:inline">Popup</span>
          </button>
          <button onClick={() => setShowPreviewPanel(!showPreviewPanel)} className="p-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface transition-colors flex items-center gap-2 text-sm font-bold text-theme-primary bg-theme-card shadow-sm">
            {showPreviewPanel ? <><EyeOff className="w-4 h-4" /> <span className="hidden sm:inline">Hide</span></> : <><Eye className="w-4 h-4" /> <span className="hidden sm:inline">Show Preview</span></>}
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-premium ml-2 flex items-center justify-center gap-2 min-w-[140px]">
            {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : (editingInvoice ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>,
        getStudioHeaderTarget('studio-header-actions-portal')
      )}

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-100 w-full max-w-[1000px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <h3 className="font-black text-lg text-theme-primary">Live Preview</h3>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-theme-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start bg-gray-100 custom-scrollbar">
                {(() => {
                  const SelectedLayout = LivePreviewLayouts[selectedTemplate];
                  if (SelectedLayout) {
                    return (
                      <div className="w-[595px] shrink-0 bg-white shadow-xl h-max" style={{ transformOrigin: 'top center' }}>
                        <SelectedLayout data={previewData} />
                      </div>
                    );
                  }
                  return (
                    <div className="w-full max-w-[800px] bg-white shadow-lg rounded-xl overflow-hidden shrink-0 h-max">
                      <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending', subtotal: previewData.totals.subtotal, taxAmount: previewData.totals.tax, discountAmount: previewData.totals.discount, grandTotal: previewData.totals.grandTotal, oldDue: previewData.totals.oldDue, totalDue: previewData.totals.totalDue }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={false} />
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 ${showPreviewPanel ? 'xl:grid-cols-[1.2fr_0.8fr]' : 'xl:max-w-6xl xl:mx-auto'} gap-6 items-start transition-all duration-300`}>

        {/* LEFT COLUMN: FORM */}
        <div className="glass-panel p-6 shadow-premium-sm min-w-0">
          <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 p-1 bg-theme-surface/50 border border-theme-border-soft rounded-xl shadow-inner max-w-full">
            {[
              { id: 'listing', label: 'Bill Listing', icon: FileText },
              { id: 'templates', label: 'Templates', icon: Palette },
              { id: 'branding', label: 'Branding & Text', icon: LayoutTemplate },
              { id: 'financial', label: 'Bank & Payments', icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white shadow-sm text-theme-primary border border-theme-border-soft/50' 
                    : 'text-theme-muted hover:text-theme-primary hover:bg-white/60'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="glass-content">
            {activeTab === 'listing' ? (
              <div className="space-y-8">

            {/* 1. Client Info */}
            <section>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border-soft relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-10 after:h-[2px] after:bg-theme-accent">
                <h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">1. Client Info</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group col-span-1 md:col-span-2">
                  
                  {/* Billing Target Toggle */}
                  <div className="flex gap-2 mb-4 bg-theme-border p-1 rounded-lg">
                    <button 
                      onClick={() => setBillingTarget('customer')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded ${billingTarget === 'customer' ? 'bg-theme-surface text-theme-text shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
                    >
                      Customer
                    </button>
                    <button 
                      onClick={() => setBillingTarget('staff')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded ${billingTarget === 'staff' ? 'bg-theme-surface text-theme-text shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
                    >
                      Staff
                    </button>
                  </div>

                  {billingTarget === 'customer' ? (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-theme-muted uppercase">Select Customer</label>
                        <button 
                          type="button"
                          onClick={() => setShowQuickAddCustomer(true)} 
                          className="text-[10px] font-bold text-theme-accent hover:underline flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" /> + New Customer
                        </button>
                      </div>
                      <select className="input-premium bg-theme-surface" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                        <option value="">Walk-in Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="text-[10px] font-bold text-theme-muted uppercase mb-1.5 block">Select Staff</label>
                      <select className="input-premium bg-theme-surface" value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                        <option value="">Select Staff...</option>
                        {staffs.map(s => <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>)}
                      </select>
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-bold text-theme-muted uppercase mb-1.5 block">Invoice Number</label>
                  <input type="text" className="input-premium bg-theme-surface/50 font-mono" value={invoiceNumber} readOnly />
                </div>
                <div className="form-group">
                  <label className="text-[10px] font-bold text-theme-muted uppercase mb-1.5 block">Date</label>
                  <input type="date" className="input-premium bg-theme-surface" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </section>

            {/* 2. Line Items */}
            <section>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-theme-border-soft relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-10 after:h-[2px] after:bg-theme-accent">
                <h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">2. Line Items</h3>
                <span className="text-2xs text-theme-muted font-semibold">Type item name to auto-fill from catalog</span>
              </div>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr>
                      {invoiceColumns.map(c => {
                        if (!c.visible) return null;
                        const widthClass = c.id === 'sn' ? 'w-16' : c.id === 'qty' ? 'w-24' : (c.id === 'rate' || c.id === 'amount') ? 'w-32' : '';
                        return <th key={c.id} className={`pb-3 px-2 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border-soft ${widthClass}`}>{c.label}</th>;
                      })}
                      <th className="pb-3 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border-soft w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {items.map((item) => (
                        <React.Fragment key={item.id}>
                          <motion.tr 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="group border-b border-theme-border-soft/50 last:border-0 hover:bg-theme-surface/30 transition-colors"
                          >
                            {invoiceColumns.map(c => {
                              if (!c.visible) return null;
                              if (c.id === 'sn') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="text" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface text-center" value={item.sNo} onChange={(e) => handleUpdateItem(item.id, 'sNo', e.target.value)} />
                                </td>
                              );
                              if (c.id === 'item') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input 
                                    type="text" 
                                    className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" 
                                    placeholder="Item or service description" 
                                    value={item.name} 
                                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)} 
                                    list="products-list" 
                                  />
                                </td>
                              );
                              if (c.id === 'hsn') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="text" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" placeholder="HSN/SAC" value={item.hsn || ''} onChange={(e) => handleUpdateItem(item.id, 'hsn', e.target.value)} />
                                </td>
                              );
                              if (c.id === 'qty') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="number" min="1" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" value={item.qty} onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)} />
                                </td>
                              );
                              if (c.id === 'rate') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="number" min="0" step="0.01" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" value={item.price} onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)} />
                                </td>
                              );
                              if (c.id === 'discount') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="number" min="0" step="0.01" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" value={item.discount || ''} onChange={(e) => handleUpdateItem(item.id, 'discount', e.target.value)} />
                                </td>
                              );
                              if (c.id === 'tax') return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="number" min="0" step="0.01" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" value={item.tax || ''} onChange={(e) => handleUpdateItem(item.id, 'tax', e.target.value)} />
                                </td>
                              );
                              if (c.id === 'amount') return (
                                <td key={c.id} className="py-2 px-2 font-bold tabular-nums text-theme-primary">
                                  {formatCurrency(item.qty * item.price)}
                                </td>
                              );
                              // custom column
                              return (
                                <td key={c.id} className="py-2 px-2">
                                  <input type="text" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" value={item.customFields?.[c.id] || ''} onChange={(e) => handleUpdateItem(item.id, c.id, e.target.value, true)} />
                                </td>
                              );
                            })}
                            <td className="py-2 text-right">
                              <div className="flex justify-end gap-1 items-center">
                                {/* Expand Category Custom Fields Button */}
                                <button 
                                  type="button"
                                  onClick={() => setExpandedCategoryItemId(expandedCategoryItemId === item.id ? null : item.id)}
                                  title="Category Custom Fields"
                                  className={`p-1.5 rounded-lg transition-colors text-2xs font-bold flex items-center gap-0.5 ${expandedCategoryItemId === item.id ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-accent hover:bg-theme-surface'}`}
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDuplicateItem(item.id)} className="p-1.5 text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 rounded-lg transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </motion.tr>

                          {/* EXPANDED CATEGORY FIELDS ROW */}
                          {expandedCategoryItemId === item.id && (
                            <tr className="bg-theme-surface/40 border-b border-theme-border-soft">
                              <td colSpan={invoiceColumns.filter(c => c.visible).length + 1} className="p-3">
                                <div className="p-3 bg-theme-card rounded-xl border border-theme-border-soft shadow-inner">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xs font-black uppercase tracking-wider text-theme-accent">
                                      Category Specifications ({wsType})
                                    </span>
                                    <button onClick={() => setExpandedCategoryItemId(null)} className="text-2xs text-theme-muted hover:text-theme-primary">
                                      Close
                                    </button>
                                  </div>

                                  {/* Tailor Preset Custom Fields */}
                                  {(wsType === 'tailor' || wsType === 'boutique') && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {['Length', 'Chest', 'Waist', 'Sleeve'].map(f => (
                                        <div key={f}>
                                          <label className="text-[10px] font-bold text-theme-muted uppercase">{f} (in)</label>
                                          <input 
                                            type="text" 
                                            className="input-premium py-1 text-xs" 
                                            placeholder={`e.g. 38"`}
                                            value={item.customFields?.[f.toLowerCase()] || ''}
                                            onChange={(e) => handleUpdateItem(item.id, f.toLowerCase(), e.target.value, true)}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Doctor / Clinic Preset Custom Fields */}
                                  {(wsType === 'doctor' || wsType === 'clinic') && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Dosage</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs" 
                                          placeholder="e.g. 500mg (1-0-1)"
                                          value={item.customFields?.dosage || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'dosage', e.target.value, true)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Duration</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs" 
                                          placeholder="e.g. 5 Days"
                                          value={item.customFields?.duration || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'duration', e.target.value, true)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Instructions</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs" 
                                          placeholder="After meals"
                                          value={item.customFields?.instructions || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'instructions', e.target.value, true)}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Service & Repair Preset Custom Fields */}
                                  {(wsType === 'service' || wsType === 'repair' || wsType === 'garage') && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Device Model</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs" 
                                          placeholder="e.g. iPhone 13 Pro"
                                          value={item.customFields?.deviceModel || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'deviceModel', e.target.value, true)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Serial / IMEI</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs font-mono" 
                                          placeholder="IMEI / Reg No."
                                          value={item.customFields?.serialNumber || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'serialNumber', e.target.value, true)}
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Job / Fault Note</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs" 
                                          placeholder="Screen replacement"
                                          value={item.customFields?.jobNote || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'jobNote', e.target.value, true)}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Default General Custom Field */}
                                  {wsType !== 'tailor' && wsType !== 'boutique' && wsType !== 'doctor' && wsType !== 'clinic' && wsType !== 'service' && wsType !== 'repair' && wsType !== 'garage' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] font-bold text-theme-muted uppercase">Item Notes / Serial No.</label>
                                        <input 
                                          type="text" 
                                          className="input-premium py-1 text-xs" 
                                          placeholder="Custom notes or serial"
                                          value={item.customFields?.note || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'note', e.target.value, true)}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddItem} className="btn-premium-dashed w-full mt-4 flex items-center justify-center gap-2 py-3 border border-dashed border-theme-border-strong rounded-xl text-sm font-bold text-theme-muted hover:text-theme-accent hover:border-theme-accent transition-colors bg-theme-surface/30 hover:bg-theme-accent/5">
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </section>

            {/* 3. Totals, Advance Payment & Financial Invariant */}
            <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Payment Recording Box */}
              <div className="bg-theme-card p-5 rounded-2xl border border-theme-border-soft shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-theme-border-soft">
                  <CreditCard className="w-4 h-4 text-theme-accent" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-theme-primary">Payment Recording</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-theme-muted uppercase">Amount Paid Now</label>
                      <div className="flex gap-1.5">
                        <button 
                          type="button" 
                          onClick={() => setAmountPaid(totals.totalDue)}
                          className="px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent text-2xs font-black hover:bg-theme-accent/20 transition-colors"
                        >
                          Full Paid
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setAmountPaid(0)}
                          className="px-2 py-0.5 rounded bg-theme-surface text-theme-muted text-2xs font-black hover:text-theme-primary transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      className="input-premium w-full text-base font-black tabular-nums bg-theme-surface text-theme-primary"
                      placeholder="0.00"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Payment Method</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input-premium w-full bg-theme-surface text-xs font-bold"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-theme-muted">Payment Status:</span>
                    <span className={`badge-premium ${totals.paymentStatus === 'Paid' ? 'badge-success' : totals.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-neutral'}`}>
                      {totals.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invariant Totals Box */}
              <div className="space-y-3 bg-white dark:bg-theme-card p-6 rounded-2xl border border-theme-border-soft shadow-sm">
                <div className="flex justify-between items-center text-sm font-semibold text-theme-muted">
                  <span>Subtotal</span>
                  <span className="text-theme-primary font-bold tabular-nums">{formatCurrency(totals.subtotal)}</span>
                </div>

                {draftBusinessSettings?.invoiceBuilderSettings?.showDiscount !== false && (
                  <div className="flex justify-between items-center text-sm font-semibold text-theme-muted gap-4">
                    <div className="flex gap-2 items-center">
                      <span>Discount</span>
                      <select 
                        className="px-2 py-1 bg-theme-surface border border-theme-border-soft rounded-lg text-[10px] font-bold uppercase tracking-wider text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="flat">Flat</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                    {discountType !== 'none' ? (
                      <input 
                        type="number" min="0" 
                        className="w-24 px-3 py-1 bg-theme-surface border border-theme-border-soft rounded-lg text-sm text-right font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                        value={discountAmount} 
                        onChange={(e) => setDiscountAmount(e.target.value)} 
                      />
                    ) : (
                      <span className="text-theme-muted">-</span>
                    )}
                  </div>
                )}

                {draftBusinessSettings?.invoiceBuilderSettings?.showTax !== false && (
                  <div className="flex justify-between items-center text-sm font-semibold text-theme-muted gap-4">
                    <span>{draftBusinessSettings?.invoiceBuilderSettings?.taxLabel || draftBusinessSettings?.taxLabel || 'Tax'} (%)</span>
                    <input 
                      type="number" min="0" 
                      className="w-24 px-3 py-1 bg-theme-surface border border-theme-border-soft rounded-lg text-sm text-right font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                      value={taxPercent} 
                      onChange={(e) => setTaxPercent(e.target.value)} 
                    />
                  </div>
                )}

                {draftBusinessSettings?.invoiceBuilderSettings?.showShipping && (
                  <div className="flex justify-between items-center text-sm font-semibold text-theme-muted gap-4">
                    <span>Shipping</span>
                    <input 
                      type="number" min="0" 
                      className="w-24 px-3 py-1 bg-theme-surface border border-theme-border-soft rounded-lg text-sm text-right font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                      value={shipping} 
                      onChange={(e) => setShipping(e.target.value)} 
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-theme-border-soft/60 space-y-2.5">
                  <div className="flex justify-between items-center text-sm font-semibold text-theme-muted">
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <span>Earlier Balance</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-theme-muted font-mono font-bold">+</span>
                      <input 
                        type="number" min="0" 
                        className="w-24 px-2.5 py-1 bg-theme-surface border border-amber-500/30 rounded-lg text-sm text-right font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-theme-accent transition-colors tabular-nums"
                        value={oldDue} 
                        onChange={(e) => setOldDue(e.target.value)} 
                        title="Customer prior unpaid balance"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-theme-primary">
                    <span>This Bill</span>
                    <span className="tabular-nums font-black text-theme-primary">
                      <span className="text-xs text-theme-muted font-mono font-bold mr-1">+</span>
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>

                  {totals.oldDue > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-theme-primary border-t border-dashed border-theme-border-soft pt-1.5">
                      <span>Total Amount Due</span>
                      <span className="tabular-nums font-black text-theme-primary">
                        {formatCurrency(totals.totalDue)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Amount Paid</span>
                    <span className="font-black tabular-nums">
                      <span className="text-xs text-emerald-500 font-mono font-bold mr-1">-</span>
                      {formatCurrency(totals.paidVal)}
                    </span>
                  </div>

                  {totals.oldDue > 0 && totals.paidVal > 0 && (
                    <div className="p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border-soft space-y-1 text-2xs font-semibold">
                      <div className="flex justify-between text-amber-700 dark:text-amber-300">
                        <span>Earlier Balance Paid:</span>
                        <span className="font-bold">{formatCurrency(totals.allocatedToOldDue)} {totals.remainingOldDue > 0 ? `(${formatCurrency(totals.remainingOldDue)} left)` : '(Cleared)'}</span>
                      </div>
                      <div className="flex justify-between text-theme-primary">
                        <span>This Bill Paid:</span>
                        <span className="font-bold">{formatCurrency(totals.allocatedToCurrentInvoice)} {totals.currentBillDue > 0 ? `(${formatCurrency(totals.currentBillDue)} left)` : '(Cleared)'}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 mt-1 border-t-2 border-dashed border-theme-border-soft flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-black text-theme-primary block tracking-tight">Amount Still Due</span>
                        <span className="text-[10px] text-theme-muted font-bold font-mono">
                          {formatCurrency(totals.oldDue)} + {formatCurrency(totals.grandTotal)} - {formatCurrency(totals.paidVal)} = {formatCurrency(totals.balanceDue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-theme-accent tabular-nums block">
                          {formatCurrency(totals.balanceDue)}
                        </span>
                        <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-0.5 ${
                          totals.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40'
                            : totals.paymentStatus === 'Partial'
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300/40'
                            : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300/40'
                        }`}>
                          {totals.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Actions Bar */}
            <div className="mt-8 pt-6 border-t border-theme-border-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onBack ? onBack() : window.history.back()}
                className="btn-premium-outline w-full sm:w-auto px-6 py-3 text-sm font-bold text-theme-muted hover:text-theme-primary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="btn-premium-outline flex-1 sm:flex-initial px-5 py-3 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-premium flex-1 sm:flex-initial px-8 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-premium"
                >
                  {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : (editingInvoice ? 'Update Invoice' : 'Save Invoice')}
                </button>
              </div>
            </div>

              </div>
            ) : (
              <InvoiceCustomizationPanel
                activeTab={activeTab}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                businessSettings={draftBusinessSettings}
                setBusinessSettings={setDraftBusinessSettings}
                viewMode={viewMode}
                setViewMode={setViewMode}
                subscription={subscription}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountAmount={discountAmount}
                setDiscountAmount={setDiscountAmount}
                oldDue={oldDue}
                setOldDue={setOldDue}
                taxPercent={taxPercent}
                setTaxPercent={setTaxPercent}
                shipping={shipping}
                setShipping={setShipping}
                invoiceColumns={invoiceColumns}
                setInvoiceColumns={setInvoiceColumns}
                notes={notes}
                setNotes={setNotes}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW */}
        {showPreviewPanel && (
          <div className="bg-white text-slate-900 rounded-2xl shadow-premium-xl xl:sticky xl:top-24 border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Mock Browser Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button onClick={() => setViewMode('pdf')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${viewMode === 'pdf' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>PDF Preview</button>
              <button onClick={() => setViewMode('livelink')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${viewMode === 'livelink' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Live Link Preview</button>
              <button onClick={() => { window.print(); }} className="px-3 py-1 text-[10px] font-bold rounded-md transition-colors text-slate-400 hover:text-slate-600 flex items-center gap-1">Print Bill</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-slate-50 flex items-start justify-center p-4">
            {(() => {
              const SelectedLayout = LivePreviewLayouts[selectedTemplate];
              
              if (viewMode === 'livelink') {
                return (
                  <div className="w-full max-w-[375px] mx-auto shrink-0 h-max mt-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 relative h-[700px]">
                      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-50"></div>
                      {SelectedLayout ? (
                        <div style={{ width: '595px', transformOrigin: 'top left', transform: 'scale(0.57)', height: '100%', overflow: 'hidden auto' }}>
                          <SelectedLayout data={previewData} />
                        </div>
                      ) : (
                        <div style={{ width: '800px', transformOrigin: 'top left', transform: 'scale(0.43)', height: '100%', overflow: 'hidden auto' }}>
                          <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending', subtotal: previewData.totals.subtotal, taxAmount: previewData.totals.tax, discountAmount: previewData.totals.discount, grandTotal: previewData.totals.grandTotal, oldDue: previewData.totals.oldDue, totalDue: previewData.totals.totalDue }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={true} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="w-full flex justify-center items-start">
                  {SelectedLayout ? (
                    <div className="w-full flex justify-center pb-8">
                      <div className="transform origin-top scale-[0.55] sm:scale-[0.7] md:scale-[0.85] xl:scale-[0.85] 2xl:scale-[0.95] transition-transform" style={{ transformOrigin: 'top center' }}>
                        <SelectedLayout data={previewData} />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-[800px] bg-white shadow-lg overflow-hidden rounded-xl">
                      <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending', subtotal: previewData.totals.subtotal, taxAmount: previewData.totals.tax, discountAmount: previewData.totals.discount, grandTotal: previewData.totals.grandTotal, oldDue: previewData.totals.oldDue, totalDue: previewData.totals.totalDue }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={false} />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          </div>
        )}
      </div>
      
      <datalist id="products-list">
        {products.map((p, idx) => (
          <option key={idx} value={p.name}>
            {p.sku ? `[${p.sku}] ` : ''}{p.sellingPrice ? `₹${p.sellingPrice} ` : ''}(Stock: {p.stock || p.quantity || 0})
          </option>
        ))}
      </datalist>
    </motion.div>
  );
};

export default CreateInvoice;
