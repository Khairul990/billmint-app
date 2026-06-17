import React, { useRef, useState } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Plus, Copy, Trash2, GripVertical, CheckSquare, FilePlus, ChevronDown } from 'lucide-react';
import QuickProductBar from './QuickProductBar';

const ExcelBillTable = ({ products }) => {
  const { state, dispatch } = useInvoice();
  const tableRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...state.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Removed side-effect amount calculation. Totals are now computed globally or dynamically rendered.
    // This fixes the bug where Quick Added items had invalid amounts or double taxation.
    
    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const handleAddRow = () => {
    const newItems = [...state.items, {
      id: `item-${Date.now()}`,
      sn: state.items.length + 1,
      description: '',
      itemService: '',
      qty: 1,
      rate: 0,
      discount: 0,
      tax: 0,
      unit: 'Piece'
    }];
    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const handleCopyRow = (index) => {
    const itemToCopy = { ...state.items[index], id: `item-${Date.now()}`, sn: state.items.length + 1 };
    dispatch({ type: 'SET_ITEMS', payload: [...state.items, itemToCopy] });
  };

  const handleDeleteRow = (index) => {
    if (state.items.length === 1) {
      // Don't delete last row, just clear it
      handleUpdateItem(0, 'itemService', '');
      handleUpdateItem(0, 'description', '');
      handleUpdateItem(0, 'qty', 1);
      handleUpdateItem(0, 'rate', 0);
      return;
    }
    const newItems = state.items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sn: idx + 1 }));
    dispatch({ type: 'SET_ITEMS', payload: newItems });
    const newSelected = new Set(selectedRows);
    newSelected.delete(index);
    setSelectedRows(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return;
    const newItems = state.items.filter((_, i) => !selectedRows.has(i)).map((item, idx) => ({ ...item, sn: idx + 1 }));
    
    // If we deleted everything, leave one empty row
    if (newItems.length === 0) {
      newItems.push({
        id: `item-${Date.now()}`,
        sn: 1,
        description: '',
        itemService: '',
        qty: 1,
        rate: 0,
        discount: 0,
        tax: 0,
        unit: 'Piece'
      });
    }
    
    dispatch({ type: 'SET_ITEMS', payload: newItems });
    setSelectedRows(new Set());
  };

  const toggleRowSelection = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);
    setSelectedRows(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === state.items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(state.items.map((_, i) => i)));
    }
  };

  // Keyboard Navigation (Excel-like)
  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (!tableRef.current) return;
    
    // Get all inputs in the table grid
    const rows = tableRef.current.querySelectorAll('tr.grid-row');
    if (!rows[rowIndex]) return;
    
    const inputs = Array.from(rows[rowIndex].querySelectorAll('input, select'));
    const colsCount = inputs.length;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === state.items.length - 1 && colIndex === colsCount - 1) {
        handleAddRow();
        // Focus will need to be set asynchronously after render, handled normally by user
      } else if (colIndex < colsCount - 1) {
        inputs[colIndex + 1].focus();
      } else if (rowIndex < state.items.length - 1) {
        const nextRowInputs = rows[rowIndex + 1].querySelectorAll('input, select');
        if (nextRowInputs[0]) nextRowInputs[0].focus();
      }
    } else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
      if (colIndex < colsCount - 1) inputs[colIndex + 1].focus();
    } else if (e.key === 'ArrowLeft' && e.target.selectionEnd === 0) {
      if (colIndex > 0) inputs[colIndex - 1].focus();
    } else if (e.key === 'ArrowDown') {
      if (rowIndex < state.items.length - 1) {
        const nextRowInputs = rows[rowIndex + 1].querySelectorAll('input, select');
        if (nextRowInputs[colIndex]) nextRowInputs[colIndex].focus();
      }
    } else if (e.key === 'ArrowUp') {
      if (rowIndex > 0) {
        const prevRowInputs = rows[rowIndex - 1].querySelectorAll('input, select');
        if (prevRowInputs[colIndex]) prevRowInputs[colIndex].focus();
      }
    }
  };

  const calculateRowAmount = (item) => {
    const q = parseFloat(item.qty) || 0;
    const r = parseFloat(item.rate) || 0;
    const d = parseFloat(item.discount) || 0;
    return Math.max(0, (q * r) - d);
  };

  return (
    <div className="flex flex-col h-full bg-theme-surface">
      <div className="sticky top-0 z-40 bg-theme-surface/95 backdrop-blur-md p-4 border-b border-theme-border-soft">
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary mb-3">Bill Items</h2>
        <QuickProductBar products={products} />
      </div>

      <div className="flex-1 overflow-auto bg-theme-app/30">
        {state.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-theme-surface border border-theme-border-soft p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-lg w-full flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="w-24 h-24 bg-theme-app border border-theme-border-soft text-theme-accent rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                <div className="absolute inset-0 rounded-full border-2 border-theme-accent/20 animate-pulse"></div>
                <FilePlus className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-theme-primary tracking-tight mb-3">No Bill Items Added</h3>
              <p className="text-sm font-bold text-theme-muted max-w-sm mx-auto mb-8">
                Create your first item or use Quick Add.
              </p>
              
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    handleAddRow();
                    setTimeout(() => {
                      const firstInput = document.querySelector('input[placeholder="Item name..."]');
                      if (firstInput) firstInput.focus();
                    }, 100);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-theme-accent to-pink-500 hover:from-pink-500 hover:to-theme-accent text-white rounded-xl font-black shadow-lg shadow-theme-accent/30 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Add First Item
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-theme-app border border-theme-border-soft hover:bg-theme-border-soft text-theme-primary rounded-xl font-bold transition-all">
                  Use Recent Item
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-theme-app border border-theme-border-soft hover:bg-theme-border-soft text-theme-primary rounded-xl font-bold transition-all">
                  Import From Previous Invoice
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="hidden sm:table w-full text-left border-collapse" ref={tableRef}>
          <thead className="sticky top-[108px] bg-theme-app/95 backdrop-blur-md z-30 text-[10px] uppercase font-black text-theme-muted tracking-wider shadow-sm">
            <tr>
              <th className="p-3 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={state.items.length > 0 && selectedRows.size === state.items.length}
                  onChange={toggleAllSelection}
                  className="w-3.5 h-3.5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer"
                />
              </th>
              <th className="p-3 w-10 text-center"></th>
              <th className="p-3 w-10 text-center">SN</th>
              <th className="p-3 min-w-[150px]">Item</th>
              <th className="p-3 min-w-[150px]">Description</th>
              <th className="p-3 w-20 text-center">Qty</th>
              <th className="p-3 w-24">Unit</th>
              <th className="p-3 w-28 text-right">Rate</th>
              <th className="p-3 w-24 text-right">Disc (₹)</th>
              <th className="p-3 w-20 text-right">Tax %</th>
              <th className="p-3 w-28 text-right">Amount (₹)</th>
              <th className="p-3 w-16 text-center">Acts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border-soft">
            {state.items.map((item, rowIndex) => (
              <tr key={item.id} className={`grid-row group transition-colors ${selectedRows.has(rowIndex) ? 'bg-theme-accent/10' : 'hover:bg-theme-accent/5'}`}>
                <td className="p-1.5 text-center border-r border-transparent">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    className="w-3.5 h-3.5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity peer-checked:opacity-100"
                  />
                </td>
                <td className="p-1.5 text-center text-theme-muted cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="p-1.5 text-center text-xs font-bold text-theme-muted">
                  {item.sn}
                </td>
                <td className="p-1.5">
                  <input
                    id={rowIndex === 0 ? "first-item-name" : undefined}
                    type="text"
                    value={item.itemService || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'itemService', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                    placeholder="Item name..."
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-0.5 px-1 transition-colors"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(rowIndex, 'description', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                    placeholder="Details..."
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-xs text-theme-muted py-0.5 px-1 transition-colors"
                  />
                </td>
                <td className="p-1.5">
                  <div className="flex items-center justify-center gap-1 bg-theme-surface rounded-md p-0.5 border border-theme-border-soft">
                    <button 
                      onClick={() => handleUpdateItem(rowIndex, 'qty', Math.max(1, (parseFloat(item.qty) || 1) - 1))}
                      className="w-5 h-5 flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded transition-colors"
                      tabIndex="-1"
                    >-</button>
                    <input
                      type="number"
                      value={item.qty || ''}
                      onChange={(e) => handleUpdateItem(rowIndex, 'qty', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 2)}
                      className="w-8 bg-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary text-center appearance-none"
                    />
                    <button 
                      onClick={() => handleUpdateItem(rowIndex, 'qty', (parseFloat(item.qty) || 0) + 1)}
                      className="w-5 h-5 flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded transition-colors"
                      tabIndex="-1"
                    >+</button>
                  </div>
                </td>
                <td className="p-1.5">
                  <div className="relative">
                    <select
                    value={item.unit || 'Piece'}
                    onChange={(e) => handleUpdateItem(rowIndex, 'unit', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 3)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-xs font-bold text-theme-muted py-1 pl-1 pr-4 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kg</option>
                    <option value="Meter">Meter</option>
                    <option value="Liter">Liter</option>
                    <option value="Box">Box</option>
                    <option value="Service">Service</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-theme-muted absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </td>
                <td className="p-1.5 relative">
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'rate', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 4)}
                    placeholder="Enter rate ₹"
                    className={`w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-black text-theme-primary py-0.5 px-1 text-right transition-colors ${item.itemService && (!item.rate || parseFloat(item.rate) === 0) ? 'border-rose-400 bg-rose-500/5' : ''}`}
                  />
                  {item.itemService && (!item.rate || parseFloat(item.rate) === 0) && (
                    <span className="absolute -bottom-3 right-0 text-[9px] text-rose-500 font-bold">Rate required</span>
                  )}
                </td>
                <td className="p-1.5">
                  <input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'discount', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 5)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-0.5 px-1 text-right transition-colors"
                  />
                </td>
                <td className="p-1.5">
                  <input
                    type="number"
                    value={item.tax || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'tax', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 6)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-1 px-1 text-right transition-colors"
                  />
                </td>
                <td className="p-2">
                  <div className="text-right text-sm font-black text-theme-primary pr-2">
                    ₹{calculateRowAmount(item).toLocaleString()}
                  </div>
                </td>
                <td className="p-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopyRow(rowIndex)} className="p-1.5 text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10 rounded-md transition-colors" title="Duplicate Row">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteRow(rowIndex)} className="p-1.5 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-md transition-colors" title="Delete Row">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Stacked Cards View */}
        <div className="block sm:hidden divide-y divide-theme-border-soft p-2">
          {state.items.map((item, rowIndex) => (
            <div key={item.id} className="bg-theme-surface rounded-xl p-3 mb-3 border border-theme-border-soft shadow-sm relative">
              
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.itemService || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'itemService', e.target.value)}
                    placeholder="Item name..."
                    className="w-full bg-transparent outline-none text-sm font-black text-theme-primary placeholder-theme-muted/50"
                  />
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-theme-primary">
                    ₹{calculateRowAmount(item).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleUpdateItem(rowIndex, 'description', e.target.value)}
                  placeholder="Details (optional)..."
                  className="w-full bg-transparent outline-none text-xs font-bold text-theme-muted placeholder-theme-muted/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-theme-app/50 p-2 rounded-lg border border-theme-border-soft flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-theme-muted">Qty</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateItem(rowIndex, 'qty', Math.max(1, (parseFloat(item.qty) || 1) - 1))} className="w-5 h-5 flex items-center justify-center bg-theme-surface rounded shadow-sm text-theme-primary">-</button>
                    <span className="text-xs font-bold text-theme-primary">{item.qty || 0}</span>
                    <button onClick={() => handleUpdateItem(rowIndex, 'qty', (parseFloat(item.qty) || 0) + 1)} className="w-5 h-5 flex items-center justify-center bg-theme-surface rounded shadow-sm text-theme-primary">+</button>
                  </div>
                </div>

                <div className={`bg-theme-app/50 p-2 rounded-lg border border-theme-border-soft flex items-center justify-between ${item.itemService && (!item.rate || parseFloat(item.rate) === 0) ? 'border-rose-400/50 bg-rose-500/5' : ''}`}>
                  <span className="text-[10px] font-black uppercase text-theme-muted">Rate</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-theme-muted">₹</span>
                    <input
                      type="number"
                      value={item.rate || ''}
                      onChange={(e) => handleUpdateItem(rowIndex, 'rate', e.target.value)}
                      placeholder="0"
                      className="w-16 bg-transparent outline-none text-sm font-black text-theme-primary text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced toggles could go here if needed, but for now we show all or basic. Let's just show disc/tax compactly. */}
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-theme-muted">Disc ₹</span>
                  <input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'discount', e.target.value)}
                    placeholder="0"
                    className="w-full bg-theme-app border border-theme-border-soft rounded-md px-2 py-1 text-xs font-bold text-theme-primary outline-none focus:border-theme-accent"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-theme-muted">Tax %</span>
                  <input
                    type="number"
                    value={item.tax || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'tax', e.target.value)}
                    placeholder="0"
                    className="w-full bg-theme-app border border-theme-border-soft rounded-md px-2 py-1 text-xs font-bold text-theme-primary outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Always show delete on mobile for easy access */}
              </div>
              <button 
                onClick={() => handleDeleteRow(rowIndex)} 
                className="absolute -top-2 -right-2 w-7 h-7 bg-theme-surface border border-theme-border-soft shadow-sm rounded-full flex items-center justify-center text-theme-muted hover:text-theme-danger hover:border-theme-danger/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      <div className="p-3 border-t border-theme-border-soft bg-theme-app/50 flex justify-between items-center">
        <div>
          {selectedRows.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-theme-danger/10 hover:bg-theme-danger/20 text-theme-danger text-xs font-bold rounded-xl transition-all shadow-sm border border-theme-danger/20"
            >
              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedRows.size})
            </button>
          )}
        </div>
        <button
          onClick={handleAddRow}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-xs font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
        >
          <Plus className="w-4 h-4" /> Add New Row
        </button>
      </div>

      {/* Mobile Floating Action Button */}
      {state.items.length > 0 && (
        <button
          onClick={handleAddRow}
          className="fixed bottom-24 right-4 w-14 h-14 bg-theme-accent text-white rounded-full shadow-[0_8px_30px_rgba(236,72,153,0.3)] flex items-center justify-center z-50 sm:hidden hover:bg-theme-accent/90 transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ExcelBillTable;
