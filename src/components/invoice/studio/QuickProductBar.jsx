import React, { useState } from 'react';
import { Plus, AlertTriangle, ArrowUp } from 'lucide-react';
import { useInvoice } from '../../../contexts/InvoiceContext';

const QuickProductBar = ({ products = [] }) => {
  const { state, dispatch } = useInvoice();

  // If no products available, mock some common ones or return null
  const defaultQuickPills = [
    { name: 'Shirt Stitching', rate: 450, unit: 'Piece' },
    { name: 'Pant Stitching', rate: 500, unit: 'Piece' },
    { name: 'Embroidery Design', rate: 800, unit: 'Design' },
    { name: 'Logo Stitch', rate: 250, unit: 'Piece' },
    { name: 'Alteration', rate: 100, unit: 'Piece' },
    { name: 'Doctor Visit', rate: 500, unit: 'Service' },
    { name: 'Tuition Fee', rate: 1000, unit: 'Service' }
  ];

  // Use predefined default products unless the user specifically configured custom products
  const topProducts = products.length > 0 ? products.slice(0, 7) : defaultQuickPills;

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
    <div className="flex flex-col gap-2 mb-4 relative">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mr-2">Quick Add / Recent:</span>
        {topProducts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickAdd(p)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-app border border-theme-border-soft hover:border-theme-accent hover:bg-theme-accent/5 hover:text-theme-accent rounded-full text-xs font-bold text-theme-primary transition-all shadow-sm"
          >
            <Plus className="w-3 h-3" /> {p.name || p.productName}
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
