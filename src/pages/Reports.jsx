import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Filter, Download, Printer, PieChart as PieChartIcon, 
  TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle2, 
  AlertCircle, Clock, Users, Package, Wallet, ArrowUpRight,
  WifiOff, BarChart3, AlertTriangle, ChevronRight, Layers, Tag,
  Banknote, ArrowRight, Sparkles, ShieldCheck
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
import { getCustomerLabelByType, getInvoiceLabelByType } from '../config/businessPresets';
import { 
  FinancialValue, 
  FinancialEquation, 
  SignatureSurface, 
  StatusBadge, 
  Badge 
} from '../components/ui';

const CHART_COLORS = {
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  slate: '#64748b',
  accent: '#0B8F78',
  purple: '#8b5cf6',
  blue: '#3b82f6',
  teal: '#14b8a6'
};

/**
 * BillQyro Financial Intelligence & Analytics Command Center
 * Redesigned for Phase 6E (Soft Luxury + Financial Clarity)
 * 
 * Answers the core small-business financial story:
 * REVENUE -> COLLECTION -> OUTSTANDING -> EXPENSES -> PROFIT / CASH FLOW
 */
const Reports = ({ 
  invoices = [], 
  customers = [], 
  products = [], 
  expenses = [], 
  staffs = [],
  businessSettings,
  setCurrentTab = null
}) => {
  const currencySymbol = businessSettings?.currencySymbol || businessSettings?.currency || '₹';
  const activeWorkspaceId = businessSettings?.activeWorkspaceId || 'default';
  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === activeWorkspaceId)?.type || businessSettings?.type || 'retail';
  
  const customerLabel = getCustomerLabelByType(wsType);
  const invoiceLabel = getInvoiceLabelByType(wsType);

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
  const [activeReportTab, setActiveReportTab] = useState('executive'); // 'executive' | 'sales' | 'collections' | 'expenses' | 'customers' | 'inventory' | 'ledger'

  // --- FILTERS STATE ---
  const [dateRange, setDateRange] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [docType, setDocType] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');

  // 1. Filter raw lists strictly by workspace (Workspace Isolation)
  const wsInvoices = useMemo(() => filterByWorkspace(invoices, activeWorkspaceId), [invoices, activeWorkspaceId]);
  const wsCustomers = useMemo(() => filterByWorkspace(customers, activeWorkspaceId), [customers, activeWorkspaceId]);
  const wsProducts = useMemo(() => filterByWorkspace(products, activeWorkspaceId), [products, activeWorkspaceId]);
  const wsExpenses = useMemo(() => filterByWorkspace(expenses, activeWorkspaceId), [expenses, activeWorkspaceId]);

  // 2. Filter by date range
  const dateFilteredInvoices = useMemo(() => {
    return filterByDateRange(wsInvoices, 'date', dateRange, customStart, customEnd);
  }, [wsInvoices, dateRange, customStart, customEnd]);

  const dateFilteredExpenses = useMemo(() => {
    return filterByDateRange(wsExpenses, 'date', dateRange, customStart, customEnd);
  }, [wsExpenses, dateRange, customStart, customEnd]);

  // 3. User-customized filter for document ledger table
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

  // 4. Canonical Financial Calculations Layer (Unmodified math engines)
  const salesSummary = useMemo(() => computeSalesSummary(dateFilteredInvoices), [dateFilteredInvoices]);
  const collectionsSummary = useMemo(() => computeCollectionsSummary(dateFilteredInvoices), [dateFilteredInvoices]);
  const expenseSummary = useMemo(() => computeExpenseSummary(dateFilteredExpenses), [dateFilteredExpenses]);
  const profitLoss = useMemo(() => computeProfitLoss(dateFilteredInvoices, dateFilteredExpenses), [dateFilteredInvoices, dateFilteredExpenses]);
  const customerReport = useMemo(() => computeCustomerReport(dateFilteredInvoices, wsCustomers), [dateFilteredInvoices, wsCustomers]);
  const inventoryReport = useMemo(() => computeInventoryReport(wsProducts, dateFilteredInvoices), [wsProducts, dateFilteredInvoices]);

  // 5. Dual-Dimension Trend Data (Revenue vs Collected)
  const trendData = useMemo(() => {
    const dailyMap = {};
    const sorted = [...dateFilteredInvoices]
      .filter(i => (i.documentType || (i.billType === 'Estimate' ? 'Estimate' : 'Invoice')) === 'Invoice')
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

    sorted.forEach(inv => {
      const d = new Date(inv.date || inv.createdAt);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const billed = parseFloat(inv.grandTotal || inv.total) || 0;
      const paid = getInvoicePaidTotal(inv);
      
      if (!dailyMap[label]) {
        dailyMap[label] = { date: label, billed: 0, collected: 0 };
      }
      dailyMap[label].billed += billed;
      dailyMap[label].collected += paid;
    });

    return Object.values(dailyMap);
  }, [dateFilteredInvoices]);

  // Payment status distribution
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
    if (activeReportTab === 'sales' || activeReportTab === 'ledger' || activeReportTab === 'executive') {
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
      className="page-premium w-full max-w-full pb-28 h-full flex flex-col print-container space-y-6"
    >
      {/* OFFLINE STATUS BANNER */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold px-4 py-2.5 rounded-2xl mb-3 flex items-center gap-2 no-print shadow-xs">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline — presenting stored local business intelligence</span>
        </div>
      )}

      {/* 1. SIGNATURE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="p-2.5 rounded-2xl bg-theme-card hover:bg-theme-surface border border-theme-border-soft transition-all text-theme-primary shadow-2xs no-print"
                aria-label="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">
                Financial Intelligence
              </h1>
              <p className="text-xs font-semibold text-theme-muted mt-0.5">
                See where your money came from, where it went, and what is still to collect
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 no-print flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-theme-card border border-theme-border-soft text-theme-primary font-extrabold text-xs flex items-center gap-2 shadow-2xs hover:bg-theme-surface transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-theme-accent" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-[image:var(--accent-gradient)] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-theme-accent/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* 2. FINANCIAL PERIOD CONTROL & FILTER STRIP */}
      <SignatureSurface variant="neutral" className="p-4 sm:p-5 no-print space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border-soft/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-black text-theme-primary tracking-tight uppercase">
              Financial Reporting Period
            </span>
          </div>
          <span className="text-[11px] font-bold text-theme-muted">
            Analyzing {dateFilteredInvoices.length} bill{dateFilteredInvoices.length !== 1 ? 's' : ''} in selected period
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Period Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scroll-premium">
            {dateOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setDateRange(opt)}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  dateRange === opt 
                    ? 'bg-theme-primary text-theme-app dark:bg-white dark:text-gray-900 shadow-2xs' 
                    : 'bg-theme-surface hover:bg-theme-card border border-theme-border-soft text-theme-muted'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'Custom' && (
            <div className="flex flex-wrap items-end gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted">From Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted">To Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="px-3 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:outline-none focus:border-theme-accent"
                />
              </div>
            </div>
          )}
        </div>
      </SignatureSurface>

      {/* 3. REPORT WORKSPACE SECTION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print text-xs scroll-premium">
        <button
          onClick={() => setActiveReportTab('executive')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'executive'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Executive Story
        </button>

        <button
          onClick={() => setActiveReportTab('sales')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'sales'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Billed Revenue
        </button>

        <button
          onClick={() => setActiveReportTab('collections')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'collections'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Collections & Due
        </button>

        {hasExpenses && (
          <button
            onClick={() => setActiveReportTab('expenses')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'expenses'
                ? 'bg-theme-accent text-white shadow-premium-sm'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" /> Business P&L
          </button>
        )}

        {hasCustomers && (
          <button
            onClick={() => setActiveReportTab('customers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'customers'
                ? 'bg-theme-accent text-white shadow-premium-sm'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> {customerLabel} Intelligence
          </button>
        )}

        {hasProducts && (
          <button
            onClick={() => setActiveReportTab('inventory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
              activeReportTab === 'inventory'
                ? 'bg-theme-accent text-white shadow-premium-sm'
                : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Inventory & Stock
          </button>
        )}

        <button
          onClick={() => setActiveReportTab('ledger')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all cursor-pointer ${
            activeReportTab === 'ledger'
              ? 'bg-theme-accent text-white shadow-premium-sm'
              : 'bg-theme-card hover:bg-theme-surface border border-theme-border-soft text-theme-muted'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Document Ledger
        </button>
      </div>

      {/* PRINT BANNER (Only visible when printing) */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-black">{businessSettings?.businessName || 'BillQyro Business'} — Financial Intelligence Report</h1>
        <p className="text-sm text-gray-600">Period: {dateRange} | Workspace: {activeWorkspaceId} | Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EXECUTIVE FINANCIAL STORY */}
      {/* ========================================================================= */}
      {(activeReportTab === 'executive') && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          
          {/* Connected Financial Story Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Billed Revenue */}
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Billed Revenue
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-theme-surface border border-theme-border-soft text-theme-primary font-numbers">
                  {salesSummary.invoiceCount} bills
                </span>
              </div>
              <FinancialValue 
                value={salesSummary.totalSales} 
                currency={currencySymbol} 
                intent="sales" 
                size="md" 
              />
              <p className="text-[11px] text-theme-muted font-medium mt-1">
                Avg. {formatCurrency(salesSummary.avgInvoiceValue, currencySymbol)} per bill
              </p>
            </SignatureSurface>

            {/* 2. Collected */}
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Collected Cash
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-theme-tint-bg text-theme-accent border border-theme-tint-border font-numbers">
                  {collectionsSummary.collectionRate}% Rate
                </span>
              </div>
              <FinancialValue 
                value={collectionsSummary.totalCollected} 
                currency={currencySymbol} 
                intent="collection" 
                size="md" 
              />
              <p className="text-[11px] text-theme-accent font-bold mt-1">
                {salesSummary.counts.paid} settled in full
              </p>
            </SignatureSurface>

            {/* 3. Money Still to Collect */}
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  Still to Collect
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-numbers">
                  {salesSummary.counts.partial + salesSummary.counts.unpaid} pending
                </span>
              </div>
              <FinancialValue 
                value={salesSummary.totalDue} 
                currency={currencySymbol} 
                intent="balanceDue" 
                size="md" 
              />
              {salesSummary.totalOverdue > 0 && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                  {formatCurrency(salesSummary.totalOverdue, currencySymbol)} overdue
                </p>
              )}
            </SignatureSurface>

            {/* 4. Business Expenses / Profit */}
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                  {hasExpenses ? 'Net Business Profit' : 'Collection Rate'}
                </span>
                {hasExpenses ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    profitLoss.isProfitable ? 'bg-theme-tint-bg text-theme-accent border-theme-tint-border' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}>
                    {profitLoss.profitMargin}% Margin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-theme-surface border border-theme-border-soft text-theme-primary">
                    Health
                  </span>
                )}
              </div>
              {hasExpenses ? (
                <FinancialValue 
                  value={profitLoss.netProfit} 
                  currency={currencySymbol} 
                  intent={profitLoss.isProfitable ? 'collection' : 'expense'} 
                  size="md" 
                />
              ) : (
                <p className="text-2xl font-black text-theme-primary font-numbers">
                  {collectionsSummary.collectionRate}%
                </p>
              )}
              <p className="text-[11px] text-theme-muted font-medium mt-1">
                {hasExpenses ? `${formatCurrency(expenseSummary.totalExpenses, currencySymbol)} overheads` : `${salesSummary.counts.unpaid} unpaid bills`}
              </p>
            </SignatureSurface>
          </div>

          {/* Connected Financial Equations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-theme-accent" />
                Deterministic Business Financial Relationship
              </span>
              <span className="text-[10px] font-bold text-theme-muted">
                Mathematical Parity Verified
              </span>
            </div>

            {/* Equation: Billed = Collected + Outstanding */}
            <FinancialEquation
              oldDue={0}
              currentBill={salesSummary.totalSales}
              totalPayable={salesSummary.totalSales}
              paid={collectionsSummary.totalCollected}
              balanceDue={salesSummary.totalDue}
              currency={currencySymbol}
              size="sm"
            />
          </div>

          {/* Primary Trend Chart: Revenue vs Collected */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SignatureSurface variant="neutral" className="p-5 lg:col-span-2 flex flex-col min-h-[340px]">
              <div className="flex items-center justify-between mb-4 border-b border-theme-border-soft/60 pb-3">
                <div>
                  <h3 className="text-sm font-black text-theme-primary tracking-tight">Business Inflow & Billing Movement</h3>
                  <p className="text-xs text-theme-muted font-medium">Billed revenue vs cash collected over selected period</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-theme-accent">
                    <span className="w-2.5 h-2.5 rounded-full bg-theme-accent"></span> Billed
                  </span>
                  <span className="flex items-center gap-1 text-theme-accent">
                    <span className="w-2.5 h-2.5 rounded-full bg-theme-accent"></span> Collected
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-[260px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent, #0B8F78)" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="var(--accent, #0B8F78)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" opacity={0.5} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} width={55} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderColor: 'var(--border-soft)', 
                          borderRadius: '1rem', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }}
                      />
                      <Area type="monotone" dataKey="billed" stroke="var(--accent, #0B8F78)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBilled)" name="Billed" />
                      <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" name="Collected" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-semibold text-theme-muted">
                    No invoice transactions recorded for this period
                  </div>
                )}
              </div>
            </SignatureSurface>

            {/* Payment Status & Debt Risk Distribution */}
            <SignatureSurface variant="neutral" className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-theme-border-soft/60 pb-3">
                  <h3 className="text-sm font-black text-theme-primary tracking-tight">Debt & Settlement Status</h3>
                  <span className="text-xs font-bold text-theme-muted">{salesSummary.invoiceCount} Bills</span>
                </div>

                <div className="h-44">
                  {paymentStatusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentStatusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {paymentStatusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-soft)', borderRadius: '0.75rem', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-theme-muted">
                      No status data available
                    </div>
                  )}
                </div>
              </div>

              {/* Status Breakdown Pills */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-theme-border-soft/60 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/50">
                  <span className="text-theme-muted font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-theme-accent"></span> Paid
                  </span>
                  <span className="font-black text-theme-primary">{salesSummary.counts.paid}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/50">
                  <span className="text-theme-muted font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Partial
                  </span>
                  <span className="font-black text-theme-primary">{salesSummary.counts.partial}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/50">
                  <span className="text-theme-muted font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span> Unpaid
                  </span>
                  <span className="font-black text-theme-primary">{salesSummary.counts.unpaid}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-theme-surface/70 border border-theme-border-soft/50">
                  <span className="text-theme-muted font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue
                  </span>
                  <span className="font-black text-rose-600">{salesSummary.counts.overdue}</span>
                </div>
              </div>
            </SignatureSurface>
          </div>

          {/* Dedicated "Money Still to Collect" Quick Actions Card */}
          {salesSummary.totalDue > 0 && (
            <SignatureSurface variant="neutral" className="p-5 border-rose-500/20 bg-rose-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-black text-theme-primary">
                      {formatCurrency(salesSummary.totalDue, currencySymbol)} Still Pending Collection
                    </h3>
                  </div>
                  <p className="text-xs text-theme-muted max-w-xl leading-relaxed">
                    Uncollected revenue delays your cash flow. Track specific debtor accounts, send WhatsApp reminders, or collect payments in the Due Ledger.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {setCurrentTab && (
                    <button
                      onClick={() => setCurrentTab('due-ledger')}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Open Due Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </SignatureSurface>
          )}

        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: BILLED REVENUE & SALES */}
      {/* ========================================================================= */}
      {activeReportTab === 'sales' && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Total Sales</span>
                <span className="badge-premium badge-info text-2xs">{salesSummary.invoiceCount} bills</span>
              </div>
              <FinancialValue value={salesSummary.totalSales} currency={currencySymbol} intent="sales" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Collected Revenue</span>
                <span className="badge-premium badge-success text-2xs">{salesSummary.counts.paid} paid</span>
              </div>
              <FinancialValue value={salesSummary.amounts.paid} currency={currencySymbol} intent="collection" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Pending Due</span>
                <span className="badge-premium badge-warning text-2xs">{salesSummary.counts.partial + salesSummary.counts.unpaid} due</span>
              </div>
              <FinancialValue value={salesSummary.totalDue} currency={currencySymbol} intent="balanceDue" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Average Bill Value</span>
              </div>
              <FinancialValue value={salesSummary.avgInvoiceValue} currency={currencySymbol} intent="neutral" size="md" />
            </SignatureSurface>
          </div>

          {/* Daily Trend */}
          <SignatureSurface variant="neutral" className="p-5 flex flex-col min-h-[320px]">
            <div className="section-header mb-4 border-b border-theme-border-soft/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Daily Billed Revenue Trend</h3>
                <p className="text-xs text-theme-muted font-medium">Billed revenue across {salesSummary.invoiceCount} invoices in {dateRange}</p>
              </div>
            </div>
            <div className="flex-1 min-h-[240px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent, #0B8F78)" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="var(--accent, #0B8F78)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" opacity={0.5} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} width={55} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-soft)', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="billed" stroke="var(--accent, #0B8F78)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-theme-muted font-semibold">
                  No sales recorded for this date range
                </div>
              )}
            </div>
          </SignatureSurface>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: COLLECTIONS & DUE */}
      {/* ========================================================================= */}
      {activeReportTab === 'collections' && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Total Invoiced</span>
              </div>
              <FinancialValue value={collectionsSummary.totalInvoiced} currency={currencySymbol} intent="neutral" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Total Collected</span>
                <span className="badge-premium badge-success text-2xs">{collectionsSummary.collectionRate}% Rate</span>
              </div>
              <FinancialValue value={collectionsSummary.totalCollected} currency={currencySymbol} intent="collection" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Outstanding Due</span>
              </div>
              <FinancialValue value={collectionsSummary.totalDue} currency={currencySymbol} intent="balanceDue" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Overdue Amount</span>
              </div>
              <FinancialValue value={salesSummary.totalOverdue} currency={currencySymbol} intent="balanceDue" size="md" />
            </SignatureSurface>
          </div>

          {/* Payment Methods Distribution */}
          <SignatureSurface variant="neutral" className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border-soft/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Collections by Payment Method</h3>
                <p className="text-xs text-theme-muted font-medium">Inflow breakdown across Cash, UPI, Bank Transfer, and other rails</p>
              </div>
            </div>

            {collectionsSummary.paymentMethodBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {collectionsSummary.paymentMethodBreakdown.map((pm) => (
                  <div key={pm.method} className="p-3.5 rounded-2xl bg-theme-surface/70 border border-theme-border-soft/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-theme-primary">{pm.method}</span>
                      <span className="badge-premium badge-info text-2xs">{pm.percentage}%</span>
                    </div>
                    <FinancialValue value={pm.amount} currency={currencySymbol} intent="collection" size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-theme-muted py-6 text-center">No payment transactions recorded for this period.</p>
            )}
          </SignatureSurface>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: PROFIT & LOSS / EXPENSES */}
      {/* ========================================================================= */}
      {activeReportTab === 'expenses' && hasExpenses && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Business Revenue</span>
              </div>
              <FinancialValue value={profitLoss.revenue} currency={currencySymbol} intent="sales" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Operating Expenses</span>
                <span className="badge-premium badge-danger text-2xs">{expenseSummary.expenseCount} entries</span>
              </div>
              <FinancialValue value={profitLoss.expenses} currency={currencySymbol} intent="expense" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Net Profit</span>
                <span className={`badge-premium text-2xs ${profitLoss.isProfitable ? 'badge-success' : 'badge-danger'}`}>
                  {profitLoss.profitMargin}% Margin
                </span>
              </div>
              <FinancialValue 
                value={profitLoss.netProfit} 
                currency={currencySymbol} 
                intent={profitLoss.isProfitable ? 'collection' : 'expense'} 
                size="md" 
              />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Top Expense Area</span>
              </div>
              <p className="text-base font-black text-theme-primary tracking-tight truncate">
                {expenseSummary.highestCategory ? expenseSummary.highestCategory.category : 'N/A'}
              </p>
              {expenseSummary.highestCategory && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {formatCurrency(expenseSummary.highestCategory.amount, currencySymbol)} ({expenseSummary.highestCategory.percentage}%)
                </p>
              )}
            </SignatureSurface>
          </div>

          {/* Expense Category Breakdown */}
          <SignatureSurface variant="neutral" className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border-soft/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Expense Categories Breakdown</h3>
                <p className="text-xs text-theme-muted font-medium">Business operating overheads (strictly isolated from personal drawings)</p>
              </div>
            </div>

            {expenseSummary.categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {expenseSummary.categoryBreakdown.map(cat => (
                  <div key={cat.category} className="p-3.5 rounded-2xl bg-theme-surface/70 border border-theme-border-soft/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-theme-primary truncate">{cat.category}</span>
                      <span className="badge-premium badge-danger text-2xs">{cat.percentage}%</span>
                    </div>
                    <FinancialValue value={cat.amount} currency={currencySymbol} intent="expense" size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-theme-muted py-6 text-center">No expenses recorded for this period.</p>
            )}
          </SignatureSurface>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: CUSTOMER / CLIENT INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeReportTab === 'customers' && hasCustomers && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Active {customerLabel}</span>
              </div>
              <p className="text-2xl font-black text-theme-primary font-numbers">
                {customerReport.totalCustomersWithInvoices}
              </p>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Settled Accounts</span>
                <span className="badge-premium badge-success text-2xs">0 Due</span>
              </div>
              <p className="text-2xl font-black text-theme-accent font-numbers">
                {customerReport.settledCount}
              </p>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Accounts With Due</span>
                <span className="badge-premium badge-warning text-2xs">Pending</span>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-numbers">
                {customerReport.outstandingCount}
              </p>
            </SignatureSurface>
          </div>

          {/* Customer Ranking Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SignatureSurface variant="neutral" className="p-5">
              <div className="flex items-center justify-between mb-4 border-b border-theme-border-soft/60 pb-3">
                <h3 className="text-sm font-black text-theme-primary">Top {customerLabel} by Billed Revenue</h3>
              </div>
              <div className="overflow-x-auto scroll-premium">
                <table className="table-premium w-full text-xs">
                  <thead>
                    <tr>
                      <th>{customerLabel}</th>
                      <th className="text-right">Bills</th>
                      <th className="text-right">Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReport.topByBilling.slice(0, 5).map(c => (
                      <tr key={c.id}>
                        <td className="font-black text-theme-primary truncate max-w-[140px]">{c.name}</td>
                        <td className="text-right font-bold text-theme-muted">{c.invoiceCount}</td>
                        <td className="text-right font-black text-theme-primary">
                          {formatCurrency(c.totalBilled, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                    {customerReport.topByBilling.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-4 text-theme-muted">No customer data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-5">
              <div className="flex items-center justify-between mb-4 border-b border-theme-border-soft/60 pb-3">
                <h3 className="text-sm font-black text-theme-primary">Largest Outstanding Receivables</h3>
              </div>
              <div className="overflow-x-auto scroll-premium">
                <table className="table-premium w-full text-xs">
                  <thead>
                    <tr>
                      <th>{customerLabel}</th>
                      <th className="text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReport.topByDue.slice(0, 5).map(c => (
                      <tr key={c.id}>
                        <td className="font-black text-theme-primary truncate max-w-[140px]">{c.name}</td>
                        <td className="text-right font-black text-rose-600 dark:text-rose-400">
                          {formatCurrency(c.totalDue, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                    {customerReport.topByDue.length === 0 && (
                      <tr><td colSpan="2" className="text-center py-4 text-theme-accent font-bold">All customer accounts settled!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SignatureSurface>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: INVENTORY & STOCK */}
      {/* ========================================================================= */}
      {activeReportTab === 'inventory' && hasProducts && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Total Products</span>
              </div>
              <p className="text-2xl font-black text-theme-primary font-numbers">
                {inventoryReport.totalProducts}
              </p>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Stock Valuation</span>
              </div>
              <FinancialValue value={inventoryReport.totalStockValuation} currency={currencySymbol} intent="neutral" size="md" />
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Low Stock</span>
                <span className="badge-premium badge-warning text-2xs">{inventoryReport.lowStockCount}</span>
              </div>
              <p className="text-2xl font-black text-amber-600 font-numbers">
                {inventoryReport.lowStockCount}
              </p>
            </SignatureSurface>

            <SignatureSurface variant="neutral" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Out of Stock</span>
                <span className="badge-premium badge-danger text-2xs">{inventoryReport.outOfStockCount}</span>
              </div>
              <p className="text-2xl font-black text-rose-600 font-numbers">
                {inventoryReport.outOfStockCount}
              </p>
            </SignatureSurface>
          </div>

          {/* Top Selling Items */}
          <SignatureSurface variant="neutral" className="p-5">
            <div className="flex items-center justify-between mb-4 border-b border-theme-border-soft/60 pb-3">
              <h3 className="text-sm font-black text-theme-primary">Top-Selling Items</h3>
              <p className="text-xs text-theme-muted font-medium">Ranked by revenue contribution in selected period</p>
            </div>
            <div className="overflow-x-auto scroll-premium">
              <table className="table-premium w-full text-xs">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th className="text-right">Quantity Sold</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryReport.bestSellers.map(item => (
                    <tr key={item.name}>
                      <td className="font-bold text-theme-primary">{item.name}</td>
                      <td className="text-right font-bold text-theme-muted tabular-nums">{item.totalQty}</td>
                      <td className="text-right font-black text-theme-accent tabular-nums">
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
          </SignatureSurface>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: DOCUMENT LEDGER */}
      {/* ========================================================================= */}
      {activeReportTab === 'ledger' && (
        <motion.div variants={staggerItem} className="space-y-4">
          
          {/* Filter Bar for Document Ledger */}
          <SignatureSurface variant="neutral" className="p-4 flex flex-wrap items-center gap-4 no-print text-xs">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-theme-muted">Doc Type:</label>
              <div className="flex gap-1">
                {['All', 'Invoice', 'Estimate', 'Quotation'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDocType(opt)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      docType === opt ? 'bg-theme-primary text-white shadow-2xs' : 'bg-theme-surface border border-theme-border-soft text-theme-muted'
                    }`}
                  >
                    {opt === 'All' ? 'All Docs' : opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase text-theme-muted">Payment Status:</label>
              <div className="flex gap-1">
                {['All', 'Paid', 'Partial', 'Unpaid', 'Overdue'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setPaymentStatus(opt)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      paymentStatus === opt ? 'bg-theme-primary text-white shadow-2xs' : 'bg-theme-surface border border-theme-border-soft text-theme-muted'
                    }`}
                  >
                    {opt === 'All' ? 'All Statuses' : opt}
                  </button>
                ))}
              </div>
            </div>
          </SignatureSurface>

          <SignatureSurface variant="neutral" className="overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-theme-border-soft no-print">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Generated Document Ledger</h3>
                <p className="text-xs text-theme-muted font-medium">Detailed financial records matching selected period</p>
              </div>
              <span className="badge-premium badge-info text-2xs font-numbers">{tableData.length} records</span>
            </div>

            <div className="overflow-x-auto scroll-premium">
              <table className="table-premium min-w-[800px] w-full text-xs">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Doc No</th>
                    <th>{customerLabel}</th>
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
                      <td className="whitespace-nowrap font-medium text-theme-muted">
                        {doc.parsedDate.toLocaleDateString()}
                      </td>
                      <td className="font-mono font-bold text-theme-primary whitespace-nowrap">
                        {doc.invoiceNumber || 'N/A'}
                      </td>
                      <td className="truncate max-w-[150px] font-bold text-theme-primary">
                        {doc.customerName || 'Unknown'}
                      </td>
                      <td>
                        <span className="badge-premium badge-info text-2xs uppercase">
                          {doc.parsedType}
                        </span>
                      </td>
                      <td className="text-right font-black text-theme-primary tabular-nums">
                        {formatCurrency(doc.parsedTotal, currencySymbol)}
                      </td>
                      <td className="text-right font-bold text-theme-accent tabular-nums">
                        {formatCurrency(doc.parsedPaid, currencySymbol)}
                      </td>
                      <td className="text-right font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(doc.parsedDue, currencySymbol)}
                      </td>
                      <td className="text-center">
                        <StatusBadge 
                          status={doc.parsedStatus === 'Paid' ? 'paid' : doc.parsedStatus === 'Partial' ? 'partial' : doc.parsedStatus === 'Overdue' ? 'overdue' : 'unpaid'} 
                          customLabel={doc.parsedStatus} 
                          size="sm" 
                        />
                      </td>
                    </tr>
                  ))}
                  {tableData.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center empty-state-text py-8 text-theme-muted">
                        No documents found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SignatureSurface>
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
