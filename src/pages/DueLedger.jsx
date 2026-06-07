import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Users,
  ChevronRight,
  Download
} from 'lucide-react';
import CustomerLedger from '../components/customers/CustomerLedger';

const DueLedger = ({ customers = [], invoices = [], businessSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const currencySymbol = businessSettings?.currency || '₹';

  // Format currency
  const formatCurrency = (amount) => {
    const formattedNum = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `${currencySymbol} ${formattedNum}`;
  };

  // Compute Ledger Data per Customer
  const ledgerData = useMemo(() => {
    let grandTotalDue = 0;
    let grandTotalPaid = 0;
    let grandTotalOverdue = 0;
    let customersWithDue = 0;

    const data = customers.map(cust => {
      const custInvoices = invoices.filter(inv => inv.customerName?.toLowerCase() === cust.name?.toLowerCase());
      let totalBilled = 0;
      let totalPaid = 0;
      let totalOverdue = 0;
      let lastInvoiceDate = null;

      custInvoices.forEach(inv => {
        const billed = parseFloat(inv.grandTotal) || 0;
        let paid = 0;
        
        if (inv.paymentStatus === 'Paid') {
          paid = billed;
        } else {
          paid = parseFloat(inv.amountPaid) || 0;
        }

        totalBilled += billed;
        totalPaid += paid;

        // Check if overdue
        if (inv.paymentStatus === 'Overdue') {
          totalOverdue += Math.max(0, billed - paid);
        }

        // Track latest invoice date
        if (inv.date) {
          const invDate = new Date(inv.date);
          if (!lastInvoiceDate || invDate > lastInvoiceDate) {
            lastInvoiceDate = invDate;
          }
        }
      });

      const totalDue = Math.max(0, totalBilled - totalPaid);
      
      grandTotalDue += totalDue;
      grandTotalPaid += totalPaid;
      grandTotalOverdue += totalOverdue;
      if (totalDue > 0) customersWithDue++;

      let status = 'Clear';
      if (totalOverdue > 0) status = 'Overdue';
      else if (totalDue > 0) status = 'Due';

      return {
        ...cust,
        totalBilled,
        totalPaid,
        totalDue,
        totalOverdue,
        lastInvoiceDate,
        status
      };
    });

    return {
      list: data,
      grandTotalDue,
      grandTotalPaid,
      grandTotalOverdue,
      customersWithDue
    };
  }, [customers, invoices]);

  // Filter
  const filteredList = ledgerData.list.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q));
  }).sort((a, b) => b.totalDue - a.totalDue); // Sort by highest due first

  return (
    <div className="space-y-6 pb-24 h-full flex flex-col">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-theme-primary dark:text-theme-primary tracking-tight">Customer Due Ledger</h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">TRACK PENDING PAYMENTS & BALANCES</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-rose-500" /> Total Market Due</span>
          <span className="text-xl font-black text-theme-primary">{formatCurrency(ledgerData.grandTotalDue)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-rose-500" /> Overdue Amount</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(ledgerData.grandTotalOverdue)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Total Collected</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(ledgerData.grandTotalPaid)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3 text-theme-accent" /> Defaulters</span>
          <span className="text-xl font-black text-theme-primary">{ledgerData.customersWithDue} Customers</span>
        </div>
      </div>

      {/* SEARCH CARD */}
      <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-4 md:p-5 border border-theme-border-soft dark:border-theme-border-soft shadow-premium flex items-center justify-between">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-theme-app dark:bg-theme-surface border border-theme-border-soft dark:border-theme-border-soft/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent focus:bg-theme-card dark:bg-theme-card transition-all text-theme-primary dark:text-theme-primary"
          />
        </div>
      </div>

      {/* Ledger Table / List */}
      <div className="bg-theme-card border border-theme-border-soft rounded-3xl overflow-hidden shadow-premium flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-theme-surface border-b border-theme-border-soft text-xs text-theme-muted font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Customer</th>
                <th className="p-4 text-right">Total Billed</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border-soft">
              {filteredList.map(cust => (
                <tr key={cust.id} className="hover:bg-theme-surface transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-accent-light text-theme-accent font-black flex items-center justify-center shrink-0">
                        {cust.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-theme-primary leading-tight">{cust.name}</p>
                        <p className="text-[10px] font-semibold text-theme-muted mt-0.5">{cust.phone || 'No Phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm font-semibold text-theme-primary">
                    {formatCurrency(cust.totalBilled)}
                  </td>
                  <td className="p-4 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(cust.totalPaid)}
                  </td>
                  <td className="p-4 text-right text-sm font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(cust.totalDue)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                      cust.status === 'Clear' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50' : 
                      cust.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50' :
                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button 
                      onClick={() => setSelectedCustomer(cust)}
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-theme-app border border-theme-border-soft hover:border-theme-accent hover:text-theme-accent text-theme-muted transition-colors active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-sm font-semibold text-theme-muted">
                    No customers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Ledger Modal (Enhanced with Payments) */}
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

export default DueLedger;
