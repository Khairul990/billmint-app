import React, { useState, useMemo, useEffect } from 'react';
import { Users, CreditCard, Clock, Wallet, Search, Plus, CheckCircle2, X, AlertCircle, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { bankEngine } from '../services/bankEngine';
import { paymentEngine } from '../services/paymentEngine';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StaffLedger = ({ 
  staffs = [], 
  invoices = [], 
  bankTransactions = [],
  onRecordStaffPayment = null,
  onOpenCollection = null,
  setCurrentTab = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [liveBankTx, setLiveBankTx] = useState([]);
  const [selectedStaffForPay, setSelectedStaffForPay] = useState(null);
  const [payType, setPayType] = useState('Salary / Wages'); // 'Salary / Wages' | 'Staff Advance'
  const [payAmount, setPayAmount] = useState('');
  const [payAccount, setPayAccount] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load bank ledger reactively
  useEffect(() => {
    let mounted = true;
    const loadLedger = async () => {
      try {
        const state = await bankEngine.getState();
        if (mounted && Array.isArray(state?.ledger)) {
          setLiveBankTx(state.ledger);
        }
      } catch (e) {
        console.warn('StaffLedger bank load notice:', e);
      }
    };
    loadLedger();
    const handleUpdate = () => loadLedger();
    window.addEventListener('billqyro_bank_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('billqyro_bank_updated', handleUpdate);
    };
  }, []);

  const combinedBankTransactions = useMemo(() => {
    return liveBankTx.length > 0 ? liveBankTx : bankTransactions;
  }, [liveBankTx, bankTransactions]);
  
  const staffLedgers = useMemo(() => {
    return staffs.map(staff => {
      const staffBills = invoices.filter(inv => inv.staffId === staff.id);
      let totalEarned = 0;
      staffBills.forEach(inv => {
        totalEarned += (inv.total || inv.grandTotal || 0);
      });

      const staffPayments = combinedBankTransactions.filter(tx => tx.staffId === staff.id && !tx.reversed);
      let totalPaid = 0;
      let totalAdvance = 0;

      staffPayments.forEach(tx => {
        const cat = (tx.category || '').toLowerCase();
        const amt = tx.amountRupees !== undefined ? tx.amountRupees : (tx.amountPaise ? tx.amountPaise / 100 : 0);
        if ((cat.includes('staff payment') || cat.includes('salary') || cat.includes('wages')) && tx.type !== 'moneyIn') {
          totalPaid += amt;
        }
        if (cat.includes('staff advance') && tx.type !== 'moneyIn') {
          totalAdvance += amt;
        }
      });

      const remainingPayable = Math.max(0, totalEarned - totalPaid - totalAdvance);

      return {
        ...staff,
        totalEarned,
        totalPaid,
        totalAdvance,
        remainingPayable
      };
    });
  }, [staffs, invoices, combinedBankTransactions]);

  const filteredStaff = staffLedgers.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').includes(searchTerm)
  );

  const handleOpenPay = (staff, defaultType = 'Salary / Wages') => {
    // If routing shortcut is provided, route directly to Money & Payment Center
    if (onRecordStaffPayment) {
      onRecordStaffPayment({ staff, type: defaultType, paymentType: defaultType });
      return;
    }
    if (onOpenCollection) {
      onOpenCollection({ staff, type: defaultType, paymentType: defaultType });
      return;
    }
    if (setCurrentTab) {
      setCurrentTab('collection-center');
      return;
    }

    // Fallback modal using canonical paymentEngine
    setSelectedStaffForPay(staff);
    setPayType(defaultType);
    setPayAmount(defaultType === 'Salary / Wages' ? (staff.remainingPayable || '') : '');
    setPayNote('');
    setPayAccount('Cash');
  };

  const handleRecordPayout = async (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payout amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentEngine.recordStaffPayment({
        staffId: selectedStaffForPay.id,
        staffName: selectedStaffForPay.name,
        amount,
        paymentType: payType,
        paymentMethod: payAccount,
        note: payNote || `${payType} recorded for ${selectedStaffForPay.name}`
      });
      toast.success(`${payType} of ₹${amount} recorded successfully.`);
      setSelectedStaffForPay(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to record staff payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-theme-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-theme-accent" />
            Staff Ledger
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">Track staff earnings, salary payouts, advances, and remaining balances</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder="Search staff by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-9 bg-theme-surface w-full md:w-72 text-xs"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-2xs uppercase tracking-wider">Total Earned</h3>
          </div>
          <p className="text-2xl font-black text-theme-primary tabular-nums">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.totalEarned, 0))}
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-2xs uppercase tracking-wider">Total Paid</h3>
          </div>
          <p className="text-2xl font-black text-blue-600 tabular-nums">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.totalPaid, 0))}
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-2xs uppercase tracking-wider">Total Advance</h3>
          </div>
          <p className="text-2xl font-black text-amber-600 tabular-nums">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.totalAdvance, 0))}
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-2xs uppercase tracking-wider">Total Payable</h3>
          </div>
          <p className="text-2xl font-black text-rose-600 tabular-nums">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.remainingPayable, 0))}
          </p>
        </div>
      </div>

      {/* Staff Ledger Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-surface/70 text-theme-muted uppercase text-2xs font-bold tracking-wider border-b border-theme-border-soft">
              <tr>
                <th className="p-4">Staff Details</th>
                <th className="p-4 text-right">Earned</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Advance</th>
                <th className="p-4 text-right">Remaining Payable</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border-soft">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-theme-muted">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(staff => (
                  <tr key={staff.id} className="hover:bg-theme-surface/40 transition-colors">
                    <td className="p-4">
                      <div className="font-black text-theme-primary">{staff.name}</div>
                      <div className="text-2xs text-theme-muted font-mono">{staff.phone || 'No phone'}</div>
                    </td>
                    <td className="p-4 text-right font-bold text-theme-primary tabular-nums">
                      {formatCurrency(staff.totalEarned)}
                    </td>
                    <td className="p-4 text-right font-bold text-blue-600 tabular-nums">
                      {formatCurrency(staff.totalPaid)}
                    </td>
                    <td className="p-4 text-right font-bold text-amber-600 tabular-nums">
                      {formatCurrency(staff.totalAdvance)}
                    </td>
                    <td className="p-4 text-right font-black text-rose-600 tabular-nums">
                      {formatCurrency(staff.remainingPayable)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => handleOpenPay(staff, 'Staff Advance')}
                          className="btn-premium-outline !min-h-[30px] px-2.5 py-1 text-2xs"
                        >
                          Advance
                        </button>
                        <button 
                          onClick={() => handleOpenPay(staff, 'Salary / Wages')}
                          className="btn-premium !min-h-[30px] px-3 py-1 text-2xs font-bold"
                        >
                          Settle / Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STAFF PAYOUT MODAL */}
      <AnimatePresence>
        {selectedStaffForPay && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-theme-card max-w-md w-full p-6 rounded-2xl shadow-2xl border border-theme-border-soft"
            >
              <div className="flex items-center justify-between pb-3 border-b border-theme-border-soft mb-4">
                <div>
                  <h3 className="text-base font-black text-theme-primary">
                    Record Staff Payout
                  </h3>
                  <p className="text-2xs text-theme-muted font-bold">Staff: {selectedStaffForPay.name}</p>
                </div>
                <button onClick={() => setSelectedStaffForPay(null)} className="p-1 text-theme-muted hover:text-theme-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayout} className="space-y-3">
                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Payout Category</label>
                  <select 
                    value={payType}
                    onChange={(e) => setPayType(e.target.value)}
                    className="input-premium w-full bg-theme-surface text-xs font-bold"
                  >
                    <option value="Salary / Wages">Salary / Wages (Settlement)</option>
                    <option value="Staff Advance">Staff Advance</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Amount (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="input-premium w-full bg-theme-surface text-sm font-black tabular-nums"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Payment Method / Account</label>
                  <select 
                    value={payAccount}
                    onChange={(e) => setPayAccount(e.target.value)}
                    className="input-premium w-full bg-theme-surface text-xs font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-bold text-theme-muted uppercase block mb-1">Note (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Monthly salary payment"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="input-premium w-full bg-theme-surface text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setSelectedStaffForPay(null)}
                    className="btn-premium-outline flex-1 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !payAmount}
                    className="btn-premium flex-1 py-2 text-xs font-bold"
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm Payout'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffLedger;
