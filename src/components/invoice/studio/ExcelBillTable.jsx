import React, { useRef, useState, useCallback, memo } from 'react';
import { useInvoice } from '../../../context/InvoiceContext';
import { Plus, Copy, Trash2, GripVertical, FilePlus, ChevronDown, Settings } from 'lucide-react';
import QuickProductBar from './QuickProductBar';
import EditColumnsModal from './EditColumnsModal';
import { getUnitsByType } from '../../../config/businessPresets';

// Extracted pure function for row calculation
const calculateRowAmount = (item) => {
  const q = parseFloat(item.qty) || 0;
  const r = parseFloat(item.rate) || 0;
  const d = parseFloat(item.discount) || 0;
  return Math.max(0, (q * r) - d);
};

// ----------------------------------------------------------------------
// Memoized Desktop Row
// ----------------------------------------------------------------------
const MemoizedBillRow = memo(({ 
  item, 
  rowIndex, 
  isSelected, 
  onUpdateItem, 
  onKeyDown, 
  onCopyRow, 
  onDeleteRow, 
  onToggleSelection,
  availableUnits,
  extraCols = []
}) => {
  return (
    <tr className={`grid-row group transition-all duration-200 border-b border-theme-border-soft ${isSelected ? 'bg-theme-accent/10 shadow-[inset_4px_0_0_var(--tw-colors-theme-accent)]' : 'hover:bg-theme-surface-hover'}`}>
      <td className="p-0 text-center border-r border-theme-border-soft">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelection(rowIndex)}
          className="w-3.5 h-3.5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity peer-checked:opacity-100"
        />
      </td>
      <td className="p-0 text-center border-r border-theme-border-soft text-theme-muted cursor-grab active:cursor-grabbing">
        <GripVertical className="w-3.5 h-3.5 mx-auto opacity-0 group-hover:opacity-50 transition-opacity" />
      </td>
      <td className="p-0 text-center border-r border-theme-border-soft text-[10px] font-black text-theme-muted">
        {item.sn}
      </td>
      <td className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_2px_var(--tw-colors-theme-accent)] transition-all">
        <input
          id={rowIndex === 0 ? "first-item-name" : undefined}
          type="text"
          value={item.itemService || ''}
          onChange={(e) => onUpdateItem(rowIndex, 'itemService', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, 0)}
          placeholder={rowIndex === 0 ? "Type item or select Quick Add..." : "Enter item..."}
          className={`w-full h-full bg-transparent outline-none font-black text-theme-primary py-2.5 px-3 ${rowIndex === 0 ? 'text-sm' : 'text-xs'}`}
        />
      </td>
      <td className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_1px_var(--tw-colors-theme-accent)] transition-all">
        <input
          type="text"
          value={item.description || ''}
          onChange={(e) => onUpdateItem(rowIndex, 'description', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, 1)}
          placeholder="Details..."
          className="w-full h-full bg-transparent outline-none text-[11px] font-medium text-theme-muted py-2.5 px-3"
        />
      </td>
      {extraCols.map((col, colIdx) => (
        <td key={col.id} className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_1px_var(--tw-colors-theme-accent)] transition-all">
          <input
            type="text"
            value={item[col.id] || ''}
            onChange={(e) => onUpdateItem(rowIndex, col.id, e.target.value)}
            placeholder="..."
            className="w-full h-full bg-transparent outline-none text-[11px] font-medium text-theme-muted py-2.5 px-3 text-center"
          />
        </td>
      ))}
      <td className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_1px_var(--tw-colors-theme-accent)] transition-all">
        <input
          type="number"
          value={item.qty || ''}
          onChange={(e) => onUpdateItem(rowIndex, 'qty', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, 2)}
          className="w-full h-full bg-transparent outline-none text-xs font-black text-theme-primary text-center appearance-none py-2.5 px-2"
        />
      </td>
      <td className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface transition-all">
        <div className="relative h-full flex items-center">
          <select
            value={item.unit || 'Piece'}
            onChange={(e) => onUpdateItem(rowIndex, 'unit', e.target.value)}
            onKeyDown={(e) => onKeyDown(e, rowIndex, 3)}
            className="w-full h-full bg-transparent outline-none text-[11px] font-bold text-theme-muted py-2.5 pl-3 pr-5 cursor-pointer appearance-none"
          >
            {availableUnits.map(u => (
              <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-theme-muted absolute right-2 pointer-events-none" />
        </div>
      </td>
      <td className="p-0 relative border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_1px_var(--tw-colors-theme-accent)] transition-all">
        <input
          type="number"
          value={item.rate || ''}
          onChange={(e) => onUpdateItem(rowIndex, 'rate', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, 4)}
          placeholder={rowIndex === 0 ? "Rate ₹" : "0.00"}
          className={`w-full h-full bg-transparent outline-none font-black text-theme-primary py-2.5 px-3 text-right ${rowIndex === 0 ? 'text-sm' : 'text-xs'} ${item.itemService && (!item.rate || parseFloat(item.rate) === 0) ? 'bg-rose-500/10 text-rose-600' : ''}`}
        />
        {item.itemService && (!item.rate || parseFloat(item.rate) === 0) && (
          <div className="absolute inset-y-0 right-0 w-1 bg-rose-500"></div>
        )}
      </td>
      <td className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_1px_var(--tw-colors-theme-accent)] transition-all">
        <input
          type="number"
          value={item.discount || ''}
          onChange={(e) => onUpdateItem(rowIndex, 'discount', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, 5)}
          placeholder="0"
          className="w-full h-full bg-transparent outline-none text-xs font-bold text-theme-primary py-2.5 px-3 text-right"
        />
      </td>
      <td className="p-0 border-r border-theme-border-soft bg-transparent focus-within:bg-theme-surface focus-within:shadow-[inset_0_0_0_1px_var(--tw-colors-theme-accent)] transition-all">
        <input
          type="number"
          value={item.tax || ''}
          onChange={(e) => onUpdateItem(rowIndex, 'tax', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, 6)}
          placeholder="0"
          className="w-full h-full bg-transparent outline-none text-xs font-bold text-theme-primary py-2.5 px-3 text-right"
        />
      </td>
      <td className="p-0 border-r border-theme-border-soft bg-theme-surface">
        <div className="w-full h-full flex items-center justify-end px-3 text-sm font-black text-theme-primary">
          {calculateRowAmount(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </td>
      <td className="p-0 text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onCopyRow(rowIndex)} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-border-soft rounded-lg transition-colors" title="Duplicate Row">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDeleteRow(rowIndex)} className="p-1.5 text-theme-muted hover:text-theme-danger hover:bg-theme-danger/10 rounded-lg transition-colors" title="Delete Row">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// ----------------------------------------------------------------------
// Memoized Mobile Row
// ----------------------------------------------------------------------
const MemoizedMobileBillRow = memo(({ 
  item, 
  rowIndex, 
  onUpdateItem, 
  onDeleteRow,
  availableUnits,
  extraCols = []
}) => {
  return (
    <div className="bg-theme-surface rounded-2xl p-4 mb-4 border border-theme-border-soft shadow-sm relative group overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-theme-accent"></div>
      
      <div className="flex flex-col gap-3">
        {/* Item Name & Rate */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">
              {item.customCols?.col1 || 'Item Name'}
            </label>
            <input
              type="text"
              value={item.itemService || ''}
              onChange={(e) => onUpdateItem(rowIndex, 'itemService', e.target.value)}
              placeholder="Enter item name..."
              className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-3 py-2 outline-none text-sm font-black text-theme-primary focus:border-theme-accent transition-colors"
            />
          </div>
          <div className="w-28">
            <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block">
              {item.customCols?.col3 || 'Rate (₹)'}
            </label>
            <input
              type="number"
              value={item.rate || ''}
              onChange={(e) => onUpdateItem(rowIndex, 'rate', e.target.value)}
              placeholder="0.00"
              className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-3 py-2 outline-none text-sm font-black text-theme-primary focus:border-theme-accent transition-colors text-right"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <input
            type="text"
            value={item.description || ''}
            onChange={(e) => onUpdateItem(rowIndex, 'description', e.target.value)}
            placeholder="Details (optional)..."
            className="w-full bg-transparent outline-none text-xs font-bold text-theme-muted placeholder-theme-muted/50 px-1"
          />
        </div>

        {extraCols.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-1">
            {extraCols.map(col => (
              <div key={col.id} className="col-span-1">
                <label className="text-[9px] font-black uppercase text-theme-muted mb-1 block">
                  {col.name}
                </label>
                <input
                  type="text"
                  value={item[col.id] || ''}
                  onChange={(e) => onUpdateItem(rowIndex, col.id, e.target.value)}
                  placeholder="..."
                  className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-2 py-1.5 outline-none text-xs font-bold text-theme-primary"
                />
              </div>
            ))}
          </div>
        )}

        <div className="h-px w-full bg-theme-border-soft/50 my-1"></div>

        {/* Qty, Unit, Disc, Tax */}
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-1">
            <label className="text-[9px] font-black uppercase text-theme-muted mb-1 block">
              {item.customCols?.col2 || 'Qty'}
            </label>
            <input
              type="number"
              value={item.qty || ''}
              onChange={(e) => onUpdateItem(rowIndex, 'qty', e.target.value)}
              className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-2 py-1.5 outline-none text-xs font-bold text-theme-primary text-center"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[9px] font-black uppercase text-theme-muted mb-1 block">Unit</label>
            <div className="relative">
              <select
                value={item.unit || 'Piece'}
                onChange={(e) => onUpdateItem(rowIndex, 'unit', e.target.value)}
                className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-2 py-1.5 outline-none text-[10px] font-bold text-theme-muted appearance-none"
              >
                {availableUnits.map(u => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-span-1">
            <label className="text-[9px] font-black uppercase text-theme-muted mb-1 block">Disc ₹</label>
            <input
              type="number"
              value={item.discount || ''}
              onChange={(e) => onUpdateItem(rowIndex, 'discount', e.target.value)}
              className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-2 py-1.5 outline-none text-xs font-bold text-theme-primary text-center"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[9px] font-black uppercase text-theme-muted mb-1 block">Tax %</label>
            <input
              type="number"
              value={item.tax || ''}
              onChange={(e) => onUpdateItem(rowIndex, 'tax', e.target.value)}
              className="w-full bg-theme-app/50 border border-theme-border-soft rounded-lg px-2 py-1.5 outline-none text-xs font-bold text-theme-primary text-center"
            />
          </div>
        </div>

        {/* Total & Action */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-theme-border-soft border-dashed">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-theme-muted">Amount:</span>
            <span className="text-sm font-black text-theme-primary">₹{calculateRowAmount(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button 
            onClick={() => onDeleteRow(rowIndex)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item === nextProps.item &&
    prevProps.rowIndex === nextProps.rowIndex
  );
});

// ----------------------------------------------------------------------
// Main Table Component
// ----------------------------------------------------------------------
const ExcelBillTable = ({ products }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  const tableRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isEditColumnsOpen, setIsEditColumnsOpen] = useState(false);
  
  const customCols = state.settings?.customColumns || businessSettings?.customColumns || { col1: 'Item Name', col2: 'Qty', col3: 'Rate (₹)' };
  const extraCols = state.settings?.extraColumns || businessSettings?.extraColumns || [];
  
  const wsType = state.businessSettings?.businessWorkspaces?.find(ws => ws.id === state.businessSettings.activeWorkspaceId)?.type || state.businessSettings?.type || 'retail';
  const availableUnits = getUnitsByType(wsType);

  // Use useCallback to prevent recreating functions on every render
  const handleUpdateItem = useCallback((index, field, value) => {
    dispatch({ type: 'UPDATE_ITEM_FIELD', payload: { index, field, value } });
  }, [dispatch]);

  const handleAddRow = useCallback(() => {
    dispatch({ type: 'ADD_EMPTY_ROW' });
  }, [dispatch]);

  const handleCopyRow = useCallback((index) => {
    dispatch({ type: 'COPY_ROW', payload: index });
  }, [dispatch]);

  const handleDeleteRow = useCallback((index) => {
    dispatch({ type: 'DELETE_ROW', payload: index });
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(index);
      return newSelected;
    });
  }, [dispatch]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.size === 0) return;
    dispatch({ type: 'BULK_DELETE_ROWS', payload: Array.from(selectedRows) });
    setSelectedRows(new Set());
  }, [selectedRows, dispatch]);

  const toggleRowSelection = useCallback((index) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(index)) newSelected.delete(index);
      else newSelected.add(index);
      return newSelected;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedRows.size === state.items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(state.items.map((_, i) => i)));
    }
  }, [selectedRows.size, state.items.length]);

  const handleKeyDown = useCallback((e, rowIndex, colIndex) => {
    if (!tableRef.current) return;
    
    const rows = tableRef.current.querySelectorAll('tr.grid-row');
    if (!rows[rowIndex]) return;
    
    const inputs = Array.from(rows[rowIndex].querySelectorAll('input, select'));
    const colsCount = inputs.length;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === state.items.length - 1 && colIndex === colsCount - 1) {
        handleAddRow();
      } else if (colIndex < colsCount - 1) {
        inputs[colIndex + 1]?.focus();
      } else if (rowIndex < state.items.length - 1) {
        const nextRowInputs = rows[rowIndex + 1].querySelectorAll('input, select');
        if (nextRowInputs[0]) nextRowInputs[0].focus();
      }
    } else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value?.length) {
      if (colIndex < colsCount - 1) inputs[colIndex + 1]?.focus();
    } else if (e.key === 'ArrowLeft' && e.target.selectionEnd === 0) {
      if (colIndex > 0) inputs[colIndex - 1]?.focus();
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
  }, [state.items.length, handleAddRow]);

  return (
    <div className="flex flex-col w-full bg-theme-surface">
      {/* Top Header & Quick Add */}
      <div className="p-3 border-b border-theme-border-soft flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-theme-primary">Bill Items</h2>
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-danger/10 hover:bg-theme-danger/20 text-theme-danger text-[10px] font-bold rounded-lg transition-all border border-theme-danger/20"
              >
                <Trash2 className="w-3 h-3" /> Delete ({selectedRows.size})
              </button>
            )}
            <button
              onClick={() => setIsEditColumnsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-surface hover:bg-theme-card text-theme-primary border border-theme-border-soft text-[10px] font-bold rounded-lg transition-all shadow-sm"
            >
              <Settings className="w-3 h-3" /> Edit Columns
            </button>
            <button
              onClick={() => {
                handleAddRow();
                setTimeout(() => {
                  const rows = tableRef.current?.querySelectorAll('tr.grid-row');
                  if (rows && rows.length > 0) {
                    const lastRowInputs = rows[rows.length - 1].querySelectorAll('input');
                    if (lastRowInputs[1]) lastRowInputs[1].focus(); // Focus Item Name
                  }
                }, 50);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-accent hover:bg-theme-accent/90 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>
        </div>
        
        {/* Quick Add Bar */}
        <QuickProductBar products={products} />
      </div>

      <div className="w-full bg-theme-surface">
        {state.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
            <div className="flex flex-col items-center justify-center min-h-[250px] text-center p-8 bg-theme-app/30 border border-theme-border-soft border-dashed rounded-2xl mx-4 w-full max-w-md">
              <div className="w-16 h-16 bg-theme-surface border border-theme-border-soft text-theme-muted rounded-2xl flex items-center justify-center mb-4 shadow-sm rotate-3">
                <FilePlus className="w-6 h-6 text-theme-accent" />
              </div>
              <h3 className="text-lg font-black text-theme-primary mb-1">No Bill Items Yet</h3>
              <p className="text-xs font-bold text-theme-muted mb-6 max-w-xs">
                Start adding items by clicking on Quick Add above or add an empty row.
              </p>
              <button
                onClick={() => {
                  handleAddRow();
                  setTimeout(() => {
                    const firstInput = document.querySelector('input[placeholder="Type item or select Quick Add..."]');
                    if (firstInput) firstInput.focus();
                  }, 100);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-xl font-black shadow-premium transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" /> Add First Item
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="hidden sm:table w-full text-left border-collapse" ref={tableRef}>
              <thead className="sticky top-[64px] bg-theme-surface z-30 text-[9px] uppercase font-black text-theme-muted tracking-wider shadow-sm border-y border-theme-border-soft">
                <tr>
                  <th className="py-3 px-1 w-8 text-center border-r border-theme-border-soft bg-theme-app/50">
                    <input 
                      type="checkbox" 
                      checked={state.items.length > 0 && selectedRows.size === state.items.length}
                      onChange={toggleAllSelection}
                      className="w-3.5 h-3.5 rounded border-theme-border-soft text-theme-accent focus:ring-theme-accent cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-1 w-6 text-center border-r border-theme-border-soft bg-theme-app/50"></th>
                  <th className="py-3 px-1 w-8 text-center border-r border-theme-border-soft bg-theme-app/50">#</th>
                  <th className="py-3 px-3 w-[35%] min-w-[200px] border-r border-theme-border-soft bg-theme-app/50">{customCols.col1}</th>
                  <th className="py-3 px-3 w-[25%] min-w-[150px] border-r border-theme-border-soft bg-theme-app/50">Description</th>
                  {extraCols.map(col => (
                    <th key={col.id} className="py-3 px-3 min-w-[100px] text-center border-r border-theme-border-soft bg-theme-app/50">{col.name}</th>
                  ))}
                  <th className="py-3 px-2 w-20 text-center border-r border-theme-border-soft bg-theme-app/50">{customCols.col2}</th>
                  <th className="py-3 px-3 w-20 border-r border-theme-border-soft bg-theme-app/50">Unit</th>
                  <th className="py-3 px-3 w-24 text-right border-r border-theme-border-soft bg-theme-app/50">{customCols.col3}</th>
                  <th className="py-3 px-3 w-20 text-right border-r border-theme-border-soft bg-theme-app/50">Disc</th>
                  <th className="py-3 px-3 w-16 text-right border-r border-theme-border-soft bg-theme-app/50">Tax%</th>
                  <th className="py-3 px-3 w-28 text-right border-r border-theme-border-soft bg-theme-app/50">Amount</th>
                  <th className="py-3 px-1 w-16 text-center bg-theme-app/50"></th>
                </tr>
              </thead>
              <tbody className="bg-theme-surface">
                {state.items.map((item, rowIndex) => (
                  <MemoizedBillRow
                    key={item.id}
                    item={item}
                    rowIndex={rowIndex}
                    isSelected={selectedRows.has(rowIndex)}
                    onUpdateItem={handleUpdateItem}
                    onKeyDown={handleKeyDown}
                    onCopyRow={handleCopyRow}
                    onDeleteRow={handleDeleteRow}
                    onToggleSelection={toggleRowSelection}
                    availableUnits={availableUnits}
                    extraCols={extraCols}
                  />
                ))}
              </tbody>
            </table>
            
            {/* Helper Row when rows are few */}
            {state.items.length > 0 && state.items.length < 5 && (
              <div className="hidden sm:flex items-center justify-center p-3 border-b border-theme-border-soft bg-theme-app/30 animate-in fade-in">
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-4">
                  <span><kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded mr-1">Enter</kbd> Add Row</span>
                  <span><kbd className="px-1.5 py-0.5 bg-theme-surface border border-theme-border-soft rounded mr-1">Tab</kbd> Next Field</span>
                </p>
              </div>
            )}

            {/* Mobile Stacked Cards View */}
            <div className="block sm:hidden divide-y divide-theme-border-soft p-2">
              {state.items.map((item, rowIndex) => (
                <MemoizedMobileBillRow
                  key={item.id}
                  item={item}
                  rowIndex={rowIndex}
                  onUpdateItem={handleUpdateItem}
                  onDeleteRow={handleDeleteRow}
                  availableUnits={availableUnits}
                  customCols={customCols}
                  extraCols={extraCols}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <EditColumnsModal
        isOpen={isEditColumnsOpen}
        onClose={() => setIsEditColumnsOpen(false)}
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

export default ExcelBillTable;

MemoizedBillRow.displayName = 'MemoizedBillRow';
MemoizedMobileBillRow.displayName = 'MemoizedMobileBillRow';