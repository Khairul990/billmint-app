import React, { useState } from 'react';
import { Plus, AlertTriangle, ArrowUp } from 'lucide-react';
import { useInvoice } from '../../../contexts/InvoiceContext';

const QuickProductBar = ({ products = [] }) => {
  const { state, dispatch } = useInvoice();

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

  const [duplicatePrompt, setDuplicatePrompt] = useState(null);

  const handleQuickAdd = (prod, forceNew = false) => {
    const prodName = (prod.name || prod.productName || '').trim().toLowerCase();
    
    if (!forceNew) {
      const existingIndex = state.items.findIndex(i => 
        (i.description || i.itemService || '').trim().toLowerCase() === prodName
      );

      if (existingIndex !== -1 && prodName !== '') {
        setDuplicatePrompt({ prod, existingIndex });
        return;
      }
    }

    setDuplicatePrompt(null);
    // Determine if last item is completely empty to overwrite it
    let newItems = [...state.items];
    const lastItem = newItems[newItems.length - 1];
    
    const newItem = {
      id: `item-${Date.now()}`,
      sn: newItems.length + 1,
      description: prod.name || prod.productName,
      qty: 1,
      rate: prod.rate || prod.price || 0,
      unit: prod.unit || 'Piece',
      amount: prod.rate || prod.price || 0
    };

    if (lastItem && !lastItem.description && lastItem.rate === 0) {
      // Overwrite the empty row
      newItem.sn = lastItem.sn;
      newItems[newItems.length - 1] = newItem;
    } else {
      newItems.push(newItem);
    }

    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  return (
    <div className="flex flex-col gap-3 mb-4 relative bg-theme-surface/50 p-3 rounded-xl border border-theme-border-soft">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted min-w-[70px]">Most Used:</span>
        {mostUsed.map((p, idx) => (
          <button
            key={`most-${idx}`}
            onClick={() => handleQuickAdd(p)}
            className="flex flex-col items-start gap-0.5 px-3 py-1.5 bg-theme-app border border-theme-border-soft hover:border-theme-accent hover:shadow-sm rounded-xl text-left transition-all group min-w-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors line-clamp-1">{p.name || p.productName}</span>
              <Plus className="w-3 h-3 text-theme-muted group-hover:text-theme-accent transition-colors opacity-0 group-hover:opacity-100 ml-1 shrink-0" />
            </div>
            <span className="text-[10px] font-black text-theme-muted group-hover:text-theme-accent/80 transition-colors">₹{(p.rate || p.price || 0).toLocaleString()}</span>
          </button>
        ))}
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted min-w-[70px]">Recent:</span>
        {recentUsed.map((p, idx) => (
          <button
            key={`recent-${idx}`}
            onClick={() => handleQuickAdd(p)}
            className="flex flex-col items-start gap-0.5 px-3 py-1.5 bg-theme-app border border-theme-border-soft hover:border-theme-accent hover:shadow-sm rounded-xl text-left transition-all group min-w-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-theme-primary group-hover:text-theme-accent transition-colors line-clamp-1">{p.name || p.productName}</span>
              <Plus className="w-3 h-3 text-theme-muted group-hover:text-theme-accent transition-colors opacity-0 group-hover:opacity-100 ml-1 shrink-0" />
            </div>
            <span className="text-[10px] font-black text-theme-muted group-hover:text-theme-accent/80 transition-colors">₹{(p.rate || p.price || 0).toLocaleString()}</span>
          </button>
        ))}
      </div>

      {duplicatePrompt && (
        <div className="absolute top-full left-0 mt-2 z-20 bg-theme-surface border border-amber-500/30 shadow-2xl rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold">"{duplicatePrompt.prod.name || duplicatePrompt.prod.productName}" already exists.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newItems = [...state.items];
                const q = parseFloat(newItems[duplicatePrompt.existingIndex].qty) || 0;
                newItems[duplicatePrompt.existingIndex].qty = q + 1;
                dispatch({ type: 'SET_ITEMS', payload: newItems });
                setDuplicatePrompt(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" /> Increase Qty
            </button>
            <button
              onClick={() => handleQuickAdd(duplicatePrompt.prod, true)}
              className="px-3 py-1.5 bg-theme-app border border-theme-border-soft hover:bg-theme-border-soft rounded-lg text-xs font-bold text-theme-primary transition-colors"
            >
              + Add as new row
            </button>
            <button 
              onClick={() => setDuplicatePrompt(null)}
              className="px-2 py-1.5 text-theme-muted hover:text-theme-primary text-xs transition-colors ml-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickProductBar;
