import React, { useState } from 'react';
import { 
  FileText, Columns, Droplet, ArrowUp, ArrowDown, Eye, EyeOff, 
  Building, DollarSign, Palette, ShieldCheck, Trash2, PenLine, X,
  Image as ImageIcon, Sparkles, QrCode, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PdfTemplateStudio from '../../pages/PdfTemplateStudio';
import SignaturePadModal from '../common/SignaturePadModal';

const LUXURY_PALETTES = [
  { id: 'emerald', name: 'Royal Emerald', primary: '#059669', accent: '#10B981', desc: 'Fintech & Trust' },
  { id: 'amber', name: 'Imperial Amber', primary: '#D97706', accent: '#F59E0B', desc: 'Luxury Gold & Jewel' },
  { id: 'indigo', name: 'Cyber Indigo', primary: '#4F46E5', accent: '#6366F1', desc: 'High-Tech SaaS' },
  { id: 'sapphire', name: 'Midnight Sapphire', primary: '#1D4ED8', accent: '#38BDF8', desc: 'Corporate Banking' },
  { id: 'ruby', name: 'Crimson Ruby', primary: '#BE123C', accent: '#FB7185', desc: 'Retail & Fashion' },
  { id: 'carbon', name: 'Titanium Slate', primary: '#0F172A', accent: '#64748B', desc: 'Minimal Obsidian' },
];

const InvoiceCustomizationPanel = ({ 
  businessSettings,
  setBusinessSettings,
  viewMode,
  setViewMode,
  subscription,
  selectedTemplate,
  onSelectTemplate,
  discountType,
  setDiscountType,
  discountAmount,
  setDiscountAmount,
  taxPercent,
  setTaxPercent,
  shipping,
  setShipping,
  oldDue,
  setOldDue,
  invoiceColumns = [],
  setInvoiceColumns,
  notes,
  setNotes,
  activeTab
}) => {
  const [isSigPadOpen, setIsSigPadOpen] = useState(false);

  const tabs = [
    { id: 'templates', label: 'Templates', icon: Palette },
    { id: 'columns', label: 'Columns & Tables', icon: Columns },
    { id: 'branding', label: 'Branding & Text', icon: FileText },
    { id: 'financial', label: 'Bank & Payments', icon: DollarSign },
  ];

  const handleUpdateSettings = (updates) => {
    setBusinessSettings(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleUpdateBuilderSettings = (updates) => {
    handleUpdateSettings({
      invoiceBuilderSettings: {
        ...(businessSettings?.invoiceBuilderSettings || {}),
        ...updates
      }
    });
  };

  const handleColumnToggle = (id) => {
    const newCols = invoiceColumns.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    setInvoiceColumns(newCols);
  };

  const moveColumn = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === invoiceColumns.length - 1) return;
    
    const newCols = [...invoiceColumns];
    const temp = newCols[index];
    newCols[index] = newCols[index + direction];
    newCols[index + direction] = temp;
    
    const reordered = newCols.map((c, i) => ({ ...c, order: i + 1 }));
    setInvoiceColumns(reordered);
  };

  const builderSettings = businessSettings?.invoiceBuilderSettings || {};
  const customColumns = builderSettings.customColumns || [];
  const taxLabel = builderSettings.taxLabel || 'Tax';
  const showDiscount = builderSettings.showDiscount !== false;
  const invoiceItemLabel = builderSettings.itemLabel || 'Item';

  return (
    <div className="bg-theme-surface border border-theme-border-soft p-4 md:p-6 rounded-2xl mb-8 shadow-sm">
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
            <div className="card-premium p-6 overflow-hidden">
              <PdfTemplateStudio 
                businessSettings={businessSettings} 
                setSettings={handleUpdateSettings} 
                viewMode={viewMode} 
                setViewMode={setViewMode} 
                subscription={subscription}
                templateOverride={selectedTemplate}
                onSelectTemplate={onSelectTemplate}
              />
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
                
                <div className="bg-theme-surface/50 border border-theme-border-soft rounded-2xl overflow-hidden mb-6">
                  {invoiceColumns.map((col, idx) => (
                    <div key={col.id} className="flex items-center justify-between p-3 border-b border-theme-border-soft last:border-b-0 hover:bg-theme-surface transition-colors">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleColumnToggle(col.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            col.visible ? 'bg-theme-success/20 text-theme-success' : 'bg-theme-surface-hover text-theme-muted'
                          }`}
                        >
                          {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <span className={`text-sm font-bold ${
                          col.visible ? 'text-theme-primary' : 'text-theme-muted line-through'
                        }`}>{col.label}</span>
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
                          disabled={idx === invoiceColumns.length - 1}
                          className="p-1.5 rounded bg-theme-surface border border-theme-border-soft text-theme-muted hover:text-theme-primary hover:bg-theme-card disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium p-6 mt-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                      <FileText className="w-5 h-5" />
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
                        onClick={() => {
                          handleUpdateBuilderSettings({ 
                            customColumns: [...customColumns, { id: Date.now().toString(), name: '', type: 'text', visible: true }]
                          });
                        }}
                        className="px-4 py-2 text-xs font-bold bg-theme-accent text-white rounded-xl shadow-sm hover:brightness-110 transition-all"
                      >
                        + Add Column
                      </button>
                    </div>
                  {customColumns.length === 0 ? (
                    <p className="text-sm text-theme-muted p-6 bg-theme-surface/50 rounded-xl border border-dashed border-theme-border-soft text-center font-semibold">No custom columns added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {customColumns.map((col, index) => (
                         <div key={col.id} className="flex flex-wrap items-center gap-3 p-3 bg-theme-surface/30 border border-theme-border-soft rounded-xl">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => {
                              const newCols = customColumns.map((c, i) => 
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
                              const newCols = customColumns.map((c, i) => 
                                i === index ? { ...c, type: e.target.value } : c
                              );
                              handleUpdateBuilderSettings({ customColumns: newCols });
                            }}
                            className="px-3 py-2 text-sm bg-theme-card border border-theme-border-soft rounded-lg text-theme-primary font-bold focus:outline-none focus:border-theme-accent"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                          <button
                            onClick={() => {
                              const newCols = customColumns.filter((_, i) => i !== index);
                              handleUpdateBuilderSettings({ customColumns: newCols });
                            }}
                            className="p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-lg transition-colors"
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

          {/* BRANDING & TEXT TAB */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* 1. CURATED LUXURY COLOR PALETTES */}
              <div className="card-premium p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-theme-primary">Luxury Color Themes</h2>
                    <p className="text-xs text-theme-muted">Select an executive bill palette or custom branding accents</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LUXURY_PALETTES.map((palette) => {
                      const isSelected = businessSettings?.primaryColor === palette.primary;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => handleUpdateSettings({
                            primaryColor: palette.primary,
                            accentColor: palette.accent
                          })}
                          className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                            isSelected 
                              ? 'border-theme-accent bg-theme-accent/10 shadow-sm ring-1 ring-theme-accent' 
                              : 'border-theme-border-soft bg-theme-surface hover:border-theme-accent/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="w-4 h-4 rounded-full shadow-xs" 
                              style={{ backgroundColor: palette.primary }} 
                            />
                            <span 
                              className="w-3 h-3 rounded-full shadow-xs -ml-1 border border-white/40" 
                              style={{ backgroundColor: palette.accent }} 
                            />
                            <span className="text-xs font-black text-theme-primary truncate">{palette.name}</span>
                          </div>
                          <p className="text-[10px] text-theme-muted truncate">{palette.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-theme-border-soft">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Primary Brand Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={businessSettings?.primaryColor || '#059669'} 
                          onChange={(e) => handleUpdateSettings({ primaryColor: e.target.value })} 
                          className="w-10 h-10 rounded-xl cursor-pointer border border-theme-border-soft bg-transparent p-0.5" 
                        />
                        <input 
                          type="text" 
                          value={businessSettings?.primaryColor || '#059669'} 
                          onChange={(e) => handleUpdateSettings({ primaryColor: e.target.value })} 
                          className="flex-1 px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-mono font-bold text-theme-primary uppercase" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Accent / Highlight Color</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={businessSettings?.accentColor || '#10B981'} 
                          onChange={(e) => handleUpdateSettings({ accentColor: e.target.value })} 
                          className="w-10 h-10 rounded-xl cursor-pointer border border-theme-border-soft bg-transparent p-0.5" 
                        />
                        <input 
                          type="text" 
                          value={businessSettings?.accentColor || '#10B981'} 
                          onChange={(e) => handleUpdateSettings({ accentColor: e.target.value })} 
                          className="flex-1 px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-mono font-bold text-theme-primary uppercase" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TOP HEADER BANNER IMAGE UPLOAD */}
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-6 border-b border-theme-border-soft pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-info/10 text-theme-info flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Top Header Banner</h2>
                      <p className="text-xs text-theme-muted">Display a custom letterhead banner graphic at the top of your bill</p>
                    </div>
                  </div>
                  {businessSettings?.headerBannerUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSettings({ headerBannerUrl: '' })}
                      className="px-3 py-1.5 text-xs font-bold text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Banner
                    </button>
                  )}
                </div>

                {businessSettings?.headerBannerUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-theme-border-soft shadow-xs group">
                    <img 
                      src={businessSettings.headerBannerUrl} 
                      alt="Header Banner Preview" 
                      className="w-full max-h-36 object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Change Banner
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => {
                              const img = new Image();
                              img.onload = () => {
                                const maxW = 1200;
                                const scale = Math.min(1, maxW / img.width);
                                const c = document.createElement('canvas');
                                c.width = Math.round(img.width * scale);
                                c.height = Math.round(img.height * scale);
                                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                                handleUpdateSettings({ headerBannerUrl: c.toDataURL('image/jpeg', 0.88) });
                              };
                              img.src = r.result;
                            };
                            r.readAsDataURL(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 bg-theme-surface hover:bg-theme-surface/80 border-2 border-dashed border-theme-border-soft rounded-2xl transition-all cursor-pointer text-center group">
                    <Upload className="w-7 h-7 text-theme-muted mb-2 group-hover:text-theme-accent group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-theme-primary">Upload Top Banner Graphic</span>
                    <span className="text-[10px] text-theme-muted mt-0.5">Recommended ratio: 1200x200 or 1200x240 (PNG/JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = () => {
                          const img = new Image();
                          img.onload = () => {
                            const maxW = 1200;
                            const scale = Math.min(1, maxW / img.width);
                            const c = document.createElement('canvas');
                            c.width = Math.round(img.width * scale);
                            c.height = Math.round(img.height * scale);
                            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                            handleUpdateSettings({ headerBannerUrl: c.toDataURL('image/jpeg', 0.88) });
                          };
                          img.src = r.result;
                        };
                        r.readAsDataURL(f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>

              {/* 3. SUB-HEADER INSTANT PAYMENT QR PLACEMENT */}
              <div className="card-premium p-6">
                <div className="flex items-center justify-between border-b border-theme-border-soft pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-success/10 text-theme-success flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Sub-Header Payment QR</h2>
                      <p className="text-xs text-theme-muted">Position payment QR code directly beneath the invoice header for instant scanning</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(businessSettings?.showSubHeaderQr)}
                      onChange={(e) => handleUpdateSettings({ showSubHeaderQr: e.target.checked })}
                      className="accent-theme-accent w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-theme-primary">Show Under Header</span>
                  </label>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-theme-accent to-theme-primary text-white flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-theme-primary">Invoice Text & Terms</h2>
                    <p className="text-xs text-theme-muted">Customize default text</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Invoice Notes</label>
                    <textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      rows={3} 
                      placeholder="Thank you for your business!"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-warning transition-colors resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Terms & Conditions</label>
                    <textarea 
                      value={businessSettings?.terms || ''} 
                      onChange={(e) => handleUpdateSettings({ terms: e.target.value })} 
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
                      value={businessSettings?.watermarkText || ''} 
                      onChange={(e) => handleUpdateSettings({ watermarkText: e.target.value })} 
                      placeholder="e.g. PAID, DRAFT, CONFIDENTIAL"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary focus:outline-none focus:border-theme-info transition-colors" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Opacity</label>
                      <span className="text-[10px] text-theme-primary font-bold">{businessSettings?.watermarkOpacity || 10}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" max="50" step="5"
                      value={businessSettings?.watermarkOpacity || 10} 
                      onChange={(e) => handleUpdateSettings({ watermarkOpacity: parseInt(e.target.value) })} 
                      className="w-full accent-theme-info" 
                    />
                  </div>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4 border-b border-theme-border-soft pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center">
                      <PenLine className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-theme-primary">Signature & Stamp</h2>
                      <p className="text-xs text-theme-muted">Authorized signatory printed on your invoices</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderSettings.showSignature !== false}
                      onChange={(e) => handleUpdateBuilderSettings({ showSignature: e.target.checked })}
                      className="accent-theme-accent w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-theme-primary">Show Signature</span>
                  </label>
                </div>

                <div className="space-y-4">
                  {businessSettings?.signatureDataUrl || businessSettings?.signatureUrl ? (
                    <div className="flex items-center justify-between p-4 bg-theme-surface rounded-xl border border-theme-border-soft">
                      <div className="flex items-center gap-4">
                        <img 
                          src={businessSettings.signatureDataUrl || businessSettings.signatureUrl} 
                          alt="Signature Preview" 
                          className="h-16 object-contain bg-white rounded-lg p-1.5 border border-theme-border-soft" 
                        />
                        <div>
                          <p className="text-xs font-bold text-theme-primary">Active Signature / Stamp</p>
                          <p className="text-[11px] text-theme-muted">Appears at bottom-right of bill</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsSigPadOpen(true)}
                          className="px-3 py-1.5 bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-accent rounded-lg text-xs font-bold transition-colors"
                        >
                          Redraw
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateSettings({ signatureDataUrl: '', signatureUrl: '' });
                          }}
                          className="p-2 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-lg transition-colors"
                          title="Remove signature"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsSigPadOpen(true)}
                        className="flex flex-col items-center justify-center p-5 bg-theme-accent/5 hover:bg-theme-accent/10 border-2 border-dashed border-theme-accent/30 rounded-xl transition-all cursor-pointer text-center group"
                      >
                        <PenLine className="w-6 h-6 text-theme-accent mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-theme-primary">Draw Digital Signature</span>
                        <span className="text-[10px] text-theme-muted">Sign with finger or mouse</span>
                      </button>

                      <label className="flex flex-col items-center justify-center p-5 bg-theme-surface hover:bg-theme-surface/80 border-2 border-dashed border-theme-border-soft rounded-xl transition-all cursor-pointer text-center group">
                        <FileText className="w-6 h-6 text-theme-muted mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-theme-primary">Upload Stamp / File</span>
                        <span className="text-[10px] text-theme-muted">PNG or JPG graphic</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => {
                              const img = new Image();
                              img.onload = () => {
                                try {
                                  const maxW = 500;
                                  const scale = Math.min(1, maxW / img.width);
                                  const c = document.createElement('canvas');
                                  c.width = Math.round(img.width * scale);
                                  c.height = Math.round(img.height * scale);
                                  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                                  const data = c.toDataURL('image/png');
                                  handleUpdateSettings({ signatureDataUrl: data, signatureUrl: data });
                                } catch (err) { console.error(err); }
                              };
                              img.src = r.result;
                            };
                            r.readAsDataURL(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <SignaturePadModal
                  isOpen={isSigPadOpen}
                  onClose={() => setIsSigPadOpen(false)}
                  onSave={(dataUrl) => {
                    handleUpdateSettings({ signatureDataUrl: dataUrl, signatureUrl: dataUrl });
                    setIsSigPadOpen(false);
                  }}
                  initialImage={businessSettings?.signatureDataUrl || businessSettings?.signatureUrl || ''}
                />
              </div>
            </div>
          )}

          {/* FINANCIAL TAB */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Added specifically for Invoice Creation to override invoice-level discounts and taxes */}
              <div className="card-premium p-6 border border-theme-accent/20 bg-theme-accent/5">
                <div className="flex items-center gap-3 mb-6 border-b border-theme-accent/20 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-theme-accent/20 text-theme-accent flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-theme-primary">Invoice Totals</h2>
                    <p className="text-xs text-theme-muted">Apply tax, discount, and shipping for this bill</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Discount Type</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="none">No Discount</option>
                        <option value="flat">Flat Amount</option>
                        <option value="percent">Percentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Discount Amt</label>
                      <input 
                        type="number" min="0" 
                        className="w-full px-4 py-3 bg-white border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors disabled:opacity-50"
                        value={discountAmount} 
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} 
                        disabled={discountType === 'none'} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Tax %</label>
                      <input 
                        type="number" min="0" 
                        className="w-full px-4 py-3 bg-white border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                        value={taxPercent} 
                        onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Shipping</label>
                      <input 
                        type="number" min="0" 
                        className="w-full px-4 py-3 bg-white border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                        value={shipping} 
                        onChange={(e) => setShipping(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-theme-surface/70 border border-theme-border-soft rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-theme-primary">Split GST into CGST &amp; SGST</p>
                      <p className="text-[10px] text-theme-muted">Divides tax percentage into equal 50% Central and State components on PDF</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={Boolean(builderSettings.splitGst)} 
                        onChange={(e) => handleUpdateBuilderSettings({ splitGst: e.target.checked })} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-theme-accent"></div>
                    </label>
                  </div>
                  {businessSettings?.invoiceBuilderSettings?.showOldDue && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">Old Due</label>
                        <input 
                          type="number" min="0" 
                          className="w-full px-4 py-3 bg-white border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                          value={oldDue} 
                          onChange={(e) => setOldDue(parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                      value={businessSettings?.bankDetails?.name || ''} 
                      onChange={(e) => handleUpdateSettings({ bankDetails: { ...businessSettings?.bankDetails, name: e.target.value } })} 
                      placeholder="Bank Name (e.g. State Bank of India)"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                    />
                    <input 
                      type="text" 
                      value={businessSettings?.bankDetails?.account || ''} 
                      onChange={(e) => handleUpdateSettings({ bankDetails: { ...businessSettings?.bankDetails, account: e.target.value } })} 
                      placeholder="Account Number"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                    />
                    <input 
                      type="text" 
                      value={businessSettings?.bankDetails?.ifsc || ''} 
                      onChange={(e) => handleUpdateSettings({ bankDetails: { ...businessSettings?.bankDetails, ifsc: e.target.value } })} 
                      placeholder="IFSC / Routing Code"
                      className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-4" 
                    />
                    
                    <div className="border-t border-theme-border-soft pt-4 mb-3">
                      <h3 className="text-sm font-bold text-theme-primary mb-3">UPI Payment Integration</h3>
                      <input 
                        type="text" 
                        value={businessSettings?.bankDetails?.upiId || ''} 
                        onChange={(e) => handleUpdateSettings({ bankDetails: { ...businessSettings?.bankDetails, upiId: e.target.value } })} 
                        placeholder="Your UPI ID (e.g. business@ybl)"
                        className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-semibold text-theme-primary focus:outline-none focus:border-theme-info transition-colors mb-3" 
                      />
                      <div className="flex items-center gap-3 p-4 bg-theme-surface border border-theme-border-soft rounded-xl">
                        <input 
                          type="checkbox" 
                          id="showQr"
                          checked={businessSettings?.bankDetails?.showQr || false}
                          onChange={(e) => handleUpdateSettings({ bankDetails: { ...businessSettings?.bankDetails, showQr: e.target.checked } })} 
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
                    <h2 className="text-lg font-black text-theme-primary">Global Financial Settings</h2>
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
  );
};

export default InvoiceCustomizationPanel;
