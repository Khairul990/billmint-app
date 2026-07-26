import React from 'react';
import { motion } from 'framer-motion';
import { useInvoice } from '../../../../contexts/InvoiceContext';
import { Percent, Banknote, FileText, FileSignature } from 'lucide-react';

const PaymentDiscountStep = () => {
  const { state, dispatch, businessSettings } = useInvoice();
  const { totals, settings } = state;
  const currencySymbol = businessSettings?.currency || '₹';

  const handleTotalChange = (field, value) => {
    dispatch({ type: 'UPDATE_TOTALS', payload: { [field]: value } });
  };

  const handleMetaChange = (field, value) => {
    dispatch({ type: 'UPDATE_META', payload: { [field]: value } });
  };

  const handleSettingChange = (field, value) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [field]: value } });
  };

  return (
    <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-6 shadow-premium h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-theme-primary">Payment & Discount</h2>
        <p className="text-sm text-theme-muted font-medium mt-1">Configure taxes, discounts, and payment terms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Left Column: Math Fields */}
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-theme-surface to-theme-accent/5 rounded-2xl border border-theme-border-soft space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-theme-border-soft">
              <span className="text-sm font-bold text-theme-muted uppercase tracking-wider">Subtotal</span>
              <motion.span 
                key={totals.subtotal}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-lg font-black text-theme-primary"
              >
                {currencySymbol}{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </motion.span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider text-orange-500">Tax (+) %</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                  <input
                    type="number"
                    min="0"
                    value={totals.taxPercentage}
                    onChange={(e) => handleTotalChange('taxPercentage', parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2.5 bg-theme-card border border-orange-200 focus:border-orange-500 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all text-theme-primary text-right"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider text-green-500">Discount (-) {currencySymbol}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-green-500">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={totals.discountAmount}
                    onChange={(e) => handleTotalChange('discountAmount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2.5 bg-theme-card border border-green-200 focus:border-green-500 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all text-theme-primary text-right"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-theme-border-soft">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={state.dueDate || ''}
                onChange={(e) => handleMetaChange('dueDate', e.target.value)}
                className="w-full px-3 py-2.5 bg-theme-card border border-theme-border-soft focus:border-theme-accent rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 transition-all text-theme-primary"
              />
            </div>

            <div className="flex justify-between items-center py-3 border-t border-b border-theme-border-soft">
              <span className="text-sm font-bold text-theme-accent uppercase tracking-wider">Grand Total</span>
              <motion.span 
                key={totals.grandTotal}
                initial={{ scale: 1.2, color: 'var(--accent)' }}
                animate={{ scale: 1, color: 'var(--accent)' }}
                className="text-3xl font-black text-theme-accent drop-shadow-md"
              >
                {currencySymbol}{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </motion.span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Amount Paid ({currencySymbol})</label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-success" />
                <input
                  type="number"
                  min="0"
                  max={totals.grandTotal}
                  value={totals.amountPaid}
                  onChange={(e) => handleTotalChange('amountPaid', parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-4 py-3 bg-theme-success/5 border border-theme-success/20 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-theme-success/30 focus:border-theme-success transition-all text-theme-success text-right"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-bold text-theme-danger uppercase tracking-wider">Balance Due</span>
              <motion.span 
                key={totals.balanceDue}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-xl font-black text-theme-danger"
              >
                {currencySymbol}{totals.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Notes */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Payment Status</label>
              <div className="px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary flex items-center justify-between pointer-events-none">
                <span>{settings.paymentStatus}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  settings.paymentStatus === 'Paid' ? 'bg-theme-success' : 
                  settings.paymentStatus === 'Partial' ? 'bg-theme-warning' : 
                  settings.paymentStatus === 'Overdue' ? 'bg-rose-500' : 'bg-theme-muted'
                }`} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Order Status</label>
              <select
                value={settings.orderStatus}
                onChange={(e) => handleSettingChange('orderStatus', e.target.value)}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary appearance-none"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Payment Method</label>
              <select
                value={settings.paymentMethod || 'Cash'}
                onChange={(e) => handleSettingChange('paymentMethod', e.target.value)}
                className="w-full px-4 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary appearance-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI / QR">UPI / QR</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Payment Note</label>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={settings.paymentNote || ''}
                  onChange={(e) => handleSettingChange('paymentNote', e.target.value)}
                  className="w-full h-full px-3 py-3 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary"
                  placeholder="e.g. Txn ID / Check No"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col min-h-[100px]">
            <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Notes to Customer</label>
            <div className="relative flex-1">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
              <textarea
                value={settings.notes}
                onChange={(e) => handleSettingChange('notes', e.target.value)}
                className="w-full h-full pl-9 pr-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary resize-none"
                placeholder="Thank you for your business!"
              />
            </div>
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col min-h-[120px]">
            <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider">Terms & Conditions</label>
            <div className="relative flex-1">
              <FileSignature className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
              <textarea
                value={settings.terms}
                onChange={(e) => handleSettingChange('terms', e.target.value)}
                className="w-full h-full pl-9 pr-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary resize-none"
                placeholder="Payment is due within 15 days..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDiscountStep;
