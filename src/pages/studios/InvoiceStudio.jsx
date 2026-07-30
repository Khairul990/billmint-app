import React, { useState } from 'react';
import { FileText, LayoutTemplate, Columns, Droplet, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import PdfTemplateStudio from '../PdfTemplateStudio';

const DEFAULT_COLUMNS = [
  { id: 'item', label: 'Item/Service', visible: true, order: 1 },
  { id: 'hsn', label: 'HSN/SAC', visible: false, order: 2 },
  { id: 'qty', label: 'Quantity', visible: true, order: 3 },
  { id: 'rate', label: 'Rate', visible: true, order: 4 },
  { id: 'discount', label: 'Discount', visible: true, order: 5 },
  { id: 'tax', label: 'Tax', visible: true, order: 6 },
  { id: 'amount', label: 'Amount', visible: true, order: 7 }
];

const InvoiceStudio = ({ settings, onUpdate }) => {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const columns = settings?.invoiceColumns || DEFAULT_COLUMNS;

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
    
    // Update order property to match new array index
    const reordered = newCols.map((c, i) => ({ ...c, order: i + 1 }));
    handleChange('invoiceColumns', reordered);
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <PdfTemplateStudio businessSettings={settings} setSettings={onUpdate} />

      {/* Column Manager */}
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

      {/* Defaults & Watermark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-theme-border-soft pb-4">
            <div className="w-10 h-10 rounded-xl bg-theme-warning/10 text-theme-warning flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-theme-primary">Defaults</h2>
              <p className="text-xs text-theme-muted">Pre-filled notes and terms</p>
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
              <h2 className="text-lg font-black text-theme-primary">Watermark</h2>
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
    </div>
  );
};

export default InvoiceStudio;
