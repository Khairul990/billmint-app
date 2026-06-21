import React, { useState, useMemo } from 'react';
import { Clock, Search, CheckCircle2, AlertCircle, CreditCard, ChevronRight, Calendar, X } from 'lucide-react';
import CustomerLedger from '../components/customers/CustomerLedger';

const DueCenter = ({ customers = [], invoices = [], businessSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const currencySymbol = businessSettings?.currency || '₹';

  const formatCurrency = (amount) => {
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `${currencySymbol} ${formattedNum}`;
  };

  const dueBills = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'unpaid' || inv.status === 'partial')
      .map(inv => ({
        ...inv,
        dueAmount: inv.dueAmount || (inv.total || 0) - (inv.amountPaid || 0),
        dueDate: new Date(inv.dueDate || inv.createdAt)
      }))
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [invoices]);

  const grouped = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayOfWeek = now.getDay();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);

    const today = [];
    const thisWeek = [];
    const older = [];

    dueBills.forEach(bill => {
      const due = bill.dueDate;
      if (due <= now) {
        today.push(bill);
      } else if (due <= endOfWeek) {
        thisWeek.push(bill);
      } else {
        older.push(bill);
      }
    });

    return { today, thisWeek, older };
  }, [dueBills]);

  const totalDueToday = useMemo(() => 
    grouped.today.reduce((sum, b) => sum + b.dueAmount, 0)
  , [grouped.today]);

  const filteredToday = grouped.today.filter(b => 
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredThisWeek = grouped.thisWeek.filter(b =>
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOlder = grouped.older.filter(b =>
    b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Section = ({ title, icon: Icon, bills, accent }) => {
    if (bills.length === 0 && !searchQuery) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl ${accent} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-theme-primary">{title}</h3>
            <p className="text-[10px] font-bold text-theme-muted">{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          {bills.map((bill, idx) => (
            <div key={bill.id} className="p-4 bg-theme-card rounded-2xl border border-theme-border-soft active:scale-[0.98] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-theme-primary truncate">{bill.customerName || 'Walk-in Customer'}</p>
                  <p className="text-xs text-theme-muted font-semibold mt-0.5">
                    {bill.invoiceNumber || `#${bill.id?.slice(0, 6)}`} • Due {bill.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-black text-theme-primary">{formatCurrency(bill.dueAmount)}</p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                    bill.status === 'partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {bill.status === 'partial' ? 'Partial' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {bills.length === 0 && searchQuery && (
            <p className="text-xs text-theme-muted font-semibold text-center py-4">No bills match your search</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-theme-primary tracking-tight">Due Center</h2>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mt-0.5">PENDING COLLECTIONS</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-rose-500">{formatCurrency(totalDueToday)}</p>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Due Today</p>
        </div>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer or bill number..."
          className="w-full pl-10 pr-4 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent transition-all text-theme-primary"
        />
      </div>

      <Section title="Due Now / Overdue" icon={AlertCircle} bills={filteredToday} accent="bg-rose-500" />
      <Section title="Due This Week" icon={Calendar} bills={filteredThisWeek} accent="bg-amber-500" />
      <Section title="Upcoming" icon={Clock} bills={filteredOlder} accent="bg-theme-accent" />

      {!searchQuery && grouped.today.length === 0 && grouped.thisWeek.length === 0 && grouped.older.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-theme-primary">All clear!</p>
          <p className="text-xs text-theme-muted font-semibold mt-1">No pending bills due</p>
        </div>
      )}

      <CustomerLedger
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        invoices={invoices}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default DueCenter;
