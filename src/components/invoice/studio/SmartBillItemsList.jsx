import React, { useState, useCallback } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Plus, Trash2, AlertTriangle, ArrowUp, X } from 'lucide-react';

const calculateRowAmount = (item) => {
  const q = parseFloat(item.qty) || 0;
  const r = parseFloat(item.rate) || 0;
  const d = parseFloat(item.discount) || 0;
  return Math.max(0, (q * r) - d);
};

const SmartBillItemsList = ({ products = [] }) => {
  const { state, dispatch } = useInvoice();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ itemService: '', description: '', qty: 1, rate: '', unit: 'Piece' });

  // Common quick add items
  const mostUsed = [
    { name: 'Shirt Stitching', rate: 450, unit: 'Piece' },
    { name: 'Pant Stitching', rate: 500, unit: 'Piece' },
    { name: 'Embroidery Design', rate: 800, unit: 'Design' }
  ];

  const recentUsed = [
    { name: 'Logo Stitch', rate: 250, unit: 'Piece' },
    { name: 'Alteration', rate: 100, unit: 'Piece' },
    { name: 'Doctor Visit', rate: 500, unit: 'Service' },
    { name: 'Tuition Fee', rate: 1000, unit: 'Service' }
  ];

  const handleUpdateItem = useCallback((index, field, value) => {
    dispatch({ type: 'UPDATE_ITEM_FIELD', payload: { index, field, value } });
  }, [dispatch]);

  const handleDeleteRow = useCallback((index) => {
    dispatch({ type: 'DELETE_ROW', payload: index });
  }, [dispatch]);

  const handleQuickAdd = (prod) => {
    const pName = prod.name || prod.productName;
    const pRate = prod.rate || prod.price || 0;
    
    // Check if empty last row exists
    const lastItem = state.items[state.items.length - 1];
    let newItems = [...state.items];
    
    const productToAdd = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

  const handleModalAdd = () => {
    if (!newItem.itemService) return;
    
    const lastItem = state.items[state.items.length - 1];
    let newItems = [...state.items];
    
    const productToAdd = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemService: newItem.itemService,
      description: newItem.description,
      qty: newItem.qty || 1,
      unit: newItem.unit || 'Piece',
      rate: parseFloat(newItem.rate) || 0,
      discount: 0,
      tax: 0,
      amount: (newItem.qty || 1) * (parseFloat(newItem.rate) || 0)
    };

    if (lastItem && !lastItem.itemService && !lastItem.description && (lastItem.rate === 0 || !lastItem.rate)) {
      productToAdd.sn = lastItem.sn;
      newItems[newItems.length - 1] = productToAdd;
    } else {
      productToAdd.sn = newItems.length + 1;
      newItems.push(productToAdd);
    }

    dispatch({ type: 'SET_ITEMS', payload: newItems });
    setNewItem({ itemService: '', description: '', qty: 1, rate: '', unit: 'Piece' });
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Quick Add Chips section */}
      <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase text-theme-muted mb-3 tracking-wider">Quick Add Items</h3>
        
        <div className="flex flex-col gap-3">
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
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted min-w-[70px] flex items-center gap-1.5">
              <ArrowUp className="w-3 h-3 text-emerald-500" /> Recent:
            </span>
            <div className="flex flex-wrap gap-2">
              {recentUsed.map((p, idx) => (
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
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-4">
        {state.items.length === 0 || (state.items.length === 1 && !state.items[0].itemService && state.items[0].rate === 0) ? (
           <div className="flex flex-col items-center justify-center p-8 bg-theme-surface border border-theme-border-soft border-dashed rounded-2xl shadow-sm">
             <div className="w-16 h-16 bg-theme-app border border-theme-border-soft text-theme-muted rounded-full flex items-center justify-center mb-4">
               <Plus className="w-6 h-6 text-theme-accent" />
             </div>
             <h3 className="text-lg font-black text-theme-primary mb-1">No Items Yet</h3>
             <p className="text-xs font-bold text-theme-muted mb-6">
               Tap "+ Add Item" below or choose from Quick Add.
             </p>
           </div>
        ) : (
          state.items.map((item, index) => {
            // Hide perfectly empty rows from UI in this card view
            if (!item.itemService && !item.description && (!item.rate || item.rate === 0)) return null;

            return (
              <div key={item.id || index} className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative group">
                <button 
                  onClick={() => handleDeleteRow(index)}
                  className="absolute top-4 right-4 text-theme-muted hover:text-theme-danger transition-colors p-1 bg-theme-app/50 rounded-lg hover:bg-theme-danger/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="pr-10 mb-3">
                  <input
                    type="text"
                    value={item.itemService || ''}
                    onChange={(e) => handleUpdateItem(index, 'itemService', e.target.value)}
                    placeholder="Item name..."
                    className="w-full bg-transparent outline-none text-lg font-black text-theme-primary placeholder-theme-muted/50 mb-1"
                  />
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    placeholder="Optional description..."
                    className="w-full bg-transparent outline-none text-xs font-bold text-theme-muted placeholder-theme-muted/30"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-theme-app/50 p-3 rounded-xl border border-theme-border-soft">
                  <div className="flex items-center gap-2 bg-theme-surface px-2 py-1.5 rounded-lg border border-theme-border-soft shadow-sm">
                    <button onClick={() => handleUpdateItem(index, 'qty', Math.max(1, (parseFloat(item.qty) || 1) - 1))} className="w-6 h-6 flex items-center justify-center text-theme-primary font-bold hover:bg-theme-app rounded">-</button>
                    <span className="text-sm font-black text-theme-primary w-6 text-center">{item.qty || 1}</span>
                    <button onClick={() => handleUpdateItem(index, 'qty', (parseFloat(item.qty) || 0) + 1)} className="w-6 h-6 flex items-center justify-center text-theme-primary font-bold hover:bg-theme-app rounded">+</button>
                  </div>
                  
                  <span className="text-xs font-black text-theme-muted">x</span>
                  
                  <div className="flex items-center gap-1 bg-theme-surface px-3 py-1.5 rounded-lg border border-theme-border-soft shadow-sm flex-1 min-w-[100px]">
                    <span className="text-xs font-black text-theme-muted">₹</span>
                    <input
                      type="number"
                      value={item.rate || ''}
                      onChange={(e) => handleUpdateItem(index, 'rate', e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent outline-none text-sm font-black text-theme-primary"
                    />
                  </div>

                  <div className="text-right min-w-[80px]">
                    <span className="text-[10px] font-bold uppercase text-theme-muted block mb-0.5">Amount</span>
                    <span className="text-base font-black text-theme-primary">
                      ₹{calculateRowAmount(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button 
        onClick={() => setShowAddModal(true)}
        className="w-full py-4 bg-theme-surface border-2 border-theme-border-soft border-dashed rounded-2xl flex items-center justify-center gap-2 text-theme-primary font-black hover:bg-theme-app hover:border-theme-accent/50 hover:text-theme-accent transition-all active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Add New Item
      </button>

      {/* Add Item Overlay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-theme-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-theme-border-soft">
              <h2 className="text-lg font-black text-theme-primary">Add Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-theme-muted hover:text-theme-primary bg-theme-app/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Item Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newItem.itemService}
                  onChange={(e) => setNewItem({ ...newItem, itemService: e.target.value })}
                  placeholder="e.g. Logo Stitching"
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-3 outline-none text-base font-black text-theme-primary focus:border-theme-accent transition-colors"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Description (Optional)</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Size, color, details..."
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-2 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Qty</label>
                  <input
                    type="number"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseFloat(e.target.value) || '' })}
                    className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-3 outline-none text-base font-black text-theme-primary focus:border-theme-accent transition-colors text-center"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Rate (₹)</label>
                  <input
                    type="number"
                    value={newItem.rate}
                    onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-3 outline-none text-base font-black text-theme-primary focus:border-theme-accent transition-colors text-right"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-theme-app border-t border-theme-border-soft flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-theme-muted">Amount</span>
                <span className="text-xl font-black text-theme-primary">
                  ₹{((newItem.qty || 1) * (parseFloat(newItem.rate) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleModalAdd}
                disabled={!newItem.itemService || !newItem.rate}
                className="px-6 py-3 bg-theme-accent hover:bg-theme-accent/90 disabled:opacity-50 disabled:hover:bg-theme-accent text-white font-black rounded-xl shadow-premium transition-all active:scale-95"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartBillItemsList;
