import React from 'react';
import { useInvoice } from '../../../context/InvoiceContext';
import { Wallet, Banknote, CreditCard, Clock } from 'lucide-react';

const SmartPaymentSection = () => {
  const { state, dispatch } = useInvoice();

  const handlePaymentTypeClick = (type) => {
    let amountPaid = 0;
    
    if (type === 'Paid') {
      amountPaid = state.totals.grandTotal;
    } else if (type === 'Unpaid') {
      amountPaid = 0;
    } else if (type === 'Partial') {
      // Don't auto-fill, keep current or let user type
      amountPaid = state.totals.amountPaid || (state.totals.grandTotal / 2);
    } else if (type === 'Advance') {
      amountPaid = state.totals.amountPaid || 500;
    }

    dispatch({
      type: 'UPDATE_TOTALS',
      payload: { amountPaid }
    });
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { paymentStatus: type }
    });
  };

  const paymentOptions = [
    { id: 'Paid', icon: CheckCircleIcon, label: 'Full Paid', color: 'text-theme-success', bg: 'bg-theme-success/10 hover:bg-theme-success/20 border-theme-success/20 hover:border-theme-success' },
    { id: 'Partial', icon: Banknote, label: 'Partial', color: 'text-theme-warning', bg: 'bg-theme-warning/10 hover:bg-theme-warning/20 border-theme-warning/20 hover:border-theme-warning' },
    { id: 'Due', icon: Clock, label: 'Due', color: 'text-theme-danger', bg: 'bg-theme-danger/10 hover:bg-theme-danger/20 border-theme-danger/20 hover:border-theme-danger' }
  ];

  const paymentMethods = ['Cash', 'UPI', 'Bank', 'Card'];

  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-2">Payment Status</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {paymentOptions.map(opt => {
          const Icon = opt.icon;
          const isActive = state.settings.paymentStatus === opt.id || (opt.id === 'Due' && state.settings.paymentStatus === 'Unpaid');
          return (
            <button
              key={opt.id}
              onClick={() => handlePaymentTypeClick(opt.id === 'Due' ? 'Unpaid' : opt.id)}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all ${
                isActive 
                  ? `${opt.bg.split(' ')[0]} ${opt.color} ring-2 ring-current border-transparent shadow-sm` 
                  : `bg-theme-surface border-theme-border-soft text-theme-muted hover:text-theme-primary`
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {opt.label}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-2">Payment Method</p>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {paymentMethods.map(method => (
          <button
            key={method}
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { paymentMethod: method } })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap ${
              state.settings.paymentMethod === method
                ? 'bg-theme-accent/10 border-theme-accent text-theme-accent'
                : 'bg-theme-surface border-theme-border-soft text-theme-muted hover:text-theme-primary'
            }`}
          >
            {method}
          </button>
        ))}
      </div>

      <div className="bg-theme-surface border border-theme-border-soft rounded-xl p-3 flex items-center justify-between">
        <label className="text-xs font-bold text-theme-muted">Amount Received</label>
        <div className="flex items-center">
          <span className="text-theme-muted font-bold mr-2">₹</span>
          <input
            type="number"
            value={state.totals.amountPaid || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              dispatch({ type: 'UPDATE_TOTALS', payload: { amountPaid: val } });
            }}
            className="w-24 bg-transparent border-b border-theme-border-soft focus:border-theme-accent outline-none text-right font-black text-theme-primary text-lg transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

// Extracted simple check icon to avoid heavy imports
function CheckCircleIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

export default SmartPaymentSection;
