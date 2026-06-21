import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Filter, Download, Printer, PieChart as PieChartIcon, 
  TrendingUp, DollarSign, FileText, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';

const COLORS = {
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  slate: '#64748b',
  accent: '#14b8a6',
  purple: '#8b5cf6'
};

const Reports = ({ invoices = [], customers = [], businessSettings }) => {
  const currencySymbol = businessSettings?.currency || '₹';

  // --- FILTERS STATE ---
  const [dateRange, setDateRange] = useState('This Month'); // 'All Time', 'Today', 'This Week', 'This Month', 'Custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [docType, setDocType] = useState('All'); // 'All', 'Invoice', 'Estimate', 'Quotation'
  const [paymentStatus, setPaymentStatus] = useState('All'); // 'All', 'Paid', 'Partial', 'Unpaid', 'Overdue'

  // --- HELPER FUNCTIONS ---
  const isDateInRange = (dateString, rangeType, start, end) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    d.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (rangeType === 'All Time') return true;
    if (rangeType === 'Today') {
      return d.getTime() === today.getTime();
    }
    if (rangeType === 'This Week') {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return d >= firstDay && d <= lastDay;
    }
    if (rangeType === 'This Month') {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
    if (rangeType === 'Custom') {
      const s = start ? new Date(start) : null;
      const e = end ? new Date(end) : null;
      if (s && e) return d >= s && d <= e;
      if (s) return d >= s;
      if (e) return d <= e;
      return true;
    }
    return true;
  };

  // --- MEMOIZED DATA PROCESSOR ---
  const { 
    filteredData, 
    metrics, 
    charts 
  } = useMemo(() => {
    // 1. Sanitize & Filter
    const processed = invoices.filter(inv => {
      // Document Type Fallback
      const type = inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice');
      if (docType !== 'All' && type !== docType) return false;

      // Date Filtering
      const targetDate = inv.date || inv.createdAt;
      if (!isDateInRange(targetDate, dateRange, customStart, customEnd)) return false;

      // Payment Status Filtering (Estimates usually don't have payment status, handle gracefully)
      const pStatus = inv.paymentStatus || 'Unpaid';
      if (paymentStatus !== 'All' && pStatus !== paymentStatus) return false;

      return true;
    }).map(inv => {
      const grandTotal = parseFloat(inv.total || inv.grandTotal) || 0;
      let paid = 0;
      if (inv.paymentStatus === 'Paid') paid = grandTotal;
      else paid = parseFloat(inv.amountPaid) || 0;

      return {
        ...inv,
        parsedType: inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice'),
        parsedDate: new Date(inv.date || inv.createdAt),
        parsedTotal: grandTotal,
        parsedPaid: paid,
        parsedDue: Math.max(0, grandTotal - paid),
        parsedStatus: inv.paymentStatus || 'Unpaid'
      };
    }).sort((a, b) => b.parsedDate - a.parsedDate); // Sort newest first

    // 2. Compute Metrics
    const counts = { Invoice: 0, Estimate: 0, Quotation: 0 };
    let totalSales = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let totalOverdue = 0;
    
    // For charts
    const salesByDate = {};
    const salesByCustomer = {};
    const salesByItem = {};
    const statusBreakdown = { Paid: 0, Partial: 0, Unpaid: 0, Overdue: 0 };

    processed.forEach(inv => {
      counts[inv.parsedType] = (counts[inv.parsedType] || 0) + 1;
      
      // We only sum revenue metrics for actual Invoices
      if (inv.parsedType === 'Invoice') {
        totalSales += inv.parsedTotal;
        totalCollected += inv.parsedPaid;
        totalDue += inv.parsedDue;

        if (inv.parsedStatus === 'Overdue') {
          totalOverdue += inv.parsedDue;
        }

        // Status pie chart
        statusBreakdown[inv.parsedStatus] = (statusBreakdown[inv.parsedStatus] || 0) + 1;

        // Area chart by date
        const dateStr = inv.parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        if (!salesByDate[dateStr]) salesByDate[dateStr] = 0;
        salesByDate[dateStr] += inv.parsedTotal;

        // Top Customer
        const custName = inv.customerName || 'Unknown';
        if (!salesByCustomer[custName]) salesByCustomer[custName] = 0;
        salesByCustomer[custName] += inv.parsedTotal;

        // Top Items
        if (inv.items && Array.isArray(inv.items)) {
          inv.items.forEach(item => {
            const name = item.item || item.description || 'Unknown Item';
            const amount = parseFloat(item.amount || (item.qty * item.rate)) || 0;
            if (!salesByItem[name]) salesByItem[name] = 0;
            salesByItem[name] += amount;
          });
        }
      }
    });

    // 3. Format Charts
    const areaChartData = Object.keys(salesByDate).map(date => ({ date, revenue: salesByDate[date] })).reverse();
    
    const topCustomers = Object.keys(salesByCustomer)
      .map(name => ({ name, value: salesByCustomer[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topItems = Object.keys(salesByItem)
      .map(name => ({ name, value: salesByItem[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const pieData = Object.keys(statusBreakdown)
      .filter(k => statusBreakdown[k] > 0)
      .map(k => ({ name: k, value: statusBreakdown[k] }));

    return {
      filteredData: processed,
      metrics: {
        totalSales, totalCollected, totalDue, totalOverdue,
        invoiceCount: counts.Invoice,
        estimateCount: counts.Estimate,
        quotationCount: counts.Quotation,
        avgValue: counts.Invoice > 0 ? (totalSales / counts.Invoice) : 0,
        topCustomer: topCustomers.length > 0 ? topCustomers[0].name : 'N/A',
        topItem: topItems.length > 0 ? topItems[0].name : 'N/A'
      },
      charts: {
        areaChartData,
        topCustomers,
        topItems,
        pieData
      }
    };
  }, [invoices, dateRange, customStart, customEnd, docType, paymentStatus]);

  // --- ACTIONS ---
  const exportCSV = () => {
    if (filteredData.length === 0) return alert("No data to export.");
    
    const escapeCSV = (val) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };
    
    const headers = ['Date', 'Document No', 'Type', 'Customer', 'Total Amount', 'Paid Amount', 'Due Amount', 'Status'];
    const rows = filteredData.map(inv => [
      inv.parsedDate.toLocaleDateString(),
      inv.invoiceNumber || inv.id,
      inv.parsedType,
      inv.customerName || 'Unknown',
      inv.parsedTotal,
      inv.parsedPaid,
      inv.parsedDue,
      inv.parsedStatus
    ]);

    const BOM = '\uFEFF';
    const csvString = BOM + headers.join(',') + '\n' + 
      rows.map(row => row.map(escapeCSV).join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BillQyro_Report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 h-full flex flex-col print-container">
      
      {/* HEADER & FILTERS */}
      <div className="bg-theme-card dark:bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-theme-border-soft">
          <div>
            <h2 className="text-xl font-extrabold text-theme-primary flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-theme-accent" />
              Business Reports
            </h2>
            <p className="text-xs text-theme-muted font-bold uppercase tracking-wider mt-1">ANALYTICS & EXPORTS</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="px-4 py-2 bg-theme-surface hover:bg-theme-surface/80 border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary flex items-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-[image:var(--accent-gradient)] text-white shadow-lg shadow-theme-accent/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Time Period</label>
            <select 
              value={dateRange} 
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>
          
          {dateRange === 'Custom' && (
            <div className="space-y-1.5 flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Start</label>
                <input 
                  type="date" 
                  value={customStart} 
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full px-2 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-[10px] font-bold text-theme-primary focus:border-theme-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">End</label>
                <input 
                  type="date" 
                  value={customEnd} 
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full px-2 py-2 bg-theme-surface border border-theme-border-soft rounded-xl text-[10px] font-bold text-theme-primary focus:border-theme-accent"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Document Type</label>
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)}
              className="w-full px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
            >
              <option value="All">All Documents</option>
              <option value="Invoice">Invoices Only</option>
              <option value="Estimate">Estimates Only</option>
              <option value="Quotation">Quotations Only</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Payment Status</label>
            <select 
              value={paymentStatus} 
              onChange={e => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-theme-surface border border-theme-border-soft rounded-xl text-xs font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRINT HEADER ONLY VISIBLE ON PRINT */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">Business Report - {businessSettings?.businessName}</h1>
        <p className="text-sm">Filter: {dateRange} | Type: {docType} | Status: {paymentStatus}</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3 text-theme-accent" /> Total Billed</span>
          <span className="text-xl font-black text-theme-primary">{formatCurrency(metrics.totalSales, currencySymbol)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Collected</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.totalCollected, currencySymbol)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Pending Due</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(metrics.totalDue, currencySymbol)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-rose-500" /> Overdue</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(metrics.totalOverdue, currencySymbol)}</span>
        </div>
        
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Doc Counts</span>
          <span className="text-sm font-black text-theme-primary">{metrics.invoiceCount} INV | {metrics.estimateCount} EST</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Avg Invoice</span>
          <span className="text-sm font-black text-theme-primary">{formatCurrency(metrics.avgValue, currencySymbol)}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Top Customer</span>
          <span className="text-sm font-black text-theme-primary truncate">{metrics.topCustomer}</span>
        </div>
        <div className="bg-theme-card border border-theme-border-soft rounded-2xl p-4 shadow-sm flex flex-col">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Top Item</span>
          <span className="text-sm font-black text-theme-primary truncate">{metrics.topItem}</span>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Revenue Trend */}
        <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-5 shadow-premium flex flex-col min-h-[300px]">
          <h3 className="text-sm font-extrabold text-theme-primary mb-4">Revenue Trend (Invoices)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.areaChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" opacity={0.5} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} width={50} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border-soft)', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie */}
        <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-5 shadow-premium flex flex-col min-h-[300px]">
          <h3 className="text-sm font-extrabold text-theme-primary mb-4">Payment Status Breakdown</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.pieData.map((entry, index) => {
                    const colors = {
                      'Paid': COLORS.emerald,
                      'Partial': COLORS.amber,
                      'Unpaid': COLORS.slate,
                      'Overdue': COLORS.rose
                    };
                    return <Cell key={`cell-${index}`} fill={colors[entry.name] || COLORS.accent} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border-soft)', borderRadius: '1rem', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-theme-card border border-theme-border-soft rounded-3xl overflow-hidden shadow-premium flex-1">
        <div className="p-5 border-b border-theme-border-soft flex items-center justify-between no-print">
          <h3 className="text-sm font-extrabold text-theme-primary">Generated Report Data</h3>
          <span className="text-xs font-bold text-theme-muted bg-theme-surface px-3 py-1 rounded-full">{filteredData.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-theme-surface border-b border-theme-border-soft text-[10px] text-theme-muted font-bold uppercase tracking-wider">
                <th className="p-4 pl-5">Date</th>
                <th className="p-4">Doc No</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Due</th>
                <th className="p-4 pr-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border-soft">
              {filteredData.map(doc => (
                <tr key={doc.id} className="hover:bg-theme-surface transition-colors">
                  <td className="p-4 pl-5 text-xs font-semibold text-theme-primary whitespace-nowrap">
                    {doc.parsedDate.toLocaleDateString()}
                  </td>
                  <td className="p-4 text-xs font-black text-theme-primary whitespace-nowrap">
                    {doc.invoiceNumber || 'N/A'}
                  </td>
                  <td className="p-4 text-xs font-semibold text-theme-primary truncate max-w-[150px]">
                    {doc.customerName || 'Unknown'}
                  </td>
                  <td className="p-4">
                    <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-theme-accent/10 text-theme-accent">
                      {doc.parsedType}
                    </span>
                  </td>
                  <td className="p-4 text-right text-xs font-black text-theme-primary">
                    {formatCurrency(doc.parsedTotal, currencySymbol)}
                  </td>
                  <td className="p-4 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(doc.parsedPaid, currencySymbol)}
                  </td>
                  <td className="p-4 text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(doc.parsedDue, currencySymbol)}
                  </td>
                  <td className="p-4 pr-5 text-center">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap ${
                      doc.parsedStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50' : 
                      doc.parsedStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50' : 
                      doc.parsedStatus === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50' :
                      'bg-theme-app text-theme-secondary border-theme-border-soft dark:bg-theme-surface/60 dark:text-theme-primary dark:border-theme-border-strong/50'
                    }`}>
                      {doc.parsedStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-sm font-semibold text-theme-muted">
                    No documents found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* GLOBAL PRINT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; }
          .bg-theme-card, .bg-theme-surface { background: transparent !important; border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border: 1px solid #ddd; }
          th, td { border: 1px solid #eee; padding: 8px !important; color: black !important; }
          span { color: black !important; background: transparent !important; border: none !important; }
        }
      `}} />
    </div>
  );
};

export default Reports;
