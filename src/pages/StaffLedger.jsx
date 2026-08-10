import React, { useState, useMemo } from 'react';
import { Users, CreditCard, Clock, Wallet, Search } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';

const StaffLedger = ({ staffs = [], invoices = [], bankTransactions = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const staffLedgers = useMemo(() => {
    return staffs.map(staff => {
      const staffBills = invoices.filter(inv => inv.staffId === staff.id);
      let totalEarned = 0;
      staffBills.forEach(inv => {
        totalEarned += (inv.total || 0);
      });

      const staffPayments = bankTransactions.filter(tx => tx.staffId === staff.id);
      let totalPaid = 0;
      let totalAdvance = 0;

      staffPayments.forEach(tx => {
        if (tx.category === 'Staff Payment' && tx.direction === 'OUT') {
          totalPaid += (tx.amountRupees || 0);
        }
        if (tx.category === 'Staff Advance' && tx.direction === 'OUT') {
          totalAdvance += (tx.amountRupees || 0);
        }
      });

      const remainingPayable = totalEarned - totalPaid - totalAdvance;

      return {
        ...staff,
        totalEarned,
        totalPaid,
        totalAdvance,
        remainingPayable
      };
    });
  }, [staffs, invoices, bankTransactions]);

  const filteredStaff = staffLedgers.filter(s => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone || '').includes(searchTerm)
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <Users className="w-6 h-6 text-theme-primary" />
            Staff Ledger
          </h1>
          <p className="text-theme-muted mt-1">Track staff earnings, advances, and payments</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-9 bg-theme-surface w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <Wallet className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-sm uppercase">Total Earned</h3>
          </div>
          <p className="text-2xl font-bold text-theme-text">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.totalEarned, 0))}
          </p>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-sm uppercase">Total Paid</h3>
          </div>
          <p className="text-2xl font-bold text-theme-text">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.totalPaid, 0))}
          </p>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-sm uppercase">Total Advance</h3>
          </div>
          <p className="text-2xl font-bold text-theme-text">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.totalAdvance, 0))}
          </p>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center gap-3 mb-2 text-theme-muted">
            <Users className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-sm uppercase">Total Payable</h3>
          </div>
          <p className="text-2xl font-bold text-theme-text">
            {formatCurrency(staffLedgers.reduce((sum, s) => sum + s.remainingPayable, 0))}
          </p>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-theme-border/50 text-theme-muted uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Staff Details</th>
                <th className="p-4 text-right">Earned</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Advance</th>
                <th className="p-4 text-right">Remaining Payable</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-theme-muted">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(staff => (
                  <tr key={staff.id} className="hover:bg-theme-border/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-theme-text">{staff.name}</div>
                      <div className="text-xs text-theme-muted">{staff.phone}</div>
                    </td>
                    <td className="p-4 text-right font-medium text-theme-text">
                      {formatCurrency(staff.totalEarned)}
                    </td>
                    <td className="p-4 text-right font-medium text-blue-500">
                      {formatCurrency(staff.totalPaid)}
                    </td>
                    <td className="p-4 text-right font-medium text-orange-500">
                      {formatCurrency(staff.totalAdvance)}
                    </td>
                    <td className="p-4 text-right font-bold text-red-500">
                      {formatCurrency(staff.remainingPayable)}
                    </td>
                    <td className="p-4 text-right">
                      {/* Placeholder for Pay Action, this will trigger the Bank Modal when integrated */}
                      <button className="text-xs px-3 py-1.5 bg-theme-primary/10 text-theme-primary font-bold rounded hover:bg-theme-primary/20 transition-colors">
                        Settle / Pay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffLedger;
