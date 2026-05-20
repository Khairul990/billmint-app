import React, { useState } from 'react';
import StatCard from '../components/StatCard';
import InvoiceCard from '../components/InvoiceCard';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Hourglass, 
  Users, 
  FileSpreadsheet, 
  ReceiptText, 
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';

/**
 * Premium Dashboard page
 * @param {Array} invoices
 * @param {Array} customers
 * @param {Function} onViewInvoice
 * @param {Function} onEditInvoice
 * @param {Function} onDeleteInvoice
 * @param {Function} onDownloadPDF
 * @param {Function} setCurrentTab
 * @param {Object} businessSettings
 */
const Dashboard = ({ 
  invoices = [], 
  customers = [], 
  onViewInvoice, 
  onEditInvoice, 
  onDeleteInvoice, 
  onDownloadPDF, 
  setCurrentTab,
  businessSettings 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const currencySymbol = businessSettings?.currency || '₹';

  // --- STATS CALCULATIONS ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  
  const paidRevenue = invoices
    .filter(inv => inv.paymentStatus === 'Paid')
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const pendingRevenue = invoices
    .filter(inv => inv.paymentStatus === 'Pending')
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const totalInvoicesCount = invoices.length;
  const totalCustomersCount = customers.length;

  // Filter invoices for local dashboard search
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.paymentStatus.toLowerCase().includes(q)
    );
  });

  // Recent invoices (Max 3)
  const recentInvoices = invoices.slice(-3).reverse();

  return (
    <div className="space-y-6">
      
      {/* 1. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Total Invoiced"
          value={formatCurrency(totalRevenue, currencySymbol)}
          icon={DollarSign}
          trend="+18.4%"
          trendUp={true}
          accentColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Paid Revenue"
          value={formatCurrency(paidRevenue, currencySymbol)}
          icon={TrendingUp}
          trend="+22.1%"
          trendUp={true}
          accentColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Collection"
          value={formatCurrency(pendingRevenue, currencySymbol)}
          icon={Hourglass}
          trend="-3.2%"
          trendUp={false}
          accentColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomersCount}
          icon={Users}
          trend="+5 new"
          trendUp={true}
          accentColor="bg-blue-50 text-blue-600"
        />
      </div>

      {/* 2. DYNAMIC QUICK LAUNCH CTA CARD */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="max-w-xl relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
            Speed Billing
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">
            Instantly Generate a Professional Invoice
          </h2>
          <p className="text-xs md:text-sm text-slate-300 font-medium mt-1 leading-relaxed">
            Prefill details by selecting saved inventory items and customers to compute GST/taxes, and print or download A4 sheets immediately.
          </p>
          
          <button
            onClick={() => setCurrentTab('create-invoice')}
            className="flex items-center gap-2 mt-5 bg-white text-slate-900 font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-md hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* 3. DOUBLE PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Recent Invoices List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight">Recent Invoices</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">LATEST TRANSACTIONS</p>
            </div>
            
            <button
              onClick={() => setCurrentTab('invoices')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-all"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                currencySymbol={currencySymbol}
                onView={onViewInvoice}
                onEdit={onEditInvoice}
                onDelete={onDeleteInvoice}
                onDownload={onDownloadPDF}
              />
            ))}

            {recentInvoices.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100/80 text-center shadow-premium">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">No Invoices Yet</h4>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Start billing by creating your first transactional record!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Global Invoice Lookup */}
        <div className="space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-800 tracking-tight">Global Search</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">QUICK FILTER SEARCH</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Invoice ID, status, client..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
              />
            </div>

            {searchQuery && (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pt-2 border-t border-slate-50">
                {filteredInvoices.map((inv) => (
                  <div 
                    key={inv.id} 
                    onClick={() => onViewInvoice(inv)}
                    className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{inv.customerName}</p>
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      {formatCurrency(inv.grandTotal, currencySymbol)}
                    </span>
                  </div>
                ))}

                {filteredInvoices.length === 0 && (
                  <p className="text-center text-slate-400 font-semibold text-xs py-4">
                    No matching records found.
                  </p>
                )}
              </div>
            )}
            
            {!searchQuery && (
              <div className="text-center py-6 text-slate-400">
                <ReceiptText className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-semibold">Search values persist instantly.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
