import React, { useRef, useState } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Plus, Copy, Trash2, GripVertical, CheckSquare } from 'lucide-react';
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

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse" ref={tableRef}>
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
                <td className="p-2 text-center border-r border-transparent">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => toggleRowSelection(rowIndex)}
                    className="w-3.5 h-3.5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity peer-checked:opacity-100"
                  />
                </td>
                <td className="p-2 text-center text-theme-muted cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="p-2 text-center text-xs font-bold text-theme-muted">
                  {item.sn}
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.itemService || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'itemService', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                    placeholder="Item name..."
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-1 px-1 transition-colors"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(rowIndex, 'description', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                    placeholder="Details..."
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm text-theme-muted py-1 px-1 transition-colors"
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-1 bg-theme-app/50 rounded-lg p-0.5 border border-theme-border-soft">
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
                <td className="p-2">
                  <select
                    value={item.unit || 'Piece'}
                    onChange={(e) => handleUpdateItem(rowIndex, 'unit', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 3)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-xs font-bold text-theme-muted py-1.5 transition-colors cursor-pointer"
                  >
                    <option value="Piece">Piece</option>
                    <option value="Kg">Kg</option>
                    <option value="Meter">Meter</option>
                    <option value="Liter">Liter</option>
                    <option value="Box">Box</option>
                    <option value="Service">Service</option>
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'rate', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 4)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-black text-theme-primary py-1 px-1 text-right transition-colors"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'discount', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 5)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-1 px-1 text-right transition-colors"
                  />
                </td>
                <td className="p-2">
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
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <button
        onClick={handleAddRow}
        className="fixed bottom-24 right-4 w-14 h-14 bg-theme-accent text-white rounded-full shadow-[0_8px_30px_rgba(236,72,153,0.3)] flex items-center justify-center z-50 sm:hidden hover:bg-theme-accent/90 transition-transform active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ExcelBillTable;
