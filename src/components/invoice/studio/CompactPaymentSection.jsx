import { useState } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { CreditCard, Banknote, Landmark, Smartphone } from 'lucide-react';

const CompactPaymentSection = () => {
  const { state, dispatch } = useInvoice();
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const isSignificantChange = (fromStatus, toStatus) => {
    const significant = ['Paid', 'Partial', 'Unpaid', 'Pending'];
    if (fromStatus === toStatus) return false;
    if (!significant.includes(fromStatus) || !significant.includes(toStatus)) return false;
    return true;
  };

  const handlePaymentStatusChange = (status) => {
    const currentStatus = state.settings.paymentStatus;
    if (isSignificantChange(currentStatus, status)) {
      setPendingStatus(status);
      setShowStatusConfirm(true);
      return;
    }
    executeStatusChange(status);
  };

  const executeStatusChange = (status) => {
    const oldStatus = state.settings.paymentStatus;
    let amountPaid = parseFloat(state.totals.amountPaid) || 0;
    const grandTotal = parseFloat(state.totals.grandTotal) || 0;
    if (status === 'Paid') {
      amountPaid = grandTotal;
    } else if (status === 'Unpaid') {
      amountPaid = 0;
    } else if (status === 'Partial') {
      if (amountPaid <= 0 || amountPaid >= grandTotal) {
        amountPaid = Math.floor(grandTotal / 2);
      }
    }

    dispatch({
      type: 'ADD_STATUS_AUDIT',
      payload: { oldStatus, newStatus: status }
    });
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
    <>
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

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowStatusConfirm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-surface border border-theme-border-soft rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-theme-primary leading-tight">Change Payment Status?</h3>
            </div>

            <p className="text-sm font-bold text-theme-muted mb-6">
              Changing status from <span className="text-theme-primary">{state.settings.paymentStatus}</span> to <span className="text-theme-primary">{pendingStatus}</span> will be recorded in the audit history.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  executeStatusChange(pendingStatus);
                  setShowStatusConfirm(false);
                  setPendingStatus(null);
                }}
                className="w-full py-3 bg-theme-accent hover:bg-theme-accent/90 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Confirm Change
              </button>
              <button
                onClick={() => {
                  setShowStatusConfirm(false);
                  setPendingStatus(null);
                }}
                className="w-full py-3 bg-transparent hover:bg-theme-border-soft text-theme-muted hover:text-theme-primary text-sm font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default CompactPaymentSection;
