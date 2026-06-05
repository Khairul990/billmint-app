import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
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
  PieChart,
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

  // Recent invoices (Max 3)
  const recentInvoices = invoices.slice(-3).reverse();

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
        className="space-y-6 pb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* PAYMENT PROOFS ALERT BANNER */}
        {pendingPaymentsCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-red-500/5 cursor-pointer"
            onClick={() => setCurrentTab('pending-payments')}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-red-600 dark:text-red-400 font-bold text-sm">Review Required</h3>
                <p className="text-red-600/80 dark:text-red-400/80 text-xs font-semibold">
                  You have <span className="font-black text-red-600 dark:text-red-400">{pendingPaymentsCount}</span> pending payment proofs to verify.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-red-500 shrink-0" />
          </motion.div>
        )}

        {/* 1. HEADER & HERO */}
        <div className="space-y-0.5 md:space-y-2">
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Dashboard</h1>
          <p className="text-xs md:text-sm text-theme-muted font-bold">Welcome back, here is your business summary.</p>
        </div>

        <div className="bg-[image:var(--accent-gradient)] rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-premium relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <h2 className="text-lg md:text-2xl font-black mb-1.5 md:mb-2 leading-tight">Create professional invoices in seconds.</h2>
            <p className="text-[10px] md:text-sm font-medium opacity-90 max-w-md leading-relaxed">Send invoices on WhatsApp, collect payments faster, and track your business growth.</p>
            <button onClick={() => setCurrentTab('create')} className="mt-4 md:mt-5 bg-white text-theme-accent px-5 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs shadow-lg hover:scale-105 transition-transform uppercase tracking-wider">
              + New Bill
            </button>
          </div>
        </div>

        {/* 2. STATS ROW (4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">Revenue</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-theme-primary tracking-tight">{formatCurrency(totalRevenue, currencySymbol)}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-green-600 dark:text-green-400 mt-1.5">+12% vs last month</p>
            </div>
          </div>

          {/* Collection */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full transition-transform duration-300 group-hover:scale-110">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">Collection</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-theme-primary tracking-tight">{formatCurrency(totalPaid, currencySymbol)}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-theme-muted mt-1.5">Total received</p>
            </div>
          </div>

          {/* Pending Due */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full transition-transform duration-300 group-hover:scale-110">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">Pending</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-theme-danger tracking-tight">{formatCurrency(totalDue, currencySymbol)}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-theme-danger/70 mt-1.5">Needs collection</p>
            </div>
          </div>

          {/* Customers */}
          <div className="bg-theme-card rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full transition-transform duration-300 group-hover:scale-110">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-[11px] md:text-xs font-semibold text-theme-muted uppercase tracking-wider">Customers</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-theme-primary tracking-tight">{customers.length}</h3>
              <p className="text-[10px] md:text-[11px] font-medium text-theme-muted mt-1.5">Active clients</p>
            </div>
          </div>
        </div>

        {/* 3. WIDGETS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Invoices Card (Left) */}
          <div className="lg:col-span-2 bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-theme-accent" /> Recent Invoices
              </h3>
              <button onClick={() => setCurrentTab('invoices')} className="text-[10px] font-black text-theme-accent hover:text-theme-primary transition-colors uppercase">View All</button>
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
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${inv.paymentStatus === 'Paid' ? 'bg-theme-success/10 text-theme-success' : 'bg-theme-danger/10 text-theme-danger'}`}>
                      {inv.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <div className="text-center py-8 text-theme-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                  <p className="text-xs font-bold">No invoices yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Summary Chart Card (Right) */}
          <div className="lg:col-span-1 bg-theme-card rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-theme-accent" /> Revenue vs Expenses
              </h3>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} className="text-theme-muted" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} className="text-theme-muted" tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border-soft)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => [formatCurrency(value, currencySymbol), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Expenses" fill="var(--danger, #ef4444)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 4. WIDGETS ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Service Status Card (Left) */}
          <div className="hidden lg:block bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <h3 className="font-extrabold text-sm text-theme-primary tracking-tight mb-5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-theme-accent" /> Service Status
            </h3>
            <div className="space-y-4">
              {/* Cloud Backup */}
              <div className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-theme-accent-light text-theme-accent rounded-xl"><Activity className="w-4 h-4" /></div>
                  <span className="text-xs font-bold text-theme-primary">Cloud Backup</span>
                </div>
                <div className="flex items-center gap-2 bg-theme-success/10 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-success animate-pulse"></span>
                  <span className="text-[9px] font-extrabold text-theme-success uppercase tracking-wider">Active</span>
                </div>
              </div>
              {/* PDF Generator */}
              <div className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-theme-accent-light text-theme-accent rounded-xl"><FileDown className="w-4 h-4" /></div>
                  <span className="text-xs font-bold text-theme-primary">PDF Engine</span>
                </div>
                <div className="flex items-center gap-2 bg-theme-success/10 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-success animate-pulse"></span>
                  <span className="text-[9px] font-extrabold text-theme-success uppercase tracking-wider">Active</span>
                </div>
              </div>
              {/* Invoice System */}
              <div className="flex items-center justify-between p-3 bg-theme-app rounded-2xl border border-theme-border-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-theme-accent-light text-theme-accent rounded-xl"><ReceiptText className="w-4 h-4" /></div>
                  <span className="text-xs font-bold text-theme-primary">Invoice DB</span>
                </div>
                <div className="flex items-center gap-2 bg-theme-success/10 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-success animate-pulse"></span>
                  <span className="text-[9px] font-extrabold text-theme-success uppercase tracking-wider">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Customers Card (Right) */}
          <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-theme-accent" /> Recent Clients
              </h3>
              <button onClick={() => setCurrentTab('customers')} className="text-[10px] font-black text-theme-accent hover:text-theme-primary transition-colors uppercase">View All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customers.slice(-4).reverse().map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-theme-app hover:bg-theme-surface rounded-2xl border border-theme-border-soft transition-colors cursor-pointer" onClick={() => setCurrentTab('customers')}>
                  <div className="w-10 h-10 rounded-xl bg-[image:var(--accent-gradient)] flex items-center justify-center text-white font-black text-sm shadow-md">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-theme-primary leading-tight truncate">{c.name}</p>
                    <p className="text-[9px] font-bold text-theme-muted mt-0.5 truncate">{c.phone || 'No phone'}</p>
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <div className="col-span-full text-center py-8 text-theme-muted">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                  <p className="text-[10px] font-bold">No clients added yet</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 5. WIDGETS ROW 3 (Banner) */}
        <div className="bg-[image:var(--accent-gradient)] rounded-3xl p-6 md:p-8 text-white shadow-premium relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 blur-2xl rounded-full"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <h3 className="font-black text-lg md:text-xl mb-1">Upgrade to Premium</h3>
              <p className="text-xs md:text-sm font-medium opacity-90">Get unlimited invoices, multi-user access, and 24/7 dedicated SaaS billing support.</p>
            </div>
            <button onClick={() => setCurrentTab('subscription')} className="bg-white text-theme-accent font-black text-xs py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform uppercase tracking-wider shrink-0">
              View Plans
            </button>
          </div>
        </div>

      </motion.div>
    </PullToRefresh>
  );
};

export default Dashboard;
