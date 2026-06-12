import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-hot-toast';
import StatCard from '../components/StatCard';
import InvoiceCard from '../components/InvoiceCard';
import NewUserGuide from '../components/NewUserGuide';
import SetupProgress from '../components/SetupProgress';
import {
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Hourglass,
  Users,
  FileSpreadsheet,
  ReceiptText,
  LayoutDashboard,
  ArrowRight,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Activity,
  Shield,
  HardDrive,
  FileDown,
  Download,
  Clock,
  Sparkles,
  FileText,
  PieChart as PieChartIcon,
  Rocket,
  Check,
  Megaphone,
  Zap,
  Smartphone,
  Bell
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { firebaseReady } from '../services/firebaseConfig';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore, getInvoices, getCustomers, getExpenses, getSettings } from '../services/dbEngine';
import { t } from '../utils/i18n';

/**
 * High-End SaaS Dashboard with SVG Charts & WhatsApp Reminders
 */
const Dashboard = ({
  invoices = [],
  customers = [],
  products = [],
  expenses = [],
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDownloadPDF,
  setCurrentTab,
  businessSettings,
  installPromptEvent = null,
  isAppInstalled = false,
  onInstallApp,
  subscription = {},
  onQuickBillOpen,
  pendingPaymentsCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const currencySymbol = businessSettings?.currency || '₹';
  const businessName = businessSettings?.businessName || 'BillQyro Embroidery';
  const isNewUser = invoices.length === 0 && customers.length === 0 && !businessSettings?.businessName;

  // --- STATS CALCULATIONS (Accurate SaaS Math) ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const totalCustomersCount = customers.length;

  // --- TODAY'S QUICK SUMMARY ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysInvoices = invoices.filter(inv => inv.date === todayStr);
  const todayBills = todaysInvoices.length;
  const todayRevenue = todaysInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const todayCollection = todaysInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const todayDue = todaysInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  // Filter invoices for local dashboard search
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return (
      (inv.invoiceNumber || '').toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      (inv.paymentStatus && inv.paymentStatus.toLowerCase().includes(q))
    );
  });

  // Recent invoices (Max 5 for mobile, 3 desktop) – show 5 universally for simplicity
  const recentInvoices = invoices.slice(-5).reverse();

  // Outstanding unpaid invoices for WhatsApp reminders
  const unpaidInvoices = invoices.filter(inv => inv.balanceDue > 0);

  // --- 6-MONTH CHART DATA AGGREGATION ---
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    // Get last 6 rolling months (chronological order)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('default', { month: 'short' }),
        revenue: 0,
        expenses: 0
      });
    }

    invoices.forEach(inv => {
      if (!inv.date) return;
      const invMonthKey = inv.date.substring(0, 7); // "YYYY-MM"
      const match = months.find(m => m.key === invMonthKey);
      if (match) {
        match.revenue += (inv.grandTotal || 0);
      }
    });

    expenses.forEach(exp => {
      if (!exp.date) return;
      const expMonthKey = exp.date.substring(0, 7);
      const match = months.find(m => m.key === expMonthKey);
      if (match) {
        match.expenses += parseFloat(exp.amount || 0);
      }
    });

    return months;
  };

  const monthlyData = getMonthlyData();

  // --- DYNAMIC BUSINESS LABELS ---
  const getLabels = () => {
    const type = businessSettings?.businessType;
    if (type === 'Doctor / Clinic') return { clients: 'Patients', invoices: 'Bills', items: 'Services', due: 'Pending Balance' };
    if (type === 'Teacher / Tuition') return { clients: 'Students', invoices: 'Fee Receipts', items: 'Courses', due: 'Due Fees' };
    if (type === 'Tailor / Fashion' || type === 'Embroidery / Designer') return { clients: 'Customers', invoices: 'Order Slips', items: 'Designs', due: 'Due Payment' };
    return { clients: 'Customers', invoices: 'Invoices', items: 'Products/Services', due: 'Pending Due' };
  };
  const labels = getLabels();

  // --- TOP CUSTOMERS ---
  const getTopCustomers = () => {
    const customerTotals = {};
    invoices.forEach(inv => {
      const name = inv.customerName || 'Unknown';
      customerTotals[name] = (customerTotals[name] || 0) + (parseFloat(inv.grandTotal) || 0);
    });

    return Object.keys(customerTotals)
      .map(name => ({ name, value: customerTotals[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };
  const topCustomersData = getTopCustomers();
  const PIE_COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  // --- BEST SELLING ITEMS ---
  const getBestSellingItems = () => {
    const itemTotals = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const name = item.description || item.productName || item.serviceName || item.itemService || 'Unknown Item';
        const qty = parseFloat(item.qty) || 1;
        itemTotals[name] = (itemTotals[name] || 0) + qty;
      });
    });

    return Object.keys(itemTotals)
      .map(name => ({ name, qty: itemTotals[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  };
  const bestSellingItems = getBestSellingItems();

  // --- WHATSAPP REMINDER DISPATCHER ---
  const sendWhatsAppReminder = (invoice) => {
    const phone = invoice.customerPhone || '';
    if (!phone) {
      toast.error('This customer does not have a saved phone number. Please edit their details in the CRM.');
      return;
    }

    const businessPrefs = invoice.businessSnapshot || { businessName };
    const regionalPrefs = invoice.regionalSettingsSnapshot || {
      currency: currencySymbol,
      numberFormat: businessSettings?.numberFormat || 'Indian'
    };

    const activeSymbol = regionalPrefs.currency || currencySymbol;
    const activeNumberFormat = regionalPrefs.numberFormat || 'Indian';
    const activeBusinessName = businessPrefs.businessName || businessName;

    const totalStr = formatCurrency(invoice.grandTotal, activeSymbol, activeNumberFormat);
    const paidStr = formatCurrency(invoice.amountPaid || 0, activeSymbol, activeNumberFormat);
    const dueStr = formatCurrency(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.grandTotal - (invoice.amountPaid || 0)), activeSymbol, activeNumberFormat);

    const msg = `Hello *${invoice.customerName}*,\n\nThis is a friendly payment reminder from *${activeBusinessName}* regarding Invoice *${invoice.invoiceNumber}* (issued on ${invoice.date}).\n\n* Invoice Total: ${totalStr}\n* Amount Paid: ${paidStr}\n* Outstanding Balance: *${dueStr}*\n* Payment Due Date: *${invoice.dueDate || 'N/A'}*\n\nPlease complete payment at your earliest convenience. Thank you for your business!\n\nBest regards,\n${activeBusinessName}`;

    // Clean phone number of spaces or symbols
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- BILLING TEMPLATE INFO ---
  const getTemplateInfo = (tpl) => {
    switch (tpl) {
      case 'embroidery': return { name: 'Embroidery / Fashion', fields: 'Design No, Work Type, Size, Quantity, Rate, Amount' };
      case 'grocery': return { name: 'Grocery / Mudi Shop', fields: 'Product Name, Unit, Quantity, Unit Price, Amount' };
      case 'repair': return { name: 'Repair / Service', fields: 'Service Name, Problem Details, Parts Cost, Labour Charge, Quantity, Amount' };
      case 'retail': return { name: 'Retail / Shopping', fields: 'Product Name, Category, Size/Variant, Quantity, Price, Discount, Amount' };
      case 'custom': return { name: 'Custom Bill', fields: 'Item/Service, Description, Quantity, Rate, Amount' };
      default: return null;
    }
  };
  const tplInfo = getTemplateInfo(businessSettings?.defaultBillingTemplate);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const handleRefresh = async () => {
    await syncFromFirestore();
    window.dispatchEvent(new Event('billqyro_sync'));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <motion.div
        className="space-y-8 pb-32 md:pb-24 max-w-[1600px] w-full mx-auto px-4 lg:px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* PAYMENT PROOFS ALERT BANNER */}
        {pendingPaymentsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setCurrentTab('pending-payments')}
            className="bg-theme-danger/10 border border-theme-danger/30 rounded-2xl p-4 flex items-center justify-between shadow-premium cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-theme-danger text-white flex items-center justify-center animate-pulse shadow-premium shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-theme-danger font-bold text-sm">Review Required</h3>
                <p className="text-theme-danger/80 text-xs font-semibold">
                  You have <span className="font-black text-theme-danger">{pendingPaymentsCount}</span> pending payment proofs to verify.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-theme-danger shrink-0" />
          </motion.div>
        )}

        {/* 1. TOP HERO SUMMARY CARD */}
        <div className="bg-gradient-to-br from-theme-accent to-theme-accent-dark rounded-3xl p-6 md:p-10 shadow-premium text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">{businessName}</h1>
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                  {businessSettings?.activeWorkspaceName || 'Main Workspace'}
                </span>
              </div>
              <p className="text-sm md:text-base font-semibold text-white/80 max-w-xl">
                {t('welcome')}, {businessSettings?.ownerName || 'Admin'}. Here is your financial overview for today.
              </p>
            </div>
            
            <div className="flex items-center gap-6 bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Today's Revenue</p>
                <p className="text-2xl font-black">{formatCurrency(todayRevenue, currencySymbol)}</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Pending Due</p>
                <p className="text-2xl font-black text-amber-300">{formatCurrency(todayDue, currencySymbol)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. QUICK ACTIONS (2x2 Mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('billing')) && (
            <button
              onClick={() => setCurrentTab('create')}
              className="flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-theme-accent to-theme-accent-dark text-white rounded-xl shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium text-center">Create {labels.invoices}</span>
            </button>
          )}
          {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('customers') || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('patients') || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('students') || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('clients')) && (
            <button
              onClick={() => setCurrentTab('customers')}
              className="flex flex-col items-center justify-center p-4 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl shadow-sm hover:bg-theme-app transition-colors"
            >
              <Users className="w-6 h-6 mb-1 text-theme-primary" />
              <span className="text-xs font-medium text-theme-primary text-center">
                Add {labels.clients}
              </span>
            </button>
          )}
          {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('products')) && (
            <button
              onClick={() => setCurrentTab('products')}
              className="flex flex-col items-center justify-center p-4 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl shadow-sm hover:bg-theme-app transition-colors"
            >
              <FileSpreadsheet className="w-6 h-6 mb-1 text-theme-primary" />
              <span className="text-xs font-medium text-theme-primary text-center">Add {labels.items}</span>
            </button>
          )}
          {(!businessSettings?.businessWorkspaces?.length || businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.enabledModules?.includes('paymentProofs')) && (
            <button
              onClick={() => setCurrentTab('pending-payments')}
              className="flex flex-col items-center justify-center p-4 bg-theme-card dark:bg-theme-card border border-theme-border-soft rounded-xl shadow-sm hover:bg-theme-app transition-colors"
            >
              <Bell className="w-6 h-6 mb-1 text-theme-primary" />
              <span className="text-xs font-medium text-theme-primary text-center">Collect Payment</span>
            </button>
          )}
        </div>

          {/* 3. STATS ROW (2x2 Grid on Mobile, 4x1 on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Revenue */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-theme-border-soft shadow-premium hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-theme-success/10 text-theme-success rounded-full transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">{t('revenue')}</p>
            </div>
            <div>
              <h3 className="text-3xl md:text-2xl font-bold text-theme-primary tracking-tight">{formatCurrency(totalRevenue, currencySymbol)}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-theme-success mt-1.5">+12% vs last month</p>
            </div>
          </div>

          {/* Collection */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-theme-border-soft shadow-premium hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-theme-accent/10 text-theme-accent rounded-full transition-transform duration-300 group-hover:scale-110">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">{t('collection')}</p>
            </div>
            <div>
              <h3 className="text-3xl md:text-2xl font-bold text-theme-primary tracking-tight">{formatCurrency(totalPaid, currencySymbol)}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-theme-muted mt-1.5">{t('total_received')}</p>
            </div>
          </div>

          {/* Pending Due */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-theme-border-soft shadow-premium hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-theme-warning/10 text-theme-warning rounded-full transition-transform duration-300 group-hover:scale-110">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">{labels.due}</p>
            </div>
            <div>
              <h3 className="text-3xl md:text-2xl font-bold text-theme-danger tracking-tight">{formatCurrency(totalDue, currencySymbol)}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-theme-danger/70 mt-1.5">{t('needs_collection')}</p>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-theme-border-soft shadow-premium hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-full transition-transform duration-300 group-hover:scale-110">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">Total {labels.clients}</p>
            </div>
            <div>
              <h3 className="text-3xl md:text-2xl font-bold text-theme-primary tracking-tight">{totalCustomersCount}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-blue-500/70 mt-1.5">Registered Active</p>
            </div>
          </div>
        </div>

        {/* 4. RECENT INVOICES & REVENUE CHART (Desktop Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-theme-accent" /> {t('recent_invoices')}
              </h3>
              <button onClick={() => setCurrentTab('invoices')} className="text-[10px] font-black text-theme-accent hover:text-theme-primary transition-colors uppercase">
                {t('view_all')}
              </button>
            </div>
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="group flex items-center justify-between p-3.5 bg-theme-app hover:bg-theme-surface rounded-2xl border border-theme-border-soft transition-all cursor-pointer" onClick={() => { onEditInvoice(inv); setCurrentTab('create'); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-theme-surface group-hover:bg-theme-card flex items-center justify-center transition-colors">
                      <FileText className="w-4 h-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-theme-primary mb-0.5">{inv.customerName}</p>
                      <p className="text-[10px] font-bold text-theme-muted">{inv.invoiceNumber} • {inv.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-theme-primary mb-1">{formatCurrency(inv.grandTotal, currencySymbol)}</p>
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${inv.paymentStatus === 'Paid' ? 'bg-theme-success/10 text-theme-success' : 'bg-theme-danger/10 text-theme-danger'}`}> {inv.paymentStatus || 'Pending'} </span>
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <div className="text-center py-8 text-theme-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">No invoices yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue vs Expenses Chart (hidden on mobile) */}
          <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium flex-col hidden md:flex">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-theme-accent" /> {t('revenue_vs_expenses')}
              </h3>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} className="text-theme-muted" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} className="text-theme-muted" tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip
                    cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border-soft)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => [formatCurrency(value, currencySymbol), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. WIDGETS ROW 2 (Desktop Only Charts) */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers (Pie Chart) */}
          <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium flex-col flex">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-theme-accent" /> {t('top_customers')}
              </h3>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              {topCustomersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCustomersData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {topCustomersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border-soft)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value) => [formatCurrency(value, currencySymbol), 'Revenue']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-theme-muted text-xs font-bold">No data available</div>
              )}
            </div>
          </div>

          {/* Best Selling Items List */}
          <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-theme-accent" /> {t('best_selling')}
              </h3>
            </div>
            <div className="space-y-4">
              {bestSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-theme-app hover:bg-theme-surface rounded-2xl border border-theme-border-soft transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-theme-accent-light text-theme-accent flex items-center justify-center font-black text-xs">
                      #{index + 1}
                    </div>
                    <span className="text-xs font-bold text-theme-primary line-clamp-1">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black bg-theme-success/10 text-theme-success px-2 py-1 rounded-md">
                      {item.qty} Sold
                    </span>
                  </div>
                </div>
              ))}
              {bestSellingItems.length === 0 && (
                <div className="text-center py-8 text-theme-muted">
                  <p className="text-[10px] font-bold">No sales data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. UPGRADE BANNER */}
        <div className="bg-[image:var(--accent-gradient)] rounded-3xl p-6 md:p-8 text-white shadow-premium relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 blur-3xl rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-lg md:text-xl mb-1">{t('upgrade')}</h2>
              <p className="text-xs md:text-sm font-medium opacity-90">Get unlimited invoices, multi-user access, and 24/7 dedicated SaaS billing support.</p>
            </div>
            <button onClick={() => setCurrentTab('subscription')} className="bg-white text-theme-accent font-black text-xs py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform uppercase tracking-wider shrink-0">
              {t('view_plans')}
            </button>
          </div>
        </div>
      </motion.div>
    </PullToRefresh>
  );
};

export default Dashboard;
