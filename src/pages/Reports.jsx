import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Filter, Download, Printer, PieChart as PieChartIcon, 
  TrendingUp, DollarSign, FileText, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/invoiceUtils';
import { pageVariants, staggerContainer, staggerItem } from '../utils/animations';

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
  const [dateRange, setDateRange] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [docType, setDocType] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');

  const isDateInRange = (dateString, rangeType, start, end) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

  const { 
    filteredData, 
    metrics, 
    charts 
  } = useMemo(() => {
    const processed = invoices.filter(inv => {
      const type = inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice');
      if (docType !== 'All' && type !== docType) return false;

      const targetDate = inv.date || inv.createdAt;
      if (!isDateInRange(targetDate, dateRange, customStart, customEnd)) return false;

      const pStatus = inv.paymentStatus || 'Unpaid';
      if (paymentStatus !== 'All' && pStatus !== paymentStatus) return false;

      return true;
    }).map(inv => {
      const grandTotal = parseFloat(inv.grandTotal || inv.total) || 0;
      const paid = inv.paymentStatus === 'Paid' 
        ? grandTotal 
        : (parseFloat(inv.amountPaid ?? inv.paidAmount) || 0);

      return {
        ...inv,
        parsedType: inv.documentType || (inv.billType === 'Estimate' ? 'Estimate' : 'Invoice'),
        parsedDate: new Date(inv.date || inv.createdAt),
        parsedTotal: grandTotal,
        parsedPaid: paid,
        parsedDue: Math.max(0, grandTotal - paid),
        parsedStatus: inv.paymentStatus || 'Unpaid'
      };
    }).sort((a, b) => b.parsedDate - a.parsedDate);

    const counts = { Invoice: 0, Estimate: 0, Quotation: 0 };
    let totalSales = 0;
    let totalCollected = 0;
    let totalDue = 0;
    let totalOverdue = 0;
    
    const salesByDate = {};
    const salesByCustomer = {};
    const salesByItem = {};
    const statusBreakdown = { Paid: 0, Partial: 0, Unpaid: 0, Overdue: 0 };

    processed.forEach(inv => {
      counts[inv.parsedType] = (counts[inv.parsedType] || 0) + 1;
      
      if (inv.parsedType === 'Invoice') {
        totalSales += inv.parsedTotal;
        totalCollected += inv.parsedPaid;
        totalDue += inv.parsedDue;

        if (inv.parsedStatus === 'Overdue') {
          totalOverdue += inv.parsedDue;
        }

        statusBreakdown[inv.parsedStatus] = (statusBreakdown[inv.parsedStatus] || 0) + 1;

        const dateStr = inv.parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        if (!salesByDate[dateStr]) salesByDate[dateStr] = 0;
        salesByDate[dateStr] += inv.parsedTotal;

        const custName = inv.customerName || 'Unknown';
        if (!salesByCustomer[custName]) salesByCustomer[custName] = 0;
        salesByCustomer[custName] += inv.parsedTotal;

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

  const exportCSV = () => {
    if (filteredData.length === 0) return toast.error("No data to export.");
    
    const escapeCSV = (val) => {
      const str = String(val ?? '').replace(/\n/g, ' ').replace(/\r/g, ' ');
      return `"${str.replace(/"/g, '""')}"`;
    };
    
    const headers = ['Date', 'Document No', 'Type', 'Customer', 'Total Amount', 'Paid Amount', 'Due Amount', 'Status'];
    const rows = filteredData.map(inv => [
      inv.parsedDate?.toLocaleDateString() || '',
      inv.invoiceNumber || inv.id || '',
      inv.parsedType || '',
      inv.customerName || 'Unknown',
      inv.parsedTotal.toFixed(2),
      inv.parsedPaid.toFixed(2),
      inv.parsedDue.toFixed(2),
      inv.parsedStatus || ''
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

  const dateOptions = ['All Time', 'Today', 'This Week', 'This Month', 'Custom'];
  const docOptions = ['All', 'Invoice', 'Estimate', 'Quotation'];
  const paymentOptions = ['All', 'Paid', 'Partial', 'Unpaid', 'Overdue'];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="page-premium pb-28 h-full flex flex-col print-container"
    >
      {/* HEADER SECTION */}
      <div className="hero-premium section-spacing-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="icon-premium icon-premium-lg">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="hero-premium-title">Business Reports</h1>
                <p className="hero-premium-subtitle">Analytics, metrics & exports for your business</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              variants={staggerItem}
              onClick={exportCSV}
              className="btn-premium-outline text-xs"
            >
              <Download className="w-4 h-4" /> Export CSV
            </motion.button>
            <motion.button
              variants={staggerItem}
              onClick={handlePrint}
              className="btn-premium text-xs"
            >
              <Printer className="w-4 h-4" /> Print Report
            </motion.button>
          </div>
        </div>
      </div>

      {/* PREMIUM FILTER BAR */}
      <motion.div variants={staggerItem} className="card-premium p-4 section-spacing no-print">
        <div className="section-header mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-accent" />
            <h3 className="section-header-title">Filters</h3>
          </div>
          <span className="badge-premium badge-info">{filteredData.length} records</span>
        </div>
        <div className="filter-bar">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Time Period</label>
            <div className="flex flex-wrap gap-1.5">
              {dateOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setDateRange(opt)}
                  className={`filter-chip ${dateRange === opt ? 'active' : ''}`}
                >
                  {opt === 'Custom' && dateRange === 'Custom' ? 'Custom Range' : opt}
                </button>
              ))}
            </div>
          </div>
          {dateRange === 'Custom' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Start</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="input-premium text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">End</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="input-premium text-xs"
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Document Type</label>
            <div className="flex flex-wrap gap-1.5">
              {docOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setDocType(opt)}
                  className={`filter-chip ${docType === opt ? 'active' : ''}`}
                >
                  {opt === 'All' ? 'All Docs' : opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Payment Status</label>
            <div className="flex flex-wrap gap-1.5">
              {paymentOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setPaymentStatus(opt)}
                  className={`filter-chip ${paymentStatus === opt ? 'active' : ''}`}
                >
                  {opt === 'All' ? 'All Statuses' : opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* PRINT HEADER */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">Business Report - {businessSettings?.businessName}</h1>
        <p className="text-sm">Filter: {dateRange} | Type: {docType} | Status: {paymentStatus}</p>
      </div>

      {/* EXPORT / SUMMARY BAR */}
      <motion.div variants={staggerItem} className="card-premium p-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <span className="badge-premium badge-info">{filteredData.length} records</span>
          {metrics.totalSales > 0 && (
            <span className="text-2xs text-theme-muted font-bold">
              Collection: {Math.round((metrics.totalCollected / metrics.totalSales) * 100)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-premium-ghost text-[10px] !min-h-[32px] !px-3">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button onClick={handlePrint} className="btn-premium-ghost text-[10px] !min-h-[32px] !px-3">
            <Printer className="w-3 h-3" /> Print
          </button>
        </div>
      </motion.div>

      {/* PREMIUM STATS GRID */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="stats-grid section-spacing">
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-theme-accent" />
              Total Billed
            </span>
          </div>
          <p className="text-xl font-black text-theme-primary tracking-tight tabular-nums">{formatCurrency(metrics.totalSales, currencySymbol)}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Collected
            </span>
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">{formatCurrency(metrics.totalCollected, currencySymbol)}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Pending Due
            </span>
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">{formatCurrency(metrics.totalDue, currencySymbol)}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              Overdue
            </span>
          </div>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">{formatCurrency(metrics.totalOverdue, currencySymbol)}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Document Counts</span>
            <span className="badge-premium badge-info text-2xs">{metrics.invoiceCount + metrics.estimateCount + metrics.quotationCount} total</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-black text-theme-primary tabular-nums">{metrics.invoiceCount} <span className="text-2xs font-bold text-theme-muted">INV</span></span>
            <span className="text-theme-border-strong">|</span>
            <span className="text-sm font-black text-theme-primary tabular-nums">{metrics.estimateCount} <span className="text-2xs font-bold text-theme-muted">EST</span></span>
            <span className="text-theme-border-strong">|</span>
            <span className="text-sm font-black text-theme-primary tabular-nums">{metrics.quotationCount} <span className="text-2xs font-bold text-theme-muted">QTN</span></span>
          </div>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Average Invoice</span>
            <TrendingUp className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <p className="text-xl font-black text-theme-primary tracking-tight tabular-nums">{formatCurrency(metrics.avgValue, currencySymbol)}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Top Customer</span>
            <span className="badge-premium badge-success text-2xs">Leader</span>
          </div>
          <p className="text-xl font-black text-theme-primary tracking-tight truncate">{metrics.topCustomer}</p>
        </motion.div>
        <motion.div variants={staggerItem} className="stat-premium">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide">Top Item</span>
            <span className="badge-premium badge-info text-2xs">Best Seller</span>
          </div>
          <p className="text-xl font-black text-theme-primary tracking-tight truncate">{metrics.topItem}</p>
        </motion.div>
      </motion.div>

      {/* CHARTS */}
      {invoices.length > 0 && (
        <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-2 gap-4 section-spacing no-print">
          <div className="card-premium p-5 flex flex-col min-h-[320px]">
            <div className="section-header mb-4">
              <div>
                <h3 className="section-header-title">Revenue Trend (Invoices)</h3>
                <p className="section-header-subtitle">Daily revenue over the selected period</p>
              </div>
            </div>
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
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-soft)', borderRadius: '0.75rem', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 25px -3px rgba(7,13,25,0.08)' }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-premium p-5 flex flex-col min-h-[320px]">
            <div className="section-header mb-4">
              <div>
                <h3 className="section-header-title">Payment Status Breakdown</h3>
                <p className="section-header-subtitle">Distribution of invoice payment statuses</p>
              </div>
            </div>
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
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-soft)', borderRadius: '0.75rem', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 10px 25px -3px rgba(7,13,25,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* PREMIUM EMPTY STATE */}
      {invoices.length === 0 && (
        <motion.div variants={staggerItem} className="card-premium no-print">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText className="w-5 h-5" />
            </div>
            <p className="empty-state-title">No data yet</p>
            <p className="empty-state-text">Create invoices to see detailed business reports and analytics</p>
          </div>
        </motion.div>
      )}

      {/* TABLE */}
      {invoices.length > 0 && (
        <motion.div variants={staggerItem} className="card-premium overflow-hidden flex-1">
          <div className="section-header p-5 border-b border-theme-border-soft no-print">
            <div>
              <h3 className="section-header-title">Generated Report Data</h3>
              <p className="section-header-subtitle">Detailed document breakdown for the selected filters</p>
            </div>
            <span className="badge-premium badge-info">{filteredData.length} records</span>
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
                {filteredData.map(doc => (
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
                {filteredData.length === 0 && (
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
      
      {/* BUSINESS TIPS */}
      <motion.div variants={staggerItem} className="card-premium p-4 no-print">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-theme-accent/10 text-theme-accent flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xs font-bold text-theme-muted uppercase tracking-premium-wide mb-1">Tip of the Day</p>
            <p className="text-xs font-semibold text-theme-primary leading-relaxed">
              {[
                'Send invoice reminders 2 days before the due date to improve on-time payment rates.',
                'Offer small discounts for early payments to encourage faster collections.',
                'Review your top-selling items monthly to optimize your inventory and pricing strategy.',
                'Categorize expenses to identify tax-deductible costs and save money at year-end.',
                'Set payment terms clearly on every invoice to avoid confusion and delays.',
                'Follow up on overdue invoices within 24 hours for the best recovery rate.'
              ][Math.floor(Date.now() / 86400000) % 6]}
            </p>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; }
          .bg-theme-card, .bg-theme-surface { background: transparent !important; border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border: 1px solid #ddd; }
          th, td { border: 1px solid #eee; padding: 8px !important; color: black !important; }
          .print-container span:not(.badge-premium):not(.badge):not([class*="badge"]) { color: black !important; background: transparent !important; border: none !important; }
        }
      `}} />
    </motion.div>
  );
};

export default Reports;
