import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Save, LayoutTemplate, Plus, Trash2, Copy, FileText, Eye, EyeOff, Maximize, X, Check, ChevronDown, Palette, Columns, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/invoiceUtils';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import InvoiceCustomizationPanel from '../components/invoice-templates/InvoiceCustomizationPanel';
import InvoicePreview from '../components/InvoicePreview';
import { LivePreviewLayouts } from '../components/invoice-templates/layouts/LivePreviewLayouts';
import { UNIVERSAL_TEMPLATES } from '../services/TemplateEngine';
import { getStudioHeaderTarget } from '../utils/portalTargets';

const CreateInvoice = ({ onSaveInvoice, invoices = [], customers = [], products = [], businessSettings, editingInvoice, onBack, defaultTemplate = 'minimal-classic', subscription }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(businessSettings?.selectedPdfTemplate || defaultTemplate);
  const [viewMode, setViewMode] = useState('pdf');
  const [activeTab, setActiveTab] = useState('listing');
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draftBusinessSettings, setDraftBusinessSettings] = useState(businessSettings || {});
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([
    { id: Date.now().toString(), sNo: '1', name: '', qty: 1, price: 0 }
  ]);
  const [discountType, setDiscountType] = useState('none');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('Thank you for your business!');
  const [previewQrCode, setPreviewQrCode] = useState(null);
  const [enableQrCode, setEnableQrCode] = useState(true);
  
  const [invoiceColumns, setInvoiceColumns] = useState(() => {
    const settingsCols = businessSettings?.invoiceColumns;
    if (!settingsCols || !Array.isArray(settingsCols)) {
      return [
        { id: 'sNo', label: 'S.No', visible: true, order: 1 },
        { id: 'description', label: 'Description', visible: true, order: 2 },
        { id: 'qty', label: 'Qty', visible: true, order: 3 },
        { id: 'rate', label: 'Rate', visible: true, order: 4 },
        { id: 'total', label: 'Total', visible: true, order: 5 }
      ];
    }
    
    const colMap = { 'item': 'description', 'qty': 'qty', 'rate': 'rate', 'amount': 'total' };
    const localCols = [{ id: 'sNo', label: 'S.No', visible: true, order: 0 }];
    
    settingsCols.forEach(col => {
      if (colMap[col.id]) {
        localCols.push({ id: colMap[col.id], label: col.label, visible: col.visible, order: col.order });
      } else {
        // Custom column
        localCols.push({ id: col.id, label: col.label, visible: col.visible, order: col.order });
      }
    });
    
    return localCols.sort((a, b) => a.order - b.order);
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    let discount = 0;
    if (discountType === 'percent') {
      discount = subtotal * (discountAmount / 100);
    } else if (discountType === 'flat') {
      discount = discountAmount;
    }
    const afterDiscount = Math.max(0, subtotal - discount);
    const tax = afterDiscount * (taxPercent / 100);
    const grandTotal = afterDiscount + tax + shipping;

    return { subtotal, discount, tax, grandTotal };
  }, [items, discountType, discountAmount, taxPercent, shipping]);

  useEffect(() => {
    const generateQr = async () => {
      const paymentQrEnabled = enableQrCode || businessSettings?.paymentQrEnabled || false;
      const showQrInPreview = businessSettings?.showQrInPreview !== false;
      
      if (paymentQrEnabled && showQrInPreview) {
        const paymentMethod = businessSettings?.paymentMethod || 'Manual';
        const upiId = businessSettings?.upiId || '';
        const bkashNumber = businessSettings?.bkashNumber || '';
        const nagadNumber = businessSettings?.nagadNumber || '';
        const payeeName = businessSettings?.payeeName || businessSettings?.businessName || '';
        const currencyCode = businessSettings?.currencyCode || 'INR';
        const dueAmount = totals.grandTotal || 0;

        let qrText = '';
        if (paymentMethod === 'UPI') {
          qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${dueAmount}&cu=${currencyCode}&tn=${invoiceNumber}`;
        } else if (paymentMethod === 'bKash') {
          qrText = `bKash Payment\nMerchant/Personal Number: ${bkashNumber}\nAmount: ${dueAmount}\nInvoice: ${invoiceNumber}`;
        } else if (paymentMethod === 'Nagad') {
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
  }, [businessSettings, totals.grandTotal, invoiceNumber]);

  useEffect(() => {
    if (editingInvoice) {
      setInvoiceNumber(editingInvoice.invoiceNumber || editingInvoice.id);
      setDate(editingInvoice.date || new Date().toISOString().split('T')[0]);
      if (editingInvoice.customerName) {
        const cust = customers.find(c => c.name === editingInvoice.customerName);
        if (cust) setSelectedCustomerId(cust.id);
      }
      if (editingInvoice.items && editingInvoice.items.length > 0) {
        setItems(editingInvoice.items.map((it, idx) => ({
          id: Date.now().toString() + idx,
          sNo: it.sNo || (idx + 1).toString(),
          name: it.itemService || it.name || '',
          qty: parseFloat(it.qty) || 1,
          price: parseFloat(it.rate) || 0,
          customFields: it.customFields || {}
        })));
      }
      setDiscountAmount(parseFloat(editingInvoice.discountAmount) || 0);
      setDiscountType(parseFloat(editingInvoice.discountAmount) > 0 ? 'flat' : 'none');
      setTaxPercent(parseFloat(editingInvoice.taxAmount) ? (parseFloat(editingInvoice.taxAmount) / (parseFloat(editingInvoice.subtotal) || 1)) * 100 : 0);
      setNotes(editingInvoice.notes || '');
    }
  }, [editingInvoice, customers]);

  const customer = customers.find(c => c.id === selectedCustomerId);

  const currentTemplateName = useMemo(
    () => UNIVERSAL_TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'Template',
    [selectedTemplate]
  );


  const previewData = useMemo(() => ({
    invoiceNumber: invoiceNumber || 'INV-XXXX',
    date: date ? new Date(date).toLocaleDateString() : '-',
    customerName: customer ? customer.name : 'Walk-in Customer',
    customerPhone: customer?.phone || '',
    items: items.map(i => ({ ...i, description: i.name, rate: i.price, amount: i.qty * i.price })),
    totals: { ...totals, tax: totals.tax },
    notes,
    businessSettings: {
      ...draftBusinessSettings,
      bankDetails: { ...(draftBusinessSettings?.bankDetails || {}), ...bankDetails },
      upiId: bankDetails.upiId || draftBusinessSettings?.bankDetails?.upiId || draftBusinessSettings?.upiId
    },
    invoiceColumns,
    qrCodeBase64: previewQrCode
  }), [invoiceNumber, date, customer, items, totals, notes, draftBusinessSettings, bankDetails, invoiceColumns, previewQrCode]);

  const handleAddItem = () => {
    const sNo = items.length > 0 ? (parseInt(items[items.length-1].sNo) + 1).toString() : '1';
    setItems([...items, { id: Date.now().toString(), sNo: isNaN(sNo) ? '' : sNo, name: '', qty: 1, price: 0 }]);
  };

  const handleUpdateItem = (id, field, value, isCustom = false) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (isCustom) {
          return { ...item, customFields: { ...(item.customFields || {}), [field]: value } };
        }
        return { ...item, [field]: field === 'name' || field === 'sNo' ? value : (parseFloat(value) || 0) };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleDuplicateItem = (id) => {
    const itemToDuplicate = items.find(item => item.id === id);
    if (itemToDuplicate) {
      const sNo = (parseInt(items[items.length-1].sNo) + 1).toString();
      setItems([...items, { ...itemToDuplicate, id: Date.now().toString(), sNo: isNaN(sNo) ? '' : sNo }]);
    }
  };

  const handleSave = () => {
    const payload = {
      invoiceNumber,
      date,
      billType: 'Invoice',
      customerName: customer?.name || 'Walk-in Customer',
      customerPhone: customer?.phone || '',
      notes,
      subtotal: totals.subtotal,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      grandTotal: totals.grandTotal,
      amountPaid: 0,
      balanceDue: totals.grandTotal,
      items: items.map((i, idx) => ({
        sNo: i.sNo || (idx + 1).toString(),
        itemService: i.name,
        name: i.name,
        description: '',
        qty: i.qty,
        rate: i.price,
        amount: i.qty * i.price,
        customFields: i.customFields || {}
      })),
      selectedTemplate
    };
    if (editingInvoice?.id) payload.id = editingInvoice.id;
    
    if (onSaveInvoice) {
      onSaveInvoice(payload, false, false);
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
          <button onClick={handleSave} className="btn-premium ml-2">
            <Save className="w-4 h-4" /> Save Invoice
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
                      <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending', subtotal: previewData.totals.subtotal, taxAmount: previewData.totals.tax, discountAmount: previewData.totals.discount, grandTotal: previewData.totals.grandTotal }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={false} />
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
                  <label className="text-[10px] font-bold text-theme-muted uppercase mb-1.5 block">Select Customer</label>
                  <select className="input-premium bg-theme-surface" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
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
              </div>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr>
                      {invoiceColumns.map(c => {
                        if (!c.visible) return null;
                        const widthClass = c.id === 'sNo' ? 'w-16' : c.id === 'qty' ? 'w-24' : (c.id === 'rate' || c.id === 'total') ? 'w-32' : '';
                        return <th key={c.id} className={`pb-3 px-2 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border-soft ${widthClass}`}>{c.label}</th>;
                      })}
                      <th className="pb-3 text-[10px] font-bold text-theme-muted uppercase tracking-wider border-b border-theme-border-soft w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.tr 
                          key={item.id} 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, x: -20 }}
                          className="group border-b border-theme-border-soft/50 last:border-0"
                        >
                          {invoiceColumns.map(c => {
                            if (!c.visible) return null;
                            if (c.id === 'sNo') return (
                              <td key={c.id} className="py-2 px-2">
                                <input type="text" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface text-center" value={item.sNo} onChange={(e) => handleUpdateItem(item.id, 'sNo', e.target.value)} />
                              </td>
                            );
                            if (c.id === 'description') return (
                              <td key={c.id} className="py-2 px-2">
                                <input type="text" className="input-premium w-full bg-transparent border-transparent hover:border-theme-border-soft focus:bg-theme-surface" placeholder="Item description" value={item.name} onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)} list="products-list" />
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
                            if (c.id === 'total') return (
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
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDuplicateItem(item.id)} className="p-1.5 text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              <button onClick={handleAddItem} className="btn-premium-dashed w-full mt-4 flex items-center justify-center gap-2 py-3 border border-dashed border-theme-border-strong rounded-xl text-sm font-bold text-theme-muted hover:text-theme-accent hover:border-theme-accent transition-colors bg-theme-surface/30 hover:bg-theme-accent/5">
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </section>


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
                          <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending', subtotal: previewData.totals.subtotal, taxAmount: previewData.totals.tax, discountAmount: previewData.totals.discount, grandTotal: previewData.totals.grandTotal }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={true} />
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
                      <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending', subtotal: previewData.totals.subtotal, taxAmount: previewData.totals.tax, discountAmount: previewData.totals.discount, grandTotal: previewData.totals.grandTotal }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={false} />
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
        {products.map((p, idx) => <option key={idx} value={p.name} />)}
      </datalist>

      <datalist id="products-list">
        {products.map((p, idx) => <option key={idx} value={p.name} />)}
      </datalist>
    </motion.div>
  );
};

export default CreateInvoice;
