import React, { useRef, useEffect } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Plus, Copy, Trash2, GripVertical } from 'lucide-react';
import QuickProductBar from './QuickProductBar';

const ExcelBillTable = ({ products }) => {
  const { state, dispatch } = useInvoice();
  const tableRef = useRef(null);

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...state.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate amount
    if (field === 'qty' || field === 'rate') {
      const q = parseFloat(newItems[index].qty) || 0;
      const r = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = q * r;
    }
    
    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const handleAddRow = () => {
    const newItems = [...state.items, {
      id: `item-${Date.now()}`,
      sn: state.items.length + 1,
      description: '',
      qty: 1,
      rate: 0,
      unit: 'Piece',
      amount: 0
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
      handleUpdateItem(0, 'description', '');
      handleUpdateItem(0, 'qty', 1);
      handleUpdateItem(0, 'rate', 0);
      return;
    }
    const newItems = state.items.filter((_, i) => i !== index).map((item, idx) => ({ ...item, sn: idx + 1 }));
    dispatch({ type: 'SET_ITEMS', payload: newItems });
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

  return (
    <div className="flex flex-col h-full bg-theme-surface">
      <div className="p-4 border-b border-theme-border-soft">
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary mb-3">Bill Items</h2>
        <QuickProductBar products={products} />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse" ref={tableRef}>
          <thead className="sticky top-0 bg-theme-app/95 backdrop-blur-md z-10 text-[10px] uppercase font-black text-theme-muted tracking-wider shadow-sm">
            <tr>
              <th className="p-3 w-10 text-center"></th>
              <th className="p-3 w-12 text-center">SN</th>
              <th className="p-3 min-w-[250px]">Item Description</th>
              <th className="p-3 w-24 text-center">Qty</th>
              <th className="p-3 w-28">Unit</th>
              <th className="p-3 w-32 text-right">Rate (₹)</th>
              <th className="p-3 w-32 text-right">Amount (₹)</th>
              <th className="p-3 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border-soft">
            {state.items.map((item, rowIndex) => (
              <tr key={item.id} className="grid-row group hover:bg-theme-accent/5 transition-colors">
                <td className="p-2 text-center text-theme-muted cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="p-2 text-center text-xs font-bold text-theme-muted">
                  {item.sn}
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(rowIndex, 'description', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                    placeholder="Enter item name..."
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-1 px-2 transition-colors"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.qty || ''}
                    onChange={(e) => handleUpdateItem(rowIndex, 'qty', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-bold text-theme-primary py-1 px-2 text-center transition-colors appearance-none"
                  />
                </td>
                <td className="p-2">
                  <select
                    value={item.unit || 'Piece'}
                    onChange={(e) => handleUpdateItem(rowIndex, 'unit', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 2)}
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
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, 3)}
                    className="w-full bg-transparent border-b border-transparent focus:border-theme-accent outline-none text-sm font-black text-theme-primary py-1 px-2 text-right transition-colors"
                  />
                </td>
                <td className="p-2">
                  <div className="text-right text-sm font-black text-theme-primary pr-2">
                    ₹{item.amount?.toLocaleString()}
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

      <div className="p-3 border-t border-theme-border-soft bg-theme-app/50 flex justify-center">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 px-4 py-2 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-xs font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
        >
          <Plus className="w-4 h-4" /> Add New Row
        </button>
      </div>
    </div>
  );
};

export default ExcelBillTable;
