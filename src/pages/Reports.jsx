import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Filter, Download, Printer, PieChart as PieChartIcon, 
  TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle2, 
  AlertCircle, Clock, Users, Package, Wallet, ArrowUpRight,
  WifiOff, BarChart3, AlertTriangle, ChevronRight, Layers, Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/invoiceUtils';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';
import { useFeatureControl } from '../hooks/useFeatureControl';
import {
  computeSalesSummary,
  computeCollectionsSummary,
  computeExpenseSummary,
  computeProfitLoss,
  computeCustomerReport,
  computeInventoryReport,
  filterByDateRange,
  filterByWorkspace,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  calculateCanonicalInvoiceFinancials
} from '../utils/financialCalculations';
import { reportEngine } from '../services/reportEngine';

const CHART_COLORS = {
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  slate: '#64748b',
  accent: '#14b8a6',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  indigo: '#6366f1'
};

const PIE_PALETTE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6', '#ec4899'];

const Reports = ({ 
  invoices = [], 
  customers = [], 
  products = [], 
  expenses = [], 
  staffs = [],
  businessSettings 
}) => {
  const currencySymbol = businessSettings?.currency || '₹';
  const activeWorkspaceId = businessSettings?.activeWorkspaceId || 'default';
  
  // Feature module control
  const { isFeatureEnabled } = useFeatureControl(activeWorkspaceId);
  const hasCustomers = isFeatureEnabled('customer');
  const hasProducts = isFeatureEnabled('product');
  const hasTreasury = isFeatureEnabled('treasury');
  const hasExpenses = isFeatureEnabled('treasury.moneyOut');

  // Offline detection
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- REPORT SECTION TAB ---
  const [activeReportTab, setActiveReportTab] = useState('sales');

  // --- FILTERS STATE ---
  const [dateRange, setDateRange] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [docType, setDocType] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');

  // 1. Filter raw lists strictly by workspace
  const wsInvoices = useMemo(() => filterByWorkspace(invoices, activeWorkspaceId), [invoices, activeWorkspaceId]);
  const wsCustomers = useMemo(() => filterByWorkspace(customers, activeWorkspaceId), [customers, activeWorkspaceId]);
  const wsProducts = useMemo(() => filterByWorkspace(products, activeWorkspaceId), [products, activeWorkspaceId]);
  const wsExpenses = useMemo(() => filterByWorkspace(expenses, activeWorkspaceId), [expenses, activeWorkspaceId]);

  // 2. Filter by date
  const dateFilteredInvoices = useMemo(() => {
    return filterByDateRange(wsInvoices, 'date', dateRange, customStart, customEnd);
  }, [wsInvoices, dateRange, customStart, customEnd]);

  const dateFilteredExpenses = useMemo(() => {
    return filterByDateRange(wsExpenses, 'date', dateRange, customStart, customEnd);
  }, [wsExpenses, dateRange, customStart, customEnd]);

  // 3. User-customized filter for document table
  const tableData = useMemo(() => {
    return dateFilteredInvoices.filter(inv => {
      const type = inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice');
      if (docType !== 'All' && type !== docType) return false;

      const pStatus = inv.paymentStatus || 'Unpaid';
      if (paymentStatus !== 'All' && pStatus !== paymentStatus) return false;

      return true;
    }).map(inv => {
      const fin = calculateCanonicalInvoiceFinancials(inv);
      const grandTotal = fin.currentInvoiceTotal;
      const paid = fin.amountPaid;
      const due = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

      return {
        ...inv,
        parsedType: inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice'),
        parsedDate: new Date(inv.date || inv.createdAt),
        parsedTotal: grandTotal,
        parsedEarlierBalance: fin.previousDue,
        parsedPaid: paid,
        parsedDue: due,
        parsedStatus: fin.paymentStatus
      };
    }).sort((a, b) => b.parsedDate - a.parsedDate);
  }, [dateFilteredInvoices, docType, paymentStatus]);

  // 4. Financial Calculations Layer
  const salesSummary = useMemo(() => computeSalesSummary(dateFilteredInvoices), [dateFilteredInvoices]);
  const collectionsSummary = useMemo(() => computeCollectionsSummary(dateFilteredInvoices), [dateFilteredInvoices]);
  const expenseSummary = useMemo(() => computeExpenseSummary(dateFilteredExpenses), [dateFilteredExpenses]);
  const profitLoss = useMemo(() => computeProfitLoss(dateFilteredInvoices, dateFilteredExpenses), [dateFilteredInvoices, dateFilteredExpenses]);
  const customerReport = useMemo(() => computeCustomerReport(dateFilteredInvoices, wsCustomers), [dateFilteredInvoices, wsCustomers]);
  const inventoryReport = useMemo(() => computeInventoryReport(wsProducts, dateFilteredInvoices), [wsProducts, dateFilteredInvoices]);

  // 5. Chart Data Preparation
  const revenueTrendData = useMemo(() => {
    const dailyMap = {};
    const sorted = [...dateFilteredInvoices]
      .filter(i => (i.documentType || (i.billType === 'Estimate' ? 'Estimate' : 'Invoice')) === 'Invoice')
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

    sorted.forEach(inv => {
      const d = new Date(inv.date || inv.createdAt);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      dailyMap[label] = (dailyMap[label] || 0) + (parseFloat(inv.grandTotal || inv.total) || 0);
    });

    return Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));
  }, [dateFilteredInvoices]);

  const paymentStatusPieData = useMemo(() => {
    return [
      { name: 'Paid', value: salesSummary.counts.paid, color: CHART_COLORS.emerald },
      { name: 'Partial', value: salesSummary.counts.partial, color: CHART_COLORS.amber },
      { name: 'Unpaid', value: salesSummary.counts.unpaid, color: CHART_COLORS.slate },
      { name: 'Overdue', value: salesSummary.counts.overdue, color: CHART_COLORS.rose }
    ].filter(item => item.value > 0);
  }, [salesSummary]);

  // --- EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (activeReportTab === 'sales' || activeReportTab === 'ledger') {
      if (tableData.length === 0) return toast.error("No invoice data to export for selected range.");
      const formatted = tableData.map(doc => ({
        'Date': doc.parsedDate.toLocaleDateString(),
        'Doc No': doc.invoiceNumber || doc.id || 'N/A',
        'Customer': doc.customerName || 'Unknown',
        'Type': doc.parsedType,
        'Total Amount': doc.parsedTotal.toFixed(2),
        'Paid Amount': doc.parsedPaid.toFixed(2),
        'Due Amount': doc.parsedDue.toFixed(2),
        'Status': doc.parsedStatus,
        'Payment Method': doc.paymentMethod || 'Cash'
      }));
      reportEngine.exportToCSV(`BillQyro_Sales_Report_${dateRange.replace(/\s+/g, '_')}`, formatted);
      toast.success("Sales report exported successfully!");
    } else if (activeReportTab === 'expenses') {
      if (dateFilteredExpenses.length === 0) return toast.error("No expenses to export.");
      const formatted = dateFilteredExpenses.map(exp => ({
        'Date': exp.date || exp.createdAt || '',
        'Title': exp.title || exp.description || 'Expense',
        'Category': exp.category || 'General',
        'Amount': (parseFloat(exp.amount) || 0).toFixed(2),
        'Payment Method': exp.paymentMethod || 'Cash',
        'Notes': exp.notes || ''
      }));
      reportEngine.exportToCSV(`BillQyro_Expenses_${dateRange.replace(/\s+/g, '_')}`, formatted);
      toast.success("Expense report exported successfully!");
    } else if (activeReportTab === 'customers') {
      if (customerReport.allCustomerStats.length === 0) return toast.error("No customer records to export.");
      const formatted = customerReport.allCustomerStats.map(c => ({
        'Customer Name': c.name,
        'Phone': c.phone,
        'Total Invoices': c.invoiceCount,
        'Total Billed': c.totalBilled.toFixed(2),
        'Total Paid': c.totalPaid.toFixed(2),
        'Total Due': c.totalDue.toFixed(2)
      }));
      reportEngine.exportToCSV(`BillQyro_Customer_Summary_${dateRange.replace(/\s+/g, '_')}`, formatted);
      toast.success("Customer summary exported successfully!");
    } else if (activeReportTab === 'inventory') {
      if (wsProducts.length === 0) return toast.error("No products to export.");
      const formatted = wsProducts.map(p => ({
        'Product Name': p.name || p.title,
        'Category': p.category || 'General',
        'Stock': p.stock || 0,
        'Selling Price': (parseFloat(p.price || p.rate) || 0).toFixed(2),
        'Cost Price': (parseFloat(p.costPrice || p.purchasePrice || p.price || 0)).toFixed(2),
        'Valuation': ((parseFloat(p.stock) || 0) * (parseFloat(p.price || p.rate) || 0)).toFixed(2)
      }));
      reportEngine.exportToCSV(`BillQyro_Inventory_Report`, formatted);
      toast.success("Inventory report exported successfully!");
    } else {
      // General comprehensive export
      reportEngine.exportInvoices(activeWorkspaceId, dateRange, customStart, customEnd);
      toast.success("Report CSV exported!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const dateOptions = [
    'Today', 
    'Yesterday', 
    'This Week', 
    'This Month', 
    'Last Month', 
    'This Year', 
    'All Time', 
    'Custom'
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="page-premium w-full max-w-full pb-28 h-full flex flex-col print-container"
    >
      {/* OFFLINE STATUS BANNER */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold px-4 py-2.5 rounded-xl mb-3 flex items-center gap-2 no-print shadow-sm">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline — showing saved data from your local device</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="hero-premium section-spacing-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="icon-premium icon-premium-lg">
                <PieChartIcon className="w-5 h-5 text-theme-accent" />
              </div>
              <div>
                <h1 className="hero-premium-title">Reports & Financial Intelligence</h1>
                <p className="hero-premium-subtitle">
                  Deterministic analytics, collections, P&L, and business insights
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <motion.button
              variants={staggerItem}
              onClick={handleExportCSV}
              className="btn-premium-outline text-xs min-h-[40px] px-3.5"
            >
              <Download className="w-4 h-4" /> Export CSV
            </motion.button>
            <motion.button
              variants={staggerItem}
              onClick={handlePrint}
              className="btn-premium text-xs min-h-[40px] px-3.5"
            >
              <Printer className="w-4 h-4" /> Print Report
            </motion.button>
          </div>
        </div>
      </div>

      {/* REPORT TYPE TABS */}
      <div className="flex items-center gap-2 overflow-x-auto scroll-premium pb-2 mb-3 no-print">
        <button
          onClick={() => setActiveReportTab('sales')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] shrink-0 ${
            activeReportTab === 'sales'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-primary'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Sales & Revenue
        </button>

        <button
          onClick={() => setActiveReportTab('collections')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] shrink-0 ${
            activeReportTab === 'collections'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-primary'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Collections & Due
        </button>

        {hasExpenses && (
          <button
            onClick={() => setActiveReportTab('expenses')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] shrink-0 ${
              activeReportTab === 'expenses'
                ? 'bg-theme-accent text-white shadow-premium-sm'
                : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" /> Profit & Loss / Expenses
          </button>
        )}

        {hasCustomers && (
          <button
            onClick={() => setActiveReportTab('customers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] shrink-0 ${
              activeReportTab === 'customers'
                ? 'bg-theme-accent text-white shadow-premium-sm'
                : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Customers Summary
          </button>
        )}

        {hasProducts && (
          <button
            onClick={() => setActiveReportTab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] shrink-0 ${
              activeReportTab === 'inventory'
                ? 'bg-theme-accent text-white shadow-premium-sm'
                : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Inventory & Stock
          </button>
        )}

        <button
          onClick={() => setActiveReportTab('ledger')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] shrink-0 ${
            activeReportTab === 'ledger'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card border border-theme-border-soft text-theme-muted hover:text-theme-primary'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Document Ledger
        </button>
      </div>

      {/* FILTER BAR */}
      <motion.div variants={staggerItem} className="card-premium p-4 section-spacing no-print">
        <div className="section-header mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-accent" />
            <h3 className="section-header-title">Date Period & Filter</h3>
          </div>
          <span className="badge-premium badge-info text-2xs">{dateFilteredInvoices.length} Invoices</span>
        </div>
        
        <div className="filter-bar flex-wrap">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Time Period</label>
            <div className="flex flex-wrap gap-1.5">
              {dateOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setDateRange(opt)}
                  className={`filter-chip min-h-[36px] ${dateRange === opt ? 'active' : ''}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {dateRange === 'Custom' && (
            <div className="flex gap-2 w-full sm:w-auto items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="input-premium text-xs min-h-[36px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="input-premium text-xs min-h-[36px]"
                />
              </div>
            </div>
          )}

          {activeReportTab === 'ledger' && (
            <>
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Document Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Invoice', 'Estimate', 'Quotation'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setDocType(opt)}
                      className={`filter-chip min-h-[36px] ${docType === opt ? 'active' : ''}`}
                    >
                      {opt === 'All' ? 'All Docs' : opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Payment Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Paid', 'Partial', 'Unpaid', 'Overdue'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setPaymentStatus(opt)}
                      className={`filter-chip min-h-[36px] ${paymentStatus === opt ? 'active' : ''}`}
                    >
                      {opt === 'All' ? 'All Statuses' : opt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* PRINT HEADER */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-black">{businessSettings?.businessName || 'Business'} — Financial Report</h1>
        <p className="text-sm text-gray-600">Period: {dateRange} | Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* TAB CONTENT 1: SALES & REVENUE */}
      {activeReportTab === 'sales' && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <div className="stats-grid">
            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-theme-accent" /> Total Sales
                </span>
                <span className="badge-premium badge-info text-2xs">{salesSummary.invoiceCount} bills</span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {formatCurrency(salesSummary.totalSales, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fully Paid
                </span>
                <span className="badge-premium badge-success text-2xs">{salesSummary.counts.paid} paid</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                {formatCurrency(salesSummary.amounts.paid, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Due
                </span>
                <span className="badge-premium badge-warning text-2xs">{salesSummary.counts.partial + salesSummary.counts.unpaid} pending</span>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
                {formatCurrency(salesSummary.totalDue, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-theme-accent" /> Average Invoice
                </span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {formatCurrency(salesSummary.avgInvoiceValue, currencySymbol)}
              </p>
            </motion.div>
          </div>

          {/* REVENUE CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 section-spacing no-print">
            <div className="card-premium p-5 flex flex-col min-h-[320px]">
              <div className="section-header mb-4">
                <div>
                  <h3 className="section-header-title">Sales Trend</h3>
                  <p className="section-header-subtitle">Daily billed revenue over selected period</p>
                </div>
              </div>
              <div className="flex-1 min-h-[240px]">
                {revenueTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" opacity={0.5} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} width={55} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-soft)', borderRadius: '0.75rem', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-semibold text-theme-muted">
                    No invoice transactions for this date range
                  </div>
                )}
              </div>
            </div>

            <div className="card-premium p-5 flex flex-col min-h-[320px]">
              <div className="section-header mb-4">
                <div>
                  <h3 className="section-header-title">Invoice Payment Status</h3>
                  <p className="section-header-subtitle">Distribution of paid vs pending invoices</p>
                </div>
              </div>
              <div className="flex-1 min-h-[240px]">
                {paymentStatusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentStatusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-soft)', borderRadius: '0.75rem', fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-semibold text-theme-muted">
                    No payment status data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 2: COLLECTIONS & DUE */}
      {activeReportTab === 'collections' && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <div className="stats-grid">
            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Total Invoiced</span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {formatCurrency(collectionsSummary.totalInvoiced, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Total Collected
                </span>
                <span className="badge-premium badge-success text-2xs">{collectionsSummary.collectionRate}% Rate</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                {formatCurrency(collectionsSummary.totalCollected, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Outstanding Due
                </span>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
                {formatCurrency(collectionsSummary.totalDue, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Overdue Amount
                </span>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">
                {formatCurrency(salesSummary.totalOverdue, currencySymbol)}
              </p>
            </motion.div>
          </div>

          {/* PAYMENT METHODS BREAKDOWN */}
          <div className="card-premium p-5">
            <div className="section-header mb-4">
              <div>
                <h3 className="section-header-title">Collections by Payment Method</h3>
                <p className="section-header-subtitle">Breakdown of cash, UPI, card, and digital receipts</p>
              </div>
            </div>

            {collectionsSummary.paymentMethodBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {collectionsSummary.paymentMethodBreakdown.map((pm, idx) => (
                  <div key={pm.method} className="p-4 rounded-xl border border-theme-border-soft bg-theme-surface/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-theme-primary">{pm.method}</span>
                      <span className="badge-premium badge-info text-2xs">{pm.percentage}%</span>
                    </div>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(pm.amount, currencySymbol)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-theme-muted py-6 text-center">No payment transactions recorded for this period.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 3: PROFIT & LOSS / EXPENSES */}
      {activeReportTab === 'expenses' && hasExpenses && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <div className="stats-grid">
            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Total Revenue</span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {formatCurrency(profitLoss.revenue, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-rose-500" /> Total Expenses
                </span>
                <span className="badge-premium badge-danger text-2xs">{expenseSummary.expenseCount} entries</span>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">
                {formatCurrency(profitLoss.expenses, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  {profitLoss.isProfitable ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                  Net Profit
                </span>
                <span className={`badge-premium text-2xs ${profitLoss.isProfitable ? 'badge-success' : 'badge-danger'}`}>
                  {profitLoss.profitMargin}% Margin
                </span>
              </div>
              <p className={`text-2xl font-black tracking-tight tabular-nums ${profitLoss.isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(profitLoss.netProfit, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Top Expense Category</span>
              </div>
              <p className="text-xl font-black text-theme-primary tracking-tight truncate">
                {expenseSummary.highestCategory ? expenseSummary.highestCategory.category : 'N/A'}
              </p>
              {expenseSummary.highestCategory && (
                <p className="text-xs font-semibold text-rose-500 mt-1 tabular-nums">
                  {formatCurrency(expenseSummary.highestCategory.amount, currencySymbol)} ({expenseSummary.highestCategory.percentage}%)
                </p>
              )}
            </motion.div>
          </div>

          {/* EXPENSE CATEGORY BREAKDOWN */}
          <div className="card-premium p-5">
            <div className="section-header mb-4">
              <div>
                <h3 className="section-header-title">Expense Categories Breakdown</h3>
                <p className="section-header-subtitle">Overheads and operational spending by category</p>
              </div>
            </div>

            {expenseSummary.categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {expenseSummary.categoryBreakdown.map(cat => (
                  <div key={cat.category} className="p-4 rounded-xl border border-theme-border-soft bg-theme-surface/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-theme-primary">{cat.category}</span>
                      <span className="badge-premium badge-danger text-2xs">{cat.percentage}%</span>
                    </div>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatCurrency(cat.amount, currencySymbol)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-theme-muted py-6 text-center">No expenses recorded for this period.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 4: CUSTOMERS REPORT */}
      {activeReportTab === 'customers' && hasCustomers && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <div className="stats-grid">
            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Active Customers</span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {customerReport.totalCustomersWithInvoices}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Settled Customers</span>
                <span className="badge-premium badge-success text-2xs">0 Due</span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                {customerReport.settledCount}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Outstanding Customers</span>
                <span className="badge-premium badge-warning text-2xs">With Due</span>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
                {customerReport.outstandingCount}
              </p>
            </motion.div>
          </div>

          {/* TOP CUSTOMERS TABLE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card-premium p-5">
              <div className="section-header mb-4">
                <h3 className="section-header-title">Top Customers by Revenue</h3>
              </div>
              <div className="overflow-x-auto scroll-premium">
                <table className="table-premium w-full text-xs">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th className="text-right">Invoices</th>
                      <th className="text-right">Total Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReport.topByBilling.slice(0, 5).map(c => (
                      <tr key={c.id}>
                        <td className="font-bold text-theme-primary truncate max-w-[140px]">{c.name}</td>
                        <td className="text-right tabular-nums">{c.invoiceCount}</td>
                        <td className="text-right font-black text-theme-primary tabular-nums">
                          {formatCurrency(c.totalBilled, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                    {customerReport.topByBilling.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-4 text-theme-muted">No customer data.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-premium p-5">
              <div className="section-header mb-4">
                <h3 className="section-header-title">Top Customers with Pending Due</h3>
              </div>
              <div className="overflow-x-auto scroll-premium">
                <table className="table-premium w-full text-xs">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th className="text-right">Total Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReport.topByDue.slice(0, 5).map(c => (
                      <tr key={c.id}>
                        <td className="font-bold text-theme-primary truncate max-w-[140px]">{c.name}</td>
                        <td className="text-right font-black text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrency(c.totalDue, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                    {customerReport.topByDue.length === 0 && (
                      <tr><td colSpan="2" className="text-center py-4 text-theme-muted">No outstanding dues!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 5: INVENTORY & STOCK */}
      {activeReportTab === 'inventory' && hasProducts && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
          <div className="stats-grid">
            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Total Products</span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {inventoryReport.totalProducts}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Stock Valuation (Cost)</span>
              </div>
              <p className="text-2xl font-black text-theme-primary tracking-tight tabular-nums">
                {formatCurrency(inventoryReport.totalStockValuation, currencySymbol)}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Low Stock Items
                </span>
                <span className="badge-premium badge-warning text-2xs">{inventoryReport.lowStockCount}</span>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
                {inventoryReport.lowStockCount}
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="stat-premium">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Out of Stock
                </span>
                <span className="badge-premium badge-danger text-2xs">{inventoryReport.outOfStockCount}</span>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">
                {inventoryReport.outOfStockCount}
              </p>
            </motion.div>
          </div>

          {/* BEST SELLING ITEMS */}
          <div className="card-premium p-5">
            <div className="section-header mb-4">
              <h3 className="section-header-title">Top-Selling Items</h3>
              <p className="section-header-subtitle">Ranked by revenue generation</p>
            </div>
            <div className="overflow-x-auto scroll-premium">
              <table className="table-premium w-full text-xs">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th className="text-right">Quantity Sold</th>
                    <th className="text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryReport.bestSellers.map(item => (
                    <tr key={item.name}>
                      <td className="font-bold text-theme-primary">{item.name}</td>
                      <td className="text-right tabular-nums">{item.totalQty}</td>
                      <td className="text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(item.totalRevenue, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                  {inventoryReport.bestSellers.length === 0 && (
                    <tr><td colSpan="3" className="text-center py-4 text-theme-muted">No sales items history yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 6: DOCUMENT LEDGER */}
      {activeReportTab === 'ledger' && (
        <motion.div variants={staggerItem} className="card-premium overflow-hidden flex-1">
          <div className="section-header p-5 border-b border-theme-border-soft no-print">
            <div>
              <h3 className="section-header-title">Generated Document Ledger</h3>
              <p className="section-header-subtitle">Detailed records matching selected filter</p>
            </div>
            <span className="badge-premium badge-info text-2xs">{tableData.length} records</span>
          </div>
          <div className="overflow-x-auto scroll-premium">
            <table className="table-premium min-w-[800px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doc No</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Due</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(doc => (
                  <tr key={doc.id}>
                    <td className="whitespace-nowrap">
                      {doc.parsedDate.toLocaleDateString()}
                    </td>
                    <td className="font-black whitespace-nowrap">
                      {doc.invoiceNumber || 'N/A'}
                    </td>
                    <td className="truncate max-w-[150px]">
                      {doc.customerName || 'Unknown'}
                    </td>
                    <td>
                      <span className="badge-premium badge-info text-2xs uppercase">
                        {doc.parsedType}
                      </span>
                    </td>
                    <td className="text-right font-black">
                      {formatCurrency(doc.parsedTotal, currencySymbol)}
                    </td>
                    <td className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(doc.parsedPaid, currencySymbol)}
                    </td>
                    <td className="text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(doc.parsedDue, currencySymbol)}
                    </td>
                    <td className="text-center">
                      <span className={`badge-premium text-2xs uppercase whitespace-nowrap ${
                        doc.parsedStatus === 'Paid' ? 'badge-success' : 
                        doc.parsedStatus === 'Partial' ? 'badge-warning' : 
                        doc.parsedStatus === 'Overdue' ? 'badge-danger' :
                        'badge-info'
                      }`}>
                        {doc.parsedStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center empty-state-text py-8">
                      No documents found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* PRINT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; }
          .bg-theme-card, .bg-theme-surface { background: transparent !important; border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border: 1px solid #ddd; }
          th, td { border: 1px solid #eee; padding: 8px !important; color: black !important; }
        }
      `}} />
    </motion.div>
  );
};

export default Reports;
