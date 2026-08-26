import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInvoice } from '../../../context/InvoiceContext';
import ProductSearch from '../ProductSearch';
import { getCustomerLabelByType } from '../../../config/businessPresets';

const QuickBillForm = ({ customers, products, onSaveInvoice }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.businessType || 'retail';
  const customerLabel = getCustomerLabelByType(wsType);
  const currencySymbol = businessSettings?.currency || '₹';

  // Customer selection
  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    if (custId) {
      const cust = customers.find(c => c.id === custId);
      if (cust) {
        dispatch({ type: 'SET_CUSTOMER', payload: { id: cust.id, name: cust.name, phone: cust.phone || '', address: cust.address || '', email: cust.email || '' } });
      }
    } else {
      dispatch({ type: 'SET_CUSTOMER', payload: { id: '', name: '', phone: '', address: '', email: '' } });
    }
  };

  const handleCustomerNameChange = (e) => {
    dispatch({ type: 'SET_CUSTOMER', payload: { ...state.customer, name: e.target.value, id: '' } });
  };

  const handleCustomerPhoneChange = (e) => {
    dispatch({ type: 'SET_CUSTOMER', payload: { ...state.customer, phone: e.target.value } });
  };

  // Items
  const handleItemChange = (index, fieldOrUpdates, optionalValue) => {
    const newItems = [...state.items];
    
    if (typeof fieldOrUpdates === 'string') {
        const field = fieldOrUpdates;
        const isNumField = ['rate', 'price', 'mrp', 'qty', 'amount'].includes(field);
        newItems[index][field] = isNumField ? (optionalValue === '' ? '' : (parseFloat(optionalValue) || 0)) : optionalValue;
    } else {
        Object.entries(fieldOrUpdates).forEach(([field, val]) => {
            const isNumField = ['rate', 'price', 'mrp', 'qty', 'amount'].includes(field);
            newItems[index][field] = isNumField ? (val === '' ? '' : (parseFloat(val) || 0)) : val;
        });
    }

    // Auto calculate amount
    const qty = parseFloat(newItems[index].qty) || 1;
    const rate = parseFloat(newItems[index].rate || newItems[index].price || 0);
    newItems[index].amount = qty * rate;

    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const handleAddItem = () => {
    const generateId = () => {
      try {
        return crypto.randomUUID();
      } catch {
        return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    };
    dispatch({ type: 'SET_ITEMS', payload: [...state.items, { id: generateId(), item: '', rate: 0, qty: 1, amount: 0 }] });
  };

  const removeItem = (index) => {
    const newItems = state.items.filter((_, i) => i !== index);
    dispatch({ type: 'SET_ITEMS', payload: newItems });
  };

  const handleSave = (statusOverride) => {
    if (!state.customer.name) {
      toast.error("Please add a customer name");
      return;
    }

    const cleanedItems = state.items.filter(i => i.item || i.rate > 0).map(i => ({
      ...i,
      qty: parseFloat(i.qty) || 1,
      rate: parseFloat(i.rate) || 0,
      amount: (parseFloat(i.qty) || 1) * (parseFloat(i.rate) || 0)
    }));

    if (cleanedItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const payload = {
      ...state,
      items: cleanedItems,
      customerId: state.customer.id || null,
      customerName: state.customer.name,
      customerPhone: state.customer.phone,
      paymentStatus: statusOverride === 'Draft' ? 'Draft' : state.settings.paymentStatus,
      paymentMethod: state.settings.paymentMethod || 'Cash',
      amountPaid: state.totals.amountPaid || 0,
      balanceDue: state.totals.balanceDue || state.totals.grandTotal,
      businessSnapshot: businessSettings,
      paymentSettingsSnapshot: businessSettings,
      regionalSettingsSnapshot: businessSettings
    };

    onSaveInvoice(payload, !state.customer.id, false);
  };

  return (
    <div className="bg-theme-card rounded-2xl border border-theme-border-soft shadow-lg overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-theme-border-soft bg-theme-surface">
        <h2 className="text-lg font-black text-theme-primary">⚡ Quick Bill</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* Customer Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">{customerLabel} Details</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder={customerLabel + ' Name'}
                value={state.customer.name || ''}
                onChange={handleCustomerNameChange}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary"
              />
              {customers.length > 0 && (
                <select 
                  onChange={handleCustomerSelect}
                  className="absolute right-0 top-0 bottom-0 opacity-0 cursor-pointer w-10"
                >
                  <option value="">New {customerLabel}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <input
              type="text"
              placeholder="Phone (Optional)"
              value={state.customer.phone || ''}
              onChange={handleCustomerPhoneChange}
              className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary"
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold text-theme-muted uppercase tracking-wider">Items</label>
          </div>
          
          <div className="space-y-2">
            {state.items.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-start bg-theme-surface p-2 rounded-xl border border-theme-border-soft">
                <div className="flex-1">
                  <ProductSearch 
                    value={item.item || ''}
                    onChange={(val) => handleItemChange(index, 'item', val)}
                    onSelectProduct={(p) => {
                      const updates = { item: p.name || p.productName };
                      if (p.price || p.rate) updates.rate = p.price || p.rate;
                      handleItemChange(index, updates);
                    }}
                    products={products}
                    placeholder="Search or enter item name..."
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.qty === 0 ? '' : item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                    className="w-full px-3 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary"
                  />
                </div>
                <div className="w-28 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted text-xs font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate === 0 ? '' : item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-3 text-theme-danger hover:bg-theme-danger/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-3 border-2 border-dashed border-theme-border-strong hover:border-theme-accent text-theme-muted hover:text-theme-accent rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-theme-border-soft pt-4">
          <div className="flex-1">
             <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-1">Discount</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted text-xs font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={state.totals.discountAmount || ''}
                  onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { discountAmount: parseFloat(e.target.value) || 0 } })}
                  className="w-full pl-7 pr-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary"
                  placeholder="0.00"
                />
             </div>
          </div>
          <div className="flex-1">
             <label className="text-[10px] font-bold text-theme-success uppercase tracking-wider block mb-1">Amount Paid</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-success text-xs font-bold">{currencySymbol}</span>
                <input
                  type="number"
                  value={state.totals.amountPaid || ''}
                  onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { amountPaid: parseFloat(e.target.value) || 0 } })}
                  className="w-full pl-7 pr-3 py-2.5 bg-theme-surface border border-theme-success/30 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-success/50 text-theme-success"
                  placeholder="0.00"
                />
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex-1 max-w-[150px]">
             <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block mb-1">Pay Method</label>
             <select
               value={state.settings.paymentMethod || 'Cash'}
               onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { paymentMethod: e.target.value } })}
               className="w-full px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 text-theme-primary"
             >
               <option value="Cash">Cash</option>
               <option value="Bank Transfer">Bank Transfer</option>
               <option value="UPI / QR">UPI / QR</option>
               <option value="Credit Card">Credit Card</option>
             </select>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Grand Total</p>
             <p className="text-2xl font-black text-theme-primary">{currencySymbol}{state.totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-theme-border-soft bg-theme-surface flex gap-3">
        <button
          onClick={() => handleSave('Draft')}
          className="flex-1 py-3.5 bg-theme-card border border-theme-border-strong hover:bg-theme-border-soft text-theme-primary rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button
          onClick={() => handleSave('Final')}
          className="flex-[2] py-3.5 bg-theme-success text-white hover:opacity-90 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-5 h-5" /> Generate Bill
        </button>
      </div>
    </div>
  );
};

export default QuickBillForm;
