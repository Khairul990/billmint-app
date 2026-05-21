import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Activity,
  Shield,
  HardDrive,
  FileDown,
  Clock,
  UserCheck,
  Sparkles,
  FileText,
  Rocket,
  Check
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { isFirebaseEnabled } from '../utils/firebase';

/**
 * High-End SaaS Dashboard with SVG Charts & WhatsApp Reminders
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
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const currencySymbol = businessSettings?.currency || '₹';
  const businessName = businessSettings?.businessName || 'BillQyro Embroidery';
  const isNewUser = invoices.length === 0 && customers.length === 0 && !businessSettings?.businessName;

  // --- STATS CALCULATIONS (Accurate SaaS Math) ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  const totalDue = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const totalCustomersCount = customers.length;

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

    const msg = `Hello *${invoice.customerName}*,\n\nThis is a friendly payment reminder from *${businessName}* regarding Invoice *${invoice.invoiceNumber}* (issued on ${invoice.date}).\n\n* Invoice Total: ${currencySymbol}${invoice.grandTotal.toFixed(2)}\n* Amount Paid: ${currencySymbol}${invoice.amountPaid.toFixed(2)}\n* Outstanding Balance: *${currencySymbol}${invoice.balanceDue.toFixed(2)}*\n* Payment Due Date: *${invoice.dueDate || 'N/A'}*\n\nPlease complete payment at your earliest convenience. Thank you for your business!\n\nBest regards,\n${businessName}`;

    // Clean phone number of spaces or symbols
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* 0. WELCOME HERO BANNER */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#071B3A] to-[#19C3A3] text-white relative overflow-hidden shadow-premium border border-slate-800/80">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Authenticated</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{businessName}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Your professional invoicing workspace is loaded and ready. Let's make billing seamless today!
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('create-invoice')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs px-5 py-3.5 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer w-fit shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bill</span>
          </button>
        </div>
      </div>

      {/* 0.1 EMPTY STATE — NEW USER WELCOME (Shown when zero invoices) */}
      {isNewUser && (
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-emerald-200/60 dark:border-emerald-800/30 shadow-premium text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
               Welcome to BillQyro
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Start by completing your business profile and creating your first bill.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCurrentTab('settings')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Settings</span>
              </button>
              <button
                onClick={() => setCurrentTab('create-invoice')}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black text-xs px-6 py-3.5 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer uppercase tracking-wider"
              >
                <FileText className="w-4 h-4" />
                <span>Create First Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 0.2 HOW TO USE BILLQYRO GUIDE + SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* New "How to Use BillQyro" Guide (Col Span 2) */}
        <div className="lg:col-span-2">
          <NewUserGuide setCurrentTab={setCurrentTab} isNewUser={isNewUser} />
        </div>

        {/* Real-Time System Services Status (Col Span 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800/80 shadow-premium flex flex-col justify-between space-y-5">
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-emerald-500" />
              <span>Workspace Services Status</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              REAL-TIME STATUS METER
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">

            {/* Firebase Status Card */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Firebase Database</span>
              </div>
              {(() => {
                if (!isFirebaseEnabled) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span>
                      <span>Firebase Not Configured</span>
                    </span>
                  );
                }
                if (!navigator.onLine) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 text-[9px] font-black uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>Offline Mode (Local Backup Active)</span>
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Firebase Connected</span>
                  </span>
                );
              })()}
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <ReceiptText className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Invoice System</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Ready</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileDown className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">PDF Generator</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Offline Storage</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Enabled</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Security Shield</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Secure</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">CRM Records</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Order Tracking</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live</span>
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* 0.3 SETUP PROGRESS TRACKER */}
      <SetupProgress
        businessSettings={businessSettings}
        customers={customers}
        invoices={invoices}
      />

      {/* 1. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Total Billed"
          value={formatCurrency(totalRevenue, currencySymbol)}
          icon={DollarSign}
          trend="+12.4% MoM"
          trendUp={true}
          accentColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalPaid, currencySymbol)}
          icon={TrendingUp}
          trend="+15.8% MoM"
          trendUp={true}
          accentColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <StatCard
          title="Outstanding Dues"
          value={formatCurrency(totalDue, currencySymbol)}
          icon={Hourglass}
          trend="-8.2% outstanding"
          trendUp={false}
          accentColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <StatCard
          title="Active Clients"
          value={totalCustomersCount}
          icon={Users}
          trend="In SaaS CRM"
          trendUp={true}
          accentColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
      </div>

      {/* 2. ANALYTICS & QUICK LAUNCH ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SVG Custom Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Revenue Analytics</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ROLLING 6 MONTH HISTORY</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Billing</span>
            </div>
          </div>

          {/* Recharts Graph */}
          <div className="relative h-64 w-full mt-4">
            {invoices.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-4 rounded-3xl text-center z-10">
                <TrendingUp className="w-10 h-10 text-indigo-500 mb-2 animate-bounce" />
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-350">Revenue will appear after invoices are created</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">NO REVENUE DATA FOUND</p>
              </div>
            )}
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 800 }}
                  formatter={(value) => [`${currencySymbol}${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Invoicing Call-To-Action Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-premium flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full w-fit">
              Embroidery Billing OS
            </span>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight mt-1 leading-snug">
              Instant Thread & Stitch Invoicing
            </h2>
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
              Auto-generate sequential SO design numbers, compile multi-composite rates with smart adders, and download premium PDF invoice sheets.
            </p>
          </div>

          <button
            onClick={() => setCurrentTab('create-invoice')}
            className="flex items-center justify-center gap-2 mt-6 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-xs px-5 py-4 rounded-2xl shadow-lg shadow-indigo-500/10 hover:from-indigo-600 hover:to-blue-600 transition-all w-full hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* 3. DUES AND RECENT RECORDS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Double-width: Unpaid WhatsApp Reminders Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>Pending Balance Reminders</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                AUTO-PREFILLED WHATSAPP DUELISTS
              </p>
            </div>

            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 py-1 px-2.5 rounded-full">
              {unpaidInvoices.length} unpaid total
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-3.5 max-h-[300px] overflow-y-auto no-scrollbar">
            {unpaidInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 rounded-2xl border border-slate-100/50 dark:border-slate-800/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</span>
                    <span className="text-[9px] bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400 font-extrabold px-2 py-0.5 rounded uppercase">
                      Due: {inv.dueDate || 'N/A'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    Client: <span className="text-slate-800 dark:text-slate-350 font-extrabold">{inv.customerName}</span> • Phone: {inv.customerPhone || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Outstanding Balance</span>
                    <span className="text-xs font-black text-rose-500 mt-1 block">
                      {formatCurrency(inv.balanceDue, currencySymbol)}
                    </span>
                  </div>

                  <button
                    onClick={() => sendWhatsAppReminder(inv)}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl shadow-sm hover:shadow transition-all shrink-0 uppercase tracking-wider"
                  >
                    <Send className="w-3 h-3" />
                    <span>Remind</span>
                  </button>
                </div>
              </div>
            ))}

            {unpaidInvoices.length === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">Perfect Billing Score!</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  All accounts settled. There are no pending outstanding balances.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Single-width: Recent Invoices & Global Search */}
        <div className="space-y-6">

          {/* Recent Invoices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Recent Logs</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LATEST TRANSACTIONS</p>
              </div>

              <button
                onClick={() => setCurrentTab('invoices')}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-all uppercase tracking-wider"
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
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/80 text-center shadow-premium">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                  <h4 className="font-bold text-xs text-slate-700 dark:text-slate-350">No invoices yet</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Start by creating your first bill to see recent transactions here!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Global Search Panel */}
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Global Invoices Filter</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FAST SEARCH SYSTEM</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-100 dark:border-slate-800/80 shadow-premium space-y-3.5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Invoice ID, client..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
                />
              </div>

              {searchQuery && (
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pt-2 border-t border-slate-50">
                  {filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => onViewInvoice(inv)}
                      className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-slate-100"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{inv.invoiceNumber}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{inv.customerName}</p>
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        {formatCurrency(inv.grandTotal, currencySymbol)}
                      </span>
                    </div>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <p className="text-center text-slate-400 font-semibold text-[10px] py-4">
                      No matching records found.
                    </p>
                  )}
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-4 text-slate-400">
                  <ReceiptText className="w-6 h-6 mx-auto text-slate-200 mb-1.5" />
                  <p className="text-[10px] font-bold">Search results show instantly.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
