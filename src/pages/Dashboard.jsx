import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  Rocket,
  Check,
  Megaphone,
  Zap,
  Smartphone
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { firebaseReady } from '../utils/firebase';
import PullToRefresh from '../components/PullToRefresh';
import { syncFromFirestore } from '../utils/storage';

/**
 * High-End SaaS Dashboard with SVG Charts & WhatsApp Reminders
 */
const Dashboard = ({
  invoices = [],
  customers = [],
  products = [],
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
  onQuickBillOpen
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
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
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
        total: 0
      });
    }

    invoices.forEach(inv => {
      if (!inv.date) return;
      const invMonthKey = inv.date.substring(0, 7); // "YYYY-MM"
      const match = months.find(m => m.key === invMonthKey);
      if (match) {
        match.total += (inv.grandTotal || 0);
      }
    });

    return months;
  };

  const monthlyData = getMonthlyData();

  // --- WHATSAPP REMINDER DISPATCHER ---
  const sendWhatsAppReminder = (invoice) => {
    const phone = invoice.customerPhone || '';
    if (!phone) {
      alert('This customer does not have a saved phone number. Please edit their details in the CRM.');
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
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

      {/* 0. WELCOME HERO BANNER */}
      <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-3xl bg-[image:var(--accent-gradient)] dark:bg-[image:none] dark:bg-theme-card dark:border-white/10 text-theme-button-text dark:text-white border border-theme-border-soft/10 relative overflow-hidden shadow-premium">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-card/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Workspace Authenticated</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${subscription?.status === 'premium'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : subscription?.expired
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-theme-card/10 border-white/20 text-white'
                }`}>
                {subscription?.status === 'premium' ? 'Premium' : subscription?.expired ? 'Expired' : 'Free'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-theme-button-text drop-shadow-md font-extrabold">{businessName}</span>
            </h1>
            <p className="text-xs text-theme-button-text/90 font-semibold">
              Your professional invoicing workspace is loaded and ready. Let's make billing seamless today!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onQuickBillOpen}
              className="flex items-center justify-center gap-1.5 bg-theme-card/10 hover:bg-theme-card/20 border border-white/20 text-white font-black text-xs px-4 py-3.5 rounded-2xl shadow-sm transition-all w-fit uppercase tracking-wider"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quick Bill</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentTab('create-invoice')}
              className="flex items-center justify-center gap-2 bg-theme-card hover:bg-theme-app text-theme-primary font-black text-xs px-5 py-3.5 rounded-2xl shadow-md cursor-pointer w-fit uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Full Bill</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 0.05 TODAY'S QUICK SUMMARY (Horizontal Scroll for Mobile) */}
      <motion.div variants={itemVariants} className="w-full overflow-x-auto pb-4 pt-2 hide-scrollbar flex gap-4 sm:grid sm:grid-cols-3">
        <div className="min-w-[200px] flex-1 bg-theme-card border border-theme-border-soft rounded-3xl p-5 shadow-premium flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-2">Today's Revenue</p>
          <h3 className="text-2xl font-black text-theme-primary tracking-tight">
            {formatCurrency(todayRevenue, currencySymbol)}
          </h3>
          <p className="text-xs font-semibold text-theme-muted mt-2">{todayBills} Bills Created</p>
        </div>
        
        <div className="min-w-[200px] flex-1 bg-theme-card border border-theme-border-soft rounded-3xl p-5 shadow-premium flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-2">Today's Collection</p>
          <h3 className="text-2xl font-black text-theme-primary tracking-tight">
            {formatCurrency(todayCollection, currencySymbol)}
          </h3>
          <p className="text-xs font-semibold text-theme-muted mt-2">Cash Inflow</p>
        </div>

        <div className="min-w-[200px] flex-1 bg-theme-card border border-theme-border-soft rounded-3xl p-5 shadow-premium flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted mb-2">Pending Due</p>
          <h3 className="text-2xl font-black text-theme-primary tracking-tight">
            {formatCurrency(todayDue, currencySymbol)}
          </h3>
          <p className="text-xs font-semibold text-theme-muted mt-2">Uncollected Cash</p>
        </div>
      </motion.div>

      {/* GLOBAL ANNOUNCEMENT BANNER */}
      {businessSettings?.globalAnnouncement && (
        <motion.div variants={itemVariants} className="bg-theme-app-soft border border-theme-border-soft rounded-3xl p-4 shadow-sm flex items-start gap-3">
          <div className="bg-theme-card dark:bg-theme-card p-2 rounded-xl shadow-sm text-theme-accent mt-0.5">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-black text-theme-accent uppercase tracking-widest mb-1">Announcement</h3>
            <p className="text-xs font-semibold text-theme-primary dark:text-theme-muted whitespace-pre-wrap leading-relaxed">{businessSettings.globalAnnouncement}</p>
          </div>
        </motion.div>
      )}

      {/* 0.1 EMPTY STATE — NEW USER WELCOME (Shown when zero invoices) */}
      {isNewUser && (
        <motion.div variants={itemVariants} className="p-6 md:p-8 rounded-3xl bg-theme-card border border-theme-border-soft shadow-premium text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-theme-accent-light rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[image:var(--accent-gradient)] text-theme-button-text border-0 flex items-center justify-center mx-auto shadow-glow">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-theme-primary dark:text-theme-primary dark:text-theme-secondary tracking-tight">
              Welcome to BillQyro
            </h2>
            <p className="text-xs text-theme-muted dark:text-theme-muted font-medium leading-relaxed">
              Start by completing your business profile and creating your first bill.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('settings')}
                className="inline-flex items-center gap-2 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Settings</span>
              </button>
              <button
                onClick={() => setCurrentTab('create-invoice')}
                className="inline-flex items-center gap-2 bg-theme-card dark:bg-theme-card dark:bg-theme-card border-2 border-theme-border-soft dark:border-theme-border-soft hover:border-theme-accent text-theme-accent dark:text-theme-accent font-black text-xs px-6 py-3.5 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
              >
                <FileText className="w-4 h-4" />
                <span>Create First Bill</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}


      {/* 0.15 CURRENT BILLING SETUP CARD */}
      <motion.div variants={itemVariants} className="bg-theme-card dark:bg-theme-card rounded-3xl p-6 border border-theme-border-soft dark:border-theme-border-soft/80 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-theme-accent to-theme-accent-dark flex items-center justify-center shrink-0 shadow-glow">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1">Current Billing Setup</h3>
            {tplInfo ? (
              <>
                <h4 className="text-xl font-black text-theme-primary dark:text-theme-primary mb-1">{tplInfo.name}</h4>
                <p className="text-xs font-medium text-theme-muted dark:text-theme-muted leading-relaxed max-w-2xl">
                  Your Create Bill form is prepared with <strong className="text-theme-primary dark:text-theme-muted">{tplInfo.fields}</strong>.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-xl font-black text-theme-primary dark:text-theme-primary mb-1">Not Set</h4>
                <p className="text-xs font-medium text-theme-muted dark:text-theme-muted leading-relaxed">
                  Choose your billing setup to create bills easily.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('setup-billing')}
            className="px-5 py-2.5 bg-theme-surface dark:bg-theme-card hover:bg-theme-border-soft dark:hover:bg-slate-700 text-theme-primary dark:text-theme-muted font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            Change Template
          </button>
          <button
            onClick={() => setCurrentTab('create-invoice')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bill</span>
          </button>
        </div>
      </motion.div>

      {/* PWA INSTALLATION PROMOTION BANNER */}
      {installPromptEvent && !isAppInstalled && (
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-3xl bg-theme-card border border-theme-border-soft shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-theme-accent to-theme-accent-dark flex items-center justify-center shrink-0 shadow-glow">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent text-[9px] font-black uppercase tracking-wider mb-1">
                STANDALONE APPLICATION AVAILABLE
              </div>
              <h4 className="text-lg font-black text-theme-primary dark:text-theme-primary mb-1">Install BillQyro App</h4>
              <p className="text-xs font-medium text-theme-muted dark:text-theme-muted leading-relaxed max-w-xl">
                Unlocks ultra-fast load speeds, robust offline workspace syncing, borderless layout window, and native system integration!
              </p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setCurrentTab('settings')}
              className="px-5 py-2.5 bg-theme-surface dark:bg-theme-card hover:bg-theme-border-soft dark:hover:bg-slate-700 text-theme-primary dark:text-theme-muted dark:text-theme-muted font-bold text-xs rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              Learn More
            </button>
            <button
              onClick={onInstallApp}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[image:var(--accent-gradient)] text-theme-button-text border-0 hover:opacity-90 font-black text-xs rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer uppercase tracking-wider animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 0.2 HOW TO USE BILLQYRO GUIDE */}
      <motion.div variants={itemVariants}>
        <NewUserGuide setCurrentTab={setCurrentTab} isNewUser={isNewUser} />
      </motion.div>

      {/* 0.3 SETUP PROGRESS TRACKER */}
      <SetupProgress
        businessSettings={businessSettings}
        customers={customers}
        invoices={invoices}
      />

      {/* 1. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue, currencySymbol)}
          icon={DollarSign}
          trend={`${todayBills} Bills Created`}
          trendUp={true}
          accentColor="bg-theme-accent-light text-theme-accent"
        />
        <StatCard
          title="Today's Collection"
          value={formatCurrency(todayCollection, currencySymbol)}
          icon={TrendingUp}
          trend="Cash Inflow"
          trendUp={true}
          accentColor="bg-theme-accent-light text-theme-accent"
        />
        <StatCard
          title="Pending Due"
          value={formatCurrency(todayDue, currencySymbol)}
          icon={Hourglass}
          trend="Uncollected Cash"
          trendUp={false}
          accentColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomersCount}
          icon={Users}
          trend="In SaaS CRM"
          trendUp={true}
          accentColor="bg-theme-accent-light text-theme-accent"
        />
      </div>

      {/* 2. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Invoices Card */}
          <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-theme-primary tracking-tight">Recent Invoices</h3>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider">LATEST TRANSACTIONS</p>
              </div>
              <button onClick={() => setCurrentTab('invoices')} className="text-[10px] font-black text-theme-accent hover:opacity-80 flex items-center gap-1 uppercase tracking-wider">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <InvoiceCard compact={true}
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
                <div className="text-center py-6">
                  <FileSpreadsheet className="w-8 h-8 text-theme-muted mx-auto mb-2 animate-pulse" />
                  <h4 className="font-bold text-xs text-theme-muted">No invoices yet</h4>
                </div>
              )}
            </div>
          </div>

          {/* Business Summary Circular Chart Card */}
          <div className="bg-theme-card rounded-3xl p-5 md:p-6 border border-theme-border-soft shadow-premium flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight mb-1">Business Summary</h3>
              <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-4">REVENUE BREAKDOWN</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-theme-accent"></div>
                    <span className="text-xs font-bold text-theme-primary">Collected</span>
                  </div>
                  <span className="text-xs font-black text-theme-primary">{formatCurrency(totalPaid, currencySymbol)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <span className="text-xs font-bold text-theme-primary">Pending</span>
                  </div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">{formatCurrency(totalDue, currencySymbol)}</span>
                </div>
              </div>
            </div>

            {/* CSS Conic Gradient Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${totalRevenue > 0 ? (totalPaid/totalRevenue)*100 : 0}%, #fbbf24 0)`
                }}
              ></div>
              <div className="absolute inset-2 rounded-full bg-theme-card flex items-center justify-center flex-col">
                <span className="text-[9px] font-bold text-theme-muted uppercase">Total</span>
                <span className="text-xs font-black text-theme-primary">{formatCurrency(totalRevenue, currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Unpaid WhatsApp Reminders Section */}
          <div className="bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-theme-accent" />
                  <span>Pending Reminders</span>
                </h3>
              </div>
              <span className="text-[10px] font-black text-theme-muted bg-theme-surface py-1 px-2.5 rounded-full">
                {unpaidInvoices.length} unpaid
              </span>
            </div>
            
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto no-scrollbar">
              {unpaidInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3.5 bg-theme-app hover:bg-theme-surface rounded-2xl border border-theme-border-soft transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-theme-primary">{inv.invoiceNumber}</span>
                      <span className="text-[9px] bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 rounded uppercase">Due: {inv.dueDate || 'N/A'}</span>
                    </div>
                    <p className="text-[10px] text-theme-muted font-bold">{inv.customerName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-rose-500">{formatCurrency(inv.balanceDue, currencySymbol)}</span>
                    <button onClick={() => sendWhatsAppReminder(inv)} className="bg-theme-accent text-white font-extrabold text-[10px] py-1.5 px-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all uppercase">
                      Remind
                    </button>
                  </div>
                </div>
              ))}
              {unpaidInvoices.length === 0 && (
                <div className="text-center py-4 text-theme-muted"><CheckCircle2 className="w-6 h-6 text-theme-accent mx-auto mb-1"/><span className="text-[10px] font-bold">All accounts settled.</span></div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Span 1) */}
        <div className="space-y-6">
          
          {/* Service Status Card */}
          <div className="bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
            <h3 className="font-extrabold text-sm text-theme-primary tracking-tight mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-theme-accent" /> Service Status
            </h3>
            <div className="space-y-3">
              {/* Cloud Backup */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-theme-accent-light text-theme-accent rounded-lg"><Activity className="w-3 h-3" /></div>
                  <span className="text-xs font-bold text-theme-primary">Cloud Backup</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
              </div>
              {/* PDF Generator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-theme-accent-light text-theme-accent rounded-lg"><FileDown className="w-3 h-3" /></div>
                  <span className="text-xs font-bold text-theme-primary">PDF Engine</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
              </div>
              {/* Invoice System */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-theme-accent-light text-theme-accent rounded-lg"><ReceiptText className="w-3 h-3" /></div>
                  <span className="text-xs font-bold text-theme-primary">Invoice DB</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
              </div>
              {/* WhatsApp Sync */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-theme-accent-light text-theme-accent rounded-lg"><Send className="w-3 h-3" /></div>
                  <span className="text-xs font-bold text-theme-primary">WhatsApp Sync</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></span>
              </div>
            </div>
          </div>

          {/* Recent Customers Card */}
          <div className="bg-theme-card rounded-3xl p-5 border border-theme-border-soft shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-theme-primary tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-theme-accent" /> Recent Clients
              </h3>
            </div>
            <div className="space-y-3">
              {customers.slice(-4).reverse().map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-theme-app rounded-xl transition-colors cursor-pointer" onClick={() => setCurrentTab('customers')}>
                  <div className="w-8 h-8 rounded-full bg-[image:var(--accent-gradient)] flex items-center justify-center text-white font-black text-xs">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-theme-primary leading-tight">{c.name}</p>
                    <p className="text-[9px] font-bold text-theme-muted">{c.phone || 'No phone'}</p>
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <p className="text-[10px] font-bold text-theme-muted text-center">No clients added yet.</p>
              )}
            </div>
          </div>

          {/* Premium Plan Banner */}
          <div className="bg-[image:var(--accent-gradient)] rounded-3xl p-5 text-white shadow-premium relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 blur-xl rounded-full"></div>
            <h3 className="font-black text-sm mb-1">Premium Support</h3>
            <p className="text-[10px] font-medium opacity-90 mb-3">Access 24/7 dedicated SaaS billing support.</p>
            <button onClick={() => setCurrentTab('subscription')} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md font-bold text-[10px] py-2 rounded-xl transition-all uppercase tracking-wider">
              View Plans
            </button>
          </div>

        </div>
      </div>
      </motion.div>
</PullToRefresh>
  );
};

export default Dashboard;
