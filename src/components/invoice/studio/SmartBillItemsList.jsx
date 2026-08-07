import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Plus, Trash2, AlertTriangle, ArrowUp, X, Settings2, Copy, Package } from 'lucide-react';
import { getProductLabelByType } from '../../../config/businessPresets';
import PremiumEmptyState from '../../../components/PremiumEmptyState';
import EditColumnsModal from './EditColumnsModal';

const calculateRowAmount = (item) => {
  const q = parseFloat(item.qty) || 0;
  const r = parseFloat(item.rate) || 0;
  const d = parseFloat(item.discount) || 0;
  return Math.max(0, (q * r) - d);
};

const SmartBillItemsList = ({ products = [], invoices = [], wsType }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  
  // Custom columns state
  const customCols = state.settings?.customColumns || businessSettings?.customColumns || { col1: 'Item Name', col2: 'Qty', col3: 'Rate' };
  const extraCols = state.settings?.extraColumns || businessSettings?.extraColumns || [];
  const [showColModal, setShowColModal] = useState(false);

  const productLabel = getProductLabelByType(wsType);

  // Remove the old columns sync effect since we use global custom columns now

  // Compute Most Used from real invoice item history
  const mostUsed = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    const usageMap = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const name = item.itemService || item.name || item.productName || item.description;
        if (!name || !name.trim()) return;
        const key = name.trim().toLowerCase();
        if (!usageMap[key]) usageMap[key] = { name: name.trim(), rate: item.rate || item.price || 0, unit: item.unit || 'Piece', count: 0 };
        usageMap[key].count++;
      });
    });
    return Object.values(usageMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [invoices]);

  // Compute Recent from products array, sorted by creation date
  const recentProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    }).slice(0, 5).map(p => ({
      name: p.name || p.productName || p.itemService || '',
      rate: p.rate || p.price || 0,
      unit: p.unit || 'Piece'
    }));
  }, [products]);

  const handleUpdateItem = useCallback((index, field, value) => {
    dispatch({ type: 'UPDATE_ITEM_FIELD', payload: { index, field, value } });
  }, [dispatch]);

  const handleCopyRow = useCallback((index) => {
    dispatch({ type: 'COPY_ROW', payload: index });
  }, [dispatch]);

  const handleDeleteRow = useCallback((index) => {
    dispatch({ type: 'DELETE_ROW', payload: index });
  }, [dispatch]);

  const handleAddRow = () => {
    dispatch({ type: 'ADD_EMPTY_ROW' });
  };

  const handleQuickAdd = (prod) => {
    const pName = prod.name || prod.productName;
    const pRate = prod.rate || prod.price || 0;
    
    // Check if empty last row exists
    const lastItem = state.items[state.items.length - 1];
    let newItems = [...state.items];
    
    const productToAdd = {
      id: crypto.randomUUID(),
      itemService: pName,
      description: '',
      qty: 1,
      unit: prod.unit || 'Piece',
      rate: pRate,
      discount: 0,
      tax: 0,
      amount: pRate
    };

    if (lastItem && !lastItem.itemService && !lastItem.description && (lastItem.rate === 0 || !lastItem.rate)) {
      productToAdd.sn = lastItem.sn;
      newItems[newItems.length - 1] = productToAdd;
    } else {
      productToAdd.sn = newItems.length + 1;
      newItems.push(productToAdd);
    }

    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const openColModal = () => {
    setShowColModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Quick Add Chips section */}
      <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase text-theme-muted mb-3 tracking-wider">Quick Add Items</h3>
        
        {mostUsed.length === 0 && recentProducts.length === 0 ? (
          <PremiumEmptyState
            icon={Package}
            title={`No ${productLabel.toLowerCase()}s yet`}
            description={`Add your first ${productLabel.toLowerCase()} to see it here for quick billing.`}
            actionLabel={`Create ${productLabel}`}
            onAction={() => window.dispatchEvent(new CustomEvent('navigate_tab', { detail: 'products' }))}
            size="sm"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {mostUsed.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted min-w-[70px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Most Used:
                </span>
                <div className="flex flex-wrap gap-2">
                  {mostUsed.map((p, idx) => (
                    <button
                      key={`most-${idx}`}
                      onClick={() => handleQuickAdd(p)}
                      className="px-3 py-1.5 bg-theme-app/50 border border-theme-border-soft hover:bg-theme-surface hover:border-theme-accent/50 hover:shadow-sm rounded-xl text-left transition-all relative overflow-hidden group"
                    >
                      <span className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors">{p.name}</span>
                      <span className="ml-2 text-[10px] font-bold text-theme-muted">₹{p.rate}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {recentProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted min-w-[70px] flex items-center gap-1.5">
                  <ArrowUp className="w-3 h-3 text-emerald-500" /> Recent:
                </span>
                <div className="flex flex-wrap gap-2">
                  {recentProducts.map((p, idx) => (
                    <button
                      key={`recent-${idx}`}
                      onClick={() => handleQuickAdd(p)}
                      className="px-3 py-1.5 bg-theme-app/50 border border-theme-border-soft hover:bg-theme-surface hover:border-theme-accent/50 hover:shadow-sm rounded-xl text-left transition-all relative overflow-hidden group"
                    >
                      <span className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors">{p.name}</span>
                      <span className="ml-2 text-[10px] font-bold text-theme-muted">₹{p.rate}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items Table Section */}
      <div className="bg-theme-surface border border-theme-border-soft rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Action */}
        <div className="p-3 bg-theme-app/30 border-b border-theme-border-soft flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-theme-primary">Bill Items</h3>
          <button onClick={openColModal} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-theme-muted hover:text-theme-accent transition-colors">
            <Settings2 className="w-3 h-3" /> Edit Columns
          </button>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-theme-app/50 border-b border-theme-border-soft">
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-12 text-center">No</th>
                <th className="py-3 px-4 text-xs font-black text-theme-muted">{customCols.col1}</th>
                {extraCols.map(col => (
                  <th key={col.id} className="py-3 px-4 text-xs font-black text-theme-muted min-w-[120px] text-center">{col.name}</th>
                ))}
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-24 text-center">{customCols.col2}</th>
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-32 text-right">{customCols.col3}</th>
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-32 text-right">Total</th>
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-16 text-center">Edit</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-theme-border-soft hover:bg-theme-app/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-bold text-theme-muted text-center">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.itemService || ''}
                      onChange={(e) => handleUpdateItem(index, 'itemService', e.target.value)}
                      placeholder="Enter details..."
                      className="w-full bg-transparent outline-none text-sm font-bold text-theme-primary placeholder-theme-muted/50"
                    />
                  </td>
                  {extraCols.map(col => (
                    <td key={col.id} className="py-3 px-4">
                      <input
                        type="text"
                        value={item[col.id] || ''}
                        onChange={(e) => handleUpdateItem(index, col.id, e.target.value)}
                        placeholder="..."
                        className="w-full bg-transparent outline-none text-sm font-bold text-theme-primary text-center"
                      />
                    </td>
                  ))}
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={item.qty || ''}
                      onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
                      placeholder="1"
                      className="w-full bg-transparent outline-none text-sm font-bold text-theme-primary text-center"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs font-black text-theme-muted">₹</span>
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => handleUpdateItem(index, 'rate', e.target.value)}
                        placeholder="0.00"
                        className="w-full max-w-[80px] bg-transparent outline-none text-sm font-bold text-theme-primary text-right"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-black text-theme-primary">
                      ₹{calculateRowAmount(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleCopyRow(index)}
                        className="text-theme-muted hover:text-theme-accent transition-colors p-1.5 rounded-lg hover:bg-theme-accent/10"
                        title="Duplicate Row"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRow(index)}
                        className="text-theme-muted hover:text-theme-danger transition-colors p-1.5 rounded-lg hover:bg-theme-danger/10"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Add Row Button at bottom of table */}
        <div className="p-3 bg-theme-surface">
          <button 
            onClick={handleAddRow}
            className="w-full py-3 bg-theme-app border border-theme-border-soft border-dashed rounded-xl flex items-center justify-center gap-2 text-theme-primary font-bold text-sm hover:border-theme-accent/50 hover:text-theme-accent transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>
      </div>

      <EditColumnsModal
        isOpen={showColModal}
        onClose={() => setShowColModal(false)}
        initialColumns={customCols}
        initialExtraColumns={extraCols}
        onSave={(cols, extras) => {
          dispatch({ type: 'UPDATE_SETTINGS', payload: { customColumns: cols, extraColumns: extras } });
          try {
            const globalSettings = JSON.parse(localStorage.getItem('billqyro_settings') || '{}');
            globalSettings.customColumns = cols;
            globalSettings.extraColumns = extras;
            localStorage.setItem('billqyro_settings', JSON.stringify(globalSettings));
          } catch (e) { console.warn(e); }
        }}
      />
    </div>
  );
};

export default SmartBillItemsList;

