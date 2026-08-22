import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, LayoutTemplate, Columns, Droplet, ArrowUp, ArrowDown, Eye, EyeOff, 
  Trash2, Building, DollarSign, Palette, Settings2, ShieldCheck, Maximize, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PdfTemplateStudio from '../PdfTemplateStudio';
import InvoicePreview from '../../components/InvoicePreview';
import { LivePreviewLayouts } from '../../components/invoice-templates/layouts/LivePreviewLayouts';
import { getPortalLabelByType } from '../../config/businessPresets';
import { getStudioHeaderTarget } from '../../utils/portalTargets';

import { DEFAULT_INVOICE_COLUMNS } from '../../utils/invoiceSchema';

// Dummy data for Live Preview
const DUMMY_INVOICE = {
  invoiceNumber: 'INV-2024-001',
  date: new Date().toLocaleDateString(),
  billType: 'Invoice',
  customerName: 'Acme Corp',
  customerPhone: '+1 555-0198',
  notes: 'Thank you for your business!',
  subtotal: 1000,
  taxAmount: 100,
  discountAmount: 50,
  grandTotal: 1050,
  amountPaid: 0,
  balanceDue: 1050,
  items: [
    { description: 'Premium Service', qty: 1, rate: 1000, amount: 1000, hsn: '998311', tax: '10%' }
  ],
  paymentStatus: 'Pending'
};

const DUMMY_BUSINESS = {
  businessName: 'Your Business Name',
  email: 'hello@yourbusiness.com',
  phone: '+1 987-654-3210',
  address: '123 Business Avenue, Suite 100\nTech District, 10001',
  gstNumber: 'GSTIN123456789',
  currency: '$'
};

