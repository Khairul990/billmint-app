import React from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { CreditCard, Banknote, Landmark, Smartphone, CheckCircle2, Circle } from 'lucide-react';

const CompactPaymentSection = () => {
  const { state, dispatch } = useInvoice();

  const handlePaymentStatusChange = (status) => {
    let amountPaid = parseFloat(state.totals.amountPaid) || 0;
    const grandTotal = parseFloat(state.totals.grandTotal) || 0;
    if (status === 'Paid') {
      amountPaid = grandTotal;
    } else if (status === 'Unpaid') {
      amountPaid = 0;
    } else if (status === 'Partial') {
      // Keep existing amountPaid if it's between 0 and grandTotal, else set to halfway
      if (amountPaid <= 0 || amountPaid >= grandTotal) {
        amountPaid = Math.floor(grandTotal / 2);
      }
    }

    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { paymentStatus: status, amountPaid }
    });
    dispatch({ type: 'UPDATE_TOTALS', payload: { amountPaid } });
  };

  const handlePaymentMethodChange = (method) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { paymentMethod: method }
    });
  };

  const methods = [
    { id: 'Cash', icon: Banknote },
    { id: 'UPI', icon: Smartphone },
    { id: 'Bank Transfer', icon: Landmark },
    { id: 'Card', icon: CreditCard }
  ];

  const statuses = [
    { id: 'Paid', label: 'Full Paid', style: 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm' },
    { id: 'Partial', label: 'Partial', style: 'bg-amber-500/10 border-amber-500 text-amber-600 shadow-sm' },
    { id: 'Unpaid', label: 'Due', style: 'bg-rose-500/10 border-rose-500 text-rose-600 shadow-sm' }
  ];

  return (
    <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
        
        {/* Payment Status Cards */}
        <div className="flex-1">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-2">Payment Status</h3>
          <div className="flex gap-2">
            {statuses.map(status => (
              <button
                key={status.id}
                onClick={() => handlePaymentStatusChange(status.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  state.settings.paymentStatus === status.id
                    ? status.style
                    : 'bg-theme-app border-theme-border-soft text-theme-muted hover:border-theme-muted hover:text-theme-primary'
                }`}
              >
                {state.settings.paymentStatus === status.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[1px] lg:w-[1px] lg:h-12 bg-theme-border-soft hidden lg:block"></div>

        {/* Payment Method */}
        <div className="flex-1">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-2">Payment Method</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {methods.map(method => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodChange(method.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    state.settings.paymentMethod === method.id
                      ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                      : 'bg-theme-app border-theme-border-soft text-theme-muted hover:border-theme-muted hover:text-theme-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {method.id === 'Bank Transfer' ? 'Bank' : method.id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full h-[1px] lg:w-[1px] lg:h-12 bg-theme-border-soft hidden lg:block"></div>

        {/* Amount Received Input */}
        <div className="flex-[0.8]">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-2">Amount Received</h3>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-theme-muted font-black text-sm">₹</span>
            </div>
            <input
              type="number"
              value={state.totals.amountPaid || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                dispatch({ type: 'UPDATE_TOTALS', payload: { amountPaid: val } });
                
                // Auto-update status based on manual input
                if (val >= state.totals.grandTotal && state.totals.grandTotal > 0) {
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { paymentStatus: 'Paid' } });
                } else if (val > 0 && val < state.totals.grandTotal) {
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { paymentStatus: 'Partial' } });
                } else if (val === 0) {
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { paymentStatus: 'Unpaid' } });
                }
              }}
              placeholder="0.00"
              className="w-full bg-theme-app border border-theme-border-soft focus:border-theme-accent outline-none rounded-xl py-2 pl-7 pr-3 text-sm font-black text-theme-primary transition-colors"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompactPaymentSection;
