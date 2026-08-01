import React, { useState, useMemo } from 'react';
import { 
  FileText, LayoutTemplate, Columns, Droplet, ArrowUp, ArrowDown, Eye, EyeOff, 
  Trash2, Building, DollarSign, Palette, Settings2, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PdfTemplateStudio from '../PdfTemplateStudio';
import UniversalInvoiceTemplate from '../../components/invoice/UniversalInvoiceTemplate';

const DEFAULT_COLUMNS = [
  { id: 'item', label: 'Item/Service', visible: true, order: 1 },
  { id: 'hsn', label: 'HSN/SAC', visible: false, order: 2 },
  { id: 'qty', label: 'Quantity', visible: true, order: 3 },
  { id: 'rate', label: 'Rate', visible: true, order: 4 },
  { id: 'discount', label: 'Discount', visible: true, order: 5 },
  { id: 'tax', label: 'Tax', visible: true, order: 6 },
  { id: 'amount', label: 'Amount', visible: true, order: 7 }
];

// Dummy data for Live Preview
const DUMMY_INVOICE = {
  invoiceNumber: 'INV-2024-001',
  date: new Date().toLocaleDateString(),
  billType: 'Invoice',
  customerName: 'Acme Corporation',
  customerPhone: '+1 555-0198',
  notes: 'Project Alpha Final Milestone',
  subtotal: 1500,
  taxAmount: 150,
  discountAmount: 50,
  grandTotal: 1600,
  amountPaid: 0,
  balanceDue: 1600,
  items: [
    { description: 'Web Design Services', qty: 1, rate: 1000, amount: 1000, hsn: '998311', tax: '10%' },
    { description: 'Hosting (1 Year)', qty: 1, rate: 500, amount: 500, hsn: '998312', tax: '10%' }
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

const InvoiceStudio = ({ settings, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('templates');

  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const columns = settings?.invoiceColumns || DEFAULT_COLUMNS;
  const invoiceBuilderSettings = settings?.invoiceBuilderSettings || {};
  const invoiceItemLabel = invoiceBuilderSettings.itemLabel || 'Item';
  const invoiceCustomColumns = invoiceBuilderSettings.customColumns || [];
  const taxLabel = invoiceBuilderSettings.taxLabel || settings?.taxLabel || 'Tax';
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
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-120px)]">
      
      {/* LEFT PANEL: Settings */}
      <div className="flex-1 space-y-6 lg:w-[55%] xl:w-[60%] max-w-4xl">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 bg-theme-surface/50 border border-theme-border-soft rounded-2xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-theme-card shadow-sm text-theme-primary border border-theme-border-soft/50' 
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface'
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
                <PdfTemplateStudio businessSettings={settings} setSettings={onUpdate} />
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
                                const newCols = [...invoiceCustomColumns];
                                newCols[index].name = e.target.value;
                                handleUpdateBuilderSettings({ customColumns: newCols });
                              }}
                              className="flex-1 min-w-[120px] px-3 py-2 text-sm bg-theme-card border border-theme-border-soft rounded-lg text-theme-primary font-bold focus:outline-none focus:border-theme-accent"
                              placeholder="Column Name"
                            />
                            <select
                              value={col.type}
                              onChange={(e) => {
                                const newCols = [...invoiceCustomColumns];
                                newCols[index].type = e.target.value;
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
                        value={bankDetails.name} 
                        onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, name: e.target.value } })} 
                        placeholder="Bank Name (e.g. State Bank of India)"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                      />
                      <input 
                        type="text" 
                        value={bankDetails.account} 
                        onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, account: e.target.value } })} 
                        placeholder="Account Number"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                      />
                      <input 
                        type="text" 
                        value={bankDetails.ifsc} 
                        onChange={(e) => handleUpdateBuilderSettings({ bankDetails: { ...bankDetails, ifsc: e.target.value } })} 
                        placeholder="IFSC / Routing Code"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors" 
                      />
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
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* RIGHT PANEL: Live Preview */}
      <div className="hidden lg:block flex-1 sticky top-6 h-[calc(100vh-120px)] pb-8 min-w-[450px] self-start">
        <div className="card-premium overflow-hidden border-2 border-theme-border-soft shadow-2xl flex flex-col h-full bg-theme-card">
          <div className="bg-theme-app border-b border-theme-border-soft px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-theme-accent" />
              <span className="text-xs font-black text-theme-primary uppercase tracking-widest">Live Preview</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-theme-border-soft"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-theme-border-soft"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-theme-border-soft"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100 overflow-y-auto custom-scrollbar h-[calc(100vh-200px)]">
            <div className="transform scale-[0.55] origin-top-left w-[210mm] shadow-lg rounded-sm overflow-hidden bg-white">
              <UniversalInvoiceTemplate 
                invoice={DUMMY_INVOICE}
                businessSettings={previewBusinessSettings}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default React.memo(InvoiceStudio);