const InvoiceStudio = ({ settings, onUpdate, subscription }) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [viewMode, setViewMode] = useState('pdf');
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef(null);
  const modalContainerRef = useRef(null);
  const [panelScale, setPanelScale] = useState(0.6);
  const [modalScale, setModalScale] = useState(1);
  const portalLabel = getPortalLabelByType(settings?.businessType);

  useEffect(() => {
    const updateScale = () => {
      const tId = settings?.selectedPdfTemplate || 'classic';
      const originalWidth = LivePreviewLayouts[tId] ? 595 : 800;
      
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth - 32; 
        setPanelScale(Math.min(availableWidth / originalWidth, 1));
      }
      if (modalContainerRef.current) {
        const availableWidth = modalContainerRef.current.clientWidth - 64; 
        setModalScale(Math.min(availableWidth / originalWidth, 1.5));
      }
    };
    
    setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [viewMode, showPreviewPanel, showPreviewModal, settings?.selectedPdfTemplate]);

  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const columns = settings?.invoiceColumns || DEFAULT_INVOICE_COLUMNS;
  const invoiceBuilderSettings = settings?.invoiceBuilderSettings || {};
  const invoiceItemLabel = invoiceBuilderSettings.itemLabel !== undefined ? invoiceBuilderSettings.itemLabel : 'Item';
  const invoiceCustomColumns = invoiceBuilderSettings.customColumns || [];
  const taxLabel = invoiceBuilderSettings.taxLabel !== undefined ? invoiceBuilderSettings.taxLabel : (settings?.taxLabel !== undefined ? settings.taxLabel : 'Tax');
  const showDiscount = invoiceBuilderSettings.showDiscount !== false;
  const bankDetails = invoiceBuilderSettings.bankDetails || { name: '', account: '', ifsc: '' };

  const handleUpdateBuilderSettings = (updates) => {
    onUpdate({
      invoiceBuilderSettings: {
        ...invoiceBuilderSettings,
        ...updates
      }
    });
  };

  const handleColumnToggle = (id) => {
    const newCols = columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    handleChange('invoiceColumns', newCols);
  };

  const moveColumn = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === columns.length - 1) return;
    
    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[index + direction];
    newCols[index + direction] = temp;
    
    const reordered = newCols.map((c, i) => ({ ...c, order: i + 1 }));
    handleChange('invoiceColumns', reordered);
  };

  // Preview settings computed
  const previewBusinessSettings = useMemo(() => ({
    ...DUMMY_BUSINESS,
    ...settings,
    invoiceColumns: columns,
    invoiceBuilderSettings: invoiceBuilderSettings
  }), [settings, columns, invoiceBuilderSettings]);

  const tabs = [
    { id: 'templates', label: 'Templates', icon: Palette },
    { id: 'columns', label: 'Columns & Tables', icon: Columns },
    { id: 'branding', label: 'Branding & Text', icon: FileText },
    { id: 'financial', label: 'Bank & Payments', icon: DollarSign },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-120px)]">
      {/* LEFT PANEL */}
      <div className={`flex-1 transition-all duration-300 min-w-0`}>
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-1 border-b border-theme-border-soft mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
                activeTab === tab.id 
                  ? 'border-theme-accent text-theme-primary' 
                  : 'border-transparent text-theme-muted hover:text-theme-primary hover:border-theme-border-soft'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="card-premium p-6">
                <PdfTemplateStudio businessSettings={settings} setSettings={onUpdate} viewMode={viewMode} setViewMode={setViewMode} subscription={subscription} />
              </div>
            )}

            {/* COLUMNS & TABLES TAB */}
            {activeTab === 'columns' && (
              <div className="space-y-6">
                <div className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
                      <Columns className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Column Manager</h2>
                      <p className="text-xs text-theme-muted">Show, hide, and reorder invoice item columns</p>
                    </div>
                  </div>
                  
                  <div className="bg-theme-surface/50 border border-theme-border-soft rounded-2xl overflow-hidden">
                    {columns.map((col, idx) => (
                      <div key={col.id} className="flex items-center justify-between p-3 border-b border-theme-border-soft last:border-b-0 hover:bg-theme-surface transition-colors">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleColumnToggle(col.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${col.visible ? 'bg-theme-success/20 text-theme-success' : 'bg-theme-surface-hover text-theme-muted'}`}
                          >
                            {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <span className={`text-sm font-bold ${col.visible ? 'text-theme-primary' : 'text-theme-muted line-through'}`}>{col.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => moveColumn(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => moveColumn(idx, 1)}
                            disabled={idx === columns.length - 1}
                            className="p-1.5 rounded bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Custom Columns</h2>
                      <p className="text-xs text-theme-muted">Add extra fields like Size, Color, or Warranty</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Item/Product Column Label</label>
                    <input
                      type="text"
                      value={invoiceItemLabel}
                      onChange={(e) => handleUpdateBuilderSettings({ itemLabel: e.target.value })}
                      className="w-full max-w-xs px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl focus:outline-none focus:border-theme-accent text-theme-primary font-bold text-sm"
                      placeholder="e.g. Item, Product, Service"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Additional Columns</label>
                      <button 
                        onClick={() => handleUpdateBuilderSettings({ customColumns: [...invoiceCustomColumns, { id: 'col_' + Date.now(), name: '', type: 'text', options: '' }] })} 
                        className="px-4 py-2 text-xs font-bold bg-theme-accent text-white rounded-xl shadow-sm hover:brightness-110 transition-all"
                      >
                        + Add Column
                      </button>
                    </div>
                    {invoiceCustomColumns.length === 0 ? (
                      <p className="text-sm text-theme-muted p-6 bg-theme-surface/50 rounded-xl border border-dashed border-theme-border-soft text-center font-semibold">No custom columns added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {invoiceCustomColumns.map((col, index) => (
                           <div key={col.id} className="flex flex-wrap items-center gap-3 p-3 bg-theme-surface/30 border border-theme-border-soft rounded-xl">
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => {
                                const newCols = invoiceCustomColumns.map((c, i) => 
                                  i === index ? { ...c, name: e.target.value } : c
                                );
                                handleUpdateBuilderSettings({ customColumns: newCols });
                              }}
                              className="flex-1 min-w-[120px] px-3 py-2 text-sm bg-theme-card border border-theme-border-soft rounded-lg text-theme-primary font-bold focus:outline-none focus:border-theme-accent"
                              placeholder="Column Name"
                            />
                            <select
                              value={col.type}
                              onChange={(e) => {
                                const newCols = invoiceCustomColumns.map((c, i) => 
                                  i === index ? { ...c, type: e.target.value } : c
                                );
                                handleUpdateBuilderSettings({ customColumns: newCols });
                              }}
                              className="px-3 py-2 text-sm bg-theme-card border border-theme-border-soft rounded-lg text-theme-primary font-bold focus:outline-none focus:border-theme-accent"
                            >
                              <option value="text">Text Input</option>
                              <option value="number">Number Input</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                            <button
                              onClick={() => {
                                const newCols = invoiceCustomColumns.filter((_, i) => i !== index);
                                handleUpdateBuilderSettings({ customColumns: newCols });
                              }}
                              className="p-2 text-theme-danger hover:bg-theme-danger/10 rounded-lg transition-colors shrink-0"
                              title="Remove Column"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BRANDING TAB */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-warning/10 text-theme-warning flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Defaults & Terms</h2>
                      <p className="text-xs text-theme-muted">Pre-filled notes and conditions</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Default Customer Notes</label>
                      <textarea 
                        value={settings?.defaultNotes || ''} 
                        onChange={(e) => handleChange('defaultNotes', e.target.value)} 
                        rows={3} 
                        placeholder="Thank you for your business!"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-warning transition-colors resize-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Terms & Conditions</label>
                      <textarea 
                        value={settings?.terms || ''} 
                        onChange={(e) => handleChange('terms', e.target.value)} 
                        rows={4} 
                        placeholder="1. Payment due in 30 days..."
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-warning transition-colors resize-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-info/10 text-theme-info flex items-center justify-center">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Watermark Settings</h2>
                      <p className="text-xs text-theme-muted">Background text for PDF invoices</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Watermark Text (Leave empty for none)</label>
                      <input 
                        type="text" 
                        value={settings?.watermarkText || ''} 
                        onChange={(e) => handleChange('watermarkText', e.target.value)} 
                        placeholder="e.g. PAID, DRAFT, CONFIDENTIAL"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-info transition-colors" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Opacity</label>
                        <span className="text-[10px] text-theme-primary font-bold">{settings?.watermarkOpacity || 10}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" max="50" step="5"
                        value={settings?.watermarkOpacity || 10} 
                        onChange={(e) => handleChange('watermarkOpacity', parseInt(e.target.value))} 
                        className="w-full accent-theme-info" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FINANCIAL TAB */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                <div className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-info/10 text-theme-info flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Bank & Payment Details</h2>
                      <p className="text-xs text-theme-muted">Prints at the bottom of the invoice</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        value={bankDetails.name || ''} 
                        onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, name: e.target.value } })} 
                        placeholder="Bank Name (e.g. State Bank of India)"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                      />
                      <input 
                        type="text" 
                        value={bankDetails.account || ''} 
                        onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, account: e.target.value } })} 
                        placeholder="Account Number"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                      />
                      <input 
                        type="text" 
                        value={bankDetails.ifsc || ''} 
                        onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, ifsc: e.target.value } })} 
                        placeholder="IFSC / Routing Code"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-4" 
                      />
                      
                      <div className="border-t border-theme-border-soft pt-4 mb-3">
                        <h3 className="text-sm font-bold text-theme-primary mb-3">UPI Payment Integration</h3>
                        <input 
                          type="text" 
                          value={bankDetails.upiId || ''} 
                          onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, upiId: e.target.value } })} 
                          placeholder="Your UPI ID (e.g. business@ybl)"
                          className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                        />
                        <div className="flex items-center gap-3 p-4 bg-theme-surface border border-theme-border-soft rounded-xl">
                          <input 
                            type="checkbox" 
                            id="showQr"
                            checked={bankDetails.showQr || false}
                            onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, showQr: e.target.checked } })} 
                            className="w-4 h-4 rounded text-theme-info focus:ring-theme-info bg-theme-surface border-theme-border-soft"
                          />
                          <label htmlFor="showQr" className="text-sm font-bold text-theme-primary cursor-pointer select-none">
                            Generate & Show UPI QR Code on Invoices
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 bg-theme-info/5 p-4 rounded-xl border border-theme-info/20 text-theme-info text-xs font-bold mt-4">
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>These details will be shown to your customers on the invoice PDF and Live Payment Link.</p>
                    </div>
                  </div>
                </div>

                <div className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Financial Settings</h2>
                      <p className="text-xs text-theme-muted">Configure tax labels and discounts</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Tax Label (e.g. GST, VAT, Tax)</label>
                      <input 
                        type="text" 
                        value={taxLabel} 
                        onChange={(e) => handleUpdateBuilderSettings({ taxLabel: e.target.value })} 
                        placeholder="GST"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-success transition-colors" 
                      />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-theme-surface/50 border border-theme-border-soft rounded-xl">
                      <input 
                        type="checkbox" 
                        id="showDiscount"
                        checked={showDiscount}
                        onChange={(e) => handleUpdateBuilderSettings({ showDiscount: e.target.checked })} 
                        className="w-4 h-4 rounded text-theme-success focus:ring-theme-success bg-theme-surface border-theme-border-soft"
                      />
                      <label htmlFor="showDiscount" className="text-sm font-bold text-theme-primary cursor-pointer select-none">
                        Show Discount Row on Invoices
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-theme-surface/50 border border-theme-border-soft rounded-xl">
                      <input 
                        type="checkbox" 
                        id="showOldDue"
                        checked={invoiceBuilderSettings.showOldDue || false}
                        onChange={(e) => handleUpdateBuilderSettings({ showOldDue: e.target.checked })} 
                        className="w-4 h-4 rounded text-theme-success focus:ring-theme-success bg-theme-surface border-theme-border-soft"
                      />
                      <label htmlFor="showOldDue" className="text-sm font-bold text-theme-primary cursor-pointer select-none">
                        Show Old Due Field
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-theme-surface/50 border border-theme-border-soft rounded-xl">
                      <input 
                        type="checkbox" 
                        id="showTax"
                        checked={invoiceBuilderSettings.showTax !== false}
                        onChange={(e) => handleUpdateBuilderSettings({ showTax: e.target.checked })} 
                        className="w-4 h-4 rounded text-theme-success focus:ring-theme-success bg-theme-surface border-theme-border-soft"
                      />
                      <label htmlFor="showTax" className="text-sm font-bold text-theme-primary cursor-pointer select-none">
                        Show Tax Input
                      </label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-theme-surface/50 border border-theme-border-soft rounded-xl">
                      <input 
                        type="checkbox" 
                        id="showShipping"
                        checked={invoiceBuilderSettings.showShipping || false}
                        onChange={(e) => handleUpdateBuilderSettings({ showShipping: e.target.checked })} 
                        className="w-4 h-4 rounded text-theme-success focus:ring-theme-success bg-theme-surface border-theme-border-soft"
                      />
                      <label htmlFor="showShipping" className="text-sm font-bold text-theme-primary cursor-pointer select-none">
                        Show Shipping Input
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* RIGHT PANEL: Live Preview */}
      {showPreviewPanel && (
        <div className="hidden xl:flex w-[400px] shrink-0 sticky top-6 h-[calc(100vh-120px)] pb-8 flex-col">
        <div className="bg-theme-surface rounded-2xl overflow-hidden border border-theme-border-soft shadow-sm flex flex-col flex-1">
          <div className="bg-theme-surface border-b border-theme-border-soft px-4 py-3 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-theme-accent" />
              <span className="text-[10px] font-black text-theme-primary uppercase tracking-widest">{viewMode === 'livelink' ? `${portalLabel} Preview` : 'PDF Preview'}</span>
            </div>
          </div>
          <div ref={containerRef} className={`flex-1 bg-slate-100 overflow-y-auto custom-scrollbar flex justify-center py-6 px-4 ${viewMode === 'livelink' ? 'items-start' : 'items-start'}`}>
            {viewMode === 'livelink' ? (
              <div className="w-full max-w-[375px] shrink-0 h-max">
                {/* Mobile Phone Mockup Frame for Portal */}
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 mx-auto relative h-[700px]">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-50"></div>
                                    {(() => {
                    const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
                    const Layout = LivePreviewLayouts[tId];
                    if (Layout) {
                      return (
                        <div className="h-full overflow-y-auto custom-scrollbar pb-24 w-[595px] origin-top-left scale-[0.7]">
                          <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />
                        </div>
                      );
                    }
                    return (
                      <div className="h-full overflow-y-auto custom-scrollbar pb-24 w-[800px] origin-top-left" style={{ transform: `scale(${panelScale * zoomLevel})` }}>
                        <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={{ ...previewBusinessSettings, showQrInPreview: true }} isLiveLink={true} />
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
                            <div className="w-full overflow-hidden flex justify-center bg-transparent">
                {(() => {
                  const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
                  const Layout = LivePreviewLayouts[tId];
                  if (Layout) {
                    return (
                      <div className="transform origin-top shadow-xl border border-slate-200 print-only-preview mb-12 h-max" style={{ transform: `scale(${panelScale * zoomLevel})` }}>
                        <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />
                      </div>
                    );
                  }
                  return (
                    <div className="w-[800px] transform origin-top shadow-xl border border-slate-200 bg-white print-only-preview mb-12 h-max" style={{ transform: `scale(${panelScale * zoomLevel})` }}>
                      <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={previewBusinessSettings} isLiveLink={false} />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          
          {/* Zoom Controls */}
          <div className="bg-theme-surface border-t border-theme-border-soft px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Zoom</span>
            <div className="flex items-center gap-3 bg-theme-app px-2 py-1 rounded-lg border border-theme-border-soft">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                className="text-theme-muted hover:text-theme-primary transition-colors font-bold text-lg leading-none"
              >-</button>
              <span className="text-xs font-bold text-theme-primary min-w-[36px] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                className="text-theme-muted hover:text-theme-primary transition-colors font-bold text-lg leading-none"
              >+</button>
            </div>
            <button 
              onClick={() => setZoomLevel(1)}
              className="text-[10px] font-bold text-theme-accent hover:underline"
            >Fit</button>
          </div>
        </div>
      </div>
      )}

      {/* Sticky Header via Portal */}
      {getStudioHeaderTarget('studio-header-actions-portal') && createPortal(
        <div className="flex items-center gap-3 pr-4">
          <button onClick={() => setShowPreviewModal(true)} className="p-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface transition-colors flex items-center gap-2 text-sm font-bold text-theme-primary bg-theme-card shadow-sm">
            <Maximize className="w-4 h-4" /> <span className="hidden sm:inline">Popup</span>
          </button>
          <button onClick={() => setShowPreviewPanel(!showPreviewPanel)} className="p-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface transition-colors flex items-center gap-2 text-sm font-bold text-theme-primary bg-theme-card shadow-sm">
            {showPreviewPanel ? <><EyeOff className="w-4 h-4" /> <span className="hidden sm:inline">Hide</span></> : <><Eye className="w-4 h-4" /> <span className="hidden sm:inline">Show Preview</span></>}
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
              className="bg-theme-card w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-theme-border-soft"
            >
              <div className="px-6 py-4 border-b border-theme-border-soft flex items-center justify-between bg-theme-surface">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-theme-primary">Live Preview</h2>
                    <p className="text-xs text-theme-muted font-medium">{viewMode === 'livelink' ? 'Live Link / Portal View' : 'PDF Invoice View'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex space-x-2 mr-4 bg-theme-card p-1 rounded-xl border border-theme-border-soft">
                    <button onClick={() => setViewMode('pdf')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${viewMode === 'pdf' ? 'bg-theme-primary text-theme-card' : 'text-theme-muted hover:text-theme-primary'}`}>PDF View</button>
                    <button onClick={() => setViewMode('livelink')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${viewMode === 'livelink' ? 'bg-theme-primary text-theme-card' : 'text-theme-muted hover:text-theme-primary'}`}>Live Link</button>
                  </div>
                  <button onClick={() => setShowPreviewModal(false)} className="p-2 rounded-xl border border-theme-border-soft hover:bg-theme-surface text-theme-muted hover:text-theme-danger transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div ref={modalContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 flex items-start justify-center p-8 no-scrollbar">
                {viewMode === 'livelink' ? (
                  <div className="w-full max-w-[375px] shrink-0 h-max">
                    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 mx-auto relative h-[700px]">
                      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-50"></div>
                      {(() => {
                        const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
                        const Layout = LivePreviewLayouts[tId];
                        if (Layout) {
                          return (
                            <div className="h-full overflow-y-auto custom-scrollbar pb-24 w-[595px] origin-top-left" style={{ transform: `scale(${modalScale})` }}>
                              <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />
                            </div>
                          );
                        }
                        return (
                          <div className="h-full overflow-y-auto custom-scrollbar pb-24 w-[800px] origin-top-left" style={{ transform: `scale(${modalScale})` }}>
                            <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={{ ...previewBusinessSettings, showQrInPreview: true }} isLiveLink={true} />
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-hidden flex justify-center bg-transparent">
                    {(() => {
                      const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
                      const Layout = LivePreviewLayouts[tId];
                      if (Layout) {
                        return (
                      <div className="transform origin-top shadow-2xl border border-slate-200 print-only-preview mb-24 h-max" style={{ transform: `scale(${modalScale})` }}>
                        <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />
                      </div>
                    );
                  }
                  return (
                    <div className="w-[800px] transform origin-top shadow-2xl border border-slate-200 bg-white print-only-preview mb-24 h-max" style={{ transform: `scale(${modalScale})` }}>
                      <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={previewBusinessSettings} isLiveLink={false} />
                    </div>
                  );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default React.memo(InvoiceStudio);
