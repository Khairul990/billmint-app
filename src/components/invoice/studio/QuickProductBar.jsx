import React from 'react';
import { Plus } from 'lucide-react';
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

  const handleQuickAdd = (prod) => {
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
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mr-2">Quick Add:</span>
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
  );
};

export default QuickProductBar;
