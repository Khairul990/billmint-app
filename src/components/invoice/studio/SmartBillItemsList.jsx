import React, { useState, useCallback, useEffect } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Plus, Trash2, AlertTriangle, ArrowUp, X, Settings2 } from 'lucide-react';

const calculateRowAmount = (item) => {
  const q = parseFloat(item.qty) || 0;
  const r = parseFloat(item.rate) || 0;
  const d = parseFloat(item.discount) || 0;
  return Math.max(0, (q * r) - d);
};

const SmartBillItemsList = ({ products = [] }) => {
  const { state, dispatch } = useInvoice();
  
  // Custom columns state
  const [columns, setColumns] = useState({ col1: 'Description', col2: 'Qty', col3: 'Rate' });
  const [showColModal, setShowColModal] = useState(false);
  const [tempCols, setTempCols] = useState({ col1: '', col2: '', col3: '' });

  // Update columns based on template selection
  useEffect(() => {
    let col1 = 'Description';
    let col2 = 'Qty';
    let col3 = 'Rate';

    const t = state.selectedTemplate?.toLowerCase();
    if (t === 'embroidery') { col1 = 'Design / Work Name'; col2 = 'Qty'; col3 = 'Rate'; }
    else if (t === 'tailor') { col1 = 'Work / Measurement'; col2 = 'Qty'; col3 = 'Rate'; }
    else if (t === 'teacher') { col1 = 'Fee Description'; col2 = 'Month'; col3 = 'Amount'; }
    else if (t === 'doctor' || t === 'clinic') { col1 = 'Service / Visit'; col2 = 'Qty'; col3 = 'Fee'; }
    else if (t === 'retail' || t === 'mall') { col1 = 'Product Name'; col2 = 'Qty'; col3 = 'Price'; }
    else if (t === 'repair') { col1 = 'Problem / Service'; col2 = 'Qty'; col3 = 'Charge'; }

    setColumns({ col1, col2, col3 });
  }, [state.selectedTemplate]);

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

  const openColModal = () => {
    setTempCols(columns);
    setShowColModal(true);
  };

  const saveColumns = () => {
    setColumns(tempCols);
    setShowColModal(false);
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
                <th className="py-3 px-4 text-xs font-black text-theme-muted">{columns.col1}</th>
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-24 text-center">{columns.col2}</th>
                <th className="py-3 px-4 text-xs font-black text-theme-muted w-32 text-right">{columns.col3}</th>
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
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => handleDeleteRow(index)}
                      className="text-theme-muted hover:text-theme-danger transition-colors p-1.5 rounded-lg hover:bg-theme-danger/10 mx-auto"
                      title="Delete Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* Edit Columns Modal */}
      {showColModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-theme-surface w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-theme-border-soft">
              <h2 className="text-lg font-black text-theme-primary">Edit Columns</h2>
              <button onClick={() => setShowColModal(false)} className="p-2 text-theme-muted hover:text-theme-primary bg-theme-app/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Column 2 (Description)</label>
                <input
                  type="text"
                  value={tempCols.col1}
                  onChange={(e) => setTempCols({ ...tempCols, col1: e.target.value })}
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Column 3 (Quantity)</label>
                <input
                  type="text"
                  value={tempCols.col2}
                  onChange={(e) => setTempCols({ ...tempCols, col2: e.target.value })}
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">Column 4 (Rate)</label>
                <input
                  type="text"
                  value={tempCols.col3}
                  onChange={(e) => setTempCols({ ...tempCols, col3: e.target.value })}
                  className="w-full bg-theme-app border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent transition-colors"
                />
              </div>
            </div>

            <div className="p-5 bg-theme-app border-t border-theme-border-soft flex gap-3">
              <button
                onClick={() => setShowColModal(false)}
                className="flex-1 py-3 bg-transparent border border-theme-border-soft text-theme-primary font-bold rounded-xl transition-all hover:bg-theme-surface"
              >
                Cancel
              </button>
              <button
                onClick={saveColumns}
                className="flex-1 py-3 bg-theme-accent hover:bg-theme-accent/90 text-white font-black rounded-xl shadow-premium transition-all active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartBillItemsList;

